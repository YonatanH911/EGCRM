"""Restore imported activity Notes from a Dynamics Web API JSON export.

The migration is a dry run by default. It matches records using the original
Dynamics GUID stored in legacy_import_ids and preserves non-empty EGCRM notes.

Usage:
    python migrate_activity_notes.py activity_descriptions.json
    python migrate_activity_notes.py activity_descriptions.json --apply
    python migrate_activity_notes.py activity_descriptions.json --apply --overwrite
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from sqlalchemy import text

from database import SessionLocal
import models


def normalize_guid(value: Any) -> str:
    return re.sub(r"[{}\s]", "", str(value or "")).casefold()


def clean_description(value: Any) -> str:
    if value is None:
        return ""
    return str(value).replace("\r\n", "\n").replace("\r", "\n").strip()


def load_descriptions(path: Path) -> tuple[dict[str, str], int]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    records = payload.get("activities", []) if isinstance(payload, dict) else payload
    if not isinstance(records, list):
        raise ValueError("Expected an 'activities' array in the Dynamics JSON export.")

    descriptions: dict[str, str] = {}
    conflicts = 0
    for record in records:
        if not isinstance(record, dict):
            continue
        source_id = normalize_guid(record.get("activityid"))
        description = clean_description(record.get("description"))
        if not source_id:
            continue
        previous = descriptions.get(source_id)
        if previous is not None and previous != description:
            conflicts += 1
            continue
        descriptions[source_id] = description
    return descriptions, conflicts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_file", type=Path, help="JSON downloaded from Dynamics.")
    parser.add_argument("--apply", action="store_true", help="Commit the Notes updates.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace existing non-empty Notes. Requires --apply.",
    )
    args = parser.parse_args()
    if args.overwrite and not args.apply:
        parser.error("--overwrite requires --apply")
    return args


def run(json_file: Path, apply: bool, overwrite: bool) -> None:
    descriptions, conflicts = load_descriptions(json_file)
    db = SessionLocal()
    try:
        try:
            mappings = db.execute(
                text(
                    "SELECT source_id, local_id FROM legacy_import_ids "
                    "WHERE entity_type = 'activity' ORDER BY local_id"
                )
            ).all()
        except Exception as exc:
            raise RuntimeError(
                "The import mapping table is unavailable. Run python migrate_db.py first."
            ) from exc

        changed = 0
        already_same = 0
        preserved = 0
        no_description = 0
        missing_from_export = 0
        missing_activity = 0
        missing_export_examples: list[str] = []

        for source_id, local_id in mappings:
            guid = normalize_guid(source_id)
            if guid not in descriptions:
                missing_from_export += 1
                activity = db.get(models.Activity, local_id)
                if activity is not None and len(missing_export_examples) < 20:
                    missing_export_examples.append(f"{guid} | {activity.subject}")
                continue
            description = descriptions[guid]
            if not description:
                no_description += 1
                continue
            activity = db.get(models.Activity, local_id)
            if activity is None:
                missing_activity += 1
                continue
            current = clean_description(activity.notes)
            if current == description:
                already_same += 1
                continue
            if current and not overwrite:
                preserved += 1
                continue
            activity.notes = description
            changed += 1

        if apply:
            db.commit()
        else:
            db.rollback()

        mapped_guids = {normalize_guid(source_id) for source_id, _ in mappings}
        print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
        print(f"Dynamics descriptions loaded: {len(descriptions)}")
        print(f"Imported activity mappings scanned: {len(mappings)}")
        print(f"Notes changed: {changed}")
        print(f"Already identical: {already_same}")
        print(f"Existing Notes preserved: {preserved}")
        print(f"Matched records with blank Description: {no_description}")
        print(f"Imported activities absent from export: {missing_from_export}")
        print(f"Mappings with missing EGCRM activity: {missing_activity}")
        print(f"Conflicting duplicate Dynamics GUIDs: {conflicts}")
        print(f"Unrelated Dynamics activities ignored: {len(set(descriptions) - mapped_guids)}")
        if missing_export_examples:
            print("\nImported activities absent from the Dynamics description export")
            for example in missing_export_examples:
                print(f"  {example}")
        print("Changes committed." if apply else "Dry run only; no changes were committed.")
    finally:
        db.close()


if __name__ == "__main__":
    arguments = parse_args()
    run(arguments.json_file, arguments.apply, arguments.overwrite)
