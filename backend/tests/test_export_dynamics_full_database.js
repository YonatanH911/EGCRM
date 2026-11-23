const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

async function main() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "export_dynamics_full_database.js"),
    "utf8"
  );
  const requests = [];
  let downloaded;
  const definitions = [
    ["account", "accounts", "accountid", "name", "Account", "Accounts"],
    ["contact", "contacts", "contactid", "fullname", "Contact", "Contacts"],
    ["ey_contract", "ey_contracts", "ey_contractid", "ey_name", "Contract", "Contracts"],
    ["ey_vault", "ey_vaults", "ey_vaultid", "ey_name", "Vault", "Vaults"],
    ["ey_deposit", "ey_deposits", "ey_depositid", "ey_name", "Deposit", "Deposits"],
    ["activitypointer", "activitypointers", "activityid", "subject", "Activity", "Activities"],
  ].map(([logical, set, id, name, display, collection]) => ({
    LogicalName: logical,
    SchemaName: logical,
    EntitySetName: set,
    PrimaryIdAttribute: id,
    PrimaryNameAttribute: name,
    IsActivity: logical === "activitypointer",
    DisplayName: { UserLocalizedLabel: { Label: display } },
    DisplayCollectionName: { UserLocalizedLabel: { Label: collection } },
  }));
  const byLogical = Object.fromEntries(definitions.map((entity) => [entity.LogicalName, entity]));
  const bySet = Object.fromEntries(definitions.map((entity) => [entity.EntitySetName, entity]));
  const context = {
    Xrm: {
      Utility: { getGlobalContext: () => ({ getClientUrl: () => "https://crm.example" }) },
    },
    location: { origin: "https://crm.example" },
    fetch: async (url, options) => {
      requests.push({ url, method: options.method });
      let value;
      const attributeMatch = url.match(/EntityDefinitions\(LogicalName='([^']+)'\)\/Attributes/);
      if (attributeMatch) {
        const logical = attributeMatch[1];
        const labels = {
          account: "Account Name",
          contact: "Full Name",
          ey_contract: "Beneficiary",
          ey_vault: "Vault Name",
          ey_deposit: "Deposit Number",
          activitypointer: "Subject",
        };
        value = [{
          LogicalName: byLogical[logical].PrimaryNameAttribute,
          SchemaName: byLogical[logical].PrimaryNameAttribute,
          AttributeType: "String",
          DisplayName: { UserLocalizedLabel: { Label: labels[logical] } },
          Description: { UserLocalizedLabel: { Label: "" } },
          IsValidForRead: true,
        }];
      } else if (url.includes("EntityDefinitions")) {
        value = definitions;
      } else {
        const set = Object.keys(bySet).find((name) => url.includes(`/${name}`));
        if (!set) throw new Error(`Unexpected URL: ${url}`);
        const entity = bySet[set];
        value = [{
          [entity.PrimaryIdAttribute]: `${entity.LogicalName}-guid`,
          [entity.PrimaryNameAttribute]: `${entity.LogicalName} row`,
          statecode: 1,
          _parentcustomerid_value: "account-guid",
          "_parentcustomerid_value@Microsoft.Dynamics.CRM.lookuplogicalname": "account",
        }];
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
  assert.equal(payload.format, "egcrm-dynamics-full-database-v1");
  assert.deepEqual(Object.keys(payload.entities), [
    "account", "contact", "contract", "vault", "deposit", "activity",
  ]);
  assert.equal(payload.entities.contact.records[0].statecode, 1);
  assert.equal(payload.entities.contact.records[0]._parentcustomerid_value, "account-guid");
  assert.equal(payload.entities.deposit.count, 1);
  assert.ok(requests.length >= 19);
  assert.ok(requests.every((request) => request.method === "GET"));
  console.log("Dynamics full database exporter test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
