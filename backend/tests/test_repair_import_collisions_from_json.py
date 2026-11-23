import unittest
from datetime import datetime
from types import SimpleNamespace

import models
from migrations.repair_import_collisions import SourceRecord
from migrations.repair_import_collisions_from_json import (
    JsonSource,
    assign_fields,
    build_plans,
    parse_datetime,
)


class RepairImportCollisionsFromJsonTests(unittest.TestCase):
    def test_converts_utc_dates_to_jerusalem_time(self):
        self.assertEqual(
            parse_datetime("2026-07-01T21:30:00Z"),
            datetime(2026, 7, 2, 0, 30),
        )

    def test_tied_sources_retain_the_oldest_dynamics_record(self):
        current = SimpleNamespace(
            first_name="Olga",
            last_name="Genish",
            email="ogenish@example.com",
            phone=None,
            is_active=True,
        )
        sources = {
            ("contact", "older"): JsonSource(
                source=SourceRecord(
                    "contact",
                    "older",
                    True,
                    {
                        "first_name": "Olga",
                        "last_name": "Genish",
                        "email": "ogenish@example.com",
                        "phone": "111",
                    },
                    "full.json",
                ),
                raw={"createdon": "2026-03-31T07:30:35Z"},
            ),
            ("contact", "newer"): JsonSource(
                source=SourceRecord(
                    "contact",
                    "newer",
                    True,
                    {
                        "first_name": "Olga",
                        "last_name": "Genish",
                        "email": "ogenish@example.com",
                        "phone": "222",
                    },
                    "full.json",
                ),
                raw={"createdon": "2026-07-15T07:08:24Z"},
            ),
        }
        db = SimpleNamespace(get=lambda _model, _local_id: current)

        plans, failures = build_plans(
            db,
            {("contact", "older"): 3491, ("contact", "newer"): 3491},
            sources,
        )

        self.assertEqual(failures, [])
        self.assertEqual(plans[0].retained_source_id, "older")
        self.assertEqual(plans[0].split_source_ids, ("newer",))
        self.assertIn("oldest Dynamics row", plans[0].retained_reason)

    def test_assign_fields_clears_nullable_values_from_merged_row(self):
        contact = models.Contact(
            first_name="Old",
            last_name="Name",
            email="wrong@example.com",
        )
        source = JsonSource(
            source=SourceRecord(
                "contact",
                "source",
                False,
                {"first_name": "Correct", "last_name": "Name", "email": None},
                "full.json",
            ),
            raw={},
        )

        assign_fields(contact, source)

        self.assertEqual(contact.first_name, "Correct")
        self.assertIsNone(contact.email)
        self.assertFalse(contact.is_active)


if __name__ == "__main__":
    unittest.main()
