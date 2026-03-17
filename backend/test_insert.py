import sys
import os
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import traceback

def test_insert():
    print("Attempting to insert a test Vault...")
    db = SessionLocal()
    try:
        # Create a basic Vault record
        test_vault = models.Vault(
            name="Debug Test Vault",
            location="Debug Location",
            capacity="10",
            status=models.VaultStatus.OPEN
        )
        db.add(test_vault)
        db.commit()
        db.refresh(test_vault)
        print(f"✅ SUCCESS: Inserted Vault with ID {test_vault.id}")
        
        # Clean it up immediately so we don't pollute the production database
        db.delete(test_vault)
        db.commit()
        print("✅ Cleanup complete.")
        
    except Exception as e:
        print("\n❌ FAILED TO INSERT VAULT:")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        print("\n--- Full Traceback ---")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_insert()
