import json
import tempfile
import unittest
from pathlib import Path

from migrate_contract_data import (
    contract_type,
    load_contracts,
    normalize_guid,
    source_value,
    text_value,
)


class ContractDataMigrationTests(unittest.TestCase):
    def test_normalizes_guid(self):
        self.assertEqual(normalize_guid(" {ABC-123} "), "abc-123")

    def test_reads_formatted_lookup_name(self):
        record = {
            "_ey_supplier_id_value": "abc",
            "_ey_supplier_id_value@OData.Community.Display.V1.FormattedValue": "Supplier Ltd",
        }
        self.assertEqual(source_value(record, "ey_supplier_id", True), "Supplier Ltd")

    def test_reads_raw_money_without_formatting(self):
        record = {
            "ey_f_supplier_annual_fee": 15000.0,
            "ey_f_supplier_annual_fee@OData.Community.Display.V1.FormattedValue": "15,000.00",
        }
        self.assertEqual(source_value(record, "ey_f_supplier_annual_fee", False), "15000")

    def test_maps_contract_type_to_frontend_choice(self):
        self.assertEqual(contract_type("3 Party"), "3-party")
        self.assertEqual(contract_type("Frame"), "frame")

    def test_loads_custom_contract_primary_ids(self):
        payload = {
            "entity": {"primary_id_attribute": "ey_contractid"},
            "contracts": [{"ey_contractid": "{ABC}", "ey_name": "Contract"}],
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "contracts.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            contracts, conflicts = load_contracts(path)
        self.assertEqual(set(contracts), {"abc"})
        self.assertEqual(conflicts, 0)

    def test_formats_integral_float_without_decimal_suffix(self):
        self.assertEqual(text_value(3500.0), "3500")


if __name__ == "__main__":
    unittest.main()
