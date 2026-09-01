
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
        "ALTER TABLE activities ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255) NULL;",
        "ALTER TABLE activities ADD COLUMN IF NOT EXISTS contact_id INT NULL;",
        "ALTER TABLE activities ADD CONSTRAINT fk_activities_contact FOREIGN KEY (contact_id) REFERENCES contacts(id);",
        
        # 3. Accounts
        "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS primary_contact_id INT NULL;",
        "ALTER TABLE accounts ADD CONSTRAINT fk_accounts_primary_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE SET NULL;",

        # 4. Contracts
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_management_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_technical_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_financial_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_management_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_technical_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_financial_contact VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS paid_by VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_title VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_title VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contact_type VARCHAR(50) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_currency VARCHAR(10) DEFAULT 'USD';",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_set_up_fee VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_annual_fee VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_updates VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS beneficiary_ext_verification VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_currency VARCHAR(10) DEFAULT 'USD';",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_set_up_fee VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_annual_fee VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_updates VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_ext_verification VARCHAR(255) NULL;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS description TEXT NULL;",
        "UPDATE contracts SET contact_type = '3-party' WHERE contact_type IS NULL OR contact_type = '';",
        "UPDATE contracts SET beneficiary_currency = currency WHERE (beneficiary_currency IS NULL OR beneficiary_currency = '') AND currency IS NOT NULL;",
        "UPDATE contracts SET beneficiary_currency = 'USD' WHERE beneficiary_currency IS NULL OR beneficiary_currency = '';",
        "UPDATE contracts SET supplier_currency = 'USD' WHERE supplier_currency IS NULL OR supplier_currency = '';",
        "UPDATE contracts SET beneficiary_annual_fee = CAST(value AS CHAR) WHERE (beneficiary_annual_fee IS NULL OR beneficiary_annual_fee = '') AND value IS NOT NULL;",
        """
        UPDATE contracts
        SET
            beneficiary_title = NULLIF(TRIM(SUBSTRING_INDEX(title, ' - ', 1)), ''),
            supplier_title = NULLIF(TRIM(SUBSTRING_INDEX(title, ' - ', -1)), '')
        WHERE (beneficiary_title IS NULL OR supplier_title IS NULL)
          AND title LIKE '% - %';
        """,

        # 5. Deposits
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS version VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS supplier VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS box VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS received_by VARCHAR(255) NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS verified_by_contact_id INT NULL;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS date_report_sent DATETIME NULL;",
        "ALTER TABLE deposits ADD CONSTRAINT fk_deposits_verified_by_contact FOREIGN KEY (verified_by_contact_id) REFERENCES contacts(id) ON DELETE SET NULL;",
        "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS description TEXT NULL;",

        # 6. Active / Inactive records
        "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;",
        "ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;",
        "ALTER TABLE vaults ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;",
        "ALTER TABLE deposits ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;",

        # 7. Stable IDs for repeatable imports from Dynamics Excel exports
        """
        CREATE TABLE IF NOT EXISTS legacy_import_ids (
            entity_type VARCHAR(32) NOT NULL,
            source_id VARCHAR(64) NOT NULL,
            local_id INT NOT NULL,
            PRIMARY KEY (entity_type, source_id),
            INDEX idx_legacy_import_local (entity_type, local_id)
        );
        """
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
