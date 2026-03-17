import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def main():
    load_dotenv()
    
    db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root@localhost:3306/crm_db")
    
    print(f"Connecting to database to fix charset...")
    engine = create_engine(db_url)
    
    try:
        with engine.connect() as conn:
            # 1. Skip Alter Database (requires root privileges on many systems)
            print("Skipping database-level alter, focusing on tables...")
            
            # 2. Get all tables
            result = conn.execute(text("SHOW TABLES;"))
            tables = [row[0] for row in result]
            
            # 3. Alter each table
            for table in tables:
                print(f"Altering table {table}...")
                conn.execute(text(f"ALTER TABLE {table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
                
            conn.commit()
            print("Database character set successfully converted to utf8mb4 (Hebrew support enabled).")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
