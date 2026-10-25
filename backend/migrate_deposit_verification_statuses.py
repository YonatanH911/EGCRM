"""Restore Deposit Verification Status values from a Dynamics JSON export.

The migration matches deposits by the original Dynamics GUID stored in
legacy_import_ids. It is a dry run unless --apply is provided. A nonblank
Dynamics status is authoritative for its matched EGCRM deposit.

Usage:
    python migrate_deposit_verification_statuses.py dynamics_deposit_verification_statuses.json
    python migrate_deposit_verification_statuses.py dynamics_deposit_verification_statuses.json --apply
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import text

from database import SessionLocal
from migrate_activity_notes import normalize_guid
import models


STATUS_ALIASES = {
    "verified": models.DepositStatus.VERIFIED,
    "verify": models.DepositStatus.VERIFIED,
    "open": models.DepositStatus.OPEN,
    "in process": models.DepositStatus.OPEN,
    "passive": models.DepositStatus.PASSIVE,
}


@dataclass
class VerificationStatusExport:
    statuses: dict[str, models.DepositStatus]
    names: dict[str, str]
    records: int
    blank_statuses: int
    duplicate_records: int
    source_counts: Counter[models.DepositStatus]
    field_name: str


def normalized_label(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip().casefold()


def deposit_status(value: Any) -> models.DepositStatus | None:
    label = normalized_label(value)
    if not label:
        return None
    return STATUS_ALIASES.get(label)


def load_statuses(path: Path) -> VerificationStatusExport:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(payload, dict) or not isinstance(payload.get("deposits"), list):
        raise ValueError("Expected a Dynamics deposit export with a 'deposits' array.")
    if payload.get("errors"):
        raise ValueError("Dynamics export reported request errors; do not import a partial export.")

    records = payload["deposits"]
    if not records:
        raise ValueError("Dynamics export contains no deposit records.")

    primary_id = (payload.get("entity") or {}).get("primary_id_attribute")
    statuses: dict[str, models.DepositStatus] = {}
    names: dict[str, str] = {}
    source_counts: Counter[models.DepositStatus] = Counter()
    unknown: Counter[str] = Counter()
    conflicts: set[str] = set()
    blank_statuses = duplicate_records = 0

    for record in records:
        if not isinstance(record, dict):
            continue
        source_id = normalize_guid(
            record.get("source_id") or (record.get(primary_id) if primary_id else None)
        )
        if not source_id:
            continue
        names[source_id] = str(record.get("name") or "").strip()
        raw_label = record.get("status_label")
        raw_value = record.get("status_value")
        if normalized_label(raw_label):
            status = deposit_status(raw_label)
            unknown_value = str(raw_label).strip()
        else:
            status = deposit_status(raw_value)
            unknown_value = str(raw_value).strip() if raw_value is not None else ""
        if status is None:
            if unknown_value:
                unknown[unknown_value] += 1
            else:
                blank_statuses += 1
            continue
        previous = statuses.get(source_id)
        if previous is not None:
            duplicate_records += 1
            if previous != status:
                conflicts.add(source_id)
            continue
        statuses[source_id] = status
        source_counts[status] += 1

    if unknown:
        values = ", ".join(f"{value!r} ({count})" for value, count in unknown.most_common(10))
        raise ValueError(
            "Unrecognized Dynamics Verification Status values: " + values + ". "
            "No data was imported."
        )
    if conflicts:
        raise ValueError(
            f"Dynamics export contains {len(conflicts)} deposit GUIDs with conflicting statuses."
        )
    if not statuses:
        raise ValueError("Dynamics export has no usable Verification Status values.")

    field = payload.get("field") or {}
    field_name = str(field.get("logical_name") or field.get("display_name") or "unknown")
    return VerificationStatusExport(
        statuses=statuses,
        names=names,
        records=len(records),
        blank_statuses=blank_statuses,
        duplicate_records=duplicate_records,
        source_counts=source_counts,
        field_name=field_name,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_file", type=Path, help="Dynamics deposit status JSON export.")
    parser.add_argument("--apply", action="store_true", help="Commit the displayed updates.")
    return parser.parse_args()


def run(json_file: Path, apply: bool = False) -> None:
    export = load_statuses(json_file)
    db = SessionLocal()
    try:
        try:
            rows = db.execute(
                text(
                    "SELECT source_id, local_id FROM legacy_import_ids "
                    "WHERE entity_type = 'deposit' ORDER BY local_id"
                )
            ).all()
        except Exception as exc:
            raise RuntimeError(
                "The import mapping table is unavailable. Run python migrate_db.py first."
            ) from exc

        mappings: dict[str, int] = {}
        ambiguous_guids: set[str] = set()
        local_guids: dict[int, set[str]] = defaultdict(set)
        for source_id, local_id in rows:
            guid = normalize_guid(source_id)
            previous = mappings.get(guid)
            if previous is not None and previous != local_id:
                ambiguous_guids.add(guid)
            mappings[guid] = local_id
            local_guids[local_id].add(guid)

        duplicate_local_ids = {
            local_id for local_id, guids in local_guids.items() if len(guids) > 1
        }
        if ambiguous_guids:
            raise RuntimeError(
                "Refusing migration: "
                f"{len(ambiguous_guids)} Dynamics deposit GUIDs map to multiple EGCRM deposits."
            )

        resolved_statuses: dict[int, models.DepositStatus] = {}
        resolved_by_name: set[int] = set()
        conflicting_local_statuses: dict[int, set[models.DepositStatus]] = {}
        for local_id, guids in local_guids.items():
            exported_guids = [guid for guid in guids if guid in export.statuses]
            statuses = {export.statuses[guid] for guid in exported_guids}
            if len(statuses) > 1:
                deposit = db.get(models.Deposit, local_id)
                product_name = normalized_label(
                    deposit.product_name if deposit is not None else ""
                )
                name_matches = [
                    guid
                    for guid in exported_guids
                    if product_name and normalized_label(export.names.get(guid)) == product_name
                ]
                if len(name_matches) == 1:
                    resolved_statuses[local_id] = export.statuses[name_matches[0]]
                    resolved_by_name.add(local_id)
                else:
                    conflicting_local_statuses[local_id] = statuses
            elif statuses:
                resolved_statuses[local_id] = next(iter(statuses))
        if conflicting_local_statuses:
            example_rows: list[str] = []
            for local_id in list(conflicting_local_statuses)[:10]:
                deposit = db.get(models.Deposit, local_id)
                reference = deposit.reference_number if deposit is not None else "missing"
                product = deposit.product_name if deposit is not None else "missing"
                assignments = ", ".join(
                    f"{guid}:{export.statuses[guid].value}:{export.names.get(guid, '')}"
                    for guid in sorted(local_guids[local_id])
                    if guid in export.statuses
                )
                example_rows.append(
                    f"{local_id} ({reference}, product={product}) [{assignments}]"
                )
            raise RuntimeError(
                "Refusing migration: "
                f"{len(conflicting_local_statuses)} EGCRM deposits map to conflicting "
                f"Dynamics statuses. Examples: {'; '.join(example_rows)}"
            )

        counts: Counter[str] = Counter()
        changes_by_status: Counter[models.DepositStatus] = Counter()
        missing_examples: list[str] = []
        for local_id, guids in local_guids.items():
            incoming = resolved_statuses.get(local_id)
            if incoming is None:
                counts["missing_from_export"] += 1
                deposit = db.get(models.Deposit, local_id)
                if deposit is not None and len(missing_examples) < 20:
                    missing_examples.append(
                        f"{','.join(sorted(guids))} | {deposit.reference_number}"
                    )
                continue
            deposit = db.get(models.Deposit, local_id)
            if deposit is None:
                counts["missing_deposit"] += 1
                continue
            if deposit.status == incoming:
                counts["already_same"] += 1
                continue
            deposit.status = incoming
            counts["changed"] += 1
            changes_by_status[incoming] += 1

        if apply:
            db.commit()
        else:
            db.rollback()

        mapped_guids = set(mappings)
        print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
        print(f"Dynamics field: {export.field_name}")
        print(f"Dynamics deposit records: {export.records}")
        print(f"Usable status values: {len(export.statuses)}")
        print(f"Blank status values skipped: {export.blank_statuses}")
        print(f"Duplicate export rows: {export.duplicate_records}")
        print(f"Imported deposit mappings scanned: {len(rows)}")
        print(f"Unique mapped EGCRM deposits: {len(local_guids)}")
        print(f"Deposits with agreeing duplicate GUID mappings: {len(duplicate_local_ids)}")
        print(f"Conflicting duplicate mappings resolved by product name: {len(resolved_by_name)}")
        print(f"Statuses changed: {counts['changed']}")
        print(f"Already identical: {counts['already_same']}")
        print(f"Imported deposits absent from export: {counts['missing_from_export']}")
        print(f"Mappings with missing EGCRM deposit: {counts['missing_deposit']}")
        print(f"Unrelated Dynamics deposits ignored: {len(set(export.statuses) - mapped_guids)}")
        print("\nDynamics statuses")
        for status in models.DepositStatus:
            print(f"  {status.value}: {export.source_counts[status]}")
        print("\nChanges by status")
        for status in models.DepositStatus:
            print(f"  {status.value}: {changes_by_status[status]}")
        if missing_examples:
            print("\nImported deposits absent from the Dynamics status export")
            for example in missing_examples:
                print(f"  {example}")
        print("Changes committed." if apply else "Dry run only; no changes were committed.")
    finally:
        db.close()


if __name__ == "__main__":
    arguments = parse_args()
    run(arguments.json_file, arguments.apply)
