#!/usr/bin/env python3
"""Seed demo citizen user for testing"""
from tools import supabase

def seed_demo_user():
    """Create demo citizen user if doesn't exist"""
    phone = "9876543210"
    
    # Check if exists
    existing = supabase.table("citizen_users").select("*").eq("phone", phone).execute()
    
    if existing.data:
        print(f"✅ Demo user already exists: {existing.data[0]}")
        return existing.data[0]
    
    # Create user
    user_data = {
        "name": "Demo User",
        "phone": phone,
        "password": "demo123"
    }
    
    result = supabase.table("citizen_users").insert(user_data).execute()
    
    if result.data:
        print(f"✨ Created demo user: {result.data[0]}")
        return result.data[0]
    else:
        print("❌ Failed to create demo user")
        return None

if __name__ == "__main__":
    seed_demo_user()
