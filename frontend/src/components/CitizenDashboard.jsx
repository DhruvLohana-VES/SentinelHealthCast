import React, { useState, useEffect } from 'react';

const CitizenDashboard = ({ user, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const regions = ["Andheri", "Bandra", "Powai", "Dadar", "Churchgate", "Colaba", "Juhu"];

    const fetchStats = async (lat = null, lon = null, loc = null) => {
        setLoading(true);
        setError(null);
        try {
            let url = 'http://localhost:8000/api/citizen/stats?';
            if (lat && lon) url += `lat=${lat}&lon=${lon}`;
            if (loc) url += `&location=${loc}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) throw new Error(data.error);
            setStats(data);
            if (data.location) setLocation(data.location);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Initial load - try GPS
    useEffect(() => {
        handleUseLocation();
    }, []);

    const handleUseLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchStats(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    // Fallback to default
                    fetchStats(null, null, "Mumbai");
                }
            );
        } else {
            fetchStats(null, null, "Mumbai");
        }
    };

    const handleRegionChange = (e) => {
        const newLoc = e.target.value;
        setLocation(newLoc);
        fetchStats(null, null, newLoc);
    };

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('Waterlogging');
    const [reportDesc, setReportDesc] = useState('');

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        try {
            const fullDesc = `${reportType}: ${reportDesc}`;
            await fetch('http://localhost:8000/api/citizen/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: location || "Mumbai",
                    description: fullDesc,
                    user_id: user.id // If available
                })
            });
            setShowReportModal(false);
            setReportDesc('');
            alert("Report submitted! It will be verified by officials.");
        } catch (err) {
            console.error(err);
            alert("Failed to submit report.");
        }
    };

    if (loading && !stats) return <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Loading your personalized health forecast...</div>;

    return (
        <div className="dashboard">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>👋 Hello, {user.name}</h2>
                    <div style={{ color: '#94a3b8' }}>Stay safe and informed.</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => window.open('https://t.me/Sentinel_Mumbai_2025_bot', '_blank')}
                        style={{ background: '#0088cc' }}
                    >
                        📱 Open in Telegram
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowReportModal(true)} style={{ background: '#ef4444' }}>
                        📢 Report Issue
                    </button>
                    <button className="btn" onClick={onLogout} style={{ background: '#334155' }}>Logout</button>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', position: 'relative' }}>
                        <button
                            onClick={() => setShowReportModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                        <h3>📢 Report a Health/Civic Issue</h3>
                        <form onSubmit={handleReportSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Issue Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="input"
                                >
                                    <option value="Waterlogging">Waterlogging / Flooding</option>
                                    <option value="Mosquitoes">High Mosquito Density</option>
                                    <option value="Garbage">Garbage Dump / Hygiene</option>
                                    <option value="Fever">Rise in Fever Cases</option>
                                    <option value="Flu">Flu / Cough Outbreak</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Description</label>
                                <textarea
                                    value={reportDesc}
                                    onChange={(e) => setReportDesc(e.target.value)}
                                    className="input"
                                    rows="4"
                                    placeholder="Describe the issue (e.g., 'Knee deep water near station')..."
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Submit Report</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Location Controls */}
            <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleUseLocation}>
                    📍 Use My Current Location
                </button>
                <span style={{ color: '#64748b' }}>or select region:</span>
                <select
                    value={regions.includes(location) ? location : ''}
                    onChange={handleRegionChange}
                    className="input"
                    style={{ width: 'auto', minWidth: '200px' }}
                >
                    <option value="" disabled>Select a Region</option>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {stats && <div style={{ marginLeft: 'auto', color: '#94a3b8' }}>Showing data for: <strong>{stats.location}</strong></div>}
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                    {/* Left Column: Risk & Weather */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Risk Score */}
                        <div className="card" style={{ textAlign: 'center', background: `linear-gradient(135deg, ${stats.status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : stats.status === 'CAUTION' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(34, 197, 94, 0.2)'} 0%, rgba(30, 41, 59, 1) 100%)` }}>
                            <h3>Current Health Risk</h3>
                            <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '1rem 0', color: stats.status === 'CRITICAL' ? '#ef4444' : stats.status === 'CAUTION' ? '#f97316' : '#22c55e' }}>
                                {stats.risk_score}
                            </div>
                            <div className={`status-badge status-${stats.status.toLowerCase()}`} style={{ display: 'inline-block', fontSize: '1.2rem', padding: '0.5rem 1.5rem' }}>
                                {stats.status}
                            </div>
                            <div style={{ marginTop: '1rem', color: '#94a3b8' }}>
                                Based on weather, reports, and web signals.
                            </div>
                        </div>

                        {/* Weather Grid */}
                        <div className="card">
                            <h3>🌦️ Environmental Conditions</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Temperature</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.weather.temperature_2m}°C</div>
                                </div>
                                <div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Humidity</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.weather.relative_humidity_2m}%</div>
                                </div>
                                <div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Rainfall</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.weather.rain}mm</div>
                                </div>
                                <div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>AQI</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: stats.weather.us_aqi > 100 ? '#ef4444' : '#22c55e' }}>
                                        {stats.weather.us_aqi || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Health Insights */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Remedies / Doctor's Advice */}
                        <div className="card">
                            <h3>🩺 Doctor's Advice (Remedies)</h3>
                            <div style={{ marginTop: '1rem' }}>
                                {stats.remedies && stats.remedies.length > 0 ? (
                                    stats.remedies.map((remedy, idx) => (
                                        <div key={idx} style={{
                                            padding: '0.75rem',
                                            marginBottom: '0.5rem',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            borderLeft: '4px solid #3b82f6',
                                            borderRadius: '0.25rem'
                                        }}>
                                            {remedy}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#94a3b8' }}>No specific remedies needed right now. Stay healthy!</div>
                                )}
                            </div>
                        </div>

                        {/* What's Going Around */}
                        <div className="card">
                            <h3>🦠 What's Going Around?</h3>
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Predicted Outbreaks</h4>
                                    {stats.disease_risks && stats.disease_risks.length > 0 ? (
                                        stats.disease_risks.map((risk, idx) => (
                                            <div key={idx} style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                                ⚠️ {risk.disease} ({risk.probability} Risk)
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ color: '#22c55e' }}>No immediate outbreaks predicted.</div>
                                    )}
                                </div>

                                <div>
                                    <h4 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Reported Symptoms</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {stats.trending_symptoms && stats.trending_symptoms.length > 0 ? (
                                            stats.trending_symptoms.map((s, idx) => (
                                                <span key={idx} style={{ padding: '0.25rem 0.75rem', background: '#475569', borderRadius: '1rem', fontSize: '0.9rem' }}>
                                                    {s}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ color: '#64748b' }}>No major symptoms reported.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default CitizenDashboard;
