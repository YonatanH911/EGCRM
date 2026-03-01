from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
try:
    response = client.post("/users/", json={"name": "test", "email":"test@test.com", "password":"pass", "role":"Sales"})
    print("Status:", response.status_code)
    try:
        print("Response:", response.json())
    except:
        print("Response Body:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
