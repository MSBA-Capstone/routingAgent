# agent_backend.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.baseAgent import BaseAgent
from backend.agent_prompts import AGENT_PROMPTS
from backend.tools.geocoding_tool import GeocodingTool
from backend.tools.directions_tool import DirectionsTool
from backend.tools.linkup_tool import LinkupTool
from backend.tools.ddgs_tool import DDGSTool

import os
import uuid
from fastapi import BackgroundTasks

app = FastAPI()

# Allow CORS for frontend (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://routing-agent.vercel.app", "https://routing-agent-ltgpw525m-haofei-zhangs-projects.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Each API endpoint will create its own BaseAgent instance to avoid
# sharing state between requests.

# Global dict to store job statuses (in production, use a database)
jobs = {}

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

# @app.post("/init")
# async def run_query(request: Request):
#     data = await request.json()
#     userInput = data.get("query", "")
#     history = data.get("history", [])
#     query = f"User Input: {userInput}\nConversation History: {history}"
#     # create a fresh agent for this request
#     local_agent = BaseAgent(
#         custom_system_prompt=AGENT_PROMPTS["route_sanity_check"],
#         tools=[GeocodingTool(), DirectionsTool()],
#         max_iterations=10
#     )
#     response = local_agent.agent.run(query)
#     continue_flag = "The route is not feasible" not in response.final_answer
#     return {"answer": response.final_answer, "continue": continue_flag}

@app.post("/utility_itinerary")
async def create_utility_itinerary(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    userInput = data.get("query", "")
    history = data.get("history", [])
    query = f"User Input: {userInput}\nConversation History: {history}"
    # create a fresh agent for this request
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "processing", "result": None}
    background_tasks.add_task(process_utility_itinerary, job_id, query)
    return {"job_id": job_id}

@app.post("/plan_trip")
async def plan_trip(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    trip_data = data.get("trip", {})
    from_loc = trip_data.get("from", "")
    to_loc = trip_data.get("to", "")
    duration = trip_data.get("duration", "")
    driving_hours = trip_data.get("drivingHoursPerDay", "")
    hurry = trip_data.get("routePreference", "")

    # First, run sanity check
    sanity_query = f"I am planning a road trip from {from_loc} to {to_loc}. The trip will last {duration} days, and I plan to drive about {driving_hours} hours each day. Please provide any additional notes or context that would help in planning this route."
    local_agent = BaseAgent(
        custom_system_prompt=AGENT_PROMPTS["route_sanity_check"],
        tools=[GeocodingTool(), DirectionsTool()],
        max_iterations=10
    )
    sanity_response = local_agent.agent.run(sanity_query)
    if "The route is not feasible" in sanity_response.final_answer:
        return {"answer": sanity_response.final_answer, "feasible": False}

    # If feasible, create itinerary
    itinerary_query = f"I am planning a road trip from {from_loc} to {to_loc}. The trip will last {duration} days, and I plan to drive about {driving_hours} hours each day. Regarding hurry: {hurry}."
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "processing", "result": None}
    background_tasks.add_task(process_utility_itinerary, job_id, itinerary_query)
    return {"job_id": job_id, "feasible": True}

def process_utility_itinerary(job_id, query):
    try:
        local_agent = BaseAgent(
            custom_system_prompt=AGENT_PROMPTS["utility_focused_itinerary"],
            tools=[GeocodingTool(), DirectionsTool(), DDGSTool()],
            max_iterations=30
        )
        response = local_agent.agent.run(query)
        jobs[job_id] = {"status": "completed", "result": {"answer": response.final_answer}}
    except Exception as e:
        jobs[job_id] = {"status": "error", "result": str(e)}

@app.get("/job_status/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs:
        return {"status": "not_found"}
    return jobs[job_id]