/*
Run this entire script in the browser console while signed in to Dynamics.
It makes GET requests only and downloads a JSON snapshot. It does not create,
edit, activate, deactivate, or delete any Dynamics record.
*/
(async () => {
  const clientUrl =
    globalThis.Xrm?.Utility?.getGlobalContext?.().getClientUrl?.() || location.origin;
  const apiBase = `${clientUrl}/api/data/v9.2/`;
  const label = (value) =>
    value?.UserLocalizedLabel?.Label || value?.LocalizedLabels?.[0]?.Label || "";
  const normalize = (value) => String(value || "").trim().toLowerCase();

  const getPages = async (url, prefer = "") => {
    const rows = [];
    while (url) {
      const headers = {
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
      };
      if (prefer) headers.Prefer = prefer;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
      }
      const page = await response.json();
      rows.push(...(page.value || []));
      url = page["@odata.nextLink"] || null;
    }
    return rows;
  };

  const allEntities = await getPages(
    `${apiBase}EntityDefinitions` +
      "?$select=LogicalName,SchemaName,EntitySetName,PrimaryIdAttribute," +
      "PrimaryNameAttribute,IsActivity,DisplayName,DisplayCollectionName"
  );

  const targets = [
    {
      key: "account",
      exactLogicalName: "account",
      namePattern: /account/i,
      fieldPattern: /account name|company name|main phone|primary contact|website/i,
    },
    {
      key: "contact",
      exactLogicalName: "contact",
      namePattern: /contact/i,
      fieldPattern: /full name|first name|last name|business phone|mobile phone|email/i,
    },
    {
      key: "contract",
      namePattern: /contract/i,
      fieldPattern: /benef(?:iciary|eciary)|supplier|billing|date contract|annual fee/i,
    },
    {
      key: "vault",
      namePattern: /vault/i,
      fieldPattern: /vault name|date vaulted|storage vault/i,
    },
    {
      key: "deposit",
      namePattern: /deposit/i,
      fieldPattern: /deposit number|product name|date received|verified by|report sent|vault/i,
    },
    {
      key: "activity",
      exactLogicalName: "activitypointer",
      namePattern: /activit/i,
      fieldPattern: /subject|regarding|due date|scheduled end|activity type/i,
    },
  ];

  const entityText = (entity) =>
    [
      entity.LogicalName,
      entity.SchemaName,
      entity.EntitySetName,
      label(entity.DisplayName),
      label(entity.DisplayCollectionName),
    ].join(" ");

  const inspectCandidate = async (target, entity) => {
    const logicalName = entity.LogicalName.replace(/'/g, "''");
    const rawAttributes = await getPages(
      `${apiBase}EntityDefinitions(LogicalName='${logicalName}')/Attributes` +
        "?$select=LogicalName,SchemaName,AttributeType,DisplayName,Description,IsValidForRead"
    );
    const sample = await getPages(
      `${apiBase}${entity.EntitySetName}` +
        `?$select=${entity.PrimaryIdAttribute}&$top=1`
    );
    const domainFieldCount = rawAttributes.filter((attribute) =>
      target.fieldPattern.test(
        `${label(attribute.DisplayName)} ${attribute.LogicalName} ${attribute.SchemaName}`
      )
    ).length;
    const exact = entity.LogicalName === target.exactLogicalName;
    const displayName = normalize(label(entity.DisplayName));
    const displayCollectionName = normalize(label(entity.DisplayCollectionName));
    const exactDisplay =
      displayName === target.key ||
      displayCollectionName === target.key ||
      displayCollectionName === `${target.key}s`;
    return {
      target,
      entity,
      rawAttributes,
      hasRecords: sample.length > 0,
      domainFieldCount,
      score:
        (exact ? 100000 : 0) +
        (exactDisplay ? 10000 : 0) +
        domainFieldCount * 1000 +
        (sample.length ? 100 : 0),
    };
  };

  const selectedEntities = [];
  const candidateDiagnostics = {};
  for (const target of targets) {
    let candidates = allEntities.filter(
      (entity) =>
        entity.EntitySetName &&
        entity.PrimaryIdAttribute &&
        (entity.LogicalName === target.exactLogicalName || target.namePattern.test(entityText(entity)))
    );
    if (target.exactLogicalName) {
      const exact = candidates.filter(
        (entity) => entity.LogicalName === target.exactLogicalName
      );
      if (exact.length) candidates = exact;
    }

    const inspected = [];
    for (const candidate of candidates) {
      try {
        inspected.push(await inspectCandidate(target, candidate));
      } catch (error) {
        console.warn(`Skipping inaccessible entity ${candidate.LogicalName}.`, error);
      }
    }
    inspected.sort((left, right) => right.score - left.score);
    const selected = inspected.find((candidate) => candidate.hasRecords) || inspected[0];
    candidateDiagnostics[target.key] = inspected.map((candidate) => ({
      logical_name: candidate.entity.LogicalName,
      display_name: label(candidate.entity.DisplayName),
      entity_set_name: candidate.entity.EntitySetName,
      has_records: candidate.hasRecords,
      relevant_field_count: candidate.domainFieldCount,
      score: candidate.score,
      selected: candidate === selected,
    }));
    if (!selected) {
      throw new Error(`Could not discover a readable Dynamics entity for ${target.key}.`);
    }
    selectedEntities.push(selected);
    console.log(
      `Selected ${target.key}: ${selected.entity.LogicalName} ` +
        `(${label(selected.entity.DisplayName) || selected.entity.EntitySetName}).`
    );
  }

  const annotations =
    'odata.include-annotations="OData.Community.Display.V1.FormattedValue,' +
    "Microsoft.Dynamics.CRM.lookuplogicalname," +
    'Microsoft.Dynamics.CRM.associatednavigationproperty",odata.maxpagesize=5000';
  const exports = {};
  for (const selected of selectedEntities) {
    const { target, entity, rawAttributes } = selected;
    console.log(`Downloading all ${target.key} records...`);
    const records = await getPages(`${apiBase}${entity.EntitySetName}`, annotations);
    const attributes = rawAttributes.map((attribute) => ({
      logical_name: attribute.LogicalName,
      schema_name: attribute.SchemaName,
      type: attribute.AttributeType,
      display_name: label(attribute.DisplayName),
      description: label(attribute.Description),
      readable: attribute.IsValidForRead,
    }));
    exports[target.key] = {
      entity: {
        logical_name: entity.LogicalName,
        schema_name: entity.SchemaName,
        display_name: label(entity.DisplayName),
        display_collection_name: label(entity.DisplayCollectionName),
        entity_set_name: entity.EntitySetName,
        primary_id_attribute: entity.PrimaryIdAttribute,
        primary_name_attribute: entity.PrimaryNameAttribute,
      },
      attributes,
      count: records.length,
      records,
    };
    console.log(`Collected ${records.length} ${target.key} records.`);
  }

  const payload = {
    format: "egcrm-dynamics-full-database-v1",
    exported_at: new Date().toISOString(),
    dynamics_url: clientUrl,
    read_only: true,
    candidate_diagnostics: candidateDiagnostics,
    entities: exports,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dynamics_full_database_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const summary = Object.fromEntries(
    Object.entries(exports).map(([key, value]) => [key, value.count])
  );
  console.log("Full Dynamics export downloaded. No Dynamics data was changed.", summary);
})().catch((error) => {
  console.error("Full Dynamics export failed.", error);
  alert(`Full Dynamics export failed: ${error.message}`);
});
