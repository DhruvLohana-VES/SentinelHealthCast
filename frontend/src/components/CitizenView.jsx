import React, { useState, useEffect } from 'react';

const CitizenView = () => {
    const [status, setStatus] = useState('loading');
    const [data, setData] = useState(null);

    const checkStatus = async () => {
        setStatus('loading');
        try {
            // In a real app, this would get the user's location
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location: 'Andheri' })
            });
            const result = await response.json();
            setData(result);
            setStatus('ready');
        } catch (error) {
            console.error('Error fetching status:', error);
            setStatus('error');
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    return (
        <div className="citizen-view">
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <h2 style={{ marginBottom: '2rem' }}>Current Health Risk Status</h2>

                {status === 'loading' && <p>Scanning environment...</p>}
                {status === 'error' && <p style={{ color: 'var(--accent-danger)' }}>Connection Error. Please try again.</p>}

                {status === 'ready' && data && (
                    <div>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                            {data.risk_score < 5 ? '🟢' : data.risk_score < 8 ? '🟡' : '🔴'}
                        </div>
                        <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                            {data.risk_score < 5 ? 'SAFE' : data.risk_score < 8 ? 'CAUTION' : 'CRITICAL'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            {data.message}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={checkStatus}>
                                Refresh Status
                            </button>
                            <a
                                href="https://t.me/YourBotName"
                                target="_blank"
                                rel="noreferrer"
                                className="btn"
                                style={{ border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
                            >
                                Report Issue via Telegram
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CitizenView;
