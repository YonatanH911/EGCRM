import unittest
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import crud
import models
import schemas


class DepositCreationTests(unittest.TestCase):
    def test_allows_repeated_deposit_numbers(self):
        engine = create_engine("sqlite:///:memory:")
        models.Base.metadata.create_all(engine)
        session_factory = sessionmaker(bind=engine)

        with session_factory() as db:
            confirmation_date = datetime(2026, 10, 26)
            payload = schemas.DepositCreate(
                reference_number="REPEATED-1",
                amount=0,
                confirmation_sent=True,
                date_confirmation_sent=confirmation_date,
            )
            first = crud.create_deposit(db, payload)
            second = crud.create_deposit(db, payload)

            self.assertNotEqual(first.id, second.id)
            self.assertTrue(first.confirmation_sent)
            self.assertEqual(first.date_confirmation_sent, confirmation_date)
            self.assertEqual(
                db.query(models.Deposit)
                .filter(models.Deposit.reference_number == "REPEATED-1")
                .count(),
                2,
            )


if __name__ == "__main__":
    unittest.main()
