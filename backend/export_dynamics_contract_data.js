/*
Run this entire script in the browser console while signed in to Dynamics.
It reads Contract records and field metadata through the Dynamics Web API and
downloads JSON. No Dynamics records are created, edited, or deleted.
*/
(async () => {
  const clientUrl =
    globalThis.Xrm?.Utility?.getGlobalContext?.().getClientUrl?.() || location.origin;
  const apiBase = `${clientUrl}/api/data/v9.2/`;
  const request = async (url, prefer = "") => {
    const headers = {
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    };
    if (prefer) headers.Prefer = prefer;
    const response = await fetch(url, { credentials: "include", headers });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Dynamics API request failed: ${response.status} ${response.statusText}\n${detail}`
      );
    }
    return response.json();
  };

  const entityResponse = await request(
    `${apiBase}EntityDefinitions` +
      `?$select=LogicalName,SchemaName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,DisplayName,DisplayCollectionName`
  );
  const label = (value) =>
    value?.UserLocalizedLabel?.Label || value?.LocalizedLabels?.[0]?.Label || "";
  const candidates = entityResponse.value.filter((entity) =>
    [
      entity.LogicalName,
      entity.SchemaName,
      entity.EntitySetName,
      label(entity.DisplayName),
      label(entity.DisplayCollectionName),
    ].some((value) => /contract/i.test(value || ""))
  );
  if (candidates.length === 0) {
    throw new Error("No Dynamics entity with 'Contract' in its name or label was found.");
  }

  const inspectedCandidates = [];
  for (const candidate of candidates) {
    try {
      const attributesResponse = await request(
        `${apiBase}EntityDefinitions(LogicalName='${candidate.LogicalName}')/Attributes` +
          `?$select=LogicalName,SchemaName,AttributeType,DisplayName,Description,IsValidForRead`
      );
      const sample = await request(
        `${apiBase}${candidate.EntitySetName}?$select=${candidate.PrimaryIdAttribute}&$top=1`
      );
      const domainFields = attributesResponse.value.filter((attribute) =>
        /benef(?:iciary|eciary)|supplier|billing|management|technical|financial/i.test(
          `${label(attribute.DisplayName)} ${attribute.LogicalName} ${attribute.SchemaName}`
        )
      ).length;
      inspectedCandidates.push({
        entity: candidate,
        rawAttributes: attributesResponse.value,
        hasRecords: sample.value.length > 0,
        domainFields,
        score: (sample.value.length > 0 ? 1000 : 0) + domainFields,
      });
    } catch (error) {
      console.warn(`Skipping inaccessible entity ${candidate.LogicalName}.`, error);
    }
  }
  inspectedCandidates.sort((left, right) => right.score - left.score);
  const selected = inspectedCandidates[0];
  if (!selected || !selected.hasRecords) {
    throw new Error(
      "Contract-labelled entities were found, but none contained readable records."
    );
  }
  const entity = selected.entity;
  console.log(
    `Selected ${entity.LogicalName} (${label(entity.DisplayName)}) with ` +
      `${selected.domainFields} relevant fields.`
  );

  const attributes = selected.rawAttributes.map((attribute) => ({
    logical_name: attribute.LogicalName,
    schema_name: attribute.SchemaName,
    type: attribute.AttributeType,
    display_name:
      label(attribute.DisplayName),
    description:
      label(attribute.Description),
    readable: attribute.IsValidForRead,
  }));

  const contracts = [];
  let nextUrl = `${apiBase}${entity.EntitySetName}`;
  const annotations =
    'odata.include-annotations="OData.Community.Display.V1.FormattedValue,' +
    'Microsoft.Dynamics.CRM.lookuplogicalname",odata.maxpagesize=5000';
  while (nextUrl) {
    const page = await request(nextUrl, annotations);
    contracts.push(...page.value);
    nextUrl = page["@odata.nextLink"] || null;
    console.log(`Collected ${contracts.length} contracts...`);
  }

  const payload = {
    exported_at: new Date().toISOString(),
    dynamics_url: clientUrl,
    entity: {
      logical_name: entity.LogicalName,
      schema_name: entity.SchemaName,
      entity_set_name: entity.EntitySetName,
      primary_id_attribute: entity.PrimaryIdAttribute,
      primary_name_attribute: entity.PrimaryNameAttribute,
    },
    candidate_entities: inspectedCandidates.map((candidate) => ({
      logical_name: candidate.entity.LogicalName,
      display_name: label(candidate.entity.DisplayName),
      entity_set_name: candidate.entity.EntitySetName,
      has_records: candidate.hasRecords,
      relevant_field_count: candidate.domainFields,
      selected: candidate.entity.LogicalName === entity.LogicalName,
    })),
    attributes,
    count: contracts.length,
    contracts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `dynamics_contract_data_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  console.log(
    `Downloaded ${contracts.length} contracts and ${attributes.length} field definitions.`
  );
})().catch((error) => {
  console.error("Contract data export failed.", error);
  alert(`Contract data export failed: ${error.message}`);
});
