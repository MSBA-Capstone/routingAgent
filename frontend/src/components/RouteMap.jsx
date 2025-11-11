import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for numbered POIs
const createNumberedIcon = (number, isActive = false) => {
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `<div style="
      background-color: ${isActive ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ${isActive ? 'animation: pulse 1s infinite;' : ''}
    ">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const RouteMap = ({ 
  routeCoordinates, 
  pois = [], 
  className = "",
  currentPOIIndex = 0,
  onPOIChange = () => {}
}) => {
  const mapRef = useRef(null);
  
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

  const coordinates = parseCoordinates(routeCoordinates);

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

  // Center map on POI when currentPOIIndex changes
  useEffect(() => {
    if (mapRef.current && pois[currentPOIIndex]) {
      mapRef.current.setView(pois[currentPOIIndex].coordinates, 15);
    }
  }, [currentPOIIndex, pois]);

  // Handle POI change
  const handlePOIChange = (index) => {
    onPOIChange(index);
    if (mapRef.current && pois[index]) {
      mapRef.current.setView(pois[index].coordinates, 15);
    }
  };

  return (
    <div className={`h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      
      <style>
        {`
          .custom-numbered-marker {
            background: transparent !important;
            border: none !important;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>
      <MapContainer
        ref={mapRef}
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
            <Marker 
              position={coordinates[0]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div className="font-semibold text-sm">🚀 Trip Start Point</div>
              </Tooltip>
              <Popup>🚀 Start Point</Popup>
            </Marker>
            <Marker 
              position={coordinates[coordinates.length - 1]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div className="font-semibold text-sm">🏁 Trip End Point</div>
              </Tooltip>
              <Popup>🏁 End Point</Popup>
            </Marker>
          </>
        )}

        {/* POI markers */}
        {pois.map((poi, index) => {
          const isActive = index === currentPOIIndex;
          return (
            <Marker 
              key={index} 
              position={poi.coordinates}
              icon={createNumberedIcon(index + 1, isActive)}
              eventHandlers={{
                click: () => handlePOIChange(index)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                <div className="max-w-xs">
                  <div className="font-semibold text-sm">📍 {poi.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Stop #{index + 1} • {poi.description.length > 50 
                      ? poi.description.substring(0, 50) + '...' 
                      : poi.description}
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div>
                  <strong>📍 {poi.name}</strong>
                  <br />
                  <span style={{ fontSize: '12px', color: '#666' }}>Stop #{index + 1}</span>
                  <br />
                  {poi.description}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RouteMap;