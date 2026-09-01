import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

import openpyxl

from import_excel_exports import (
    WorkbookRows,
    activity_type_from_subject,
    normalize_header,
    parse_yes_no,
    split_contract_title,
    split_name,
    unique_unclaimed,
)


class ExcelImportTests(unittest.TestCase):
    def test_normalizes_export_headers(self):
        self.assertEqual(normalize_header("  Israeli? "), "israeli")
        self.assertEqual(normalize_header("(Do Not Modify) Contact"), "do not modify contact")

    def test_preserves_unknown_boolean(self):
        self.assertTrue(parse_yes_no("Yes"))
        self.assertFalse(parse_yes_no("No"))
        self.assertIsNone(parse_yes_no(None))

    def test_uses_full_name_only_when_parts_are_missing(self):
        self.assertEqual(split_name(None, None, None, "Ada Lovelace"), ("Ada", "", "Lovelace"))
        self.assertEqual(split_name("Ada", None, "Lovelace", "Ignored"), ("Ada", "", "Lovelace"))

    def test_splits_contract_parties(self):
        self.assertEqual(
            split_contract_title("6 Cross North - RS Industries"),
            ("6 Cross North", "RS Industries"),
        )

    def test_extracts_activity_type_from_subject(self):
        cases = {
            "Billing - invoice sent": "Billing",
            "BILLING -Customer follow-up": "Billing",
            "Dep req for Clal - FU Ofer": "Dep Req",
            "Dep request Elbit / Simigon": "Dep Req",
            "RONEN - follow up": "Ronen",
            "Termination - old contract": "Termination",
            "Letter of transfer - Enlight": "Letter of transfer",
        }
        for subject, expected in cases.items():
            with self.subTest(subject=subject):
                self.assertEqual(activity_type_from_subject(subject), expected)

    def test_activity_type_is_empty_without_a_recognized_prefix(self):
        self.assertEqual(activity_type_from_subject("General follow-up"), "")

    def test_selects_only_one_unclaimed_contract_candidate(self):
        candidates = [SimpleNamespace(id=1), SimpleNamespace(id=2)]
        self.assertEqual(unique_unclaimed(candidates, {1}).id, 2)
        self.assertIsNone(unique_unclaimed(candidates, set()))
        self.assertIsNone(unique_unclaimed(candidates, {1, 2}))

    def test_reads_values_by_normalized_header(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "contacts.xlsx"
            workbook = openpyxl.Workbook()
            worksheet = workbook.active
            worksheet.append([" Full Name", "Israeli?"])
            worksheet.append(["Ada Lovelace", "Yes"])
            workbook.save(path)
            workbook.close()

            rows = WorkbookRows(path)
            try:
                row = next(rows.rows())
                self.assertEqual(rows.value(row, "Full Name"), "Ada Lovelace")
                self.assertEqual(rows.value(row, "Israeli?"), "Yes")
            finally:
                rows.close()


if __name__ == "__main__":
    unittest.main()
