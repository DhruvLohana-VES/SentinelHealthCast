import os
import google.generativeai as genai
from tools import get_weather_data, calculate_risk_score, create_dispatch_ticket, get_citizen_reports
from dotenv import load_dotenv
import json

load_dotenv()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Define the model
model = genai.GenerativeModel('gemini-2.5-flash')

from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.runners import InMemoryRunner
from google.adk.tools import google_search
from google.genai import types

# Define helper for ADK Runner
async def run_adk_agent(agent, prompt):
    runner = InMemoryRunner(agent=agent)
    response = await runner.run_debug(prompt)
    # Handle list return type (history of turns)
    if isinstance(response, list):
        last_event = response[-1]
        if last_event.content and last_event.content.parts:
            return last_event.content.parts[0].text
        return "No text content found in response."
    return response.text

async def run_web_scout_agent(location: str):
    """
    Uses Google ADK Agent with Google Search to find real-time health trends.
    """
    # Define the ADK Agent
    web_scout = Agent(
        name="web_scout",
        model=Gemini(model="gemini-2.5-flash"),
        instruction=f"""
        You are a Medical Intelligence Scout.
        Search for recent news, tweets, or reports about disease outbreaks or health symptoms in {location} from the last 30 days.
        Focus on: Dengue, Malaria, Leptospirosis, Fever, Flu.
        
        Return a list of 3 short, specific summaries of what you found.
        Format:
        - [Source] Summary
        
        If nothing significant is found, return "No significant recent reports found."
        """,
        tools=[google_search]
    )
    
    try:
        # Run the agent using ADK Runner
        # Note: In a real app, we might reuse the runner/session
        result_text = await run_adk_agent(web_scout, f"Find health trends in {location}")
        
        # Parse the text response into our list format
        return [{"description": line.strip()} for line in result_text.split('\n') if line.strip().startswith('-')]
    except Exception as e:
        print(f"⚠️ ADK Web Scout Error: {e}")
        return [{"description": "Error running ADK Web Scout."}]

async def run_sentinel_agent(location: str):
    # ... (existing code)
    """
    Orchestrates the Perception -> Reasoning -> Action loop.
    """
    print(f"🤖 Sentinel Agent Activated for: {location}")
    
    # 1. PERCEPTION (Gather Data)
    # For Mumbai/Andheri, we can hardcode coords or use a geocoder. 
    # Using Andheri coords for demo: 19.1136, 72.8697
    lat, lon = 19.1136, 72.8697 
    
    print("👀 Perception: Scanning Weather & Citizen Reports...")
    weather_data = await get_weather_data(lat, lon)
    reports = get_citizen_reports(location)
    report_count = len(reports) if reports else 0
    
    print(f"   - Rain: {weather_data['current']['rain']}mm")
    print(f"   - Reports: {report_count}")

    # 2. REASONING (Calculate Risk)
    print("🧠 Reasoning: Calculating Risk Score...")
    risk_score = calculate_risk_score(weather_data, report_count)
    print(f"   - Risk Score: {risk_score}/10")
    
    reasoning = f"Risk is {risk_score}. Rain: {weather_data['current']['rain']}mm. Citizen Reports: {report_count}."

    # 3. ACTION (Decide)
    if risk_score > 7.0: # Critical Threshold
        print("⚠️ CRITICAL RISK DETECTED. INITIATING DISPATCH PROTOCOL.")
        print("✋ Action: PAUSING for Human Approval.")
        
        # Create Ticket
        ticket = create_dispatch_ticket(location, risk_score, reasoning)
        return {
            "status": "PAUSED",
            "message": "High risk detected. Dispatch ticket created. Waiting for official approval.",
            "risk_score": risk_score,
            "ticket_id": ticket[0]['id'] if ticket else None
        }
    else:
        print("✅ Risk is manageable. Monitoring continues.")
        return {
            "status": "MONITORING",
            "message": "Risk levels are within safe limits.",
            "risk_score": risk_score
        }

if __name__ == "__main__":
    import asyncio
    # Test run
    asyncio.run(run_sentinel_agent("Andheri"))
