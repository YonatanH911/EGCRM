import unittest
from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
from reactivate_overdue_activities import reactivate_overdue_activities


class ReactivateOverdueActivitiesTests(unittest.TestCase):
    def test_reactivates_only_inactive_activities_matching_old_rule(self):
        engine = create_engine("sqlite:///:memory:")
        models.Base.metadata.create_all(engine)
        session_factory = sessionmaker(bind=engine)
        now = datetime(2026, 11, 1, 12, 0)

        with session_factory() as db:
            activities = [
                models.Activity(
                    subject="Inactive and overdue",
                    due_date=now - timedelta(days=3),
                    is_active=False,
                ),
                models.Activity(
                    subject="Inactive but recent",
                    due_date=now - timedelta(hours=12),
                    is_active=False,
                ),
                models.Activity(
                    subject="Already active",
                    due_date=now - timedelta(days=3),
                    is_active=True,
                ),
            ]
            db.add_all(activities)
            db.commit()

            changed = reactivate_overdue_activities(db, apply=True, now=now)
            db.expire_all()

            self.assertEqual(changed, 1)
            self.assertTrue(activities[0].is_active)
            self.assertFalse(activities[1].is_active)
            self.assertTrue(activities[2].is_active)


if __name__ == "__main__":
    unittest.main()
