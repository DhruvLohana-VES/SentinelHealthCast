import os
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import math

# Load .env from the same directory as this file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Supabase Setup
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

async def get_weather_data(latitude: float, longitude: float):
    """
    Fetches current weather and AQI from Open-Meteo.
    """
    weather_url = "https://api.open-meteo.com/v1/forecast"
    weather_params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["temperature_2m", "relative_humidity_2m", "rain", "precipitation"],
        "forecast_days": 1
    }
    
    aqi_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    aqi_params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["us_aqi", "pm2_5"]
    }
    
    async with httpx.AsyncClient() as client:
        weather_response = await client.get(weather_url, params=weather_params)
        aqi_response = await client.get(aqi_url, params=aqi_params)
        
        data = weather_response.json()
        aqi_data = aqi_response.json()
        
        # Merge AQI into data
        if "current" in data and "current" in aqi_data:
            data["current"]["us_aqi"] = aqi_data["current"].get("us_aqi", 0)
            data["current"]["pm2_5"] = aqi_data["current"].get("pm2_5", 0.0)
            
    return data

def calculate_risk_score(weather_data: dict, report_count: int, verified_count: int = 0) -> float:
    """
    Deterministic formula to calculate risk score (0-10).
    See risk_logic.md for epidemiological proofs.
    
    Formula: R = min(10, E_rain + E_humid + S_reports + V_verified + Base)
    """
    score = 0.0
    
    # 1. Weather Factors (Source: Open-Meteo)
    current = weather_data.get("current", {})
    rain = current.get("rain", 0.0)
    humidity = current.get("relative_humidity_2m", 0)
    
    # E_rain: Rainfall Risk (Vector: Stagnant Water)
    # Proof: >5mm creates pockets for breeding. >10mm might wash out but leaves residue.
    if rain > 10.0:
        score += 2.0 # Washout effect, slightly lower immediate risk
    elif rain > 5.0:
        score += 3.0 # Peak breeding risk
    elif rain > 0.0:
        score += 1.0 # Wet surface
        
    # E_humid: Humidity Risk (Vector: Survival Rate)
    # Proof: >70% extends mosquito lifespan and viral incubation.
    if humidity > 80:
        score += 2.0
    elif humidity > 60:
        score += 1.0
        
    # 2. Social Signal (S_reports)
    # Proof: Cluster analysis of citizen reports.
    # Each report adds 0.5 risk, capped at 4.0 (8 reports max out this factor)
    report_risk = min(report_count * 0.5, 4.0)
    score += report_risk

    # 3. Verified Reports Signal (V_verified)
    # Verified reports carry double the weight of unverified ones.
    verified_risk = min(verified_count * 1.0, 5.0)
    score += verified_risk
    
    # 4. Base Risk (Endemic Factor)
    score += 1.0
    
    return min(score, 10.0)

def predict_disease_risk(weather_data: dict, symptoms: list) -> list:
    """
    Predicts potential diseases based on weather patterns and reported symptoms.
    """
    risks = []
    current = weather_data.get("current", {})
    rain = current.get("rain", 0.0)
    humidity = current.get("relative_humidity_2m", 0)
    
    # Symptom Keywords
    symptom_text = " ".join(symptoms).lower()
    
    # 1. Dengue Risk
    # High humidity + Rain + High Fever/Joint Pain
    dengue_score = 0
    if humidity > 70: dengue_score += 1
    if rain > 5: dengue_score += 1
    if "fever" in symptom_text: dengue_score += 1
    if "joint" in symptom_text or "bone" in symptom_text: dengue_score += 2
    
    if dengue_score >= 3:
        risks.append({"disease": "Dengue", "probability": "High", "vector": "Aedes Mosquito"})
    elif dengue_score >= 1:
        risks.append({"disease": "Dengue", "probability": "Moderate", "vector": "Aedes Mosquito"})

    # 2. Malaria Risk
    # Stagnant water (Rain) + Chills/Sweating
    malaria_score = 0
    if rain > 10: malaria_score += 2
    if "chills" in symptom_text: malaria_score += 2
    if "sweat" in symptom_text: malaria_score += 1
    
    if malaria_score >= 3:
        risks.append({"disease": "Malaria", "probability": "High", "vector": "Anopheles Mosquito"})
        
    # 3. Leptospirosis Risk
    # Heavy Rain (Flooding) + Muscle Pain
    lepto_score = 0
    if rain > 20: lepto_score += 3
    if "muscle" in symptom_text or "calf" in symptom_text: lepto_score += 2
    
    if lepto_score >= 3:
        risks.append({"disease": "Leptospirosis", "probability": "High", "vector": "Contaminated Water"})

    return risks

