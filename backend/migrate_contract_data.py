"""Restore imported Contract party, contact, and billing data from Dynamics JSON.

The migration is a dry run by default and matches contracts by the original
Dynamics GUID stored in legacy_import_ids. Existing values are preserved unless
--overwrite is supplied with --apply.

Usage:
    python migrate_contract_data.py dynamics_contract_data.json
    python migrate_contract_data.py dynamics_contract_data.json --apply
    python migrate_contract_data.py dynamics_contract_data.json --apply --overwrite
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any, Callable

from sqlalchemy import text

from database import SessionLocal
import models


FORMATTED_SUFFIX = "@OData.Community.Display.V1.FormattedValue"


def contract_type(value: str) -> str:
    choices = {"3 party": "3-party", "3-party": "3-party", "frame": "frame"}
    return choices.get(value.casefold(), value)


def identity(value: str) -> str:
    return value


# target field: (Dynamics logical name, prefer formatted label, transform)
FIELD_SPECS: dict[str, tuple[str, bool, Callable[[str], str]]] = {
    "beneficiary_title": ("ey_beneficiary_id", True, identity),
    "supplier_title": ("ey_supplier_id", True, identity),
    "contact_type": ("ey_p_contract_type", True, contract_type),
    "beneficiary_currency": ("ey_p_beneficiary_currency", True, identity),
    "beneficiary_set_up_fee": ("ey_f_beneficiary_set_up_fee", False, identity),
    "beneficiary_annual_fee": ("ey_f_beneficiary_annual_fee", False, identity),
    "beneficiary_updates": ("ey_f_beneficiary_updates", False, identity),
    "beneficiary_ext_verification": ("ey_f_beneficiary_ext_verification", False, identity),
    "supplier_currency": ("ey_p_supplier_currency", True, identity),
    "supplier_set_up_fee": ("ey_f_supplier_set_up_fee", False, identity),
    "supplier_annual_fee": ("ey_f_supplier_annual_fee", False, identity),
    "supplier_updates": ("ey_f_supplier_updates", False, identity),
    "supplier_ext_verification": ("ey_f_supplier_ext_verification", False, identity),
    "beneficiary_management_contact": (
        "ey_beneficiary_management_contact_id",
        True,
        identity,
    ),
    "beneficiary_technical_contact": (
        "ey_beneficiary_technical_contact_id",
        True,
        identity,
    ),
    "beneficiary_financial_contact": (
        "ey_beneficiary_financial_contact_",
        True,
        identity,
    ),
    "supplier_management_contact": (
        "ey_supplier_management_contact_id",
        True,
        identity,
    ),
    "supplier_technical_contact": (
        "ey_supplier_technical_contact_id",
        True,
        identity,
    ),
    "supplier_financial_contact": (
        "ey_supplier_financial_contact",
        True,
        identity,
    ),
}


def normalize_guid(value: Any) -> str:
    return re.sub(r"[{}\s]", "", str(value or "")).casefold()


def text_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def source_value(record: dict[str, Any], logical_name: str, prefer_formatted: bool) -> str:
    direct_key = logical_name
    lookup_key = f"_{logical_name}_value"
    raw = record.get(direct_key, record.get(lookup_key))
    formatted = record.get(f"{direct_key}{FORMATTED_SUFFIX}")
    if formatted is None:
        formatted = record.get(f"{lookup_key}{FORMATTED_SUFFIX}")
    if prefer_formatted and formatted not in (None, ""):
        return text_value(formatted)
    return text_value(raw)


def load_contracts(path: Path) -> tuple[dict[str, dict[str, Any]], int]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(payload, dict) or not isinstance(payload.get("contracts"), list):
        raise ValueError("Expected a Dynamics Contract export containing a 'contracts' array.")
    entity = payload.get("entity") or {}
    primary_id = entity.get("primary_id_attribute")
    if not primary_id:
        raise ValueError("The Contract export does not identify its primary ID attribute.")

    contracts: dict[str, dict[str, Any]] = {}
    conflicts = 0
    for record in payload["contracts"]:
        if not isinstance(record, dict):
            continue
        source_id = normalize_guid(record.get(primary_id))
        if not source_id:
            continue
        if source_id in contracts and contracts[source_id] != record:
            conflicts += 1
            continue
        contracts[source_id] = record
    return contracts, conflicts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_file", type=Path, help="JSON downloaded from Dynamics.")
    parser.add_argument("--apply", action="store_true", help="Commit the displayed updates.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Preview or replace existing values with authoritative Dynamics values.",
    )
    return parser.parse_args()


def run(json_file: Path, apply: bool, overwrite: bool) -> None:
    exported, conflicts = load_contracts(json_file)
    db = SessionLocal()
    try:
        try:
            mappings = db.execute(
                text(
                    "SELECT source_id, local_id FROM legacy_import_ids "
                    "WHERE entity_type = 'contract' ORDER BY local_id"
                )
            ).all()
        except Exception as exc:
            raise RuntimeError(
                "The import mapping table is unavailable. Run python migrate_db.py first."
            ) from exc

        local_id_counts = Counter(local_id for _, local_id in mappings)
        duplicate_local_ids = [
            local_id for local_id, count in local_id_counts.items() if count > 1
        ]
        if duplicate_local_ids:
            raise RuntimeError(
                f"Refusing migration: {len(duplicate_local_ids)} EGCRM contracts are mapped "
                "to multiple Dynamics GUIDs. Repair the import mappings first."
            )

        changed_contracts: set[int] = set()
        changed_fields: Counter[str] = Counter()
        already_same = 0
        preserved = 0
        blank_source = 0
        missing_from_export = 0
        missing_contract = 0
        missing_examples: list[str] = []

        for source_id, local_id in mappings:
            guid = normalize_guid(source_id)
            record = exported.get(guid)
            if record is None:
                missing_from_export += 1
                contract = db.get(models.Contract, local_id)
                if contract is not None and len(missing_examples) < 20:
                    missing_examples.append(f"{guid} | {contract.title}")
                continue
            contract = db.get(models.Contract, local_id)
            if contract is None:
                missing_contract += 1
                continue

            for target, (logical_name, prefer_formatted, transform) in FIELD_SPECS.items():
                incoming = transform(source_value(record, logical_name, prefer_formatted))
                if not incoming:
                    blank_source += 1
                    continue
                current = text_value(getattr(contract, target, None))
                if current == incoming:
                    already_same += 1
                    continue
                if current and not overwrite:
                    preserved += 1
                    continue
                setattr(contract, target, incoming)
                changed_contracts.add(contract.id)
                changed_fields[target] += 1

        if apply:
            db.commit()
        else:
            db.rollback()

        mapped_guids = {normalize_guid(source_id) for source_id, _ in mappings}
        print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
        print(f"Dynamics contracts loaded: {len(exported)}")
        print(f"Imported contract mappings scanned: {len(mappings)}")
        print(f"Contracts changed: {len(changed_contracts)}")
        print(f"Fields changed: {sum(changed_fields.values())}")
        print(f"Already identical fields: {already_same}")
        print(f"Existing values preserved: {preserved}")
        print(f"Blank Dynamics fields skipped: {blank_source}")
        print(f"Imported contracts absent from export: {missing_from_export}")
        print(f"Mappings with missing EGCRM contract: {missing_contract}")
        print(f"Conflicting duplicate Dynamics GUIDs: {conflicts}")
        print(f"Unrelated Dynamics contracts ignored: {len(set(exported) - mapped_guids)}")
        print("\nChanges by field")
        for field in FIELD_SPECS:
            print(f"  {field}: {changed_fields[field]}")
        if missing_examples:
            print("\nImported contracts absent from the Dynamics export")
            for example in missing_examples:
                print(f"  {example}")
        print("Changes committed." if apply else "Dry run only; no changes were committed.")
    finally:
        db.close()


if __name__ == "__main__":
    arguments = parse_args()
    run(arguments.json_file, arguments.apply, arguments.overwrite)
