# Create custom tool for agentpro using Mapbox Geocoding API
from agentpro.tools import Tool
import requests
import os
from typing import Any

class GeocodingTool(Tool):
    name: str = "Mapbox Geocoding Tool"  # Human-readable name for the tool (used in documentation and debugging)
    description: str = "Geocodes an array of addresses or place names to coordinates and location details using Mapbox API. Useful for finding latitude/longitude of multiple locations."  # Brief summary explaining the tool's functionality for agent
    action_type: str = "geocode_addresses"  # Unique identifier for the tool; lowercase with underscores for agent; avoid spaces, digits, special characters
    input_format: str = "An array of string addresses or place names to geocode"  # Instruction on what kind of input the tool expects with example

    def run(self, input_text: Any) -> list[str]:
        # Check if input is a list
        if not isinstance(input_text, list):
            return ["Error: Input must be a list of addresses."]
        
        # Get Mapbox access token from environment
        access_token = os.getenv("MAPBOX_ACCESS_TOKEN")
        if not access_token:
            return ["Error: MAPBOX_ACCESS_TOKEN environment variable not set."]
        
        results = []
        for address in input_text:
            try:
                # Build the forward geocoding URL (v6 API)
                url = "https://api.mapbox.com/search/geocode/v6/forward"
                params = {
                    "q": address,
                    "access_token": access_token,
                    "limit": 1  # Get the top result
                }
                
                response = requests.get(url, params=params)
                response.raise_for_status()  # Raise error for bad status codes
                data = response.json()
                
                features = data.get("features", [])
                if not features:
                    results.append(f"No geocoding results found for '{address}'.")
                    continue
                
                # Extract details from the first feature
                feature = features[0]
                name = feature["properties"].get("name", "Unknown")
                place_formatted = feature["properties"].get("place_formatted", "")
                coordinates = feature["geometry"]["coordinates"]
                longitude, latitude = coordinates
                
                results.append(f"Geocoded '{address}': {name}, {place_formatted}. Coordinates: {latitude}, {longitude}")
            
            except requests.RequestException as e:
                results.append(f"Error calling Mapbox API for '{address}': {str(e)}")
            except KeyError as e:
                results.append(f"Error parsing API response for '{address}': {str(e)}")
        
        return results