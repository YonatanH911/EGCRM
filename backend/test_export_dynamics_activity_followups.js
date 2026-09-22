const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

async function main() {
  const source = fs.readFileSync(
    path.join(__dirname, "export_dynamics_activity_followups.js"),
    "utf8"
  );
  const requests = [];
  let downloaded;
  const context = {
    Xrm: {
      Utility: { getGlobalContext: () => ({ getClientUrl: () => "https://crm.example" }) },
      Page: {
        data: { entity: { getEntityName: () => "task", getId: () => "{abc}" } },
        ui: { controls: { get: () => [{
          getLabel: () => "Follow Up Email",
          getName: () => "new_followupemail2",
          getAttribute: () => ({
            getName: () => "new_followupemail2",
            getAttributeType: () => "lookup",
            getValue: () => [{ id: "contact-guid", entityType: "contact", name: "Person" }],
          }),
        }] } },
      },
    },
    location: { origin: "https://crm.example" },
    fetch: async (url, options) => {
      requests.push({ url, method: options.method });
      let value;
      if (url.includes("EntityDefinitions(LogicalName='task')/Attributes")) {
        value = [
          {
            LogicalName: "new_followupemail2",
            SchemaName: "new_FollowUpEmail2",
            AttributeType: "Lookup",
            DisplayName: { UserLocalizedLabel: { Label: "Follow Up Email" } },
            IsValidForRead: true,
          },
          {
            LogicalName: "new_followupemail2name",
            SchemaName: "new_FollowUpEmail2Name",
            AttributeType: "String",
            DisplayName: { UserLocalizedLabel: { Label: "" } },
            IsValidForRead: true,
          },
        ];
      } else if (url.includes("EntityDefinitions")) {
        value = [{
          LogicalName: "task",
          EntitySetName: "tasks",
          PrimaryIdAttribute: "activityid",
          PrimaryNameAttribute: "subject",
          IsActivity: true,
        }];
      } else if (url.includes("/tasks?")) {
        value = [{
          activityid: "abc",
          subject: "Follow up",
          _new_followupemail2_value: "contact-guid",
          "_new_followupemail2_value@Microsoft.Dynamics.CRM.lookuplogicalname": "contact",
        }];
      } else {
        throw new Error(`Unexpected URL: ${url}`);
      }
      return { ok: true, json: async () => ({ value }) };
    },
    Blob: class {
      constructor(parts) { this.parts = parts; }
    },
    URL: {
      createObjectURL: (blob) => { downloaded = blob; return "blob:test"; },
      revokeObjectURL: () => {},
    },
    document: { createElement: () => ({ click: () => {} }) },
    setTimeout: (callback) => callback(),
    console,
    alert: (message) => { throw new Error(message); },
  };

  await vm.runInNewContext(source, context);
  const payload = JSON.parse(downloaded.parts.join(""));
  assert.equal(payload.count, 1);
  assert.equal(payload.activities[0].activityid, "abc");
  assert.equal(payload.activities[0].follow_up_fields[0].value, "contact-guid");
  assert.equal(payload.activities[0].follow_up_fields[0].lookup_type, "contact");
  assert.equal(payload.discovered_fields[0].fields[0].logical_name, "new_followupemail2");
  assert.ok(!requests.some((request) => request.url.includes("new_followupemail2name")));
  assert.ok(requests.length >= 3);
  assert.ok(requests.every((request) => request.method === "GET"));
  console.log("Dynamics follow-up exporter test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
