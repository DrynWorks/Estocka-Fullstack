
import requests
import sys

BASE_URL = "http://localhost:8000"

# Login to get token
def login():
    response = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "admin@estoque.com",
        "password": "1234"
    })
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def test_soft_delete():
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Product
    product_data = {
        "name": "Produto Teste Soft Delete",
        "sku": "SOFT-DEL-001",
        "price": 50.0,
        "cost_price": 30.0,
        "quantity": 10,
        "alert_level": 5,
        "lead_time": 2,
        "category_id": 1
    }
    
    # Check if exists first and delete hard if needed (or just use unique SKU)
    # Since we have soft delete now, we can't easily hard delete via API.
    # We'll use a random SKU suffix to avoid conflicts.
    import random
    suffix = random.randint(1000, 9999)
    product_data["sku"] = f"SOFT-DEL-{suffix}"
    
    print(f"Creating product {product_data['sku']}...")
    response = requests.post(f"{BASE_URL}/products/", json=product_data, headers=headers)
    if response.status_code != 201:
        print(f"Create failed: {response.text}")
        return
    
    product_id = response.json()["id"]
    print(f"Product created with ID: {product_id}")
    
    # 2. Verify it appears in search
    print("Verifying in search...")
    response = requests.get(f"{BASE_URL}/products/search?search={product_data['sku']}", headers=headers)
    products = response.json()
    if not any(p['id'] == product_id for p in products):
        print("❌ Product not found in search before delete!")
        return
    print("✅ Product found in search.")
    
    # 3. Soft Delete
    print("Soft deleting product...")
    response = requests.delete(f"{BASE_URL}/products/{product_id}", headers=headers)
    if response.status_code != 200:
        print(f"Delete failed: {response.text}")
        return
    print("Product deleted.")
    
    # 4. Verify it DOES NOT appear in search
    print("Verifying absence in search...")
    response = requests.get(f"{BASE_URL}/products/search?search={product_data['sku']}", headers=headers)
    products = response.json()
    if any(p['id'] == product_id for p in products):
        print("❌ Product STILL found in search after soft delete!")
    else:
        print("✅ Product NOT found in search after soft delete. Success!")

    # 5. Verify it DOES NOT appear in list
    print("Verifying absence in list...")
    response = requests.get(f"{BASE_URL}/products/", headers=headers)
    products = response.json()
    if any(p['id'] == product_id for p in products):
        print("❌ Product STILL found in list after soft delete!")
    else:
        print("✅ Product NOT found in list after soft delete. Success!")

if __name__ == "__main__":
    test_soft_delete()
