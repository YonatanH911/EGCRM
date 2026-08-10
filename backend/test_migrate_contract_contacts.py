import unittest

from migrate_contract_contacts import (
    canonicalize_contact_cell,
    normalize_title,
    resolve_contact_columns,
)


class ContractContactMigrationTests(unittest.TestCase):
    def test_resolves_six_party_contact_columns(self):
        headers = [
            "Contract Title",
            "Beneficiary Management Contact",
            "Beneficiary Technical Contact",
            "Beneficiary Financial Contact",
            "Supplier Management Contact",
            "Supplier Technical Contact",
            "Supplier Financial Contact",
        ]

        columns, warnings = resolve_contact_columns(headers, "both")

        self.assertEqual(len(columns), 6)
        self.assertEqual(columns["beneficiary_management_contact"], 1)
        self.assertEqual(columns["supplier_financial_contact"], 6)
        self.assertEqual(warnings, [])

    def test_maps_legacy_columns_to_both_parties(self):
        headers = [
            "Name",
            "Management Contact",
            "Technical Contact",
            "Financial Contact",
        ]

        columns, warnings = resolve_contact_columns(headers, "both")

        self.assertEqual(len(columns), 6)
        self.assertEqual(columns["beneficiary_technical_contact"], 2)
        self.assertEqual(columns["supplier_technical_contact"], 2)
        self.assertEqual(len(warnings), 6)

    def test_canonicalizes_known_names_and_preserves_unknown_names(self):
        names = {
            "alice smith": {"Alice Smith"},
            "bob jones": {"Bob Jones"},
        }
        emails = {"alice@example.com": "Alice Smith"}

        value, unresolved = canonicalize_contact_cell(
            "alice@example.com; bob jones; External Person", names, emails
        )

        self.assertEqual(value, "Alice Smith, Bob Jones, External Person")
        self.assertEqual(unresolved, ["External Person"])

    def test_normalizes_case_spacing_and_dash_variants(self):
        self.assertEqual(
            normalize_title("  6 Cross North LTD - R.S Industries  "),
            normalize_title("6 cross north ltd\u2013r.s industries"),
        )


if __name__ == "__main__":
    unittest.main()
