import json
import tempfile
import unittest
from pathlib import Path

from migrate_activity_notes import clean_description, load_descriptions, normalize_guid


class ActivityNotesMigrationTests(unittest.TestCase):
    def test_normalizes_dynamics_guid(self):
        self.assertEqual(
            normalize_guid(" {ABCDEF01-2345-6789-ABCD-EF0123456789} "),
            "abcdef01-2345-6789-abcd-ef0123456789",
        )

    def test_normalizes_description_newlines(self):
        self.assertEqual(clean_description(" First\r\nSecond\r"), "First\nSecond")

    def test_loads_object_export_and_detects_conflicts(self):
        payload = {
            "activities": [
                {"activityid": "{ABC}", "description": "First"},
                {"activityid": "abc", "description": "Different"},
                {"activityid": "DEF", "description": " Second "},
            ]
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "activities.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            descriptions, conflicts = load_descriptions(path)

        self.assertEqual(descriptions, {"abc": "First", "def": "Second"})
        self.assertEqual(conflicts, 1)


if __name__ == "__main__":
    unittest.main()
