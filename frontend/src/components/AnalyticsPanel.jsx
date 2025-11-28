import React from 'react';

const AnalyticsPanel = ({ stats }) => {
    if (!stats) return null;

    const { weather_details, risk_breakdown, disease_forecast, symptom_trends } = stats;

    return (
        <div className="analytics-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>

            {/* Weather Card */}
            <div className="card">
                <h3>🌦️ Real-time Weather</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{weather_details?.temp}°C</div>
                        <div style={{ color: '#94a3b8' }}>Temp</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{weather_details?.rain}mm</div>
                        <div style={{ color: '#94a3b8' }}>Rain</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{weather_details?.humidity}%</div>
                        <div style={{ color: '#94a3b8' }}>Humidity</div>
                    </div>
                </div>
            </div>

            {/* Risk Breakdown Card */}
            <div className="card">
                <h3>🧮 Risk Factor Breakdown</h3>
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Rain Factor</span>
                        <span style={{ color: risk_breakdown?.rain_score > 1 ? '#ef4444' : '#22c55e' }}>
                            +{risk_breakdown?.rain_score}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Humidity Factor</span>
                        <span style={{ color: risk_breakdown?.humidity_score > 1 ? '#ef4444' : '#22c55e' }}>
                            +{risk_breakdown?.humidity_score}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Social Signal</span>
                        <span style={{ color: risk_breakdown?.social_score > 2 ? '#ef4444' : '#22c55e' }}>
                            +{risk_breakdown?.social_score}
                        </span>
                    </div>
                </div>
            </div>

            {/* Disease Forecast Card */}
            <div className="card">
                <h3>🦠 Disease Forecast</h3>
                <div style={{ marginTop: '1rem' }}>
                    {disease_forecast && disease_forecast.length > 0 ? (
                        disease_forecast.map((disease, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem',
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <span>{disease.disease}</span>
                                    <span style={{ color: '#ef4444' }}>{disease.probability} Risk</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                    Vector: {disease.vector}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: '#22c55e', textAlign: 'center', padding: '1rem' }}>
                            No immediate disease outbreaks predicted.
                        </div>
                    )}
                </div>
            </div>

            {/* Symptom Trends Card */}
            <div className="card">
                <h3>📈 Trending Symptoms (Telegram/X)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                    {symptom_trends && symptom_trends.length > 0 ? (
                        symptom_trends.map((symptom, idx) => (
                            <span key={idx} style={{
                                background: '#334155',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.9rem'
                            }}>
                                #{symptom}
                            </span>
                        ))
                    ) : (
                        <span style={{ color: '#94a3b8' }}>No significant trends detected.</span>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AnalyticsPanel;
