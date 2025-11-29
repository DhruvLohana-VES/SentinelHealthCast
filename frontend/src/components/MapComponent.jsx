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

// Report marker icon based on severity and type
const getReportIcon = (severity, type) => {
    const color = severity >= 8 ? '#dc2626' : severity >= 5 ? '#f59e0b' : '#10b981';
    const emoji = type === 'Garbage' ? '🗑️' : type === 'Stagnant Water' ? '💧' : '⚠️';
    return L.divIcon({
        className: 'report-icon',
        html: `<div style="background-color: ${color}; padding: 4px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 16px;">${emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

const MapComponent = ({ riskZones, reports, center, zoom }) => {
    const mumbaiCenter = center || [19.0760, 72.8777];
    const defaultZoom = zoom || 11;

    return (
        <MapContainer center={mumbaiCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {riskZones && riskZones.map((zone, idx) => (
                <Marker
                    key={`zone-${idx}`}
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
            {reports && reports.map((report, idx) => (
                <Marker
                    key={`report-${report.id || idx}`}
                    position={[report.lat, report.lng]}
                    icon={getReportIcon(report.severity, report.type)}
                >
                    <Popup>
                        <div style={{ color: 'black', minWidth: '150px' }}>
                            <strong>{report.type}</strong><br />
                            Ward: {report.ward}<br />
                            Severity: {report.severity}/10<br />
                            <div style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>
                                {report.description}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
