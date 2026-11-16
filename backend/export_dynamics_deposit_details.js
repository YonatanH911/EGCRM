/*
Open any Deposit record in Dynamics, then run this entire script in the browser
console. It makes GET requests only and downloads field metadata and Deposit
records; it does not create, edit, or delete anything in Dynamics.
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

  const entities = await getPages(
    `${apiBase}EntityDefinitions` +
      `?$select=LogicalName,SchemaName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,DisplayName` +
      `&$filter=LogicalName eq '${entityName.replace(/'/g, "''")}'`
  );
  const entity = entities[0];
  if (!entity?.EntitySetName || !entity?.PrimaryIdAttribute) {
    throw new Error(`Could not read Web API metadata for the open ${entityName} form.`);
  }

  const rawAttributes = await getPages(
    `${apiBase}EntityDefinitions(LogicalName='${entityName.replace(/'/g, "''")}')/Attributes` +
      "?$select=LogicalName,SchemaName,AttributeType,DisplayName,Description,IsValidForRead"
  );
  const attributes = rawAttributes.map((attribute) => ({
    logical_name: attribute.LogicalName,
    schema_name: attribute.SchemaName,
    type: attribute.AttributeType,
    display_name: label(attribute.DisplayName),
    description: label(attribute.Description),
    readable: attribute.IsValidForRead,
  }));

  const annotations =
    'odata.include-annotations="OData.Community.Display.V1.FormattedValue,' +
    'Microsoft.Dynamics.CRM.lookuplogicalname",odata.maxpagesize=5000';
  const deposits = await getPages(`${apiBase}${entity.EntitySetName}`, annotations);

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
    attributes,
    count: deposits.length,
    deposits,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dynamics_deposit_details_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  console.log(
    `Downloaded ${deposits.length} Deposits and ${attributes.length} field definitions. ` +
      "No Dynamics records were changed."
  );
})().catch((error) => {
  console.error("Deposit details export failed.", error);
  alert(`Deposit details export failed: ${error.message}`);
});
