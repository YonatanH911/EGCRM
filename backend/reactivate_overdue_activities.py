import argparse
from datetime import datetime, timedelta

from database import SessionLocal
from models import Activity


def reactivate_overdue_activities(db, apply=False, now=None):
    cutoff = (now or datetime.now()) - timedelta(days=2)
    candidates = db.query(Activity).filter(
        Activity.is_active.is_(False),
        Activity.due_date.isnot(None),
        Activity.due_date <= cutoff,
    )
    count = candidates.count()

    print(f"Cutoff: {cutoff.isoformat(sep=' ', timespec='seconds')}")
    print(f"Inactive overdue activities found: {count}")
    for activity in candidates.order_by(Activity.due_date.desc()).limit(10):
        print(f"  {activity.id}: {activity.due_date} | {activity.subject}")

    if not apply:
        print("Dry run only; no activities were changed.")
        return count

    changed = candidates.update(
        {Activity.is_active: True},
        synchronize_session=False,
    )
    db.commit()
    print(f"Reactivated activities: {changed}")
    return changed


def main():
    parser = argparse.ArgumentParser(
        description="Reactivate activities matching the removed automatic overdue rule."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Commit the reactivation. Without this flag, the script is a dry run.",
    )
    args = parser.parse_args()

    with SessionLocal() as db:
        reactivate_overdue_activities(db, apply=args.apply)


if __name__ == "__main__":
    main()
