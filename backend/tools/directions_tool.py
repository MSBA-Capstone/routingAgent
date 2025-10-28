# Create custom tool for agentpro using Mapbox Directions API
from agentpro.tools import Tool
import requests
import os
from typing import Any

class DirectionsTool(Tool):
    name: str = "Mapbox Directions Tool"  # Human-readable name for the tool (used in documentation and debugging)
    description: str = "Gets driving directions between up to 25 coordinates using Mapbox API. Useful for routing and estimating travel time/distance."  # Brief summary explaining the tool's functionality for agent
    action_type: str = "get_directions"  # Unique identifier for the tool; lowercase with underscores for agent; avoid spaces, digits, special characters
    input_format: str = "A string of coordinates in the format 'longitude1,latitude1;longitude2,latitude2;longitude3,latitude3' (e.g., '-122.4194,37.7749;-118.2437,34.0522;-119.4179,36.7783') [up to 25 coordinates]"  # Instruction on what kind of input the tool expects with example

    def run(self, input_text: Any) -> str:
        # Get Mapbox access token from environment
        access_token = os.getenv("MAPBOX_ACCESS_TOKEN")
        if not access_token:
            return "Error: MAPBOX_ACCESS_TOKEN environment variable not set."
        
        # Parse input: expect "lon1,lat1;lon2,lat2"
        try:
            coords = input_text.strip()
            if ';' not in coords:
                return "Error: Input must contain two coordinates separated by ';'."
            start, end = coords.split(';', 1)
            start_lon, start_lat = map(float, start.split(','))
            end_lon, end_lat = map(float, end.split(','))
        except ValueError:
            return "Error: Invalid coordinate format. Use 'longitude1,latitude1;longitude2,latitude2'."
        
        # Build the directions URL (v5 API, driving profile)
        profile = "mapbox/driving"
        coordinates = f"{start_lon},{start_lat};{end_lon},{end_lat}"
        url = f"https://api.mapbox.com/directions/v5/{profile}/{coordinates}"
        params = {
            "access_token": access_token,
            "geometries": "geojson",  # Return GeoJSON geometry
            "overview": "full"  # Full route geometry
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()  # Raise error for bad status codes
            data = response.json()
            
            if data.get("code") != "Ok":
                return f"Error: Directions API returned code {data.get('code')}."
            
            routes = data.get("routes", [])
            if not routes:
                return "No routes found for the given coordinates."
            
            # Get the first (best) route
            route = routes[0]
            distance_m = route.get("distance", 0)
            duration_s = route.get("duration", 0)
            distance_km = distance_m / 1000
            duration_min = duration_s / 60
            
            # Basic summary
            summary = f"Route from ({start_lon:.4f}, {start_lat:.4f}) to ({end_lon:.4f}, {end_lat:.4f}): Distance: {distance_km:.2f} km, Duration: {duration_min:.1f} minutes."
            
            # Optionally include legs summary if available
            legs = route.get("legs", [])
            if legs:
                leg = legs[0]  # Assuming one leg for simplicity
                leg_summary = leg.get("summary", "")
                if leg_summary:
                    summary += f" Via: {leg_summary}."
            
            return summary
        
        except requests.RequestException as e:
            return f"Error calling Mapbox API: {str(e)}"
        except KeyError as e:
            return f"Error parsing API response: {str(e)}"