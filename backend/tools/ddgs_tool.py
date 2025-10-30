# Create custom tool for agentpro using DuckDuckGo Search API
from agentpro.tools import Tool
from ddgs import DDGS
from typing import Any

class DDGSTool(Tool):
    name: str = "DuckDuckGo Search Tool"  # Human-readable name for the tool (used in documentation and debugging)
    description: str = "Searches text using DuckDuckGo and returns titles and bodies of search results."  # Brief summary explaining the tool's functionality for agent
    action_type: str = "search_text"  # Unique identifier for the tool; lowercase with underscores for agent; avoid spaces, digits, special characters
    input_format: str = "A search query string (e.g., 'python web scraping')"  # Instruction on what kind of input the tool expects with example

    def run(self, input_text: Any) -> str:
        query = str(input_text).strip()
        if not query:
            return "Error: Search query cannot be empty."
        
        try:
            with DDGS() as ddgs:
                results = ddgs.text(query, max_results=10)  # Limit to 10 results
            
            if not results:
                return "No search results found."
            
            output = ""
            for i, r in enumerate(results, 1):
                title = r.get('title', 'No title')
                body = r.get('body', 'No body')
                output += f"Result {i}:\nTitle: {title}\nBody: {body}\n\n"
            
            return output.strip()
        
        except Exception as e:
            return f"Error performing search: {str(e)}"
