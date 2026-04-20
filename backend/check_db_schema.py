import os
import sys
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in .env file.")
    sys.exit(1)

if "mysql" in DATABASE_URL and "charset=" not in DATABASE_URL:
    joiner = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL += f"{joiner}charset=utf8mb4"

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print(f"--- Database Schema Check ---")
for table in ["accounts", "contacts", "contracts", "leads", "activities"]:
    try:
        columns = [c['name'] for c in inspector.get_columns(table)]
        print(f"Table '{table}' columns: {columns}")
    except Exception as e:
        print(f"Table '{table}' could not be inspected: {e}")
