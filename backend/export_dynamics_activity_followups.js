/*
Run in the browser console while signed in to Dynamics. This script makes only
GET requests and downloads a JSON export; it does not change Dynamics records.
*/
(async () => {
  const clientUrl =
    globalThis.Xrm?.Utility?.getGlobalContext?.().getClientUrl?.() || location.origin;
  const apiBase = `${clientUrl}/api/data/v9.2/`;
  const label = (value) =>
    value?.UserLocalizedLabel?.Label || value?.LocalizedLabels?.[0]?.Label || "";
  const matchesFollowUp = (value) =>
    /follow[\s_-]*up.*(?:e[\s_-]?mail|with)/i.test(value || "");

  const getPages = async (url, prefer = "") => {
    const rows = [];
    while (url) {
      const headers = {
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
      };
      if (prefer) headers.Prefer = prefer;
      const response = await fetch(url, { method: "GET", credentials: "include", headers });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
      }
      const page = await response.json();
      rows.push(...(page.value || []));
      url = page["@odata.nextLink"] || null;
    }
    return rows;
  };

  const form = globalThis.Xrm?.Page;
  let formContext = null;
  try {
    formContext = {
      entity_name: form?.data?.entity?.getEntityName?.() || null,
      activity_id: form?.data?.entity?.getId?.() || null,
      matching_controls: (form?.ui?.controls?.get?.() || [])
        .filter((control) =>
          [control.getLabel?.(), control.getName?.(), control.getAttribute?.()?.getName?.()]
            .some(matchesFollowUp)
        )
        .map((control) => {
          const attribute = control.getAttribute?.();
          return {
            label: control.getLabel?.() || "",
            control_name: control.getName?.() || "",
            attribute_name: attribute?.getName?.() || null,
            attribute_type: attribute?.getAttributeType?.() || null,
            value: attribute?.getValue?.() ?? null,
          };
        }),
    };
  } catch (error) {
    console.warn("Could not inspect the open form controls.", error);
  }

  const entities = await getPages(
    `${apiBase}EntityDefinitions` +
      "?$select=LogicalName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,IsActivity,DisplayName"
  );
  const activityEntities = entities.filter(
    (entity) => entity.IsActivity || entity.LogicalName === "activitypointer"
  );
  const discovered = [];
  const nearbyFields = [];
  const errors = [];
  const records = [];
  const annotations =
    'odata.include-annotations="OData.Community.Display.V1.FormattedValue,' +
    'Microsoft.Dynamics.CRM.lookuplogicalname",odata.maxpagesize=5000';

  for (const entity of activityEntities) {
    if (!entity.EntitySetName || !entity.PrimaryIdAttribute) continue;
    try {
      const attributes = await getPages(
        `${apiBase}EntityDefinitions(LogicalName='${entity.LogicalName}')/Attributes` +
          "?$select=LogicalName,SchemaName,AttributeType,DisplayName,IsValidForRead"
      );
      for (const attribute of attributes) {
        if (/follow|e[\s_-]?mail/i.test(
          `${label(attribute.DisplayName)} ${attribute.LogicalName} ${attribute.SchemaName}`
        )) {
          nearbyFields.push({
            entity_name: entity.LogicalName,
            logical_name: attribute.LogicalName,
            display_name: label(attribute.DisplayName),
            type: attribute.AttributeType,
          });
        }
      }
      const candidates = attributes.filter((attribute) => {
        const names = [
          label(attribute.DisplayName),
          attribute.LogicalName,
          attribute.SchemaName,
        ];
        const formField =
          formContext?.entity_name === entity.LogicalName &&
          formContext.matching_controls.some(
            (control) => control.attribute_name === attribute.LogicalName
          );
        return attribute.IsValidForRead !== false &&
          (names.some(matchesFollowUp) || formField);
      });
      const formAttributeNames = formContext?.entity_name === entity.LogicalName
        ? formContext.matching_controls.map((control) => control.attribute_name).filter(Boolean)
        : [];
      const matched = formAttributeNames.length
        ? candidates.filter((attribute) => formAttributeNames.includes(attribute.LogicalName))
        : candidates.filter((attribute) => !/(?:name|yominame)$/i.test(attribute.LogicalName));
      if (!matched.length) continue;

      const fields = matched.map((attribute) => {
        const type = attribute.AttributeType || "";
        const property = /^(Lookup|Customer|Owner)$/.test(type)
          ? `_${attribute.LogicalName}_value`
          : attribute.LogicalName;
        return {
          logical_name: attribute.LogicalName,
          display_name: label(attribute.DisplayName),
          type,
          property,
        };
      });
      const source = {
        entity_name: entity.LogicalName,
        entity_set_name: entity.EntitySetName,
        primary_id_attribute: entity.PrimaryIdAttribute,
        primary_name_attribute: entity.PrimaryNameAttribute,
        fields,
        rows_exported: 0,
      };
      discovered.push(source);

      const selected = [
        entity.PrimaryIdAttribute,
        entity.PrimaryNameAttribute,
        ...fields.map((field) => field.property),
      ].filter(Boolean);
      const columns = [...new Set(selected)].join(",");
      const rows = await getPages(
        `${apiBase}${entity.EntitySetName}?$select=${columns}`,
        annotations
      );
      for (const row of rows) {
        records.push({
          activityid: row[entity.PrimaryIdAttribute] || null,
          subject: row[entity.PrimaryNameAttribute] || "",
          source_entity: entity.LogicalName,
          follow_up_fields: fields.map((field) => ({
            ...field,
            value: row[field.property] ?? null,
            formatted_value:
              row[`${field.property}@OData.Community.Display.V1.FormattedValue`] ?? null,
            lookup_type:
              row[`${field.property}@Microsoft.Dynamics.CRM.lookuplogicalname`] ?? null,
          })),
        });
      }
      source.rows_exported = rows.length;
      console.log(`Collected ${rows.length} ${entity.LogicalName} activities.`);
    } catch (error) {
      errors.push({ entity_name: entity.LogicalName, message: String(error) });
      console.warn(`Could not export ${entity.LogicalName}.`, error);
    }
  }

  const payload = {
    exported_at: new Date().toISOString(),
    dynamics_url: clientUrl,
    form_context: formContext,
    activity_entities_inspected: activityEntities.length,
    discovered_fields: discovered,
    nearby_fields: nearbyFields,
    errors,
    count: records.length,
    activities: records,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dynamics_activity_followups_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  console.log(
    `Downloaded ${records.length} activities from ${discovered.length} matching entities.`
  );
  if (!discovered.length || errors.length) {
    console.warn("Review the JSON diagnostics before importing: no fields found or some requests failed.");
  }
})().catch((error) => {
  console.error("Follow Up Email export failed.", error);
  alert(`Follow Up Email export failed: ${error.message}`);
});
