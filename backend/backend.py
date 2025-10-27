# agent_backend.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from agentpro import ReactAgent, create_model
from agentpro.tools import AresInternetTool, QuickInternetTool
from backend.rag_tool import RagTool  # import your custom tool

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

# Initialize model and tools
model = create_model(provider="openai", model_name="gpt-4.1-nano", api_key=os.getenv("OPENAI_API_KEY", None))
tools = [
    # AresInternetTool(os.getenv("ARES_API_KEY", None)),
    # QuickInternetTool(),
    RagTool()
]
agent = ReactAgent(model=model, tools=tools)

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

@app.post("/query")
async def run_query(request: Request):
    data = await request.json()
    query = data.get("query", "")
    response = agent.run(query)
    return {"answer": response.final_answer}

# Endpoint to add a new cat fact and update RAG index
@app.post("/add_fact")
async def add_fact(request: Request):
    data = await request.json()
    fact = data.get("fact", "").strip()
    if not fact:
        return {"success": False, "error": "No fact provided."}
    # Append fact to cat-facts.txt
    facts_path = os.path.join(os.path.dirname(__file__), "..", "RAG", "cat-facts.txt")
    try:
        with open(facts_path, "a", encoding="utf-8") as f:
            f.write(fact + "\n")
    except Exception as e:
        return {"success": False, "error": str(e)}
    # Rebuild RAG index
    try:
        from RAG.ragInit import build_index
        build_index()
    except Exception as e:
        return {"success": False, "error": "Fact added, but failed to rebuild index: " + str(e)}
    return {"success": True, "message": "Fact added and RAG index updated."}