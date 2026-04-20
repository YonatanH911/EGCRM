
import sys
import os
from pydantic import ValidationError
import schemas
import models
from database import SessionLocal

def test_pydantic_validation():
    print("--- Testing Pydantic Schema Validation ---")
    
    # Testing ContactCreate with empty email string
    print("Testing ContactCreate with email=''...")
    try:
        contact = schemas.ContactCreate(
            first_name="Test",
            last_name="User",
            email=""  # This should be converted to None by our new BaseSchema validator
        )
        print(f"  Success! Email value: {contact.email} (Type: {type(contact.email)})")
        assert contact.email is None
    except ValidationError as e:
        print(f"  FAILED: Validation error for empty email: {e}")
    except Exception as e:
        print(f"  FAILED: Unexpected error: {e}")

    # Testing AccountCreate with empty industry/website
    print("Testing AccountCreate with empty strings...")
    try:
        account = schemas.AccountCreate(
            name="Test Account",
            industry="",
            website=""
        )
        print(f"  Success! Industry: {account.industry}, Website: {account.website}")
        assert account.industry is None
        assert account.website is None
    except Exception as e:
        print(f"  FAILED: {e}")

def test_database_insert():
    print("\n--- Testing Database Nullability (Dry Run) ---")
    db = SessionLocal()
    try:
        # Create a basic Contact record with missing optional fields
        # This will test if the DB table allows NULL in the 'phone' column
        test_contact = models.Contact(
            first_name="Schema",
            last_name="Test",
            phone=None  # This is the field we explicitly made nullable=True
        )
        db.add(test_contact)
        db.commit()
        db.refresh(test_contact)
        print(f"✅ SUCCESS: DB Inserted Contact with ID {test_contact.id}")
        
        # Cleanup
        db.delete(test_contact)
        db.commit()
        print("✅ Cleanup complete.")
        
    except Exception as e:
        print("\n❌ FAILED DATABASE INSERT:")
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Add backend to path so we can import schemas/models
    sys.path.append(os.getcwd())
    
    test_pydantic_validation()
    test_database_insert()
