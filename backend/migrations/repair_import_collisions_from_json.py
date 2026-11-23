"""Repair merged Dynamics imports from a full read-only Dynamics JSON snapshot.

The migration is a dry run unless --apply is supplied. It splits every
many-to-one legacy_import_ids mapping, restores source fields, reconnects
lookup relationships, removes mappings for records deleted from Dynamics, and
refuses to commit unless no collisions remain.

Usage:
    python -m migrations.repair_import_collisions_from_json full_database.json
    python -m migrations.repair_import_collisions_from_json full_database.json --apply
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import inspect, text

import models
from database import SessionLocal
from migrations.repair_import_collisions import (
    MODEL_BY_ENTITY,
    SourceRecord,
    comparable,
    similarity_score,
    source_signature,
)


LOCAL_TIMEZONE = ZoneInfo("Asia/Jerusalem")
ENTITY_ORDER = ("account", "contact", "vault", "contract", "deposit", "activity")


@dataclass(frozen=True)
class JsonSource:
    source: SourceRecord
    raw: dict[str, Any]


@dataclass(frozen=True)
class RepairPlan:
    entity_type: str
    local_id: int
    retained_source_id: str
    split_source_ids: tuple[str, ...]
    stale_source_ids: tuple[str, ...]
    scores: dict[str, int]
    retained_reason: str


def normalize_guid(value: Any) -> str:
    return re.sub(r"[{}\s]", "", str(value or "")).casefold()


def formatted(record: dict[str, Any], property_name: str) -> str:
    return str(
        record.get(
            f"{property_name}@OData.Community.Display.V1.FormattedValue",
            "",
        )
        or ""
    ).strip()


def lookup_guid(record: dict[str, Any], logical_name: str) -> str:
    return normalize_guid(record.get(f"_{logical_name}_value"))


def parse_datetime(value: Any, *, date_only: bool = False) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(LOCAL_TIMEZONE).replace(tzinfo=None)
    if date_only:
        parsed = parsed.replace(hour=0, minute=0, second=0, microsecond=0)
    return parsed


def is_active(record: dict[str, Any]) -> bool:
    return record.get("statecode") == 0


def account_fields(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": record.get("name"),
        "website": record.get("websiteurl"),
        "phone": record.get("telephone1"),
        "description": record.get("description"),
        "street": record.get("address1_line1"),
        "city": record.get("address1_city"),
        "state_or_province": record.get("address1_stateorprovince"),
        "zip_code": record.get("address1_postalcode"),
        "country": record.get("address1_country"),
        "created_at": parse_datetime(record.get("createdon")),
    }


def contact_fields(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "first_name": record.get("firstname") or "",
        "middle_name": record.get("middlename"),
        "last_name": record.get("lastname") or "",
        "email": record.get("emailaddress1"),
        "phone": record.get("telephone1"),
        "mobile_phone": record.get("mobilephone"),
        "is_israeli": record.get("cr4ec_israeli"),
        "job_title": record.get("jobtitle"),
        "company_name": record.get("ey_s_company_name"),
        "supplier": formatted(record, "accountrolecode") or None,
        "description": record.get("description"),
        "account_name": formatted(record, "_parentcustomerid_value") or None,
        "created_at": parse_datetime(record.get("createdon")),
    }


def contract_fields(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": record.get("ey_name") or "",
        "beneficiary_title": formatted(record, "_ey_beneficiary_id_value") or None,
        "supplier_title": formatted(record, "_ey_supplier_id_value") or None,
        "contact_type": formatted(record, "ey_p_contract_type") or None,
        "status": models.ContractStatus.ACTIVE,
        "start_date": parse_datetime(record.get("ey_d_date_contract_signed"), date_only=True),
        "end_date": parse_datetime(record.get("ey_d_date_contract_ends"), date_only=True),
        "beneficiary_currency": formatted(record, "ey_p_beneficiary_currency") or None,
        "beneficiary_set_up_fee": string_value(record.get("ey_f_beneficiary_set_up_fee")),
        "beneficiary_annual_fee": string_value(record.get("ey_f_beneficiary_annual_fee")),
        "beneficiary_updates": string_value(record.get("ey_f_beneficiary_updates")),
        "beneficiary_ext_verification": string_value(record.get("ey_f_beneficiary_ext_verification")),
        "supplier_currency": formatted(record, "ey_p_supplier_currency") or None,
        "supplier_set_up_fee": string_value(record.get("ey_f_supplier_set_up_fee")),
        "supplier_annual_fee": string_value(record.get("ey_f_supplier_annual_fee")),
        "supplier_updates": string_value(record.get("ey_f_supplier_updates")),
        "supplier_ext_verification": string_value(record.get("ey_f_supplier_ext_verification")),
        "beneficiary_management_contact": formatted(record, "_ey_beneficiary_management_contact_id_value") or None,
        "beneficiary_technical_contact": formatted(record, "_ey_beneficiary_technical_contact_id_value") or None,
        "beneficiary_financial_contact": formatted(record, "_ey_beneficiary_financial_contact__value") or None,
        "supplier_management_contact": formatted(record, "_ey_supplier_management_contact_id_value") or None,
        "supplier_technical_contact": formatted(record, "_ey_supplier_technical_contact_id_value") or None,
        "supplier_financial_contact": formatted(record, "_ey_supplier_financial_contact_value") or None,
        "product_name": record.get("ey_s_product_name"),
        "description": record.get("ey_s_description"),
        "created_at": parse_datetime(record.get("createdon")),
    }


def string_value(value: Any) -> str | None:
    return None if value in (None, "") else str(value)


def deposit_status(record: dict[str, Any]) -> models.DepositStatus:
    value = formatted(record, "ey_p_verification_status").casefold()
    if value == "verified":
        return models.DepositStatus.VERIFIED
    if value == "passive":
        return models.DepositStatus.PASSIVE
    return models.DepositStatus.OPEN


def deposit_fields(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "reference_number": record.get("ey_s_deposit_number") or "",
        "amount": float(record.get("ey_n_media_amount") or 0),
        "date": parse_datetime(record.get("ey_d_date_recieved"), date_only=True),
        "status": deposit_status(record),
        "product_name": record.get("ey_name"),
        "version": record.get("ey_s_version"),
        "supplier": formatted(record, "_ey_supplier_id_value") or None,
        "box": record.get("ey_s_box"),
        "date_vaulted": parse_datetime(record.get("ey_d_date_vaulted"), date_only=True),
        "confirmation_sent": record.get("ey_b_is_confirmation_sent"),
        "date_confirmation_sent": parse_datetime(
            record.get("ey_d_date_confirmation_sent"), date_only=True
        ),
        "is_confirmation_sent": record.get("ey_b_is_report_sent"),
        "date_report_sent": parse_datetime(record.get("ey_d_date_report_sent"), date_only=True),
        "description": record.get("ey_s_description"),
        "received_by": formatted(record, "ey_p_received_by") or None,
        "vault_name": formatted(record, "_ey_vault_id_value") or None,
        "created_at": parse_datetime(record.get("createdon")),
    }


def vault_fields(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": record.get("ey_name") or "",
        "status": models.VaultStatus.OPEN,
        "created_at": parse_datetime(record.get("createdon")),
    }


def activity_fields(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "subject": record.get("subject") or "",
        "regarding": formatted(record, "_regardingobjectid_value") or None,
        "start_date": parse_datetime(record.get("scheduledstart")),
        "due_date": parse_datetime(record.get("scheduledend")),
        "notes": record.get("description"),
        "created_at": parse_datetime(record.get("createdon")),
    }


FIELD_EXTRACTORS = {
    "account": account_fields,
    "contact": contact_fields,
    "contract": contract_fields,
    "vault": vault_fields,
    "deposit": deposit_fields,
    "activity": activity_fields,
}


def load_sources(path: Path) -> dict[tuple[str, str], JsonSource]:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if payload.get("format") != "egcrm-dynamics-full-database-v1":
        raise ValueError("Unsupported JSON format; run export_dynamics_full_database.js again.")
    exports = payload.get("entities")
    if not isinstance(exports, dict):
        raise ValueError("The JSON has no entities object.")
    missing = [entity_type for entity_type in ENTITY_ORDER if entity_type not in exports]
    if missing:
        raise ValueError(f"The JSON is missing entities: {', '.join(missing)}")

    sources: dict[tuple[str, str], JsonSource] = {}
    for entity_type in ENTITY_ORDER:
        export = exports[entity_type]
        id_field = export.get("entity", {}).get("primary_id_attribute")
        if not id_field:
            raise ValueError(f"{entity_type} export has no primary ID attribute.")
        extractor = FIELD_EXTRACTORS[entity_type]
        for record in export.get("records", []):
            source_id = normalize_guid(record.get(id_field))
            if not source_id:
                continue
            source = SourceRecord(
                entity_type=entity_type,
                source_id=source_id,
                active=is_active(record),
                fields=extractor(record),
                file_name=path.name,
            )
            sources[(entity_type, source_id)] = JsonSource(source=source, raw=record)
    return sources


def load_mappings(db) -> dict[tuple[str, str], int]:
    rows = db.execute(
        text("SELECT entity_type, source_id, local_id FROM legacy_import_ids")
    ).all()
    return {
        (str(entity_type), normalize_guid(source_id)): int(local_id)
        for entity_type, source_id, local_id in rows
    }


def collision_groups(mappings: dict[tuple[str, str], int]) -> dict[tuple[str, int], list[str]]:
    grouped: dict[tuple[str, int], list[str]] = defaultdict(list)
    for (entity_type, source_id), local_id in mappings.items():
        if entity_type in MODEL_BY_ENTITY:
            grouped[(entity_type, local_id)].append(source_id)
    return {
        key: sorted(set(source_ids))
        for key, source_ids in grouped.items()
        if len(set(source_ids)) > 1
    }


def build_plans(db, mappings, sources) -> tuple[list[RepairPlan], list[str]]:
    plans: list[RepairPlan] = []
    failures: list[str] = []
    for (entity_type, local_id), source_ids in sorted(collision_groups(mappings).items()):
        current = db.get(MODEL_BY_ENTITY[entity_type], local_id)
        label = f"{entity_type} local_id={local_id}"
        if current is None:
            failures.append(f"{label}: local row is missing")
            continue
        present = [source_id for source_id in source_ids if (entity_type, source_id) in sources]
        stale = [source_id for source_id in source_ids if (entity_type, source_id) not in sources]
        if not present:
            failures.append(f"{label}: no mapped GUID remains in Dynamics")
            continue
        scores = {
            source_id: similarity_score(current, sources[(entity_type, source_id)].source)
            for source_id in present
        }
        best_score = max(scores.values())
        winners = [source_id for source_id, score in scores.items() if score == best_score]
        if len(winners) == 1:
            retained = winners[0]
            retained_reason = "best field match"
        else:
            signatures = {
                source_signature(sources[(entity_type, source_id)].source)
                for source_id in winners
            }
            retained = min(
                winners,
                key=lambda source_id: (
                    parse_datetime(
                        sources[(entity_type, source_id)].raw.get("createdon")
                    )
                    or datetime.max,
                    source_id,
                ),
            )
            retained_reason = (
                "identical duplicate; oldest Dynamics row retained"
                if len(signatures) == 1
                else "tied field match; oldest Dynamics row retained"
            )
        if stale and best_score == 0:
            failures.append(
                f"{label}: cannot prove that stale mappings {', '.join(stale)} "
                "do not represent the retained local row"
            )
            continue
        plans.append(
            RepairPlan(
                entity_type=entity_type,
                local_id=local_id,
                retained_source_id=retained,
                split_source_ids=tuple(source_id for source_id in present if source_id != retained),
                stale_source_ids=tuple(stale),
                scores=scores,
                retained_reason=retained_reason,
            )
        )
    return plans, failures


def contact_email_is_unique(db) -> bool:
    indexes = inspect(db.get_bind()).get_indexes("contacts")
    return any(
        index.get("unique") and index.get("column_names") == ["email"]
        for index in indexes
    )


def assign_fields(target: Any, source: JsonSource) -> None:
    columns = {column.name: column for column in target.__table__.columns}
    for field, value in source.source.fields.items():
        column = columns.get(field)
        if column is not None and (value is not None or column.nullable):
            setattr(target, field, value)
    if "is_active" in columns:
        target.is_active = source.source.active


def required_defaults(entity_type: str, source: JsonSource) -> dict[str, Any]:
    fields = source.source.fields
    if entity_type == "account":
        return {"name": fields.get("name")}
    if entity_type == "contact":
        return {
            "first_name": fields.get("first_name") or "Unknown",
            "last_name": fields.get("last_name") or "Unknown",
        }
    if entity_type == "contract":
        return {
            "title": fields.get("title") or f"Imported {source.source.source_id}",
            "value": 0.0,
            "status": models.ContractStatus.ACTIVE,
        }
    if entity_type == "vault":
        return {
            "name": fields.get("name") or f"Imported {source.source.source_id}",
            "status": models.VaultStatus.OPEN,
        }
    if entity_type == "deposit":
        return {
            "reference_number": fields.get("reference_number") or f"IMPORT-{source.source.source_id}",
            "amount": fields.get("amount") or 0.0,
            "status": fields.get("status") or models.DepositStatus.OPEN,
        }
    return {"subject": fields.get("subject") or f"Imported {source.source.source_id}"}


def write_mapping(db, entity_type: str, source_id: str, local_id: int) -> None:
    db.execute(
        text(
            "INSERT INTO legacy_import_ids (entity_type, source_id, local_id) "
            "VALUES (:entity_type, :source_id, :local_id) "
            "ON DUPLICATE KEY UPDATE local_id = VALUES(local_id)"
        ),
        {"entity_type": entity_type, "source_id": source_id, "local_id": local_id},
    )


def mapped_id(mappings, entity_type: str, source_id: Any) -> int | None:
    normalized = normalize_guid(source_id)
    return mappings.get((entity_type, normalized)) if normalized else None


def relink_records(db, sources, mappings) -> Counter:
    from collections import Counter

    changed = Counter()
    for (entity_type, source_id), source in sources.items():
        local_id = mappings.get((entity_type, source_id))
        if not local_id:
            continue
        target = db.get(MODEL_BY_ENTITY[entity_type], local_id)
        if target is None:
            continue
        record = source.raw
        updates: dict[str, Any] = {}
        if entity_type == "account":
            updates["primary_contact_id"] = mapped_id(
                mappings, "contact", lookup_guid(record, "primarycontactid")
            )
        elif entity_type == "contact":
            if record.get(
                "_parentcustomerid_value@Microsoft.Dynamics.CRM.lookuplogicalname"
            ) == "account":
                updates["account_id"] = mapped_id(
                    mappings, "account", lookup_guid(record, "parentcustomerid")
                )
        elif entity_type == "contract":
            updates["beneficiary_account_id"] = mapped_id(
                mappings, "account", lookup_guid(record, "ey_beneficiary_id")
            )
            updates["supplier_account_id"] = mapped_id(
                mappings, "account", lookup_guid(record, "ey_supplier_id")
            )
        elif entity_type == "deposit":
            updates["vault_id"] = mapped_id(
                mappings, "vault", lookup_guid(record, "ey_vault_id")
            )
            updates["verified_by_contact_id"] = mapped_id(
                mappings, "contact", lookup_guid(record, "ey_verified_by_id")
            )
        for field, value in updates.items():
            if getattr(target, field) != value:
                setattr(target, field, value)
                changed[f"{entity_type}.{field}"] += 1
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
    print("Dynamics records loaded:")
    for entity_type in ENTITY_ORDER:
        print(
            f"  {entity_type}: "
            f"{sum(1 for kind, _ in sources if kind == entity_type)}"
        )

    db = SessionLocal()
    try:
        mappings = load_mappings(db)
        groups = collision_groups(mappings)
        plans, failures = build_plans(db, mappings, sources)
        print(f"Collided local rows: {len(groups)}")
        print(f"Resolved plans: {len(plans)}")
        print(f"Rows to create: {sum(len(plan.split_source_ids) for plan in plans)}")
        print(f"Stale mappings to remove: {sum(len(plan.stale_source_ids) for plan in plans)}")
        counts = defaultdict(int)
        for plan in plans:
            counts[plan.entity_type] += len(plan.split_source_ids)
            print(
                f"  {plan.entity_type} local_id={plan.local_id}: "
                f"retain={plan.retained_source_id}, split={list(plan.split_source_ids)}, "
                f"stale={list(plan.stale_source_ids)}, scores={plan.scores}, "
                f"reason={plan.retained_reason}"
            )
        print("Rows to create by entity:", dict(counts))
        if failures:
            print("\nUnresolved collision groups:")
            for failure in failures:
                print(f"  - {failure}")
            print("Refusing repair until every collision group is resolved.")
            return 2
        if not groups:
            print("No import collisions remain.")
            return 0
        if not args.apply:
            print("Dry run only; no changes were made.")
            return 0
        if any(plan.entity_type == "contact" for plan in plans) and contact_email_is_unique(db):
            print("Refusing repair: run python -m migrations.migrate_db first.")
            return 2

        for entity_type in ENTITY_ORDER:
            for plan in (item for item in plans if item.entity_type == entity_type):
                retained = db.get(MODEL_BY_ENTITY[entity_type], plan.local_id)
                assign_fields(retained, sources[(entity_type, plan.retained_source_id)])
                for source_id in plan.stale_source_ids:
                    db.execute(
                        text(
                            "DELETE FROM legacy_import_ids "
                            "WHERE entity_type = :entity_type AND source_id = :source_id"
                        ),
                        {"entity_type": entity_type, "source_id": source_id},
                    )
                    mappings.pop((entity_type, source_id), None)
                for source_id in plan.split_source_ids:
                    source = sources[(entity_type, source_id)]
                    clone = MODEL_BY_ENTITY[entity_type](
                        **required_defaults(entity_type, source)
                    )
                    assign_fields(clone, source)
                    db.add(clone)
                    db.flush()
                    write_mapping(db, entity_type, source_id, clone.id)
                    mappings[(entity_type, source_id)] = clone.id

        relationship_changes = relink_records(db, sources, mappings)
        remaining = collision_groups(load_mappings(db))
        if remaining:
            db.rollback()
            print(f"Refusing commit: {len(remaining)} collision groups remain.")
            return 2
        db.commit()
        print("Relationship changes:", dict(relationship_changes))
        print("Repair committed. Import mapping collisions remaining: 0")
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
