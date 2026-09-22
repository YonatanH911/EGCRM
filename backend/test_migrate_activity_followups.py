import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import migrate_activity_followups
from migrate_activity_followups import load_followups
import models


def write_export(path: Path, rows: list[tuple[str, str, str]]) -> None:
    payload = {
        "errors": [],
        "activities": [
            {
                "activityid": activity_id,
                "source_entity": "task",
                "follow_up_fields": [{
                    "logical_name": "new_followupemail2",
                    "value": contact_id,
                    "lookup_type": lookup_type,
                }],
            }
            for activity_id, contact_id, lookup_type in rows
        ],
    }
    path.write_text(json.dumps(payload), encoding="utf-8")


class FollowupImportTests(unittest.TestCase):
    def test_loads_contact_lookups_and_rejects_conflicts(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "followups.json"
            write_export(path, [
                ("{ABC}", "{CONTACT-1}", "contact"),
                ("def", "contact-2", "contact"),
                ("DEF", "contact-3", "contact"),
                ("ghi", "", "contact"),
            ])
            export = load_followups(path)
        self.assertEqual(export.assignments, {"abc": "contact-1"})
        self.assertEqual(export.conflicting_activities, {"def"})
        self.assertEqual(export.blank_lookup, 1)

    def test_rejects_partial_or_non_contact_exports(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "followups.json"
            write_export(path, [("abc", "contact-1", "account")])
            with self.assertRaisesRegex(ValueError, "non-Contact"):
                load_followups(path)
            path.write_text(json.dumps({"errors": ["request failed"], "activities": []}))
            with self.assertRaisesRegex(ValueError, "partial export"):
                load_followups(path)
            write_export(path, [("abc", "", "contact")])
            with self.assertRaisesRegex(ValueError, "no usable"):
                load_followups(path)

    def test_dry_run_and_apply_preserve_existing_links(self):
        engine = create_engine("sqlite:///:memory:")
        models.Base.metadata.create_all(engine)
        with engine.begin() as connection:
            connection.execute(text(
                "CREATE TABLE legacy_import_ids (entity_type VARCHAR(32), source_id VARCHAR(64), local_id INT)"
            ))
        session_factory = sessionmaker(bind=engine)
        with session_factory() as db:
            original = models.Contact(first_name="Original", last_name="Person")
            replacement = models.Contact(first_name="New", last_name="Person")
            linked = models.Activity(subject="Call", contact=original)
            unlinked = models.Activity(subject="Email")
            db.add_all([original, replacement, linked, unlinked])
            db.flush()
            original_id = original.id
            replacement_id = replacement.id
            linked_id = linked.id
            unlinked_id = unlinked.id
            db.execute(text(
                "INSERT INTO legacy_import_ids VALUES "
                "('activity', 'abc', :linked_id), "
                "('activity', 'def', :unlinked_id), "
                "('contact', 'contact-2', :contact_id)"
            ), {
                "linked_id": linked_id,
                "unlinked_id": unlinked_id,
                "contact_id": replacement_id,
            })
            db.commit()

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "followups.json"
            write_export(path, [
                ("abc", "contact-2", "contact"),
                ("def", "contact-2", "contact"),
            ])
            with patch.object(migrate_activity_followups, "SessionLocal", session_factory):
                with contextlib.redirect_stdout(io.StringIO()):
                    migrate_activity_followups.run(path)
                with session_factory() as db:
                    self.assertEqual(db.get(models.Activity, linked_id).contact_id, original_id)
                    self.assertIsNone(db.get(models.Activity, unlinked_id).contact_id)

                with contextlib.redirect_stdout(io.StringIO()):
                    migrate_activity_followups.run(path, apply=True)
                with session_factory() as db:
                    self.assertEqual(db.get(models.Activity, linked_id).contact_id, original_id)
                    self.assertEqual(db.get(models.Activity, unlinked_id).contact_id, replacement_id)

                with contextlib.redirect_stdout(io.StringIO()):
                    migrate_activity_followups.run(path, apply=True, overwrite=True)
                with session_factory() as db:
                    self.assertEqual(db.get(models.Activity, linked_id).contact_id, replacement_id)


if __name__ == "__main__":
    unittest.main()
