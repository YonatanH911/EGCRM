import unittest
from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import crud
import models


class ActivityAutoDeactivationTests(unittest.TestCase):
    def test_deactivates_only_active_activities_overdue_by_two_days(self):
        engine = create_engine("sqlite:///:memory:")
        models.Base.metadata.create_all(engine)
        session_factory = sessionmaker(bind=engine)
        now = datetime(2026, 10, 26, 12, 0)

        with session_factory() as db:
            activities = [
                models.Activity(subject="At cutoff", due_date=now - timedelta(days=2)),
                models.Activity(subject="Not yet at cutoff", due_date=now - timedelta(days=2) + timedelta(minutes=1)),
                models.Activity(subject="Already inactive", due_date=now - timedelta(days=5), is_active=False),
                models.Activity(subject="No due date", due_date=None),
            ]
            db.add_all(activities)
            db.commit()

            changed = crud.deactivate_overdue_activities(db, now=now)
            db.expire_all()

            self.assertEqual(changed, 1)
            self.assertFalse(activities[0].is_active)
            self.assertTrue(activities[1].is_active)
            self.assertFalse(activities[2].is_active)
            self.assertTrue(activities[3].is_active)


if __name__ == "__main__":
    unittest.main()
