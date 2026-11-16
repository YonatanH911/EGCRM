import contextlib
import io
import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from migrations import migrate_deposit_details
from migrations.migrate_deposit_details import details_from_record, load_export
import models


ATTRIBUTES = [
    {
        "logical_name": "ey_confirmationsent",
        "schema_name": "ey_ConfirmationSent",
        "display_name": "Is Confirmation Sent?",
        "type": "Boolean",
        "readable": True,
    },
    {
        "logical_name": "ey_dateconfirmationsent",
        "schema_name": "ey_DateConfirmationSent",
        "display_name": "Date Confirmation Sent",
        "type": "DateTime",
        "readable": True,
    },
    {
        "logical_name": "ey_verifiedbyid",
        "schema_name": "ey_VerifiedById",
        "display_name": "Verified By",
        "type": "Lookup",
        "readable": True,
    },
    {
        "logical_name": "ey_isreportsent",
        "schema_name": "ey_IsReportSent",
        "display_name": "Is Report Sent",
        "type": "Boolean",
        "readable": True,
    },
    {
        "logical_name": "ey_datereportsent",
        "schema_name": "ey_DateReportSent",
        "display_name": "Date Report Sent",
        "type": "DateTime",
        "readable": True,
    },
]

CONTACT_GUID = "01234567-89ab-cdef-0123-456789abcdef"


def deposit_record(source_id: str = "DEP-GUID") -> dict:
    return {
        "ey_depositid": source_id,
        "ey_name": "Deposit Product",
        "ey_confirmationsent": True,
        "ey_dateconfirmationsent": "2026-07-12T00:00:00Z",
        "_ey_verifiedbyid_value": CONTACT_GUID,
        "_ey_verifiedbyid_value@OData.Community.Display.V1.FormattedValue": "Ada Lovelace",
        "_ey_verifiedbyid_value@Microsoft.Dynamics.CRM.lookuplogicalname": "contact",
        "ey_isreportsent": True,
        "ey_datereportsent": "2026-07-14T00:00:00Z",
    }


def write_export(path: Path, records: list[dict]) -> None:
    path.write_text(
        json.dumps(
            {
                "entity": {
                    "primary_id_attribute": "ey_depositid",
                    "primary_name_attribute": "ey_name",
                },
                "attributes": ATTRIBUTES,
                "deposits": records,
            }
        ),
        encoding="utf-8",
    )


class DepositDetailsMigrationTests(unittest.TestCase):
    def test_detects_and_extracts_all_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "details.json"
            write_export(path, [deposit_record()])
            export = load_export(path)
            details = details_from_record(export.records["dep-guid"], export.fields)

        self.assertTrue(details.confirmation_sent)
        self.assertEqual(details.date_confirmation_sent, datetime(2026, 7, 12))
        self.assertEqual(details.verified_by_source_id, CONTACT_GUID)
        self.assertEqual(details.verified_by_name, "Ada Lovelace")
        self.assertTrue(details.is_report_sent)
        self.assertEqual(details.date_report_sent, datetime(2026, 7, 14))

    def test_rejects_ambiguous_field_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "details.json"
            duplicate = dict(ATTRIBUTES[0], logical_name="ey_confirmationsentcopy")
            payload = {
                "entity": {
                    "primary_id_attribute": "ey_depositid",
                    "primary_name_attribute": "ey_name",
                },
                "attributes": [*ATTRIBUTES, duplicate],
                "deposits": [deposit_record()],
            }
            path.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Could not uniquely identify"):
                load_export(path)

    def test_accepts_verified_by_as_contact_name_text(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "details.json"
            record = deposit_record()
            record.pop(
                "_ey_verifiedbyid_value@OData.Community.Display.V1.FormattedValue"
            )
            record["_ey_verifiedbyid_value"] = "Ada Lovelace"
            write_export(path, [record])
            export = load_export(path)
            details = details_from_record(export.records["dep-guid"], export.fields)

        self.assertEqual(details.verified_by_source_id, "")
        self.assertEqual(details.verified_by_name, "Ada Lovelace")

    def test_dry_run_then_apply_uses_guid_mappings(self):
        engine = create_engine("sqlite:///:memory:")
        models.Base.metadata.create_all(engine)
        with engine.begin() as connection:
            connection.execute(
                text(
                    "CREATE TABLE legacy_import_ids "
                    "(entity_type VARCHAR(32), source_id VARCHAR(64), local_id INT)"
                )
            )
        session_factory = sessionmaker(bind=engine)
        with session_factory() as db:
            contact = models.Contact(first_name="Ada", last_name="Lovelace")
            deposit = models.Deposit(
                reference_number="DEP-1",
                amount=0,
                status=models.DepositStatus.VERIFIED,
                product_name="Deposit Product",
            )
            db.add_all([contact, deposit])
            db.flush()
            contact_id = contact.id
            deposit_id = deposit.id
            db.execute(
                text(
                    "INSERT INTO legacy_import_ids VALUES "
                    "('deposit', 'DEP-GUID', :deposit_id), "
                    "('contact', :contact_guid, :contact_id)"
                ),
                {
                    "deposit_id": deposit_id,
                    "contact_id": contact_id,
                    "contact_guid": CONTACT_GUID,
                },
            )
            db.commit()

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "details.json"
            write_export(path, [deposit_record()])
            with patch.object(migrate_deposit_details, "SessionLocal", session_factory):
                with contextlib.redirect_stdout(io.StringIO()):
                    migrate_deposit_details.run(path)
                with session_factory() as db:
                    unchanged = db.get(models.Deposit, deposit_id)
                    self.assertFalse(unchanged.confirmation_sent)
                    self.assertIsNone(unchanged.verified_by_contact_id)

                with contextlib.redirect_stdout(io.StringIO()):
                    migrate_deposit_details.run(path, apply=True)

        with session_factory() as db:
            updated = db.get(models.Deposit, deposit_id)
            self.assertTrue(updated.confirmation_sent)
            self.assertEqual(updated.date_confirmation_sent, datetime(2026, 7, 12))
            self.assertEqual(updated.verified_by_contact_id, contact_id)
            self.assertTrue(updated.is_confirmation_sent)
            self.assertEqual(updated.date_report_sent, datetime(2026, 7, 14))


if __name__ == "__main__":
    unittest.main()
