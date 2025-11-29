"""
Apply the create_missing_tables.sql migration to Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Missing environment variables")
    exit(1)

# Read the SQL file
with open('create_missing_tables.sql', 'r') as f:
    sql = f.read()

print("📋 SQL Migration to Apply:")
print("=" * 60)
print(sql[:500] + "...\n")
print("=" * 60)

print("\n⚠️  This will create 'reports' and 'alerts' tables in Supabase.")
print("    You need to run this SQL in the Supabase SQL Editor:")
print(f"    👉 https://supabase.com/dashboard/project/{SUPABASE_URL.split('//')[1].split('.')[0]}/sql/new")
print("\n1. Go to Supabase Dashboard > SQL Editor")
print("2. Paste the contents of create_missing_tables.sql")
print("3. Click 'Run'")
print("\n✅ After running, the brain.py will work correctly!")
