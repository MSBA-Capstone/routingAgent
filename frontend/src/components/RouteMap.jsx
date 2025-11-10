import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RouteMap = ({ routeCoordinates, className = "" }) => {
  // Parse coordinates from the route string format: "[-122.3321,47.6062;-122.9007,47.0379]"
  const parseCoordinates = (coordString) => {
    if (!coordString) return null;

    try {
      // Remove square brackets if present
      const cleanString = coordString.replace(/^\[|\]$/g, '');
      const coords = cleanString.split(';').map(coord => {
        const [lon, lat] = coord.split(',').map(Number);
        return [lat, lon]; // Leaflet uses [lat, lng]
      });
      return coords;
    } catch (error) {
      console.error('Error parsing coordinates:', error, 'Input:', coordString);
      return null;
    }
  };

  // Parse GeoJSON geometry for route line
  const parseGeometry = (drivingText) => {
    if (!drivingText) return null;

    try {
      // Look for ROUTE_GEOMETRY in the driving text
      const geometryMatch = drivingText.match(/ROUTE_GEOMETRY:\s*(\{.*\})/);
      if (geometryMatch) {
        const geometry = JSON.parse(geometryMatch[1]);
        if (geometry.type === 'LineString' && geometry.coordinates) {
          // Convert from [lon, lat] to [lat, lon] for Leaflet
          return geometry.coordinates.map(coord => [coord[1], coord[0]]);
        }
      }
    } catch (error) {
      console.error('Error parsing geometry:', error, 'Input:', drivingText);
      return null;
    }
    return null;
  };

  const coordinates = parseCoordinates(routeCoordinates);

  console.log('RouteMap Debug:', { routeCoordinates, coordinates });

  // Calculate map center and bounds
  const getMapCenter = () => {
    if (coordinates && coordinates.length > 0) {
      return coordinates[0]; // Start point
    }
    return [39.8283, -98.5795]; // Center of USA as fallback
  };

  const getMapBounds = () => {
    if (coordinates && coordinates.length > 1) {
      return coordinates;
    }
    return null;
  };

  const center = getMapCenter();
  const bounds = getMapBounds();

  return (
    <div className={`h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <MapContainer
        center={center}
        zoom={bounds ? undefined : 10}
        bounds={bounds ? bounds : undefined}
        boundsOptions={bounds ? { padding: [20, 20] } : undefined}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Start and end markers */}
        {coordinates && coordinates.length >= 2 && (
          <>
            <Marker position={coordinates[0]}>
              <Popup>Start Point</Popup>
            </Marker>
            <Marker position={coordinates[coordinates.length - 1]}>
              <Popup>End Point</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default RouteMap;