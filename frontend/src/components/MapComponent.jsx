import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for risk levels
const getIcon = (status) => {
    const color = status === 'CRITICAL' ? 'red' : status === 'CAUTION' ? 'orange' : 'green';
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: ${color}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const MapComponent = ({ riskZones, center, zoom }) => {
    const mumbaiCenter = center || [19.0760, 72.8777];
    const defaultZoom = zoom || 11;

    return (
        <MapContainer center={mumbaiCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {riskZones.map((zone, idx) => (
                <Marker
                    key={idx}
                    position={[zone.lat, zone.lng]}
                    icon={getIcon(zone.status)}
                >
                    <Popup>
                        <div style={{ color: 'black' }}>
                            <strong>{zone.name}</strong><br />
                            Risk Score: {zone.risk_score}<br />
                            Status: {zone.status}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
