import requests
import json
import jwt
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000/api"

def test_endpoint():
    print("Testing /patients without token...")
    r = requests.get(f"{BASE_URL}/patients")
    print(f"Status: {r.status_code}") # Should be 401

    print("\nTesting login...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@hmeps.io", "password": "admin123"})
    if r.status_code == 200:
        print("Login successful.")
        token = r.json()["token"]
    else:
        print(f"Login failed: {r.status_code} - {r.text}")
        return

    print("\nTesting /patients with admin token...")
    r = requests.get(f"{BASE_URL}/patients", headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {r.status_code}") # Should be 200

    print("\nTesting invalid token...")
    r = requests.get(f"{BASE_URL}/patients", headers={"Authorization": "Bearer invalid.token.here"})
    print(f"Status: {r.status_code}") # Should be 401

    print("\nTesting expired token...")
    payload = {
        "user_id": "admin-001",
        "email": "admin@hmeps.io",
        "role": "ADMIN",
        "exp": datetime.utcnow() - timedelta(hours=1)
    }
    expired_token = jwt.encode(payload, "dev-jwt-secret", algorithm="HS256")
    r = requests.get(f"{BASE_URL}/patients", headers={"Authorization": f"Bearer {expired_token}"})
    print(f"Status: {r.status_code}") # Should be 401
    
    print("\nCreating DOCTOR user...")
    r = requests.post(f"{BASE_URL}/users", headers={"Authorization": f"Bearer {token}"}, json={
        "name": "Test Doctor",
        "email": "doctor@hmeps.io",
        "password": "docpassword123",
        "role": "DOCTOR",
        "department": "Clinical"
    })
    if r.status_code == 201:
        doc_user_id = r.json()["user"]["user_id"]
    else:
        # User might already exist from a previous run
        doc_user_id = "doc-001"
        
    print("\nLogging in as DOCTOR to get token...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "doctor@hmeps.io", "password": "docpassword123"})
    if r.status_code == 200:
        doctor_token = r.json()["token"]
    else:
        print(f"Doctor login failed: {r.status_code}")
        return
        
    print("Testing /users with DOCTOR token (should be 403)...")
    r = requests.get(f"{BASE_URL}/users", headers={"Authorization": f"Bearer {doctor_token}"})
    print(f"Status: {r.status_code}") # Should be 403
    
    print("\nTesting /patients with DOCTOR token (should be 200)...")
    r = requests.get(f"{BASE_URL}/patients", headers={"Authorization": f"Bearer {doctor_token}"})
    print(f"Status: {r.status_code}") # Should be 200
    
    print("\nCreating NURSE user...")
    r = requests.post(f"{BASE_URL}/users", headers={"Authorization": f"Bearer {token}"}, json={
        "name": "Test Nurse",
        "email": "nurse@hmeps.io",
        "password": "nursepassword123",
        "role": "NURSE",
        "department": "Nursing"
    })
    
    print("\nLogging in as NURSE to get token...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "nurse@hmeps.io", "password": "nursepassword123"})
    if r.status_code == 200:
        nurse_token = r.json()["token"]
    else:
        print(f"Nurse login failed: {r.status_code}")
        return

    print("Testing /patients/<id>/delete with NURSE token (should be 403)...")
    r = requests.delete(f"{BASE_URL}/patients/123", headers={"Authorization": f"Bearer {nurse_token}"})
    print(f"Status: {r.status_code}") # Should be 403

if __name__ == '__main__':
    test_endpoint()
