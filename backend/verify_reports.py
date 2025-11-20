import requests
import sys

BASE_URL = "http://localhost:8000"

def login():
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@estoque.com", "password": "1234"})
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def test_endpoints(token):
    headers = {"Authorization": f"Bearer {token}"}
    endpoints = [
        "/reports/abc",
        "/reports/xyz",
        "/reports/turnover",
        "/reports/financial",
        "/reports/forecast"
    ]
    
    for endpoint in endpoints:
        print(f"Testing {endpoint}...", end=" ")
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        if response.status_code == 200:
            print("OK")
            # print(response.json()) # Uncomment to see data
        else:
            print(f"FAILED ({response.status_code})")
            print(response.text)

if __name__ == "__main__":
    try:
        token = login()
        test_endpoints(token)
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Is it running?")
