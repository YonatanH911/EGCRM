"""Split Dynamics records that were merged by non-unique import fallback keys.

The command is a dry run unless --apply is supplied. It refuses to apply when
any collided Dynamics GUID is absent from the supplied active/inactive exports,
or when the existing local row cannot be matched to one source row uniquely.

Usage:
    python -m migrations.repair_import_collisions ../excel/full_export
    python -m migrations.repair_import_collisions ../excel/full_export --apply
"""
from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

from sqlalchemy import inspect, text

import models
from import_excel_exports import (
    FILES,
    ExcelImporter,
    WorkbookRows,
    clean,
    normalized,
    parse_date,
    split_name,
)


@dataclass(frozen=True)
class SourceRecord:
    entity_type: str
    source_id: str
    active: bool
    fields: dict[str, Any]
    file_name: str


@dataclass(frozen=True)
class CollisionPlan:
    entity_type: str
    local_id: int
    retained_source_id: str
    split_source_ids: tuple[str, ...]
    scores: dict[str, int]


def comparable(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.replace(microsecond=0).isoformat()
    if isinstance(value, bool):
        return "true" if value else "false"
    return normalized(value)


def current_field_value(current: Any, field: str) -> Any:
    if field == "account_name":
        return current.account.name if getattr(current, "account", None) else None
    if field == "vault_name":
        return current.vault.name if getattr(current, "vault", None) else None
    return getattr(current, field, None)


def similarity_score(current: Any, source: SourceRecord) -> int:
    score = 0
    for field, source_value in source.fields.items():
        if source_value in (None, ""):
            continue
        current_value = current_field_value(current, field)
        if current_value in (None, ""):
            continue
        if comparable(current_value) == comparable(source_value):
            score += 1
    if hasattr(current, "is_active") and current.is_active == source.active:
        score += 1
    return score


def source_signature(source: SourceRecord) -> tuple[Any, ...]:
    return (
        source.active,
        tuple(
            sorted(
                (field, comparable(value))
                for field, value in source.fields.items()
            )
        ),
    )


def account_fields(book: WorkbookRows, row: tuple[Any, ...]) -> dict[str, Any]:
    return {
        "name": clean(book.value(row, "Comapny Name", "Company Name", "Account Name")),
        "phone": clean(book.value(row, "Phone", "Main Phone")),
        "street": clean(book.value(row, "Street")),
        "zip_code": clean(book.value(row, "ZIP/Postal Code")),
        "city": clean(book.value(row, "City")),
        "country": clean(book.value(row, "Country/Region")),
        "website": clean(book.value(row, "Website")),
    }


def contact_fields(book: WorkbookRows, row: tuple[Any, ...]) -> dict[str, Any]:
    first, middle, last = split_name(
        book.value(row, "First Name"),
        book.value(row, "Middle Name"),
        book.value(row, "Last Name"),
        book.value(row, "Full Name"),
    )
    return {
        "first_name": first,
        "middle_name": middle,
        "last_name": last,
        "email": clean(book.value(row, "Email")),
        "phone": clean(book.value(row, "Business Phone")),
        "mobile_phone": clean(book.value(row, "Mobile Phone")),
        "account_name": clean(book.value(row, "Account")),
    }


def contract_fields(book: WorkbookRows, row: tuple[Any, ...]) -> dict[str, Any]:
    return {
        "title": clean(book.value(row, "Name", "Contract Title")),
        "start_date": parse_date(book.value(row, "Date Contract Signed")),
        "end_date": parse_date(book.value(row, "Date Contract Ends")),
    }


def vault_fields(book: WorkbookRows, row: tuple[Any, ...]) -> dict[str, Any]:
    return {"name": clean(book.value(row, "Vault Name", "Name"))}


def deposit_fields(book: WorkbookRows, row: tuple[Any, ...]) -> dict[str, Any]:
    return {
        "reference_number": clean(book.value(row, "Deposit Number")),
        "product_name": clean(book.value(row, "Product Name")),
        "version": clean(book.value(row, "Version")),
        "supplier": clean(book.value(row, "Supplier")),
        "date": parse_date(book.value(row, "Date Received")),
        "box": clean(book.value(row, "Box")),
        "received_by": clean(book.value(row, "Received By")),
        "date_vaulted": parse_date(book.value(row, "Date Vaulted")),
        "vault_name": clean(book.value(row, "Vault")),
    }


def activity_fields(book: WorkbookRows, row: tuple[Any, ...]) -> dict[str, Any]:
    return {
        "subject": clean(book.value(row, "Subject")),
        "regarding": clean(book.value(row, "Regarding")),
        "start_date": parse_date(book.value(row, "Start Date")),
        "due_date": parse_date(book.value(row, "Due Date")),
    }


FileSpec = tuple[str, str, bool, str, Callable[[WorkbookRows, tuple[Any, ...]], dict[str, Any]]]

FILE_SPECS: tuple[FileSpec, ...] = (
    ("account", "active_accounts", True, "(Do Not Modify) Account", account_fields),
    ("account", "inactive_accounts", False, "(Do Not Modify) Account", account_fields),
    ("contact", "active_contacts", True, "(Do Not Modify) Contact", contact_fields),
    ("contact", "inactive_contacts", False, "(Do Not Modify) Contact", contact_fields),
    ("contract", "active_contracts", True, "(Do Not Modify) Contract", contract_fields),
    ("contract", "inactive_contracts", False, "(Do Not Modify) Contract", contract_fields),
    ("vault", "active_vaults", True, "(Do Not Modify) Vault", vault_fields),
    ("deposit", "active_deposits", True, "(Do Not Modify) Deposit", deposit_fields),
    ("deposit", "inactive_deposits", False, "(Do Not Modify) Deposit", deposit_fields),
    ("activity", "activities", True, "(Do Not Modify) Activity", activity_fields),
)

MODEL_BY_ENTITY = {
    "account": models.Account,
    "contact": models.Contact,
    "contract": models.Contract,
    "vault": models.Vault,
    "deposit": models.Deposit,
    "activity": models.Activity,
}


def load_sources(directory: Path) -> tuple[dict[tuple[str, str], SourceRecord], list[str]]:
    sources: dict[tuple[str, str], SourceRecord] = {}
    missing_files: list[str] = []
    for entity_type, file_key, active, source_header, extractor in FILE_SPECS:
        path = directory / FILES[file_key]
        if not path.is_file():
            missing_files.append(path.name)
            continue
        book = WorkbookRows(path)
        try:
            for row in book.rows():
                source_id = clean(book.value(row, source_header)).casefold()
                if not source_id:
                    continue
                sources[(entity_type, source_id)] = SourceRecord(
                    entity_type=entity_type,
                    source_id=source_id,
                    active=active,
                    fields=extractor(book, row),
                    file_name=path.name,
                )
        finally:
            book.close()
    return sources, sorted(set(missing_files))


def collision_groups(importer: ExcelImporter) -> dict[tuple[str, int], list[str]]:
    grouped: dict[tuple[str, int], list[str]] = defaultdict(list)
    for (entity_type, source_id), local_id in importer.mappings.items():
        if entity_type in MODEL_BY_ENTITY:
            grouped[(entity_type, local_id)].append(source_id.casefold())
    return {
        key: sorted(set(source_ids))
        for key, source_ids in grouped.items()
        if len(set(source_ids)) > 1
    }


def build_plans(
    importer: ExcelImporter,
    sources: dict[tuple[str, str], SourceRecord],
) -> tuple[list[CollisionPlan], list[str]]:
    plans: list[CollisionPlan] = []
    failures: list[str] = []
    for (entity_type, local_id), source_ids in sorted(collision_groups(importer).items()):
        model = MODEL_BY_ENTITY[entity_type]
        current = importer.db.get(model, local_id)
        label = f"{entity_type} local_id={local_id}"
        if current is None:
            failures.append(f"{label}: local row is missing")
            continue
        missing = [source_id for source_id in source_ids if (entity_type, source_id) not in sources]
        if missing:
            failures.append(f"{label}: missing source GUIDs {', '.join(missing)}")
            continue
        scores = {
            source_id: similarity_score(current, sources[(entity_type, source_id)])
            for source_id in source_ids
        }
        best_score = max(scores.values())
        winners = [source_id for source_id, score in scores.items() if score == best_score]
        if len(winners) != 1:
            signatures = {
                source_signature(sources[(entity_type, source_id)])
                for source_id in winners
            }
            if len(signatures) == 1:
                retained = sorted(winners)[0]
            else:
                failures.append(
                    f"{label}: ambiguous retained source among {', '.join(winners)} "
                    f"with score {best_score}"
                )
                continue
        else:
            retained = winners[0]
        plans.append(
            CollisionPlan(
                entity_type=entity_type,
                local_id=local_id,
                retained_source_id=retained,
                split_source_ids=tuple(source_id for source_id in source_ids if source_id != retained),
                scores=scores,
            )
        )
    return plans, failures


def contact_email_is_unique(importer: ExcelImporter) -> bool:
    indexes = inspect(importer.db.get_bind()).get_indexes("contacts")
    return any(
        index.get("unique") and index.get("column_names") == ["email"]
        for index in indexes
    )


def run_imports(importer: ExcelImporter, entity_types: set[str]) -> None:
    if "account" in entity_types or "contact" in entity_types:
        importer.import_accounts("active_accounts", True)
        importer.import_accounts("inactive_accounts", False)
    if "contact" in entity_types:
        importer.import_contacts("active_contacts", True)
        importer.import_contacts("inactive_contacts", False)
        importer.link_primary_contacts()
    if "contract" in entity_types:
        importer.import_contracts("active_contracts", True)
        importer.import_contracts("inactive_contracts", False)
    if "vault" in entity_types or "deposit" in entity_types:
        importer.import_vaults("active_vaults", True)
    if "deposit" in entity_types:
        importer.import_deposits("active_deposits", True)
        importer.import_deposits("inactive_deposits", False)
    if "activity" in entity_types:
        importer.import_activities()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path, help="Directory containing the complete Dynamics exports.")
    parser.add_argument("--apply", action="store_true", help="Commit the repair; otherwise dry-run only.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    directory = args.directory.expanduser().resolve()
    print(f"Export directory: {directory}")
    print(f"Mode: {'APPLY' if args.apply else 'DRY RUN'}")

    sources, missing_files = load_sources(directory)
    importer = ExcelImporter(directory, apply=args.apply, overwrite=True)
    try:
        importer.load_mappings()
        groups = collision_groups(importer)
        plans, failures = build_plans(importer, sources)
        print(f"Collided local rows: {len(groups)}")
        print(f"Resolved collision plans: {len(plans)}")
        print(f"Rows to create: {sum(len(plan.split_source_ids) for plan in plans)}")
        for plan in plans:
            print(
                f"  {plan.entity_type} local_id={plan.local_id}: "
                f"retain={plan.retained_source_id}, split={list(plan.split_source_ids)}, "
                f"scores={plan.scores}"
            )

        if missing_files:
            print("\nMissing export files:")
            for file_name in missing_files:
                print(f"  - {file_name}")
        if failures:
            print("\nUnresolved collision groups:")
            for failure in failures:
                print(f"  - {failure}")

        if not groups:
            print("No import collisions remain.")
            return 0
        if missing_files or failures or len(plans) != len(groups):
            print("Refusing repair until source coverage and retained-row matching are complete.")
            return 2
        if any(plan.entity_type == "contact" for plan in plans) and contact_email_is_unique(importer):
            print("Refusing repair: run python -m migrations.migrate_db to allow shared contact emails.")
            return 2

        for plan in plans:
            for source_id in plan.split_source_ids:
                importer.mappings.pop((plan.entity_type, source_id), None)
                importer.db.execute(
                    text(
                        "DELETE FROM legacy_import_ids "
                        "WHERE entity_type = :entity_type AND source_id = :source_id"
                    ),
                    {"entity_type": plan.entity_type, "source_id": source_id},
                )

        run_imports(importer, {plan.entity_type for plan in plans})
        remaining = collision_groups(importer)
        if remaining:
            importer.db.rollback()
            print(f"Refusing commit: {len(remaining)} collision groups remain after repair simulation.")
            return 2

        if args.apply:
            importer.db.commit()
            print("Repair committed.")
        else:
            importer.db.rollback()
            print("Dry run completed; no changes were committed.")
        return 0
    except Exception:
        importer.db.rollback()
        raise
    finally:
        importer.close()


if __name__ == "__main__":
    sys.exit(main())
