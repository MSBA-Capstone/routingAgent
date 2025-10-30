# Create custom tool for agentpro using Linkup Search API
from agentpro.tools import Tool
import requests
import os
from typing import Any

class LinkupTool(Tool):
    name: str = "Linkup Search Tool"  # Human-readable name for the tool (used in documentation and debugging)
    description: str = "Searches the web using Linkup API to get sourced answers and information."  # Brief summary explaining the tool's functionality for agent
    action_type: str = "search_linkup"  # Unique identifier for the tool; lowercase with underscores for agent; avoid spaces, digits, special characters
    input_format: str = "A search query string, e.g., 'What is Microsoft's 2024 revenue?'"  # Instruction on what kind of input the tool expects with example

    def run(self, input_text: Any) -> str:
        # Get Linkup API token from environment
        token = os.getenv("LINKUP_API_TOKEN")
        if not token:
            return "Error: LINKUP_API_TOKEN environment variable not set."
        
        # Build the search payload
        url = "https://api.linkup.so/v1/search"
        payload = {
            "q": input_text,
            "depth": "standard",
            "outputType": "sourcedAnswer",
            "structuredOutputSchema": None,
            "includeImages": False,
            "includeInlineCitations": False,
            "includeSources": True
        }
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()  # Raise error for bad status codes
            data = response.json()
            
            answer = data.get("answer", "No answer found.")
            sources = data.get("sources", [])
            
            # Format the response
            result = f"Answer: {answer}\n\nSources:\n"
            for i, source in enumerate(sources, 1):
                name = source.get("name", "Unknown")
                url = source.get("url", "")
                snippet = source.get("snippet", "")[:200] + "..." if len(source.get("snippet", "")) > 200 else source.get("snippet", "")
                result += f"{i}. {name}: {url}\n   Snippet: {snippet}\n\n"
            
            return result
        
        except requests.RequestException as e:
            return f"Error calling Linkup API: {str(e)}"
        except KeyError as e:
            return f"Error parsing API response: {str(e)}"
