import asyncio
import httpx
import json

async def test_aqi():
    latitude = 19.1136
    longitude = 72.8697
    
    aqi_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    aqi_params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["us_aqi", "pm2_5"]
    }
    
    async with httpx.AsyncClient() as client:
        print(f"Fetching AQI from: {aqi_url}")
        response = await client.get(aqi_url, params=aqi_params)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print("Response Data:")
        print(json.dumps(data, indent=2))

if __name__ == "__main__":
    asyncio.run(test_aqi())