def analyze_symptoms(reports: list) -> dict:
    """
    Extracts and counts symptoms from a list of report descriptions.
    """
    symptoms = {
        "fever": 0,
        "joint pain": 0,
        "chills": 0,
        "cough": 0,
        "headache": 0,
        "rash": 0,
        "nausea": 0
    }
    
    for report in reports:
        text = report.get("description", "").lower()
        for symptom in symptoms:
            if symptom in text:
                symptoms[symptom] += 1
                
    # Return top 3 trending
    sorted_symptoms = sorted(symptoms.items(), key=lambda x: x[1], reverse=True)[:3]
    return [s[0] for s in sorted_symptoms if s[1] > 0]

def create_dispatch_ticket(location: str, risk_score: float, reasoning: str):
    """
    Creates a dispatch ticket in Supabase. This acts as the 'Pause' mechanism.
    """
    data = {
        "location": location,
        "risk_score": float(risk_score),
        "reasoning": reasoning,
        "status": "pending"
    }
    response = supabase.table("dispatch_tickets").insert(data).execute()
    return response.data

    return response.data

def get_citizen_reports(location: str, verified_only: bool = False):
    """
    Fetches recent citizen reports for a location.
    """
    query = supabase.table("citizen_reports").select("*").ilike("location", f"%{location}%")
    
    if verified_only:
        query = query.eq("verified", True)
        
    response = query.execute()
    return response.data

from duckduckgo_search import DDGS

def scout_web_for_symptoms(location: str) -> list:
    """
    Uses DuckDuckGo to find real-time symptom reports from the web (Twitter/X, News).
    """
    print(f"🕵️ Web Scout: Searching for health trends in {location}...")
    results = []
    queries = [
        f"dengue cases in {location} twitter",
        f"fever outbreak {location} news",
        f"malaria symptoms {location} recent"
    ]
    
    try:
        with DDGS() as ddgs:
            for query in queries:
                # Get top 3 results per query, filtered by past month (30 days)
                search_results = list(ddgs.text(query, max_results=3, time='m'))
                for r in search_results:
                    results.append({"description": r['body']}) # Format like a citizen report
                    
        print(f"   - Found {len(results)} web signals.")
        return results
    except Exception as e:
        print(f"⚠️ Web Scout Error: {e}")
        return []

def get_hospital_stats(location: str):
    """
    Generates readiness checklist and stats for a specific hospital location.
    """
    # 1. Get Local Risk Score (Mocked logic based on location for now)
    # In real app, query specific grid cell
    risk_score = 4.5 # Default
    if "Andheri" in location: risk_score = 8.7
    elif "Bandra" in location: risk_score = 3.1
    elif "Powai" in location: risk_score = 7.8
    
    # 2. Generate Readiness Checklist based on Risk
    checklist = []
    if risk_score > 7.0:
        checklist = [
            "⚠️ Activate Dengue Isolation Ward",
            "🩸 Stock up on Platelet Kits (Type O+ High Demand)",
            "🦟 Fogging in 5km radius requested",
            "🚑 Increase Ambulance standby for night shift"
        ]
    elif risk_score > 4.0:
        checklist = [
            "⚠️ Monitor Fever OPD cases",
            "🧪 Ensure Rapid Test Kit availability"
        ]
    else:
        checklist = [
            "✅ Routine Monitoring",
            "📢 Conduct Awareness Camp"
        ]
        
    return {
        "location": location,
        "risk_score": risk_score,
        "status": "CRITICAL" if risk_score > 7 else "CAUTION" if risk_score > 4 else "SAFE",
        "checklist": checklist,
        "predicted_cases": int(risk_score * 15) # Mock prediction
    }

