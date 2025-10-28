# agent_backend.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.baseAgent import BaseAgent
from backend.agent_prompts import AGENT_PROMPTS
from backend.tools.geocoding_tool import GeocodingTool
from backend.tools.directions_tool import DirectionsTool
from backend.tools.linkup_tool import LinkupTool

import os

app = FastAPI()

# Allow CORS for frontend (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://agent-pro-example.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Each API endpoint will create its own BaseAgent instance to avoid
# sharing state between requests.


@app.post("/validate_password")
async def validate_password(request: Request):
    data = await request.json()
    password = data.get("password", "")
    correct_password = os.getenv("APP_PASSWORD")
    if correct_password is None:
        return {"success": False, "error": "Server password not set."}
    if password == correct_password:
        return {"success": True}
    return {"success": False}

@app.post("/init")
async def run_query(request: Request):
    data = await request.json()
    userInput = data.get("query", "")
    history = data.get("history", [])
    query = f"User Input: {userInput}\nConversation History: {history}"
    # create a fresh agent for this request
    local_agent = BaseAgent(
        custom_system_prompt=AGENT_PROMPTS["route_sanity_check"],
        tools=[GeocodingTool(), DirectionsTool()],
        max_iterations=10
    )
    response = local_agent.agent.run(query)
    continue_flag = "The route is not feasible" not in response.final_answer
    return {"answer": response.final_answer, "continue": continue_flag}

@app.post("/utility_itinerary")
async def create_utility_itinerary(request: Request):
    data = await request.json()
    userInput = data.get("query", "")
    history = data.get("history", [])
    query = f"User Input: {userInput}\nConversation History: {history}"
    # create a fresh agent for this request
    local_agent = BaseAgent(
        custom_system_prompt=AGENT_PROMPTS["utility_focused_itinerary"],
        tools=[GeocodingTool(), DirectionsTool(), LinkupTool()],
        max_iterations=30
    )
    response = local_agent.agent.run(query)
    return {"answer": response.final_answer}