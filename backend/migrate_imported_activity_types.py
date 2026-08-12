"""Assign task types to imported activities from their subject prefixes.

The migration is a dry run by default and only touches activities recorded in
legacy_import_ids by import_excel_exports.py.

Usage:
    python migrate_imported_activity_types.py
    python migrate_imported_activity_types.py --apply
"""
from __future__ import annotations

import argparse
from collections import Counter

from sqlalchemy import text

from database import SessionLocal
from import_excel_exports import activity_type_from_subject, normalized
import models


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Commit the assignments.")
    return parser.parse_args()


def run(apply: bool) -> None:
    db = SessionLocal()
    try:
        try:
            imported = db.execute(
                text(
                    "SELECT DISTINCT a.id, a.subject, a.task_type_id "
                    "FROM activities AS a "
                    "INNER JOIN legacy_import_ids AS source "
                    "ON source.entity_type = 'activity' AND source.local_id = a.id "
                    "ORDER BY a.id"
                )
            ).mappings().all()
        except Exception as exc:
            raise RuntimeError(
                "The import mapping table is unavailable. Run python migrate_db.py first."
            ) from exc

        task_types = {
            normalized(task_type.name): task_type
            for task_type in db.query(models.TaskType).all()
        }
        assignments: Counter[str] = Counter()
        created_types: list[str] = []
        changed = 0
        unchanged = 0
        skipped = 0

        for row in imported:
            type_name = activity_type_from_subject(row["subject"])
            if not type_name:
                skipped += 1
                continue
            if len(type_name) > 50:
                print(
                    f"Skipping activity {row['id']}: extracted type exceeds 50 characters "
                    f"({type_name!r})."
                )
                skipped += 1
                continue

            key = normalized(type_name)
            task_type = task_types.get(key)
            if task_type is None:
                task_type = models.TaskType(name=type_name, color="#6366f1")
                db.add(task_type)
                db.flush()
                task_types[key] = task_type
                created_types.append(type_name)

            assignments[task_type.name] += 1
            if row["task_type_id"] == task_type.id:
                unchanged += 1
                continue
            activity = db.get(models.Activity, row["id"])
            activity.task_type_id = task_type.id
            changed += 1

        if apply:
            db.commit()
        else:
            db.rollback()

        print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
        print(f"Imported activities scanned: {len(imported)}")
        print(f"Assignments changed: {changed}")
        print(f"Already correct: {unchanged}")
        print(f"Skipped: {skipped}")
        print(f"Task types to create: {', '.join(created_types) if created_types else 'none'}")
        print("\nAssignments by type")
        for name, count in assignments.most_common():
            print(f"  {name}: {count}")
        print("Changes committed." if apply else "Dry run only; no changes were committed.")
    finally:
        db.close()


if __name__ == "__main__":
    run(parse_args().apply)
