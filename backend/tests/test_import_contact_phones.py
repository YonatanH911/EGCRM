import unittest
from types import SimpleNamespace

from import_contact_phones import update_nonblank


class UpdateNonblankTests(unittest.TestCase):
    def test_updates_a_different_nonblank_value(self):
        contact = SimpleNamespace(phone="old")

        changed = update_nonblank(contact, "phone", "new")

        self.assertTrue(changed)
        self.assertEqual(contact.phone, "new")

    def test_preserves_existing_value_when_source_is_blank(self):
        contact = SimpleNamespace(mobile_phone="existing")

        changed = update_nonblank(contact, "mobile_phone", "")

        self.assertFalse(changed)
        self.assertEqual(contact.mobile_phone, "existing")


if __name__ == "__main__":
    unittest.main()
