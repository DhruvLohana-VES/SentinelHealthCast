import os
import time
import json
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import google.generativeai as genai

# 1. Setup & Config
load_dotenv()

# Setup Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger("SentinelBrain")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    logger.error("❌ Missing Environment Variables. Check .env")
    exit(1)

# 2. Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_KEY)

# Use Gemini 2.5 Flash (latest model)
model = genai.GenerativeModel('gemini-2.5-flash')

def scan_grid():
    """
    Scans the reports table (used by telegram bot), aggregates by ward, and triggers Gemini analysis
    if a ward has 2 or more reports.
    """
    logger.info("📡 Scanning Grid for outbreaks...")
    
    try:
        # 1. Fetch all reports from the 'reports' table (telegram bot reports)
        # In production, filter by created_at within last 24-48 hours
        try:
            response = supabase.table("reports").select("*").execute()
            reports = response.data
        except Exception as e:
            if "Could not find the table 'public.reports'" in str(e):
                logger.warning("⚠️ 'reports' table not found. Creating it...")
                # The table will be created by create_missing_tables.sql
                # For now, use citizen_reports as fallback
                response = supabase.table("citizen_reports").select("*").execute()
                reports = response.data
                logger.info("   Using 'citizen_reports' instead.")
            else:
                raise e
        
        if not reports:
            logger.info("... No reports found.")
            return

        # 2. Aggregate reports by ward_id
        ward_counts = {}
        ward_reports = {}  # Store actual reports for each ward
        
        for report in reports:
            ward_id = report.get("ward_id")
            if not ward_id:
                continue
                
            ward_counts[ward_id] = ward_counts.get(ward_id, 0) + 1
            if ward_id not in ward_reports:
                ward_reports[ward_id] = []
            ward_reports[ward_id].append(report)

        # 3. Check for outbreaks
        for ward_id, count in ward_counts.items():
            # TRIGGER CONDITION: 2 or more reports
            if count >= 2:
                logger.warning(f"⚠️ OUTBREAK CANDIDATE: Ward {ward_id} has {count} reports.")
                process_outbreak(ward_id, count, ward_reports[ward_id])
            else:
                logger.info(f"Ward {ward_id} stable ({count} reports).")

    except Exception as e:
        logger.error(f"Scan Cycle Error: {e}")

def process_outbreak(ward_id, count, reports_data):
    """
    Uses Gemini to analyze the outbreak and saves the alert to Supabase.
    """
    try:
        # 1. Get Ward Name for context
        try:
            w_res = supabase.table('wards').select('name').eq('id', ward_id).execute()
            ward_name = w_res.data[0]['name'] if w_res.data else f"Zone-{ward_id}"
        except:
            ward_name = f"Zone-{ward_id}"

        # 2. Aggregate report details for AI context
        report_types = [r.get('type', 'Unknown') for r in reports_data]
        avg_severity = sum([r.get('severity', 5) for r in reports_data]) / len(reports_data)
        
        # 3. AI Reasoning
        prompt = f"""
        You are the Mumbai Health Commissioner.
        Ward: {ward_name} (ID: {ward_id})
        Current Status: {count} critical citizen reports
        Report Types: {', '.join(report_types)}
        Average Severity: {avg_severity:.1f}/10
        
        Analyze the disease outbreak risk. Return STRICT JSON:
        {{
            "alert_level": "HIGH" or "CRITICAL",
            "advisory_header": "Short Urgent Title (Max 5 words)",
            "public_message": "One sentence warning for citizens.",
            "action_items": ["Specific Action 1", "Specific Action 2", "Specific Action 3"]
        }}
        """
        
        response = model.generate_content(prompt)
        
        # Clean JSON
        text = response.text.replace('```json', '').replace('```', '').strip()
        plan = json.loads(text)
        
        # 4. Save Alert to DB
        # Check if alerts table exists, if not use dispatch_tickets as fallback
        try:
            alert_payload = {
                "ward_id": ward_id,
                "severity": plan.get('alert_level', 'HIGH'),
                "message": plan.get('advisory_header', 'Outbreak Alert'),
                "action_plan": plan  # Store full JSON in jsonb column
            }
            supabase.table('alerts').insert(alert_payload).execute()
            logger.info(f"✅ ALERT PUBLISHED for {ward_name}: {plan.get('advisory_header')}")
        except Exception as e:
            if "Could not find the table 'public.alerts'" in str(e):
                logger.warning("⚠️ 'alerts' table not found. Using dispatch_tickets instead...")
                # Fallback to dispatch_tickets table
                ticket_payload = {
                    "risk_score": avg_severity,
                    "location": ward_name,
                    "reasoning": f"{plan.get('advisory_header')} - {plan.get('public_message')}",
                    "status": "pending"
                }
                supabase.table('dispatch_tickets').insert(ticket_payload).execute()
                logger.info(f"✅ DISPATCH TICKET CREATED for {ward_name}")
            else:
                raise e

    except json.JSONDecodeError as e:
        logger.error(f"❌ Error parsing JSON from Gemini for Ward {ward_id}: {e}")
        logger.error(f"   Raw response: {response.text if 'response' in locals() else 'N/A'}")
    except Exception as e:
        logger.error(f"❌ AI/DB Error for Ward {ward_id}: {e}")

if __name__ == "__main__":
    logger.info("🧠 Sentinel Brain Service Started...")
    logger.info("   Press Ctrl+C to stop.")
    logger.info("   Scanning every 30 seconds...")
    
    try:
        while True:
            scan_grid()
            time.sleep(30)  # Scan every 30 seconds
    except KeyboardInterrupt:
        logger.info("\n👋 Sentinel Brain shutting down gracefully...")
