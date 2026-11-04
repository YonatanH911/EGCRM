"""Update contact phone fields from a Dynamics contact Excel export.

The command is a dry run unless ``--apply`` is supplied. It updates only
``phone`` (Business Phone) and ``mobile_phone`` and never clears a populated
CRM value when the corresponding spreadsheet cell is blank.
"""
from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

from import_excel_exports import ExcelImporter, WorkbookRows, clean, split_name


@dataclass
class PhoneImportStats:
    scanned: int = 0
    matched: int = 0
    changed_contacts: int = 0
    business_updates: int = 0
    mobile_updates: int = 0
    unchanged: int = 0
    no_phone_data: int = 0
    skipped: int = 0
    unresolved: int = 0


def update_nonblank(contact, field: str, value: str) -> bool:
    if not value or getattr(contact, field, None) == value:
        return False
    setattr(contact, field, value)
    return True


def import_contact_phones(workbook_path: Path, apply: bool) -> PhoneImportStats:
    importer = ExcelImporter(workbook_path.parent, apply=apply, overwrite=True)
    book = WorkbookRows(workbook_path)
    stats = PhoneImportStats()
    unresolved_examples: list[str] = []

    try:
        importer.load_mappings()
        for row in book.rows():
            stats.scanned += 1
            source_id = clean(book.value(row, "(Do Not Modify) Contact"))
            first, _middle, last = split_name(
                book.value(row, "First Name"),
                book.value(row, "Middle Name"),
                book.value(row, "Last Name"),
                book.value(row, "Full Name"),
            )
            business_phone = clean(book.value(row, "Business Phone"))
            mobile_phone = clean(book.value(row, "Mobile Phone"))
            if not source_id or (not first and not last):
                stats.skipped += 1
                continue
            if not business_phone and not mobile_phone:
                stats.no_phone_data += 1
                continue

            email = clean(book.value(row, "Email"))
            account = importer.account_by_name(book.value(row, "Account"))
            contact = importer.find_contact(
                source_id,
                email,
                first,
                last,
                account.id if account else None,
                business_phone,
            )
            if contact is None:
                stats.unresolved += 1
                if len(unresolved_examples) < 10:
                    name = clean(book.value(row, "Full Name")) or f"{first} {last}".strip()
                    unresolved_examples.append(f"{source_id} | {name} | {email or 'no email'}")
                continue

            stats.matched += 1
            importer.remember("contact", source_id, contact.id)
            business_changed = update_nonblank(contact, "phone", business_phone)
            mobile_changed = update_nonblank(contact, "mobile_phone", mobile_phone)
            stats.business_updates += int(business_changed)
            stats.mobile_updates += int(mobile_changed)
            if business_changed or mobile_changed:
                stats.changed_contacts += 1
            else:
                stats.unchanged += 1

        if apply:
            importer.db.commit()
        else:
            importer.db.rollback()
    except Exception:
        importer.db.rollback()
        raise
    finally:
        book.close()
        importer.close()

    print(f"Workbook: {workbook_path}")
    print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
    print(f"Rows scanned: {stats.scanned}")
    print(f"Contacts matched: {stats.matched}")
    print(f"Contacts changed: {stats.changed_contacts}")
    print(f"Business phone updates: {stats.business_updates}")
    print(f"Mobile phone updates: {stats.mobile_updates}")
    print(f"Already current or blank: {stats.unchanged}")
    print(f"Rows without phone data: {stats.no_phone_data}")
    print(f"Skipped invalid rows: {stats.skipped}")
    print(f"Unresolved contacts: {stats.unresolved}")
    if unresolved_examples:
        print("\nUnresolved examples:")
        for example in unresolved_examples:
            print(f"  {example}")
    print("Changes committed." if apply else "Dry run only; no changes were committed.")
    return stats


def parse_args():
    parser = argparse.ArgumentParser(
        description="Update Business Phone and Mobile Phone from a Dynamics contact export."
    )
    parser.add_argument("workbook", type=Path, help="Path to the contact .xlsx export.")
    parser.add_argument("--apply", action="store_true", help="Commit changes; otherwise dry-run.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    workbook_path = args.workbook.expanduser().resolve()
    if not workbook_path.is_file():
        print(f"Workbook not found: {workbook_path}")
        return 2
    import_contact_phones(workbook_path, args.apply)
    return 0


if __name__ == "__main__":
    sys.exit(main())
