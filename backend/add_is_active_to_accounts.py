import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add the current directory to sys.path so we can import local modules
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

def migrate():
    print(f"Connecting to database...")
    try:
        with engine.connect() as conn:
            # Check if column exists
            print("Checking if 'is_active' column exists in 'accounts' table...")
            result = conn.execute(text("SHOW COLUMNS FROM accounts LIKE 'is_active'")).fetchone()
            
            if result:
                print("✅ Column 'is_active' already exists.")
            else:
                print("Adding 'is_active' column to 'accounts' table...")
                conn.execute(text("ALTER TABLE accounts ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
                conn.commit()
                print("✅ Successfully added 'is_active' column.")
                
    except Exception as e:
        print(f"❌ ERROR during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
