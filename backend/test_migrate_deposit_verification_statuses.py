import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import migrate_deposit_verification_statuses
from migrate_deposit_verification_statuses import deposit_status, load_statuses
import models


def write_export(path: Path, records: list[dict]) -> None:
    path.write_text(
        json.dumps(
            {
                "entity": {"primary_id_attribute": "ey_depositid"},
                "field": {"logical_name": "ey_verificationstatus"},
                "deposits": records,
            }
        ),
        encoding="utf-8",
    )


class DepositVerificationStatusMigrationTests(unittest.TestCase):
    def test_maps_supported_dynamics_labels(self):
        self.assertEqual(deposit_status("Verified"), models.DepositStatus.VERIFIED)
        self.assertEqual(deposit_status(" verify "), models.DepositStatus.VERIFIED)
        self.assertEqual(deposit_status("OPEN"), models.DepositStatus.OPEN)
        self.assertEqual(deposit_status("In Process"), models.DepositStatus.OPEN)
        self.assertEqual(deposit_status("Passive"), models.DepositStatus.PASSIVE)
        self.assertIsNone(deposit_status(""))

    def test_loads_formatted_statuses_and_counts_blanks(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "statuses.json"
            write_export(
                path,
                [
                    {"source_id": "{ABC}", "status_value": 1, "status_label": "Verified"},
                    {"source_id": "DEF", "status_value": 2, "status_label": "Open"},
                    {"source_id": "GHI", "status_value": 3, "status_label": "Passive"},
                    {"source_id": "JKL", "status_value": None, "status_label": None},
                ],
            )
            export = load_statuses(path)

        self.assertEqual(export.statuses["abc"], models.DepositStatus.VERIFIED)
        self.assertEqual(export.statuses["def"], models.DepositStatus.OPEN)
        self.assertEqual(export.statuses["ghi"], models.DepositStatus.PASSIVE)
        self.assertEqual(export.blank_statuses, 1)
        self.assertEqual(export.field_name, "ey_verificationstatus")

    def test_rejects_unknown_and_conflicting_statuses(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "statuses.json"
            write_export(path, [{"source_id": "ABC", "status_label": "Closed"}])
            with self.assertRaisesRegex(ValueError, "Unrecognized"):
                load_statuses(path)

            write_export(
                path,
                [
                    {"source_id": "ABC", "status_label": "Open"},
                    {"source_id": "{abc}", "status_label": "Passive"},
                ],
            )
            with self.assertRaisesRegex(ValueError, "conflicting"):
                load_statuses(path)

    def test_dry_run_then_apply_updates_only_mapped_statuses(self):
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
            changing = models.Deposit(
                reference_number="DEP-1",
                amount=0,
                status=models.DepositStatus.VERIFIED,
                product_name="Main product",
            )
            unchanged = models.Deposit(
                reference_number="DEP-2",
                amount=0,
                status=models.DepositStatus.PASSIVE,
            )
            db.add_all([changing, unchanged])
            db.flush()
            changing_id = changing.id
            unchanged_id = unchanged.id
            db.execute(
                text(
                    "INSERT INTO legacy_import_ids VALUES "
                    "('deposit', 'abc', :changing_id), "
                    "('deposit', 'abc-copy', :changing_id), "
                    "('deposit', 'def', :unchanged_id)"
                ),
                {"changing_id": changing_id, "unchanged_id": unchanged_id},
            )
            db.commit()

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "statuses.json"
            write_export(
                path,
                [
                    {"source_id": "ABC", "status_label": "Open"},
                    {"source_id": "ABC-COPY", "status_label": "Open"},
                    {"source_id": "DEF", "status_label": "Passive"},
                ],
            )
            with patch.object(
                migrate_deposit_verification_statuses,
                "SessionLocal",
                session_factory,
            ):
                with contextlib.redirect_stdout(io.StringIO()):
                    migrate_deposit_verification_statuses.run(path)
                with session_factory() as db:
                    self.assertEqual(
                        db.get(models.Deposit, changing_id).status,
                        models.DepositStatus.VERIFIED,
                    )

                with contextlib.redirect_stdout(io.StringIO()):
                    migrate_deposit_verification_statuses.run(path, apply=True)
                with session_factory() as db:
                    self.assertEqual(
                        db.get(models.Deposit, changing_id).status,
                        models.DepositStatus.OPEN,
                    )
                    self.assertEqual(
                        db.get(models.Deposit, unchanged_id).status,
                        models.DepositStatus.PASSIVE,
                    )

                with session_factory() as db:
                    db.execute(
                        text(
                            "INSERT INTO legacy_import_ids VALUES "
                            "('deposit', 'abc-conflict', :changing_id)"
                        ),
                        {"changing_id": changing_id},
                    )
                    db.commit()
                write_export(
                    path,
                    [
                        {"source_id": "ABC", "name": "Main product", "status_label": "Open"},
                        {"source_id": "ABC-COPY", "name": "Old product", "status_label": "Open"},
                        {"source_id": "ABC-CONFLICT", "name": "Other product", "status_label": "Passive"},
                        {"source_id": "DEF", "status_label": "Passive"},
                    ],
                )
                with contextlib.redirect_stdout(io.StringIO()):
                    migrate_deposit_verification_statuses.run(path)

                with session_factory() as db:
                    db.execute(
                        text(
                            "INSERT INTO legacy_import_ids VALUES "
                            "('deposit', 'abc-ambiguous', :changing_id)"
                        ),
                        {"changing_id": changing_id},
                    )
                    db.commit()
                write_export(
                    path,
                    [
                        {"source_id": "ABC", "name": "Main product", "status_label": "Open"},
                        {"source_id": "ABC-COPY", "name": "Old product", "status_label": "Open"},
                        {"source_id": "ABC-CONFLICT", "name": "Other product", "status_label": "Passive"},
                        {"source_id": "ABC-AMBIGUOUS", "name": "Main product", "status_label": "Passive"},
                        {"source_id": "DEF", "status_label": "Passive"},
                    ],
                )
                with self.assertRaisesRegex(RuntimeError, "conflicting Dynamics statuses"):
                    migrate_deposit_verification_statuses.run(path)


if __name__ == "__main__":
    unittest.main()