def get_health_remedies(risk_score: float, symptoms: list) -> list:
    """
    Provides actionable health remedies based on risk score and symptoms.
    """
    remedies = []
    
    # Risk-based Remedies
    if risk_score > 7.0:
        remedies.append("🚫 Avoid outdoor activities during dawn and dusk (mosquito peak hours).")
        remedies.append("👕 Wear full-sleeved clothing to prevent mosquito bites.")
        remedies.append("💧 Ensure no stagnant water around your home.")
    elif risk_score > 4.0:
        remedies.append("🧴 Use mosquito repellent when going outside.")
        remedies.append("👀 Keep an eye out for fever or joint pain symptoms.")
    else:
        remedies.append("✅ Maintain general hygiene and cleanliness.")
        
    # Symptom-based Remedies
    symptom_text = " ".join(symptoms).lower()
    if "fever" in symptom_text:
        remedies.append("💊 Paracetamol can help with fever (Consult a doctor).")
        remedies.append("🥤 Stay hydrated; drink plenty of fluids.")
    if "cough" in symptom_text:
        remedies.append("🍯 Warm water with honey can soothe a throat.")
    if "joint" in symptom_text:
        remedies.append("🛌 Rest is crucial for joint pain recovery.")
    if "rash" in symptom_text:
        remedies.append("❄️ Apply cool compresses to soothe rashes.")
        
    return list(set(remedies)) # Deduplicate

def analyze_report_credibility(report_type: str, weather: dict, risk_score: float) -> dict:
    """
    Analyzes the credibility of a citizen report based on environmental data.
    """
    credibility = "LOW"
    reasoning = "No supporting data found."
    
    report_type = report_type.lower()
    
    # Check Waterlogging
    if "waterlogging" in report_type or "flood" in report_type:
        rain = weather.get("rain", 0)
        if rain > 10:
            credibility = "HIGH"
            reasoning = f"Heavy rainfall detected ({rain}mm). Waterlogging is highly likely."
        elif rain > 0:
            credibility = "MEDIUM"
            reasoning = f"Some rainfall detected ({rain}mm). Waterlogging is possible."
        else:
            reasoning = "No recent rainfall detected. Report might be outdated or inaccurate."
            
    # Check Mosquitoes / Dengue / Malaria
    elif "mosquito" in report_type or "dengue" in report_type or "malaria" in report_type:
        humidity = weather.get("relative_humidity_2m", 0)
        temp = weather.get("temperature_2m", 0)
        if risk_score > 7 or (humidity > 70 and temp > 25):
            credibility = "HIGH"
            reasoning = f"High humidity ({humidity}%) and temp ({temp}°C) favor mosquito breeding. Risk Score is {risk_score}."
        elif risk_score > 4:
            credibility = "MEDIUM"
            reasoning = "Conditions are favorable for mosquitoes."
        else:
            reasoning = "Current conditions do not strongly favor rapid mosquito breeding."
            
    # Check Fever / Flu
    elif "fever" in report_type or "flu" in report_type:
        # Check for temperature drops or high risk score
        if risk_score > 6:
            credibility = "HIGH"
            reasoning = f"High disease risk score ({risk_score}) correlates with increased cases."
        else:
            credibility = "MEDIUM"
            reasoning = "General health report. Hard to verify with weather alone."
            
    else:
        credibility = "MEDIUM"
        reasoning = "General issue report."
        
    return {"credibility": credibility, "reasoning": reasoning}
