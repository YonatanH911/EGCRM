import unittest
from datetime import datetime

from repair_contract_import_mappings import (
    SourceContract,
    create_contract,
    exact_source_match,
    source_match_score,
)


class ContractMappingRepairTests(unittest.TestCase):
    def source(self):
        return SourceContract(
            source_id="abc",
            title="Beneficiary - Supplier",
            start_date=datetime(2025, 1, 1),
            end_date=datetime(2026, 1, 1),
            is_active=True,
        )

    def test_requires_exact_title_dates_and_state_for_orphan_reuse(self):
        source = self.source()
        contract = create_contract({}, source)
        self.assertTrue(exact_source_match(contract, source))
        contract.end_date = datetime(2027, 1, 1)
        self.assertFalse(exact_source_match(contract, source))

    def test_match_score_prefers_matching_dates(self):
        source = self.source()
        matching = create_contract({}, source)
        other = create_contract(
            {},
            SourceContract(
                source_id="def",
                title=source.title,
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 12, 31),
                is_active=True,
            ),
        )
        self.assertGreater(
            source_match_score(matching, source),
            source_match_score(other, source),
        )

    def test_new_contract_uses_dynamics_party_and_billing_values(self):
        source = self.source()
        suffix = "@OData.Community.Display.V1.FormattedValue"
        record = {
            f"_ey_beneficiary_id_value{suffix}": "Beneficiary Ltd",
            f"ey_p_contract_type{suffix}": "Frame",
            f"ey_p_beneficiary_currency{suffix}": "EUR",
            "ey_f_beneficiary_annual_fee": 2500.0,
        }
        contract = create_contract(record, source)
        self.assertEqual(contract.beneficiary_title, "Beneficiary Ltd")
        self.assertEqual(contract.contact_type, "frame")
        self.assertEqual(contract.beneficiary_currency, "EUR")
        self.assertEqual(contract.beneficiary_annual_fee, "2500")
        self.assertEqual(contract.value, 2500.0)


if __name__ == "__main__":
    unittest.main()
