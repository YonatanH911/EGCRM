import unittest
from datetime import datetime

from pydantic import ValidationError

import models
import schemas


class ContactSchemaTests(unittest.TestCase):
    def test_response_preserves_legacy_invalid_email_text(self):
        contact = models.Contact(
            id=1,
            first_name="Legacy",
            last_name="Contact",
            email="legacy@example.com.",
            is_active=True,
            created_at=datetime(2026, 1, 1),
        )

        response = schemas.ContactResponse.model_validate(contact)

        self.assertEqual(response.email, "legacy@example.com.")

    def test_create_still_rejects_invalid_email_text(self):
        with self.assertRaises(ValidationError):
            schemas.ContactCreate(
                first_name="New",
                last_name="Contact",
                email="invalid@example.com.",
            )


if __name__ == "__main__":
    unittest.main()
