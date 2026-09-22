"""Link imported Activities to Contacts using a Dynamics Activities Excel export.

The workbook must contain '(Do Not Modify) Activity' and 'Follow Up Email'.
Dry run is the default; --overwrite allows replacing existing contact links.

Usage:
    python migrate_activity_followups.py ../excel/Activities_with_follow_up_email.xlsx
    python migrate_activity_followups.py ../excel/Activities_with_follow_up_email.xlsx --apply
    python migrate_activity_followups.py ../excel/Activities_with_follow_up_email.xlsx --overwrite --apply
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import text

from database import SessionLocal
from import_excel_exports import WorkbookRows, normalize_header
from migrate_activity_notes import normalize_guid
import models


def normalize_email(value: Any) -> str:
    return str(value or "").strip().casefold()


@dataclass
class FollowupExport:
    emails: dict[str, str]
    rows_scanned: int
    blank_guid: int
    blank_email: int
    conflicting_guids: set[str]


def load_followups(path: Path) -> FollowupExport:
    book = WorkbookRows(path)
    try:
        id_header = normalize_header("(Do Not Modify) Activity")
        email_headers = {
            normalize_header("Follow Up Email"),
            normalize_header("Follow Up E-mail"),
        }
        if id_header not in book.columns or not email_headers.intersection(book.columns):
            raise ValueError(
                "Workbook must contain '(Do Not Modify) Activity' and 'Follow Up Email' columns. "
                f"Found: {', '.join(book.columns)}"
            )

        emails: dict[str, str] = {}
        conflicts: set[str] = set()
        scanned = blank_guid = blank_email = 0
        for row in book.rows():
            scanned += 1
            guid = normalize_guid(book.value(row, "(Do Not Modify) Activity"))
            if not guid:
                blank_guid += 1
                continue
            email = normalize_email(book.value(row, "Follow Up Email", "Follow Up E-mail"))
            if not email:
                blank_email += 1
                continue
            if guid in emails and emails[guid] != email:
                conflicts.add(guid)
            else:
                emails[guid] = email
        for guid in conflicts:
            emails.pop(guid, None)
        return FollowupExport(emails, scanned, blank_guid, blank_email, conflicts)
    finally:
        book.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("excel_file", type=Path, help="Fresh Dynamics Activities .xlsx export.")
    parser.add_argument("--apply", action="store_true", help="Commit contact links to EGCRM.")
    parser.add_argument(
        "--overwrite", action="store_true", help="Include different existing contact links."
    )
    return parser.parse_args()


def run(excel_file: Path, apply: bool = False, overwrite: bool = False) -> None:
    export = load_followups(excel_file)
    db = SessionLocal()
    try:
        mappings = db.execute(
            text("SELECT source_id, local_id FROM legacy_import_ids WHERE entity_type = 'activity'")
        ).all()
        by_guid = {normalize_guid(source_id): local_id for source_id, local_id in mappings}
        by_local: dict[int, set[str]] = defaultdict(set)
        for source_id, local_id in mappings:
            by_local[local_id].add(normalize_guid(source_id))
        duplicate_local_ids = {local_id for local_id, guids in by_local.items() if len(guids) > 1}

        contacts_by_email: dict[str, list[models.Contact]] = defaultdict(list)
        for contact in db.query(models.Contact).all():
            if contact.email:
                contacts_by_email[normalize_email(contact.email)].append(contact)

        counts: dict[str, int] = defaultdict(int)
        examples: dict[str, list[str]] = defaultdict(list)
        for guid, email in export.emails.items():
            local_id = by_guid.get(guid)
            if local_id is None:
                counts["unmapped_activity"] += 1
                continue
            if local_id in duplicate_local_ids:
                counts["duplicate_activity_mapping"] += 1
                continue
            activity = db.get(models.Activity, local_id)
            if activity is None:
                counts["missing_activity"] += 1
                continue
            contacts = contacts_by_email.get(email, [])
            if len(contacts) != 1:
                category = "missing_contact" if not contacts else "ambiguous_contact"
                counts[category] += 1
                if len(examples[category]) < 20:
                    examples[category].append(f"{guid} | {email} | {activity.subject}")
                continue
            contact = contacts[0]
            if activity.contact_id == contact.id:
                counts["already_linked"] += 1
            elif activity.contact_id is not None and not overwrite:
                counts["existing_link_preserved"] += 1
                if len(examples["existing_link_preserved"]) < 20:
                    examples["existing_link_preserved"].append(
                        f"{guid} | current={activity.contact_id} | new={contact.id} | {activity.subject}"
                    )
            else:
                activity.contact_id = contact.id
                counts["links_changed"] += 1

        if apply:
            db.commit()
        else:
            db.rollback()

        print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
        print(f"Workbook rows scanned: {export.rows_scanned}")
        print(f"Rows with blank Dynamics ID: {export.blank_guid}")
        print(f"Rows with blank Follow Up Email: {export.blank_email}")
        print(f"Conflicting duplicate Dynamics IDs: {len(export.conflicting_guids)}")
        print(f"Imported activity mappings: {len(by_guid)}")
        print(f"Imported activities without a usable exported email: {len(set(by_guid) - set(export.emails))}")
        print(f"Links changed: {counts['links_changed']}")
        print(f"Already linked: {counts['already_linked']}")
        print(f"Existing links preserved: {counts['existing_link_preserved']}")
        print(f"Unmapped Dynamics activities: {counts['unmapped_activity']}")
        print(f"Duplicate local activity mappings skipped: {counts['duplicate_activity_mapping']}")
        print(f"Missing EGCRM activities: {counts['missing_activity']}")
        print(f"No contact with this email: {counts['missing_contact']}")
        print(f"Multiple contacts with this email: {counts['ambiguous_contact']}")
        for category, items in examples.items():
            print(f"\n{category} examples:")
            for item in items:
                print(f"  {item}")
        print("Changes committed." if apply else "Dry run only; no changes were committed.")
    finally:
        db.close()


if __name__ == "__main__":
    arguments = parse_args()
    run(arguments.excel_file, arguments.apply, arguments.overwrite)
