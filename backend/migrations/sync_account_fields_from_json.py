"""Fill blank account fields from a full Dynamics JSON snapshot.

The command is a dry run unless --apply is supplied. Existing nonblank EGCRM
values are never overwritten.

Usage:
    python -m migrations.sync_account_fields_from_json full_database.json
    python -m migrations.sync_account_fields_from_json full_database.json --apply
"""
from __future__ import annotations

import argparse
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import models
from database import SessionLocal
from migrations.repair_import_collisions_from_json import load_mappings, load_sources


ACCOUNT_FIELDS = (
    "website",
    "phone",
    "description",
    "street",
    "city",
    "state_or_province",
    "zip_code",
    "country",
)


def is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def fill_blank_account_fields(account: models.Account, fields: dict[str, Any]) -> list[str]:
    changed: list[str] = []
    for field in ACCOUNT_FIELDS:
        source_value = fields.get(field)
        if is_blank(getattr(account, field)) and not is_blank(source_value):
            setattr(account, field, source_value)
            changed.append(field)
    return changed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_file", type=Path, help="Full JSON from export_dynamics_full_database.js")
    parser.add_argument("--apply", action="store_true", help="Commit changes; otherwise dry run only.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    json_file = args.json_file.expanduser().resolve()
    print(f"JSON file: {json_file}")
    print(f"Mode: {'APPLY' if args.apply else 'DRY RUN'}")

    sources = load_sources(json_file)
    account_sources = {
        source_id: source
        for (entity_type, source_id), source in sources.items()
        if entity_type == "account"
    }

    db = SessionLocal()
    try:
        mappings = load_mappings(db)
        account_mappings = {
            source_id: local_id
            for (entity_type, source_id), local_id in mappings.items()
            if entity_type == "account" and source_id in account_sources
        }
        mappings_by_local_id: dict[int, list[str]] = defaultdict(list)
        for source_id, local_id in account_mappings.items():
            mappings_by_local_id[local_id].append(source_id)
        collisions = {
            local_id: source_ids
            for local_id, source_ids in mappings_by_local_id.items()
            if len(source_ids) > 1
        }
        if collisions:
            print(
                "Refusing sync: "
                f"{len(collisions)} EGCRM accounts are mapped to multiple Dynamics records."
            )
            return 2

        counts: Counter[str] = Counter()
        changed_accounts = 0
        missing_local_accounts = 0
        examples: list[str] = []
        for source_id, local_id in sorted(account_mappings.items()):
            account = db.get(models.Account, local_id)
            if account is None:
                missing_local_accounts += 1
                continue
            changed_fields = fill_blank_account_fields(
                account,
                account_sources[source_id].source.fields,
            )
            if not changed_fields:
                continue
            changed_accounts += 1
            counts.update(changed_fields)
            if len(examples) < 20:
                examples.append(f"  {account.name} (id={account.id}): {', '.join(changed_fields)}")

        unmapped_sources = len(account_sources) - len(account_mappings)
        print(f"Dynamics account records: {len(account_sources)}")
        print(f"Mapped account records: {len(account_mappings)}")
        print(f"Unmapped Dynamics accounts: {unmapped_sources}")
        print(f"Mappings with missing EGCRM accounts: {missing_local_accounts}")
        print(f"Accounts to update: {changed_accounts}")
        print(f"Fields to fill: {dict(counts)}")
        if examples:
            print("Examples:")
            print("\n".join(examples))

        if not args.apply:
            db.rollback()
            print("Dry run only; no changes were committed.")
            return 0

        db.commit()
        print("Account field repair committed.")
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
