import httpx
import asyncio

async def test_stats():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://127.0.0.1:8000/api/dashboard/stats")
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Weather: {data.get('weather_details')}")
            print(f"Risk Breakdown: {data.get('risk_breakdown')}")
            print(f"Disease Forecast: {data.get('disease_forecast')}")
            print(f"Symptom Trends: {data.get('symptom_trends')}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_stats())
