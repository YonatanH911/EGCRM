
import sys
import os
from sqlalchemy import text
from database import engine

def cleanup():
    print("--- Database Schema Cleanup ---")
    with engine.connect() as conn:
        # Check if we are using MySQL/MariaDB
        dialect = engine.url.get_dialect().name
        
        # 1. Cleanup accounts table (is_active)
        print(f"Checking 'accounts' table ({dialect})...")
        if dialect == "mysql":
            try:
                conn.execute(text("ALTER TABLE accounts DROP COLUMN is_active"))
                print("  Successfully dropped 'is_active' from 'accounts'.")
            except Exception as e:
                if "check that column/key exists" in str(e).lower() or "can't drop" in str(e).lower():
                    print("  'is_active' column does not exist in 'accounts' (skipping).")
                else:
                    print(f"  Error dropping 'is_active': {e}")
        elif dialect == "sqlite":
            print("  SQLite detected. SQLite does not support DROP COLUMN directly. ")
            print("  However, SQLAlchemy models will ignore extra columns. No action taken.")

        # 2. Cleanup contacts table (supplier)
        print(f"Checking 'contacts' table...")
        if dialect == "mysql":
            try:
                conn.execute(text("ALTER TABLE contacts DROP COLUMN supplier"))
                print("  Successfully dropped 'supplier' from 'contacts'.")
            except Exception as e:
                if "check that column/key exists" in str(e).lower() or "can't drop" in str(e).lower():
                    print("  'supplier' column does not exist in 'contacts' (skipping).")
                else:
                    print(f"  Error dropping 'supplier': {e}")
        
        conn.commit()
    print("--- Cleanup Complete ---")

if __name__ == "__main__":
    cleanup()
