"""Restore Deposit confirmation, verification, and report fields from Dynamics.

The migration is a dry run unless --apply is supplied. Deposits and the
Verified By contact are matched through legacy_import_ids. Existing non-default
EGCRM values are preserved unless --overwrite is also supplied.

Usage:
    python migrate_deposit_details.py dynamics_deposit_details.json
    python migrate_deposit_details.py dynamics_deposit_details.json --apply
    python migrate_deposit_details.py dynamics_deposit_details.json --apply --overwrite
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text

from database import SessionLocal
import models


FORMATTED_SUFFIX = "@OData.Community.Display.V1.FormattedValue"
LOOKUP_ENTITY_SUFFIX = "@Microsoft.Dynamics.CRM.lookuplogicalname"

# Required and forbidden words are matched against Dynamics display, logical,
# and schema names. Forbidden words keep similarly named date/boolean fields
# from being confused with one another.
FIELD_RULES: dict[str, tuple[set[str], set[str]]] = {
    "confirmation_sent": ({"confirmation", "sent"}, {"date", "report"}),
    "date_confirmation_sent": ({"date", "confirmation", "sent"}, {"report"}),
    "verified_by_contact_id": ({"verified", "by"}, {"status"}),
    "is_confirmation_sent": ({"report", "sent"}, {"date", "confirmation"}),
    "date_report_sent": ({"date", "report", "sent"}, {"confirmation"}),
}


@dataclass(frozen=True)
class AttributeValue:
    raw: Any
    formatted: Any
    lookup_entity: str


@dataclass(frozen=True)
class DepositDetails:
    confirmation_sent: bool | None
    date_confirmation_sent: datetime | None
    verified_by_source_id: str
    verified_by_name: str
    is_report_sent: bool | None
    date_report_sent: datetime | None


@dataclass
class DepositExport:
    records: dict[str, dict[str, Any]]
    fields: dict[str, dict[str, Any]]
    primary_name: str
    duplicate_conflicts: int


def normalize_guid(value: Any) -> str:
    return re.sub(r"[{}\s]", "", str(value or "")).casefold()


def is_guid(value: str) -> bool:
    return bool(re.fullmatch(r"[0-9a-f]{32}", value.replace("-", "")))


def normalize_label(value: Any) -> str:
    source = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", str(value or ""))
    return re.sub(r"[^a-z0-9]+", " ", source.casefold()).strip()


def normalized_name(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip().casefold()


def resolve_fields(
    attributes: list[dict[str, Any]], overrides: dict[str, str] | None = None
) -> dict[str, dict[str, Any]]:
    overrides = overrides or {}
    resolved: dict[str, dict[str, Any]] = {}
    failures: list[str] = []
    readable = [attribute for attribute in attributes if attribute.get("readable") is not False]

    for target, (required, forbidden) in FIELD_RULES.items():
        override = overrides.get(target)
        if override:
            matches = [
                attribute
                for attribute in readable
                if str(attribute.get("logical_name") or "").casefold() == override.casefold()
            ]
        else:
            matches = []
            for attribute in readable:
                labels = [
                    normalize_label(attribute.get("display_name")),
                    normalize_label(attribute.get("logical_name")),
                    normalize_label(attribute.get("schema_name")),
                ]
                compact_labels = [label.replace(" ", "") for label in labels if label]
                required_compact = [word.replace(" ", "") for word in required]
                forbidden_compact = [word.replace(" ", "") for word in forbidden]
                if any(
                    all(word in label for word in required_compact)
                    and not any(word in label for word in forbidden_compact)
                    for label in compact_labels
                ):
                    matches.append(attribute)

        if len(matches) == 1:
            resolved[target] = matches[0]
            continue
        descriptions = ", ".join(
            f"{match.get('logical_name')} ({match.get('display_name')})" for match in matches
        ) or "none"
        failures.append(f"{target}: {len(matches)} candidates [{descriptions}]")

    if failures:
        raise ValueError(
            "Could not uniquely identify all Dynamics Deposit fields. "
            + "; ".join(failures)
            + ". Use --field TARGET=LOGICAL_NAME for ambiguous fields."
        )
    return resolved


def attribute_value(record: dict[str, Any], attribute: dict[str, Any]) -> AttributeValue:
    logical_name = str(attribute.get("logical_name") or "")
    direct_key = logical_name
    lookup_key = f"_{logical_name}_value"
    key = lookup_key if lookup_key in record else direct_key
    return AttributeValue(
        raw=record.get(key),
        formatted=record.get(f"{key}{FORMATTED_SUFFIX}"),
        lookup_entity=str(record.get(f"{key}{LOOKUP_ENTITY_SUFFIX}") or ""),
    )


def parse_yes_no(value: AttributeValue, field_name: str) -> bool | None:
    for candidate in (value.formatted, value.raw):
        if candidate in (None, ""):
            continue
        if isinstance(candidate, bool):
            return candidate
        if isinstance(candidate, (int, float)) and candidate in (0, 1):
            return bool(candidate)
        label = normalize_label(candidate)
        if label in {"yes", "true", "sent", "1"}:
            return True
        if label in {"no", "false", "not sent", "0"}:
            return False
    if value.raw in (None, "") and value.formatted in (None, ""):
        return None
    raise ValueError(
        f"Unrecognized yes/no value for {field_name}: raw={value.raw!r}, "
        f"formatted={value.formatted!r}"
    )


def parse_datetime(value: AttributeValue, field_name: str) -> datetime | None:
    raw = value.raw
    if raw in (None, ""):
        return None
    if isinstance(raw, datetime):
        parsed = raw
    elif isinstance(raw, date):
        parsed = datetime.combine(raw, datetime.min.time())
    else:
        source = str(raw).strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(source)
        except ValueError as exc:
            raise ValueError(f"Unrecognized date for {field_name}: {raw!r}") from exc
    return parsed.replace(tzinfo=None)


def details_from_record(
    record: dict[str, Any], fields: dict[str, dict[str, Any]]
) -> DepositDetails:
    verified = attribute_value(record, fields["verified_by_contact_id"])
    verified_raw = str(verified.raw or "").strip()
    verified_guid = normalize_guid(verified_raw)
    return DepositDetails(
        confirmation_sent=parse_yes_no(
            attribute_value(record, fields["confirmation_sent"]), "confirmation_sent"
        ),
        date_confirmation_sent=parse_datetime(
            attribute_value(record, fields["date_confirmation_sent"]),
            "date_confirmation_sent",
        ),
        verified_by_source_id=verified_guid if is_guid(verified_guid) else "",
        verified_by_name=str(
            verified.formatted or (verified_raw if not is_guid(verified_guid) else "")
        ).strip(),
        is_report_sent=parse_yes_no(
            attribute_value(record, fields["is_confirmation_sent"]), "is_report_sent"
        ),
        date_report_sent=parse_datetime(
            attribute_value(record, fields["date_report_sent"]), "date_report_sent"
        ),
    )


def load_export(path: Path, overrides: dict[str, str] | None = None) -> DepositExport:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(payload, dict) or not isinstance(payload.get("deposits"), list):
        raise ValueError("Expected a Dynamics Deposit export containing a 'deposits' array.")
    if not isinstance(payload.get("attributes"), list):
        raise ValueError("The Dynamics Deposit export does not contain field metadata.")
    entity = payload.get("entity") or {}
    primary_id = entity.get("primary_id_attribute")
    if not primary_id:
        raise ValueError("The Dynamics Deposit export does not identify its primary ID field.")

    fields = resolve_fields(payload["attributes"], overrides)
    records: dict[str, dict[str, Any]] = {}
    conflicts = 0
    for record in payload["deposits"]:
        if not isinstance(record, dict):
            continue
        source_id = normalize_guid(record.get(primary_id))
        if not source_id:
            continue
        previous = records.get(source_id)
        if previous is not None and previous != record:
            conflicts += 1
            continue
        records[source_id] = record
    if conflicts:
        raise ValueError(f"Dynamics export contains {conflicts} conflicting duplicate deposits.")
    return DepositExport(
        records=records,
        fields=fields,
        primary_name=str(entity.get("primary_name_attribute") or ""),
        duplicate_conflicts=conflicts,
    )


def parse_field_overrides(values: list[str]) -> dict[str, str]:
    overrides: dict[str, str] = {}
    for value in values:
        target, separator, logical_name = value.partition("=")
        if not separator or target not in FIELD_RULES or not logical_name.strip():
            raise ValueError(
                "--field must use TARGET=LOGICAL_NAME; valid targets: "
                + ", ".join(FIELD_RULES)
            )
        overrides[target] = logical_name.strip()
    return overrides


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_file", type=Path, help="JSON downloaded from Dynamics.")
    parser.add_argument("--apply", action="store_true", help="Commit the displayed updates.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace existing non-default EGCRM values with Dynamics values.",
    )
    parser.add_argument(
        "--field",
        action="append",
        default=[],
        metavar="TARGET=LOGICAL_NAME",
        help="Override automatic Dynamics field detection; may be repeated.",
    )
    return parser.parse_args()


def run(
    json_file: Path,
    apply: bool = False,
    overwrite: bool = False,
    field_overrides: dict[str, str] | None = None,
) -> None:
    export = load_export(json_file, field_overrides)
    exported_details = {
        source_id: details_from_record(record, export.fields)
        for source_id, record in export.records.items()
    }
    db = SessionLocal()
    try:
        rows = db.execute(
            text(
                "SELECT entity_type, source_id, local_id FROM legacy_import_ids "
                "WHERE entity_type IN ('deposit', 'contact') ORDER BY local_id"
            )
        ).all()

        deposit_guids: dict[int, set[str]] = defaultdict(set)
        deposit_ids_by_guid: dict[str, set[int]] = defaultdict(set)
        contact_ids_by_guid: dict[str, set[int]] = defaultdict(set)
        for entity_type, source_id, local_id in rows:
            guid = normalize_guid(source_id)
            if entity_type == "deposit":
                deposit_guids[local_id].add(guid)
                deposit_ids_by_guid[guid].add(local_id)
            else:
                contact_ids_by_guid[guid].add(local_id)

        ambiguous_deposit_guids = [
            guid for guid, local_ids in deposit_ids_by_guid.items() if len(local_ids) > 1
        ]
        if ambiguous_deposit_guids:
            raise RuntimeError(
                "Refusing migration: "
                f"{len(ambiguous_deposit_guids)} Dynamics deposits map to multiple EGCRM deposits."
            )

        contacts_by_name: dict[str, list[int]] = defaultdict(list)
        for contact in db.query(models.Contact).all():
            name = normalized_name(f"{contact.first_name or ''} {contact.last_name or ''}")
            if name:
                contacts_by_name[name].append(contact.id)

        changed_deposits: set[int] = set()
        changed_fields: Counter[str] = Counter()
        counts: Counter[str] = Counter()
        conflicts: list[str] = []
        unresolved_contacts: list[str] = []

        for local_id, guids in deposit_guids.items():
            available = [guid for guid in guids if guid in exported_details]
            if not available:
                counts["missing_from_export"] += 1
                continue
            unique_details = {exported_details[guid] for guid in available}
            selected_guid: str | None = None
            if len(unique_details) == 1:
                selected_guid = available[0]
            else:
                deposit = db.get(models.Deposit, local_id)
                product_name = normalized_name(deposit.product_name if deposit else "")
                name_matches = [
                    guid
                    for guid in available
                    if product_name
                    and normalized_name(export.records[guid].get(export.primary_name))
                    == product_name
                ]
                if len(name_matches) == 1:
                    selected_guid = name_matches[0]
                    counts["duplicate_resolved_by_name"] += 1
                else:
                    conflicts.append(
                        f"{local_id}: {','.join(sorted(available))}"
                    )
                    continue

            deposit = db.get(models.Deposit, local_id)
            if deposit is None:
                counts["missing_deposit"] += 1
                continue
            incoming = exported_details[selected_guid]

            verified_by_contact_id: int | None = None
            if incoming.verified_by_source_id:
                mapped_ids = contact_ids_by_guid.get(incoming.verified_by_source_id, set())
                if len(mapped_ids) == 1:
                    candidate_id = next(iter(mapped_ids))
                    if db.get(models.Contact, candidate_id) is not None:
                        verified_by_contact_id = candidate_id
                if verified_by_contact_id is None and incoming.verified_by_name:
                    name_ids = contacts_by_name.get(normalized_name(incoming.verified_by_name), [])
                    if len(name_ids) == 1:
                        verified_by_contact_id = name_ids[0]
                        counts["contact_resolved_by_name"] += 1
                if verified_by_contact_id is None:
                    counts["unresolved_contact"] += 1
                    if len(unresolved_contacts) < 20:
                        unresolved_contacts.append(
                            f"{deposit.reference_number} | {incoming.verified_by_source_id} | "
                            f"{incoming.verified_by_name}"
                        )

            values = {
                "confirmation_sent": incoming.confirmation_sent,
                "date_confirmation_sent": incoming.date_confirmation_sent,
                "verified_by_contact_id": verified_by_contact_id,
                "is_confirmation_sent": incoming.is_report_sent,
                "date_report_sent": incoming.date_report_sent,
            }
            for field, value in values.items():
                if value is None:
                    counts["blank_source"] += 1
                    continue
                current = getattr(deposit, field)
                if current == value:
                    counts["already_same"] += 1
                    continue
                has_existing_value = current not in (None, False, "")
                if has_existing_value and not overwrite:
                    counts["preserved"] += 1
                    continue
                setattr(deposit, field, value)
                changed_deposits.add(deposit.id)
                changed_fields[field] += 1

        if conflicts:
            db.rollback()
            raise RuntimeError(
                "Refusing migration: conflicting Dynamics values for "
                f"{len(conflicts)} EGCRM deposits. Examples: {'; '.join(conflicts[:10])}"
            )

        if apply:
            db.commit()
        else:
            db.rollback()

        mapped_deposit_guids = set(deposit_ids_by_guid)
        print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
        print(f"Dynamics deposits loaded: {len(export.records)}")
        print(f"Mapped EGCRM deposits scanned: {len(deposit_guids)}")
        print(f"Deposits changed: {len(changed_deposits)}")
        print(f"Fields changed: {sum(changed_fields.values())}")
        print(f"Already identical fields: {counts['already_same']}")
        print(f"Existing values preserved: {counts['preserved']}")
        print(f"Blank Dynamics fields skipped: {counts['blank_source']}")
        print(f"Imported deposits absent from export: {counts['missing_from_export']}")
        print(f"Mappings with missing EGCRM deposit: {counts['missing_deposit']}")
        print(f"Duplicate mappings resolved by product name: {counts['duplicate_resolved_by_name']}")
        print(f"Verified By contacts resolved by name: {counts['contact_resolved_by_name']}")
        print(f"Unresolved Verified By contacts: {counts['unresolved_contact']}")
        print(f"Unrelated Dynamics deposits ignored: {len(set(export.records) - mapped_deposit_guids)}")
        print("\nDetected Dynamics fields")
        for target, attribute in export.fields.items():
            print(
                f"  {target}: {attribute.get('logical_name')} "
                f"({attribute.get('display_name')})"
            )
        print("\nChanges by field")
        for field in FIELD_RULES:
            print(f"  {field}: {changed_fields[field]}")
        if unresolved_contacts:
            print("\nUnresolved Verified By contacts")
            for example in unresolved_contacts:
                print(f"  {example}")
        print("Changes committed." if apply else "Dry run only; no changes were committed.")
    finally:
        db.close()


if __name__ == "__main__":
    arguments = parse_args()
    run(
        arguments.json_file,
        apply=arguments.apply,
        overwrite=arguments.overwrite,
        field_overrides=parse_field_overrides(arguments.field),
    )
