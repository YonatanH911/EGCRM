import urllib.request
import json
import urllib.error

data = json.dumps({'name': 'test', 'email':'test@test.com', 'password':'pass', 'role':'Sales'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/users/', data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("Success:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Error:", e.code)
    print(e.read().decode('utf-8'))
