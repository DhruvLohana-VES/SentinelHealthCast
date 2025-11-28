from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents import run_sentinel_agent, run_web_scout_agent
from tools import supabase, get_weather_data, calculate_risk_score, predict_disease_risk, analyze_symptoms, get_hospital_stats, get_citizen_reports, get_health_remedies, analyze_report_credibility, scout_web_for_symptoms
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SentinelHealthCast API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    location: str

class DispatchAction(BaseModel):
    ticket_id: str
    action: str # "approve" or "reject"

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main entry point for the frontend.
    Triggers the Sentinel Agent for a location.
    """
    try:
        result = await run_sentinel_agent(request.location)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dispatch/resume")
async def resume_dispatch(action: DispatchAction):
    """
    Handles the 'Human-in-the-loop' approval.
    """
    try:
        # Update ticket status
        status = "approved" if action.action == "approve" else "rejected"
        
        data = supabase.table("dispatch_tickets")\
            .update({"status": status, "approved_at": "now()"})\
            .eq("id", action.ticket_id)\
            .execute()
            
        if action.action == "approve":
            # TODO: Trigger actual alert dispatch (e.g., Telegram broadcast)
            return {"status": "success", "message": "Dispatch approved. Alerts sending..."}
        else:
            return {"status": "success", "message": "Dispatch rejected."}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """
    Returns aggregated stats for the Official Dashboard.
    """
    try:
        # 1. System Health
        system_health = "Operational"
        
        # 2. Total Reports & Active Alerts
        reports_response = supabase.table("citizen_reports").select("*").execute()
        reports = reports_response.data
        
        # [NEW] Web Scout Integration (Google ADK Agent)
        # Fetch real-time web signals for Mumbai using Gemini Grounding
        web_signals = await run_web_scout_agent("Mumbai")
        
        # Merge Citizen Reports + Web Signals for Analysis
        all_reports_for_analysis = reports + web_signals
        
        reports_count = len(reports) # Only count official DB reports for the counter
        
        pending_tickets = supabase.table("dispatch_tickets").select("*", count="exact").eq("status", "pending").execute().count
        
        # 3. Weather & Risk Analysis (Real-time for Mumbai)
        # Using Andheri coords as proxy for Mumbai
        weather_data = await get_weather_data(19.1136, 72.8697)
        current_weather = weather_data.get("current", {})
        
        # Analyze Symptoms from ALL sources (DB + Web)
        trending_symptoms = analyze_symptoms(all_reports_for_analysis)
        
        # Predict Disease Risk
        disease_forecast = predict_disease_risk(weather_data, trending_symptoms)
        
        # Risk Breakdown
        risk_breakdown = {
            "rain_score": 3.0 if current_weather.get("rain", 0) > 5 else 1.0,
            "humidity_score": 2.0 if current_weather.get("relative_humidity_2m", 0) > 80 else 1.0,
            "social_score": min(reports_count * 0.5, 4.0)
        }

        # 4. Risk Zones (Comprehensive Mumbai Areas)
        risk_zones = [
            {"name": "Colaba", "risk_score": 6.5, "lat": 18.9067, "lng": 72.8147, "status": "CAUTION"},
            {"name": "Fort", "risk_score": 5.8, "lat": 18.9322, "lng": 72.8328, "status": "SAFE"},
            {"name": "Marine Lines", "risk_score": 4.5, "lat": 18.9447, "lng": 72.8244, "status": "SAFE"},
            {"name": "Malabar Hill", "risk_score": 3.2, "lat": 18.9548, "lng": 72.7985, "status": "SAFE"},
            {"name": "Worli", "risk_score": 7.1, "lat": 19.0166, "lng": 72.8172, "status": "CAUTION"},
            {"name": "Dadar", "risk_score": 4.2, "lat": 19.0178, "lng": 72.8478, "status": "SAFE"},
            {"name": "Bandra West", "risk_score": 3.1, "lat": 19.0596, "lng": 72.8295, "status": "SAFE"},
            {"name": "Bandra East", "risk_score": 5.5, "lat": 19.0625, "lng": 72.8437, "status": "SAFE"},
            {"name": "Santacruz", "risk_score": 6.2, "lat": 19.0843, "lng": 72.8360, "status": "CAUTION"},
            {"name": "Andheri East", "risk_score": 8.7, "lat": 19.1136, "lng": 72.8697, "status": "CRITICAL"},
            {"name": "Andheri West", "risk_score": 7.5, "lat": 19.1197, "lng": 72.8305, "status": "CAUTION"},
            {"name": "Juhu", "risk_score": 4.8, "lat": 19.1075, "lng": 72.8263, "status": "SAFE"},
            {"name": "Goregaon", "risk_score": 6.9, "lat": 19.1663, "lng": 72.8526, "status": "CAUTION"},
            {"name": "Malad", "risk_score": 7.2, "lat": 19.1874, "lng": 72.8484, "status": "CAUTION"},
            {"name": "Kandivali", "risk_score": 5.4, "lat": 19.2047, "lng": 72.8520, "status": "SAFE"},
            {"name": "Borivali", "risk_score": 4.1, "lat": 19.2307, "lng": 72.8567, "status": "SAFE"},
            {"name": "Dahisar", "risk_score": 3.8, "lat": 19.2575, "lng": 72.8591, "status": "SAFE"},
            {"name": "Kurla", "risk_score": 8.2, "lat": 19.0726, "lng": 72.8793, "status": "CRITICAL"},
            {"name": "Ghatkopar", "risk_score": 7.6, "lat": 19.0860, "lng": 72.9090, "status": "CAUTION"},
            {"name": "Vikhroli", "risk_score": 6.1, "lat": 19.1119, "lng": 72.9278, "status": "CAUTION"},
            {"name": "Powai", "risk_score": 7.8, "lat": 19.1197, "lng": 72.9051, "status": "CAUTION"},
            {"name": "Mulund", "risk_score": 4.5, "lat": 19.1726, "lng": 72.9425, "status": "SAFE"},
            {"name": "Chembur", "risk_score": 5.9, "lat": 19.0522, "lng": 72.8999, "status": "SAFE"},
            {"name": "Sion", "risk_score": 8.5, "lat": 19.0390, "lng": 72.8619, "status": "CRITICAL"},
        ]
        
        return {
            "system_health": system_health,
            "total_reports": reports_count,
            "active_alerts": pending_tickets,
            "risk_zones": risk_zones,
            "weather_details": {
                "rain": current_weather.get("rain", 0),
                "humidity": current_weather.get("relative_humidity_2m", 0),
                "temp": current_weather.get("temperature_2m", 0)
            },
            "risk_breakdown": risk_breakdown,
            "disease_forecast": disease_forecast,
            "symptom_trends": trending_symptoms
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        # Return fallback data if DB fails
        return {
            "system_health": "Degraded",
            "total_reports": 0,
            "active_alerts": 0,
            "risk_zones": [],
            "weather_details": {},
            "risk_breakdown": {},
            "disease_forecast": [],
            "symptom_trends": []
        }

@app.post("/api/login")
async def login(request: LoginRequest):
    """
    Simple login for hospitals.
    """
    try:
        response = supabase.table("hospitals").select("*").eq("username", request.username).eq("password", request.password).execute()
        if len(response.data) > 0:
            return {"status": "success", "hospital": response.data[0]}
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/citizen/signup")
async def citizen_signup(request: Request):
    """
    Registers a new citizen user.
    """
    data = await request.json()
    name = data.get("name")
    phone = data.get("phone")
    password = data.get("password")
    
    if not name or not phone or not password:
        raise HTTPException(status_code=400, detail="Missing fields")
        
    # Check if user exists
    existing = supabase.table("citizen_users").select("*").eq("phone", phone).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User already exists")
        
    # Create user
    user_data = {
        "name": name,
        "phone": phone,
        "password": password # Plaintext for hackathon
    }
    response = supabase.table("citizen_users").insert(user_data).execute()
    
    if response.data:
        return {"status": "success", "user": response.data[0]}
    raise HTTPException(status_code=500, detail="Failed to create user")

@app.post("/api/citizen/login")
async def citizen_login(request: Request):
    """
    Authenticates a citizen user.
    """
    data = await request.json()
    phone = data.get("phone")
    password = data.get("password")
    
    if not phone or not password:
        raise HTTPException(status_code=400, detail="Missing credentials")
        
    # Verify credentials
    response = supabase.table("citizen_users").select("*").eq("phone", phone).eq("password", password).execute()
    
    if response.data:
        return {"status": "success", "user": response.data[0]}
    
    raise HTTPException(status_code=401, detail="Invalid phone or password")

@app.get("/api/citizen/stats")
async def citizen_stats(lat: float = None, lon: float = None, location: str = None):
    """
    Returns personalized stats for a citizen based on GPS or selected location.
    """
    try:
        # 1. Determine Location & Coords
        target_location = location if location else "Mumbai"
        target_lat = lat if lat else 19.0760
        target_lon = lon if lon else 72.8777
        
        # If we have GPS but no name, we might want to reverse geocode, 
        # but for now we'll rely on the frontend sending a name or defaulting to "Current Location"
        if not location and lat:
             target_location = "Current Location"

        # 2. Get Weather & AQI
        weather_data = await get_weather_data(target_lat, target_lon)
        
        # 3. Get Web Signals (Web Scout)
        # Note: Web Scout needs a text location name to search news.
        # If "Current Location", we might miss news unless we reverse geocode.
        # For hackathon, if generic, maybe search "Mumbai" as fallback?
        search_query_location = target_location if target_location != "Current Location" else "Mumbai"
        web_signals = await run_web_scout_agent(search_query_location)
        
        # 4. Aggregate Symptoms
        citizen_reports = supabase.table("citizen_reports").select("*").ilike("location", f"%{search_query_location}%").execute().data
        
        web_reports = [{"description": s} for s in web_signals if isinstance(s, str)]
        if web_signals and isinstance(web_signals[0], dict):
             web_reports = web_signals
             
        all_reports = citizen_reports + web_reports
        trending_symptoms = analyze_symptoms(all_reports)
        
        # 5. Calculate Risk Score
        report_count = len(citizen_reports)
        risk_score = calculate_risk_score(weather_data, report_count)
        
        # 6. Predict Disease Outbreaks
        disease_risks = predict_disease_risk(weather_data, trending_symptoms)
        
        # 7. Get Remedies
        remedies = get_health_remedies(risk_score, trending_symptoms)
        
        return {
            "location": target_location,
            "risk_score": risk_score,
            "status": "CRITICAL" if risk_score > 7 else "CAUTION" if risk_score > 4 else "SAFE",
            "weather": weather_data.get("current", {}),
            "trending_symptoms": trending_symptoms,
            "disease_risks": disease_risks,
            "remedies": remedies
        }
    except Exception as e:
        print(f"Error in citizen_stats: {e}")
        return {"error": str(e)}

@app.get("/api/hospital/stats")
async def hospital_stats(location: str):
    """
    Returns specific stats for a hospital's region.
    """
    try:
        # Get Weather for this specific location (using Andheri as proxy if needed, or lookup coords)
        # For hackathon, we'll use the generic weather but specific risk logic
        weather_data = await get_weather_data(19.1136, 72.8697)
        
        # Get Local Stats
        local_stats = get_hospital_stats(location)
        
        # Get Web Signals for this location (Google Agent)
        web_signals = await run_web_scout_agent(location)
        
        print(f"DEBUG: Weather Data for {location}: {weather_data}") # Debug print
        
        # [NEW] Aggregate Symptoms (Telegram + Web)
        all_reports = get_citizen_reports(location)
        verified_reports = [r for r in all_reports if r.get("verified")]
        
        # Convert web signals to report format for analysis
        web_reports = [{"description": s} for s in web_signals if isinstance(s, str)]
        if web_signals and isinstance(web_signals[0], dict):
             web_reports = web_signals
             
        combined_reports = all_reports + web_reports
        trending_symptoms = analyze_symptoms(combined_reports)
        
        # Calculate Dynamic Risk Score
        risk_score = calculate_risk_score(weather_data, len(all_reports), len(verified_reports))
        
        # Update local_stats with dynamic risk
        local_stats["risk_score"] = risk_score
        local_stats["status"] = "CRITICAL" if risk_score > 7 else "CAUTION" if risk_score > 4 else "SAFE"
        local_stats["predicted_cases"] = int(risk_score * 15)
        
        # [NEW] Disease Prediction
        disease_risks = predict_disease_risk(weather_data, trending_symptoms)
        
        return {
            "weather": weather_data.get("current", {}),
            "local_stats": local_stats,
            "web_signals": web_signals,
            "trending_symptoms": trending_symptoms,
            "disease_risks": disease_risks
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

@app.get("/api/bmc/stats")
async def bmc_stats():
    """
    Returns high-level stats for BMC Headquarters (Ward-wise breakdown).
    """
    try:
        # 1. Define Wards (Mocked for Hackathon, mapped to Areas)
        wards = [
            {"id": "A", "name": "Colaba", "lat": 18.9067, "lng": 72.8147},
            {"id": "D", "name": "Malabar Hill", "lat": 18.9548, "lng": 72.7985},
            {"id": "G/N", "name": "Dadar", "lat": 19.0178, "lng": 72.8478},
            {"id": "H/W", "name": "Bandra West", "lat": 19.0596, "lng": 72.8295},
            {"id": "K/E", "name": "Andheri East", "lat": 19.1136, "lng": 72.8697},
            {"id": "K/W", "name": "Andheri West", "lat": 19.1197, "lng": 72.8305},
            {"id": "L", "name": "Kurla", "lat": 19.0726, "lng": 72.8793},
            {"id": "S", "name": "Powai", "lat": 19.1197, "lng": 72.9051},
            {"id": "F/N", "name": "Sion", "lat": 19.0390, "lng": 72.8619}
        ]
        
        ward_stats = []
        
        for ward in wards:
            # Get Reports for Ward
            reports = get_citizen_reports(ward["name"])
            verified = [r for r in reports if r.get("verified")]
            
            # Get Weather (Mocked/Shared)
            weather = await get_weather_data(ward["lat"], ward["lng"])
            
            # Calculate Risk
            risk = calculate_risk_score(weather, len(reports), len(verified))
            
            # Determine Status & Action Plan
            status = "SAFE"
            action_plan = "Routine Monitoring"
            
            if risk > 8.0:
                status = "CRITICAL"
                action_plan = "🚨 Deploy Fogging Trucks + Medical Camps"
            elif risk > 6.0:
                status = "HIGH"
                action_plan = "⚠️ Increase Surveillance + Anti-Larval Treatment"
            elif risk > 4.0:
                status = "CAUTION"
                action_plan = "📢 Public Awareness Campaign"
                
            ward_stats.append({
                "ward_id": ward["id"],
                "name": ward["name"],
                "risk_score": risk,
                "total_cases": len(reports),
                "verified_cases": len(verified),
                "status": status,
                "action_plan": action_plan,
                "lat": ward["lat"],
                "lng": ward["lng"]
            })
            
        # Sort by Risk Score (Descending)
        ward_stats.sort(key=lambda x: x["risk_score"], reverse=True)
            
        return {
            "system_status": "Active",
            "total_wards": len(wards),
            "critical_wards": len([w for w in ward_stats if w["status"] == "CRITICAL"]),
            "ward_details": ward_stats
        }
        
    except Exception as e:
        print(f"Error in BMC stats: {e}")
        return {"error": str(e)}

@app.post("/api/citizen/report")
async def citizen_report(request: Request):
    """
    Submits a new citizen report.
    """
    data = await request.json()
    user_id = data.get("user_id") # Optional if we had auth middleware
    location = data.get("location")
    description = data.get("description")
    
    if not location or not description:
        raise HTTPException(status_code=400, detail="Missing fields")
        
    report_data = {
        "location": location,
        "description": description,
        "verified": False
        # "user_id": user_id # If we linked to profiles
    }
    
    response = supabase.table("citizen_reports").insert(report_data).execute()
    return {"status": "success", "report": response.data[0]}

@app.get("/api/reports/pending")
async def get_pending_reports():
    """
    Returns unverified reports with AI credibility analysis.
    """
    # Fetch pending reports
    reports = supabase.table("citizen_reports").select("*").eq("verified", False).execute().data
    
    results = []
    for report in reports:
        # Fetch weather for report location (Mocking coords for now or using generic Mumbai)
        # In real app, we'd geocode report['location']
        weather_data = await get_weather_data(19.0760, 72.8777) 
        
        # Calculate Risk Score (Quick calc)
        risk_score = calculate_risk_score(weather_data, 10) # Mock count
        
        # Analyze Credibility
        analysis = analyze_report_credibility(report["description"], weather_data.get("current", {}), risk_score)
        
        results.append({
            **report,
            "ai_analysis": analysis
        })
        
    return results

@app.post("/api/reports/verify")
async def verify_report(request: Request):
    """
    Approves or Rejects a report.
    """
    data = await request.json()
    report_id = data.get("id")
    action = data.get("action") # 'approve' or 'reject'
    
    if action == 'approve':
        supabase.table("citizen_reports").update({"verified": True}).eq("id", report_id).execute()
        return {"status": "approved"}
    elif action == 'reject':
        supabase.table("citizen_reports").delete().eq("id", report_id).execute()
        return {"status": "rejected"}
        
    return {"status": "error"}

@app.post("/api/telegram-webhook")
async def telegram_webhook(request: Request):
    """
    Receives updates from Telegram.
    """
    data = await request.json()
    print(f"📩 Telegram Update: {data}")
    
    # Simple logic to save citizen report if it's a message
    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")
        # Check for photo? For now just text.
        
        # Save to citizen_reports (simplified)
        # In real app, we'd link to a user profile
        report = {
            "location": "Unknown (Telegram)", # Needs parsing or location sharing
            "description": text,
            "verified": False
        }
        # supabase.table("citizen_reports").insert(report).execute()
        
    return {"status": "ok"}

@app.get("/")
def health_check():
    return {"status": "SentinelHealthCast Brain is Active"}
