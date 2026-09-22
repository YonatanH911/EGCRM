"""Restore Activity Follow up with links from a Dynamics JSON export.

The importer matches Dynamics Activity and Contact GUIDs through legacy_import_ids.
It is a dry run unless --apply is provided. Existing links are preserved unless
--overwrite is also supplied.
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import text

from database import SessionLocal
from migrate_activity_notes import normalize_guid
import models


FIELD_NAME = "new_followupemail2"


@dataclass
class FollowupExport:
    assignments: dict[str, str]
    records: int
    blank_lookup: int
    invalid_lookup_type: int
    conflicting_activities: set[str]


def load_followups(path: Path) -> FollowupExport:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(payload, dict) or not isinstance(payload.get("activities"), list):
        raise ValueError("Expected a Dynamics follow-up JSON export with an activities array.")
    if payload.get("errors"):
        raise ValueError("Dynamics export reported request errors; do not import a partial export.")
    records = payload["activities"]
    if not records:
        raise ValueError("Dynamics export contains no activity records.")

    assignments: dict[str, str] = {}
    conflicts: set[str] = set()
    blank_lookup = invalid_type = 0
    for record in records:
        if not isinstance(record, dict):
            continue
        activity_guid = normalize_guid(record.get("activityid"))
        if not activity_guid:
            continue
        fields = [
            field for field in record.get("follow_up_fields", [])
            if isinstance(field, dict) and field.get("logical_name") == FIELD_NAME
        ]
        if len(fields) != 1:
            continue
        field = fields[0]
        contact_guid = normalize_guid(field.get("value"))
        if not contact_guid:
            blank_lookup += 1
            continue
        if str(field.get("lookup_type") or "").casefold() != "contact":
            invalid_type += 1
            continue
        if activity_guid in assignments and assignments[activity_guid] != contact_guid:
            conflicts.add(activity_guid)
        else:
            assignments[activity_guid] = contact_guid
    for guid in conflicts:
        assignments.pop(guid, None)
    if invalid_type:
        raise ValueError(
            f"Found {invalid_type} non-Contact or untyped Follow Up Email lookups. "
            "Inspect the JSON before importing."
        )
    if not assignments:
        raise ValueError("Dynamics export has no usable Follow Up Email Contact lookups.")
    return FollowupExport(assignments, len(records), blank_lookup, invalid_type, conflicts)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_file", type=Path, help="Dynamics follow-up JSON export.")
    parser.add_argument("--apply", action="store_true", help="Commit contact links to EGCRM.")
    parser.add_argument("--overwrite", action="store_true", help="Replace different existing links.")
    return parser.parse_args()


def run(path: Path, apply: bool = False, overwrite: bool = False) -> None:
    export = load_followups(path)
    db = SessionLocal()
    try:
        rows = db.execute(text(
            "SELECT entity_type, source_id, local_id FROM legacy_import_ids "
            "WHERE entity_type IN ('activity', 'contact')"
        )).all()
        mappings: dict[str, dict[str, int]] = {"activity": {}, "contact": {}}
        ambiguous_guids: dict[str, set[str]] = {"activity": set(), "contact": set()}
        activity_guids_by_local: dict[int, set[str]] = defaultdict(set)
        for entity_type, source_id, local_id in rows:
            guid = normalize_guid(source_id)
            prior = mappings[entity_type].get(guid)
            if prior is not None and prior != local_id:
                ambiguous_guids[entity_type].add(guid)
            mappings[entity_type][guid] = local_id
            if entity_type == "activity":
                activity_guids_by_local[local_id].add(guid)
        duplicate_activity_ids = {
            local_id for local_id, guids in activity_guids_by_local.items()
            if len(guids) > 1
        }

        counts: dict[str, int] = defaultdict(int)
        examples: dict[str, list[str]] = defaultdict(list)
        for activity_guid, contact_guid in export.assignments.items():
            if activity_guid in ambiguous_guids["activity"]:
                counts["ambiguous_activity_guid"] += 1
                continue
            activity_id = mappings["activity"].get(activity_guid)
            if activity_id is None:
                counts["unmapped_activity"] += 1
                continue
            if activity_id in duplicate_activity_ids:
                counts["duplicate_activity_mapping"] += 1
                continue
            activity = db.get(models.Activity, activity_id)
            if activity is None:
                counts["missing_activity"] += 1
                continue
            if contact_guid in ambiguous_guids["contact"]:
                counts["ambiguous_contact_guid"] += 1
                continue
            contact_id = mappings["contact"].get(contact_guid)
            if contact_id is None:
                counts["unmapped_contact"] += 1
                if len(examples["unmapped_contact"]) < 20:
                    examples["unmapped_contact"].append(
                        f"{activity_guid} | contact={contact_guid} | {activity.subject}"
                    )
                continue
            if db.get(models.Contact, contact_id) is None:
                counts["missing_contact"] += 1
                continue
            if activity.contact_id == contact_id:
                counts["already_linked"] += 1
            elif activity.contact_id is not None and not overwrite:
                counts["existing_link_preserved"] += 1
                if len(examples["existing_link_preserved"]) < 20:
                    examples["existing_link_preserved"].append(
                        f"{activity_guid} | current={activity.contact_id} | new={contact_id} | {activity.subject}"
                    )
            else:
                activity.contact_id = contact_id
                counts["links_changed"] += 1

        if apply:
            db.commit()
        else:
            db.rollback()

        print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
        print(f"Dynamics activity records: {export.records}")
        print(f"Records with blank Follow Up Email lookup: {export.blank_lookup}")
        print(f"Conflicting Dynamics activity lookups: {len(export.conflicting_activities)}")
        print(f"Imported activity mappings: {len(mappings['activity'])}")
        print(f"Imported contact mappings: {len(mappings['contact'])}")
        print(f"Links changed: {counts['links_changed']}")
        print(f"Already linked: {counts['already_linked']}")
        print(f"Existing links preserved: {counts['existing_link_preserved']}")
        print(f"Unmapped Dynamics activities: {counts['unmapped_activity']}")
        print(f"Unmapped Dynamics contacts: {counts['unmapped_contact']}")
        print(f"Missing EGCRM activities: {counts['missing_activity']}")
        print(f"Missing EGCRM contacts: {counts['missing_contact']}")
        print(f"Duplicate local activity mappings skipped: {counts['duplicate_activity_mapping']}")
        print(f"Ambiguous Activity GUID mappings: {counts['ambiguous_activity_guid']}")
        print(f"Ambiguous Contact GUID mappings: {counts['ambiguous_contact_guid']}")
        for category, items in examples.items():
            print(f"\n{category} examples:")
            for item in items:
                print(f"  {item}")
        print("Changes committed." if apply else "Dry run only; no changes were committed.")
    finally:
        db.close()


if __name__ == "__main__":
    arguments = parse_args()
    run(arguments.json_file, arguments.apply, arguments.overwrite)
