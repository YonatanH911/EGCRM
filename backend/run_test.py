import requests
import os
import json

base_url = "http://localhost:8000"

# 1. Register or Login
data = {"username": "test3@test.com", "password": "password"}
r = requests.post(f"{base_url}/token", data=data)
if r.status_code != 200:
    print("Login failed!", r.text)
    exit(1)

token = r.json()["access_token"]
print("Got token:", token)

# 2. Try fetching accounts using the token
headers = {"Authorization": f"Bearer {token}"}
r2 = requests.get(f"{base_url}/accounts/", headers=headers)
print("Accounts API response stat:", r2.status_code)
print("Accounts API response:", r2.text)
