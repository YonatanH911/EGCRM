
from sqlalchemy import text
from database import SessionLocal

def cleanup():
    db = SessionLocal()
    try:
        print("Cleaning up database tables...")
        # Disable FK checks to allow truncate/delete in any order
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        tables = ["deposits", "contracts", "leads", "contacts", "accounts"]
        for table in tables:
            print(f"  Clearing {table}...")
            # Use DELETE instead of TRUNCATE for transactions compatibility
            db.execute(text(f"DELETE FROM {table};"))
            db.execute(text(f"ALTER TABLE {table} AUTO_INCREMENT = 1;"))
        
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.commit()
        print("✅ Cleanup complete!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
