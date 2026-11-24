import unittest

import models
from migrations.sync_account_fields_from_json import fill_blank_account_fields


class SyncAccountFieldsFromJsonTests(unittest.TestCase):
    def test_fills_blank_fields_without_overwriting_existing_values(self):
        account = models.Account(
            name="Example",
            website=None,
            phone="local phone",
            street="   ",
            country="Israel",
        )

        changed = fill_blank_account_fields(
            account,
            {
                "website": "https://example.com",
                "phone": "source phone",
                "street": "1 Example Street",
                "city": "",
                "country": "USA",
            },
        )

        self.assertEqual(changed, ["website", "street"])
        self.assertEqual(account.website, "https://example.com")
        self.assertEqual(account.phone, "local phone")
        self.assertEqual(account.street, "1 Example Street")
        self.assertIsNone(account.city)
        self.assertEqual(account.country, "Israel")


if __name__ == "__main__":
    unittest.main()
