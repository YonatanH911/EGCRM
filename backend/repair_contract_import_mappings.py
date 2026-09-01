"""Split Contract import mappings that incorrectly share one EGCRM record.

The repair is a dry run by default. For each duplicated local mapping, it keeps
the best-matching Dynamics GUID on the existing Contract, reuses an unmapped
Contract only when title, dates, and active state match exactly, and otherwise
creates a distinct Contract from the Dynamics JSON.

Usage:
    python repair_contract_import_mappings.py contract_data.json ../excel_exports/excel
    python repair_contract_import_mappings.py contract_data.json ../excel_exports/excel --apply
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text

from database import SessionLocal
from import_excel_exports import WorkbookRows, clean, normalized, parse_date
from migrate_contract_data import FIELD_SPECS, load_contracts, normalize_guid, source_value
import models


@dataclass(frozen=True)
class SourceContract:
    source_id: str
    title: str
    start_date: datetime | None
    end_date: datetime | None
    is_active: bool


def load_source_contracts(directory: Path) -> dict[str, SourceContract]:
    sources: dict[str, SourceContract] = {}
    files = (
        ("Active Contracts.xlsx", True),
        ("Inactive Contracts.xlsx", False),
    )
    for filename, active in files:
        path = directory / filename
        if not path.is_file():
            raise FileNotFoundError(f"Required Contract export not found: {path}")
        workbook = WorkbookRows(path)
        try:
            for row in workbook.rows():
                source_id = clean(workbook.value(row, "(Do Not Modify) Contract"))
                title = clean(workbook.value(row, "Name", "Contract Title"))
                if not source_id or not title:
                    continue
                sources[normalize_guid(source_id)] = SourceContract(
                    source_id=source_id,
                    title=title,
                    start_date=parse_date(workbook.value(row, "Date Contract Signed")),
                    end_date=parse_date(workbook.value(row, "Date Contract Ends")),
                    is_active=active,
                )
        finally:
            workbook.close()
    return sources


def exact_source_match(contract: models.Contract, source: SourceContract) -> bool:
    return (
        normalized(contract.title) == normalized(source.title)
        and contract.start_date == source.start_date
        and contract.end_date == source.end_date
        and bool(contract.is_active) == source.is_active
    )


def source_match_score(contract: models.Contract, source: SourceContract) -> int:
    score = 0
    if normalized(contract.title) == normalized(source.title):
        score += 100
    if source.start_date is not None and contract.start_date == source.start_date:
        score += 20
    if source.end_date is not None and contract.end_date == source.end_date:
        score += 20
    if bool(contract.is_active) == source.is_active:
        score += 10
    return score


def restored_values(record: dict[str, Any]) -> dict[str, str | None]:
    values: dict[str, str | None] = {}
    for target, (logical_name, prefer_formatted, transform) in FIELD_SPECS.items():
        value = transform(source_value(record, logical_name, prefer_formatted))
        values[target] = value or None
    return values


def create_contract(record: dict[str, Any], source: SourceContract) -> models.Contract:
    values = restored_values(record)
    annual_fee = values.get("beneficiary_annual_fee")
    try:
        numeric_value = float(annual_fee) if annual_fee else 0.0
    except ValueError:
        numeric_value = 0.0
    product_name = source_value(record, "ey_s_product_name", False) or None
    return models.Contract(
        title=source.title,
        status=models.ContractStatus.ACTIVE,
        start_date=source.start_date,
        end_date=source.end_date,
        value=numeric_value,
        currency=values.get("beneficiary_currency") or "USD",
        product_name=product_name,
        is_active=source.is_active,
        **values,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_file", type=Path, help="Dynamics Contract JSON export.")
    parser.add_argument(
        "excel_directory",
        type=Path,
        help="Directory containing Active Contracts.xlsx and Inactive Contracts.xlsx.",
    )
    parser.add_argument("--apply", action="store_true", help="Commit the mapping repair.")
    return parser.parse_args()


def run(json_file: Path, excel_directory: Path, apply: bool) -> None:
    exported, export_conflicts = load_contracts(json_file)
    if export_conflicts:
        raise RuntimeError(
            f"Refusing repair: Dynamics JSON contains {export_conflicts} conflicting GUIDs."
        )
    sources = load_source_contracts(excel_directory)
    db = SessionLocal()
    try:
        mappings = db.execute(
            text(
                "SELECT source_id, local_id FROM legacy_import_ids "
                "WHERE entity_type = 'contract' ORDER BY local_id, source_id"
            )
        ).all()
        groups: dict[int, list[str]] = defaultdict(list)
        for source_id, local_id in mappings:
            groups[local_id].append(source_id)
        duplicates = {
            local_id: source_ids
            for local_id, source_ids in groups.items()
            if len(source_ids) > 1
        }

        if not duplicates:
            print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
            print("Duplicate Contract mappings: 0")
            print("No repair is required.")
            return

        mapped_ids = set(groups)
        unmapped_contracts = [
            contract
            for contract in db.query(models.Contract).all()
            if contract.id not in mapped_ids
        ]
        reserved_ids: set[int] = set()
        reused = 0
        created = 0
        reassigned = 0
        retained = 0
        details: list[str] = []

        for local_id, source_ids in duplicates.items():
            existing = db.get(models.Contract, local_id)
            if existing is None:
                raise RuntimeError(f"Mapped EGCRM Contract {local_id} does not exist.")

            source_rows: list[tuple[str, SourceContract, dict[str, Any]]] = []
            for source_id in source_ids:
                key = normalize_guid(source_id)
                source = sources.get(key)
                record = exported.get(key)
                if source is None or record is None:
                    raise RuntimeError(
                        f"Cannot safely repair Dynamics Contract GUID {source_id}: "
                        "it is missing from the spreadsheet or JSON export."
                    )
                source_rows.append((source_id, source, record))

            source_rows.sort(
                key=lambda item: (-source_match_score(existing, item[1]), item[0].casefold())
            )
            kept_source_id, _, _ = source_rows[0]
            retained += 1
            details.append(
                f"Contract {local_id}: retained {kept_source_id}; splitting {len(source_rows) - 1}"
            )

            for source_id, source, record in source_rows[1:]:
                candidates = [
                    contract
                    for contract in unmapped_contracts
                    if contract.id not in reserved_ids and exact_source_match(contract, source)
                ]
                if len(candidates) == 1:
                    target = candidates[0]
                    reserved_ids.add(target.id)
                    reused += 1
                else:
                    target = create_contract(record, source)
                    db.add(target)
                    db.flush()
                    reserved_ids.add(target.id)
                    created += 1

                db.execute(
                    text(
                        "UPDATE legacy_import_ids SET local_id = :local_id "
                        "WHERE entity_type = 'contract' AND source_id = :source_id"
                    ),
                    {"local_id": target.id, "source_id": source_id},
                )
                reassigned += 1

        db.flush()
        repaired_rows = db.execute(
            text(
                "SELECT local_id, COUNT(*) FROM legacy_import_ids "
                "WHERE entity_type = 'contract' GROUP BY local_id HAVING COUNT(*) > 1"
            )
        ).all()
        if repaired_rows:
            raise RuntimeError(
                f"Repair validation failed: {len(repaired_rows)} duplicate mappings remain."
            )

        if apply:
            db.commit()
        else:
            db.rollback()

        print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
        print(f"Contract mappings scanned: {len(mappings)}")
        print(f"Duplicate Contract mappings: {len(duplicates)}")
        print(f"Existing mapped contracts retained: {retained}")
        print(f"Unmapped Contract rows safely reused: {reused}")
        print(f"New Contract rows required: {created}")
        print(f"Mappings reassigned: {reassigned}")
        print("Duplicate mappings remaining: 0")
        print("\nRepair details")
        for detail in details:
            print(f"  {detail}")
        print("Changes committed." if apply else "Dry run only; no changes were committed.")
    finally:
        db.close()


if __name__ == "__main__":
    arguments = parse_args()
    run(arguments.json_file, arguments.excel_directory, arguments.apply)
