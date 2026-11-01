import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import crud
import models
import schemas
from migrate_contract_accounts import match_contract_accounts


class ContractAccountLinkTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        models.Base.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(bind=self.engine)

    def test_create_contract_uses_selected_account_names(self):
        with self.session_factory() as db:
            beneficiary = models.Account(name="6 Cross North Ltd")
            supplier = models.Account(name="R.S. Industries Israel")
            db.add_all([beneficiary, supplier])
            db.commit()

            contract = crud.create_contract(
                db,
                schemas.ContractCreate(
                    title="Ignored old title",
                    beneficiary_title="Ignored beneficiary",
                    supplier_title="Ignored supplier",
                    beneficiary_account_id=beneficiary.id,
                    supplier_account_id=supplier.id,
                ),
            )

            self.assertEqual(contract.beneficiary_title, beneficiary.name)
            self.assertEqual(contract.supplier_title, supplier.name)
            self.assertEqual(contract.title, f"{beneficiary.name} - {supplier.name}")

    def test_migration_matches_unique_normalized_names_only(self):
        with self.session_factory() as db:
            beneficiary = models.Account(name="R.S. Industries Israel")
            duplicate_one = models.Account(name="Duplicate Ltd")
            duplicate_two = models.Account(name="Duplicate-Ltd")
            db.add_all([beneficiary, duplicate_one, duplicate_two])
            db.flush()
            matched = models.Contract(
                title="R S Industries Israel - Missing Supplier",
                beneficiary_title="R S Industries Israel",
                supplier_title="Missing Supplier",
            )
            ambiguous = models.Contract(
                title="Duplicate Ltd - Missing Supplier",
                beneficiary_title="Duplicate Ltd",
                supplier_title="Missing Supplier",
            )
            db.add_all([matched, ambiguous])
            db.commit()

            summary = match_contract_accounts(db, apply=True)
            db.refresh(matched)
            db.refresh(ambiguous)

            self.assertEqual(summary.matched, 1)
            self.assertEqual(summary.ambiguous, 1)
            self.assertEqual(matched.beneficiary_account_id, beneficiary.id)
            self.assertEqual(matched.beneficiary_title, beneficiary.name)
            self.assertIsNone(ambiguous.beneficiary_account_id)


if __name__ == "__main__":
    unittest.main()
