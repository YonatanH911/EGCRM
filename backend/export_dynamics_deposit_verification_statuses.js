/*
Open any Deposit record in Dynamics, then run this entire script in the browser
console. It makes only GET requests and downloads a JSON export; it does not
create, edit, or delete Dynamics records.
*/
(async () => {
  const clientUrl =
    globalThis.Xrm?.Utility?.getGlobalContext?.().getClientUrl?.() || location.origin;
  const apiBase = `${clientUrl}/api/data/v9.2/`;
  const form = globalThis.Xrm?.Page;
  const entityName = form?.data?.entity?.getEntityName?.();
  const currentId = form?.data?.entity?.getId?.() || null;
  const label = (value) =>
    value?.UserLocalizedLabel?.Label || value?.LocalizedLabels?.[0]?.Label || "";
  const isVerificationStatus = (value) =>
    /verification[\s_-]*status|status[\s_-]*verification/i.test(value || "");

  if (!entityName) {
    throw new Error(
      "No Dynamics form context was found. Open a Deposit record, then run the script again."
    );
  }

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

  const entityResponse = await getPages(
    `${apiBase}EntityDefinitions` +
      `?$select=LogicalName,SchemaName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,DisplayName` +
      `&$filter=LogicalName eq '${entityName.replace(/'/g, "''")}'`
  );
  const entity = entityResponse[0];
  if (!entity?.EntitySetName || !entity?.PrimaryIdAttribute) {
    throw new Error(`Could not read Web API metadata for the open ${entityName} form.`);
  }

  const attributes = await getPages(
    `${apiBase}EntityDefinitions(LogicalName='${entityName.replace(/'/g, "''")}')/Attributes` +
      "?$select=LogicalName,SchemaName,AttributeType,DisplayName,Description,IsValidForRead"
  );
  const controls = form?.ui?.controls?.get?.() || [];
  const matchingControls = controls
    .filter((control) =>
      [control.getLabel?.(), control.getName?.(), control.getAttribute?.()?.getName?.()].some(
        isVerificationStatus
      )
    )
    .map((control) => ({
      label: control.getLabel?.() || "",
      control_name: control.getName?.() || "",
      attribute_name: control.getAttribute?.()?.getName?.() || null,
      visible: control.getVisible?.() ?? null,
    }));
  const formAttributeNames = [
    ...new Set(matchingControls.map((control) => control.attribute_name).filter(Boolean)),
  ];
  const metadataCandidates = attributes.filter((attribute) =>
    [
      label(attribute.DisplayName),
      attribute.LogicalName,
      attribute.SchemaName,
      label(attribute.Description),
    ].some(isVerificationStatus)
  );
  const selectedCandidates = formAttributeNames.length
    ? attributes.filter((attribute) => formAttributeNames.includes(attribute.LogicalName))
    : metadataCandidates.filter(
        (attribute) =>
          attribute.IsValidForRead !== false &&
          /^verification\s+status$/i.test(label(attribute.DisplayName).trim())
      );
  const fallbackCandidates = selectedCandidates.length
    ? selectedCandidates
    : metadataCandidates.filter((attribute) => attribute.IsValidForRead !== false);

  if (fallbackCandidates.length !== 1) {
    console.table(
      fallbackCandidates.map((attribute) => ({
        logical_name: attribute.LogicalName,
        schema_name: attribute.SchemaName,
        display_name: label(attribute.DisplayName),
        type: attribute.AttributeType,
      }))
    );
    throw new Error(
      `Expected exactly one Verification Status field, but found ${fallbackCandidates.length}. ` +
        "Keep the Deposit form open and review the candidate table in the console."
    );
  }

  const attribute = fallbackCandidates[0];
  const isLookup = /^(Lookup|Customer|Owner)$/.test(attribute.AttributeType || "");
  const property = isLookup ? `_${attribute.LogicalName}_value` : attribute.LogicalName;
  const selected = [
    entity.PrimaryIdAttribute,
    entity.PrimaryNameAttribute,
    property,
  ].filter(Boolean);
  const annotations =
    'odata.include-annotations="OData.Community.Display.V1.FormattedValue,' +
    'Microsoft.Dynamics.CRM.lookuplogicalname",odata.maxpagesize=5000';
  const rows = await getPages(
    `${apiBase}${entity.EntitySetName}?$select=${[...new Set(selected)].join(",")}`,
    annotations
  );
  const formattedKey = `${property}@OData.Community.Display.V1.FormattedValue`;
  const deposits = rows.map((row) => ({
    source_id: row[entity.PrimaryIdAttribute] || null,
    name: row[entity.PrimaryNameAttribute] || "",
    status_value: row[property] ?? null,
    status_label: row[formattedKey] ?? null,
  }));

  const payload = {
    exported_at: new Date().toISOString(),
    dynamics_url: clientUrl,
    current_record_id: currentId,
    entity: {
      logical_name: entity.LogicalName,
      schema_name: entity.SchemaName,
      display_name: label(entity.DisplayName),
      entity_set_name: entity.EntitySetName,
      primary_id_attribute: entity.PrimaryIdAttribute,
      primary_name_attribute: entity.PrimaryNameAttribute,
    },
    field: {
      logical_name: attribute.LogicalName,
      schema_name: attribute.SchemaName,
      display_name: label(attribute.DisplayName),
      type: attribute.AttributeType,
      property,
    },
    matching_form_controls: matchingControls,
    count: deposits.length,
    deposits,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dynamics_deposit_verification_statuses_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  console.log(
    `Downloaded Verification Status for ${deposits.length} deposits from ` +
      `${attribute.LogicalName} (${label(attribute.DisplayName)}).`
  );
})().catch((error) => {
  console.error("Deposit Verification Status export failed.", error);
  alert(`Deposit Verification Status export failed: ${error.message}`);
});
