import asyncio
from agents import run_sentinel_agent

async def main():
    print("🧪 Starting Sentinel Agent Verification...")
    
    # Test Case 1: Normal Run
    print("\n--- Test Case 1: Checking Andheri ---")
    result = await run_sentinel_agent("Andheri")
    print(f"Result: {result}")
    
    # Note: To test the "High Risk" scenario, we would need to mock the weather data 
    # or the citizen reports to return high values. 
    # For now, we verify the pipeline runs without errors.

if __name__ == "__main__":
    asyncio.run(main())
