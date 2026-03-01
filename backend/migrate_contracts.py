"""One-time migration: add new columns to the contracts table."""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root@localhost:3306/crm_db")
engine = create_engine(DATABASE_URL)

new_cols = {
    "currency": "VARCHAR(10) DEFAULT 'USD'",
    "beneficiary": "VARCHAR(255)",
    "management_contact": "VARCHAR(255)",
    "technical_contact": "VARCHAR(255)",
    "financial_contact": "VARCHAR(255)",
    "supplier": "VARCHAR(255)",
}

with engine.connect() as conn:
    # Get existing columns
    result = conn.execute(text("SHOW COLUMNS FROM contracts"))
    existing = {row[0] for row in result}
    print(f"Existing columns: {existing}")

    for col, col_def in new_cols.items():
        if col not in existing:
            stmt = f"ALTER TABLE contracts ADD COLUMN {col} {col_def}"
            conn.execute(text(stmt))
            print(f"Added: {col}")
        else:
            print(f"Already exists: {col}")
    conn.commit()

print("Migration complete.")
