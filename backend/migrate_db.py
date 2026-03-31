
import os
from sqlalchemy import text
from database import engine

def migrate():
    SQL_COMMANDS = [
        # 1. Task Types
        """
        CREATE TABLE IF NOT EXISTS task_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """,
        # 2. Activities
        "ALTER TABLE activities ADD COLUMN IF NOT EXISTS task_type_id INT NULL;",
        "ALTER TABLE activities ADD CONSTRAINT fk_activities_task_type FOREIGN KEY (task_type_id) REFERENCES task_types(id);",
        
        # 3. Contracts
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_management_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_technical_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_financial_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_management_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_technical_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_financial_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS paid_by VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';",

        # 4. Deposits
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS version VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS supplier VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS box VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS received_by VARCHAR(255) NULL;"
    ]

    print("Starting database migration...")
    with engine.connect() as connection:
        for cmd in SQL_COMMANDS:
            try:
                print(f"Executing: {cmd.strip().splitlines()[0]}...")
                connection.execute(text(cmd))
                connection.commit()
            except Exception as e:
                print(f"Skipped/Error: {e}")
    
    print("✅ Migration process finished!")

if __name__ == "__main__":
    migrate()
