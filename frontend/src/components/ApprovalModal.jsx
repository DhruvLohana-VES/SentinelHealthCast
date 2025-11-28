import React from 'react';

const ApprovalModal = ({ ticket, onApprove, onReject }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ color: 'var(--accent-danger)', marginBottom: '0.5rem' }}>CRITICAL RISK DETECTED</h2>
                    <p style={{ fontSize: '1.2rem' }}>AI Execution Paused</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                    <p><strong>Location:</strong> Andheri</p>
                    <p><strong>Risk Score:</strong> {ticket.risk_score}/10</p>
                    <p><strong>Reasoning:</strong> {ticket.message}</p>
                </div>

                <p style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    Do you want to authorize the dispatch of emergency alerts to citizens in this area?
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-danger" onClick={onApprove} style={{ flex: 1 }}>
                        APPROVE DISPATCH
                    </button>
                    <button className="btn" onClick={onReject} style={{ flex: 1, background: '#334155' }}>
                        REJECT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;
