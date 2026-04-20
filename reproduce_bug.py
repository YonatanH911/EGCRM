
import requests

BASE_URL = "http://localhost:8000"

def test_create_contact_empty_email():
    print("Testing create contact with empty email string...")
    payload = {
        "first_name": "Test",
        "last_name": "User",
        "email": ""
    }
    # We need a token first, but let's see if we get a 422 even without auth if the schema fails first
    # Actually, Depends(get_current_user) runs before validation? No, Pydantic validation happens first.
    response = requests.post(f"{BASE_URL}/contacts", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    try:
        test_create_contact_empty_email()
    except Exception as e:
        print(f"Error: {e}")
