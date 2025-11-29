"""
Generate test reports to trigger brain.py outbreak detection
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Use service role key which bypasses RLS
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')  # This should be the service_role key for testing

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🧪 Generating Test Outbreak Scenario...")

# Get a ward
wards_response = supabase.table('wards').select('id, name').limit(1).execute()
if not wards_response.data:
    print("❌ No wards found. Run complete_schema.sql first!")
    exit(1)

ward = wards_response.data[0]
ward_id = ward['id']
ward_name = ward['name']

print(f"\n📍 Target Ward: {ward_name} (ID: {ward_id})")

# Create 3 test reports in the same ward (triggers outbreak threshold >= 2)
test_reports = [
    {
        'ward_id': ward_id,
        'description': 'Large pile of garbage near residential area. Strong odor.',
        'severity': 8,
        'type': 'Garbage',
        'location': f'POINT(72.835 19.115)',
        'chat_id': 123456789
    },
    {
        'ward_id': ward_id,
        'description': 'Stagnant water accumulated in open drain for 3+ days.',
        'severity': 9,
        'type': 'Stagnant Water',
        'location': f'POINT(72.837 19.117)',
        'chat_id': 987654321
    },
    {
        'ward_id': ward_id,
        'description': 'Overflowing dustbin with rotting waste. Flies and mosquitoes.',
        'severity': 7,
        'type': 'Garbage',
        'location': f'POINT(72.839 19.119)',
        'chat_id': 555555555
    }
]

for i, report in enumerate(test_reports, 1):
    try:
        supabase.table('reports').insert(report).execute()
        print(f"✅ Report {i}/3 created: {report['type']} (Severity {report['severity']})")
    except Exception as e:
        print(f"❌ Report {i} failed: {e}")

print(f"\n🚨 Created 3 critical reports in {ward_name}")
print("⏰ Brain.py will detect this outbreak in the next 30-second scan cycle...")
print("📊 Expected AI Response: HIGH/CRITICAL alert with action items")
print("\n💡 Watch the brain.py terminal for outbreak detection!")
