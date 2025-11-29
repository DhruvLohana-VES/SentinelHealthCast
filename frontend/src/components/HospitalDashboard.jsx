import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';

const HospitalDashboard = ({ hospital, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/hospital/stats?location=${hospital.location}`);
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching hospital stats:', error);
            }
        };

        const fetchAlerts = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/alerts?limit=5');
                const data = await response.json();
                setAlerts(data.alerts || []);
            } catch (error) {
                console.error('Error fetching alerts:', error);
            }
        };

        fetchStats();
        fetchAlerts();
        
        const interval = setInterval(() => {
            fetchStats();
            fetchAlerts();
        }, 30000); // Refresh every 30s
        
        return () => clearInterval(interval);
    }, [hospital]);

    if (!stats) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading Dashboard...</p>
            </div>
        </div>
    );

    const { weather, local_stats, web_signals, trending_symptoms, disease_risks } = stats;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">🏥 {hospital.name}</h2>
                            <p className="mt-1 text-sm font-medium text-gray-500">Region: {hospital.location}</p>
                        </div>
                        <button className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* Weather & Environmental Data Row */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Temperature</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900">{weather.temperature_2m}°C</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Humidity</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900">{weather.relative_humidity_2m}%</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rainfall</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900">{weather.rain}mm</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Air Quality (AQI)</div>
                        <div className={`mt-2 text-3xl font-bold ${
                            weather.us_aqi > 100 ? 'text-red-600' : 
                            weather.us_aqi > 50 ? 'text-orange-600' : 
                            'text-green-600'
                        }`}>
                            {weather.us_aqi || 'N/A'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* Left Column: Map & Disease Forecast */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Map */}
                        <div className="h-[350px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <MapComponent
                                riskZones={[{
                                    name: hospital.location,
                                    lat: hospital.lat,
                                    lng: hospital.lng,
                                    risk_score: local_stats.risk_score,
                                    status: local_stats.status
                                }]}
                                center={[hospital.lat, hospital.lng]}
                                zoom={14}
                            />
                        </div>

                        {/* Disease Risk Forecast */}
                        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-6 text-lg font-bold text-gray-900">🦠 Disease Outbreak Risk Forecast</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {disease_risks && disease_risks.length > 0 ? (
                                    disease_risks.map((risk, idx) => (
                                        <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-4">
                                            <div className="mb-2 font-bold text-red-700">{risk.disease}</div>
                                            <div className="text-sm text-gray-700">Risk: <strong>{risk.probability}</strong></div>
                                            <div className="text-xs text-gray-500">Vector: {risk.vector}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
                                        ✅ No immediate high-risk disease outbreaks predicted based on current data.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Web Signals */}
                        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-6 text-lg font-bold text-gray-900">🌐 Real-time Web Signals ({hospital.location})</h3>
                            <div className="max-h-[300px] space-y-3 overflow-y-auto">
                                {web_signals && web_signals.length > 0 ? (
                                    web_signals.map((signal, idx) => (
                                        <div key={idx} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                            {signal.description}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-400">No recent web signals found.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Risk Status & Trending Symptoms */}
                    <div className="space-y-6">
                        {/* Risk Status Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <h3 className="mb-4 text-lg font-bold text-gray-900">Local Risk Score</h3>
                            <div className={`my-4 text-6xl font-bold ${
                                local_stats.status === 'CRITICAL' ? 'text-red-600' : 
                                local_stats.status === 'CAUTION' ? 'text-orange-600' : 
                                'text-green-600'
                            }`}>
                                {local_stats.risk_score}
                            </div>
                            <div className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${
                                local_stats.status === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                                local_stats.status === 'CAUTION' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                                {local_stats.status}
                            </div>
                            <div className="mt-4 text-sm text-gray-500">
                                Predicted Cases (48h): <span className="font-bold text-gray-900">{local_stats.predicted_cases}</span>
                            </div>
                        </div>

                        {/* Trending Symptoms */}
                        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-6 text-lg font-bold text-gray-900">📈 Trending Symptoms</h3>
                            <div className="flex flex-wrap gap-2">
                                {trending_symptoms && trending_symptoms.length > 0 ? (
                                    trending_symptoms.map((symptom, idx) => (
                                        <span key={idx} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white">
                                            {symptom}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400">No major symptoms trending.</span>
                                )}
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                                *Aggregated from Telegram & Web
                            </div>
                        </div>

                        {/* Readiness Checklist */}
                        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-6 text-lg font-bold text-gray-900">📋 Readiness Checklist</h3>
                            <div className="space-y-3">
                                {local_stats.checklist.map((item, idx) => (
                                    <div key={idx} className="rounded-lg border-l-4 border-sky-500 bg-sky-50 p-3 text-sm text-gray-700">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Outbreak Alerts */}
                        {alerts && alerts.length > 0 && (
                            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                                <h3 className="mb-6 text-lg font-bold text-gray-900">🚨 AI Outbreak Alerts</h3>
                                <div className="space-y-3">
                                    {alerts.map(alert => (
                                        <div key={alert.id} className={`rounded-lg border p-4 ${
                                            alert.severity === 'CRITICAL' ? 'border-red-200 bg-red-50' :
                                            alert.severity === 'HIGH' ? 'border-orange-200 bg-orange-50' :
                                            'border-yellow-200 bg-yellow-50'
                                        }`}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <span className={`rounded px-2 py-1 text-xs font-bold ${
                                                            alert.severity === 'CRITICAL' ? 'bg-red-200 text-red-900' :
                                                            alert.severity === 'HIGH' ? 'bg-orange-200 text-orange-900' :
                                                            'bg-yellow-200 text-yellow-900'
                                                        }`}>
                                                            {alert.severity}
                                                        </span>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {alert.wards?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900">{alert.message}</h4>
                                                    {alert.action_plan?.public_message && (
                                                        <p className="mt-1 text-sm text-gray-600">{alert.action_plan.public_message}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(alert.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
