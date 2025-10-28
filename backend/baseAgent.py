# backend/baseAgent.py
# Implementation of basic agent with no tools
from agentpro import ReactAgent, create_model
import os

# Initialize model and tools (moved from backend.py)
# Expose `agent` for other modules to import
model = create_model(
    provider="openai",
    model_name="gpt-4.1-nano",
    api_key=os.getenv("OPENAI_API_KEY", None),
)
tools = []
agent = ReactAgent(model=model, tools=tools)

__all__ = ["agent", "model", "tools"]
