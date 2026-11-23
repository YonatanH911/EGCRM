import unittest
from types import SimpleNamespace

from migrations.repair_import_collisions import (
    SourceRecord,
    collision_groups,
    similarity_score,
    source_signature,
)


class RepairImportCollisionTests(unittest.TestCase):
    def test_scores_the_source_that_matches_the_existing_row(self):
        current = SimpleNamespace(
            product_name="Axon Pipeline",
            supplier="Axons Vision Ltd.",
            reference_number="2022070701",
            is_active=True,
        )
        matching = SourceRecord(
            entity_type="deposit",
            source_id="axon",
            active=True,
            fields={
                "product_name": "Axon Pipeline",
                "supplier": "Axons Vision Ltd.",
                "reference_number": "2022070701",
            },
            file_name="Active Deposits.xlsx",
        )
        other = SourceRecord(
            entity_type="deposit",
            source_id="files",
            active=True,
            fields={
                "product_name": "Updated files",
                "supplier": "Airtouch, O Soiling Ltd.",
                "reference_number": "2022070701",
            },
            file_name="Active Deposits.xlsx",
        )

        self.assertGreater(
            similarity_score(current, matching),
            similarity_score(current, other),
        )

    def test_reports_only_many_to_one_mapping_groups(self):
        importer = SimpleNamespace(
            mappings={
                ("deposit", "first"): 31,
                ("deposit", "second"): 31,
                ("deposit", "third"): 32,
                ("contact", "contact"): 8,
            }
        )

        self.assertEqual(
            collision_groups(importer),
            {("deposit", 31): ["first", "second"]},
        )

    def test_identical_source_rows_have_the_same_signature(self):
        first = SourceRecord("contact", "first", True, {"email": "same@example.com"}, "active.xlsx")
        second = SourceRecord("contact", "second", True, {"email": " SAME@example.com "}, "active.xlsx")

        self.assertEqual(source_signature(first), source_signature(second))


if __name__ == "__main__":
    unittest.main()
