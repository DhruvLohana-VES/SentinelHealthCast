import React, { useState, useEffect } from 'react';
import ApprovalModal from './ApprovalModal';
import MapComponent from './MapComponent';
import AnalyticsPanel from './AnalyticsPanel';

const OfficialDashboard = () => {
    const [stats, setStats] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [pendingTicket, setPendingTicket] = useState(null);

    const [pendingReports, setPendingReports] = useState([]);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/dashboard/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchPendingReports = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/reports/pending');
            const data = await response.json();
            setPendingReports(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchPendingReports();
        const interval = setInterval(() => {
            fetchStats();
            fetchPendingReports();
        }, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleReportAction = async (id, action) => {
        try {
            await fetch('http://localhost:8000/api/reports/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });
            fetchPendingReports(); // Refresh list
        } catch (error) {
            console.error('Error verifying report:', error);
        }
    };

    const runSimulation = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location: 'Andheri' })
            });
            const result = await response.json();

            if (result.status === 'PAUSED') {
                setPendingTicket(result);
                setShowModal(true);
            }
            fetchStats(); // Refresh stats after simulation
        } catch (error) {
            console.error('Error running simulation:', error);
        }
    };

    const handleApproval = async (approved) => {
        if (!pendingTicket?.ticket_id) return;

        try {
            await fetch('http://localhost:8000/api/dispatch/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_id: pendingTicket.ticket_id,
                    action: approved ? 'approve' : 'reject'
                })
            });

            setShowModal(false);
            setPendingTicket(null);
            fetchStats();
        } catch (error) {
            console.error('Error handling approval:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Official Command Center</h2>
                            <div className="mt-3 flex gap-4">
                                <span className="inline-flex items-center rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                                    System: {stats?.system_health || 'Checking...'}
                                </span>
                                <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                                    Reports: {stats?.total_reports || 0}
                                </span>
                                <span className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                                    Active Alerts: {stats?.active_alerts || 0}
                                </span>
                            </div>
                        </div>
                        <button className="rounded-lg bg-blue-500 px-6 py-3 font-bold text-white shadow-sm transition-all hover:scale-105 hover:shadow-md" onClick={runSimulation}>
                            Run AI Simulation
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Map Section */}
                    <div className="lg:col-span-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {stats?.risk_zones ? (
                            <MapComponent riskZones={stats.risk_zones} />
                        ) : (
                            <div className="flex h-[500px] items-center justify-center text-gray-400">
                                Loading Map...
                            </div>
                        )}
                    </div>

                    {/* Risk Zones List */}
                    <div className="overflow-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-gray-900">Risk Zones</h3>
                        <div className="space-y-3">
                            {stats?.risk_zones?.map((zone, idx) => (
                                <div key={idx} className={`rounded-lg border-l-4 bg-gray-50 p-4 ${
                                    zone.status === 'CRITICAL' ? 'border-red-500' : 
                                    zone.status === 'CAUTION' ? 'border-orange-500' : 
                                    'border-green-500'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <strong className="text-gray-900">{zone.name}</strong>
                                        <span className="font-bold text-gray-900">{zone.risk_score}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        Status: {zone.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>

                {/* Pending Reports Verification Panel */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h3 className="mb-6 text-lg font-bold text-gray-900">📢 Pending Citizen Reports ({pendingReports.length})</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {pendingReports.length > 0 ? (
                            pendingReports.map((report) => (
                                <div key={report.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="mb-3 font-bold text-gray-900">{report.location}</div>
                                    <div className="mb-4 text-sm text-gray-600">{report.description}</div>

                                    {/* AI Analysis */}
                                    {report.ai_analysis && (
                                        <div className="mb-4 rounded-lg bg-gray-50 p-4">
                                            <div className={`mb-2 text-xs font-bold uppercase ${
                                                report.ai_analysis.credibility === 'HIGH' ? 'text-green-700' :
                                                report.ai_analysis.credibility === 'MEDIUM' ? 'text-orange-700' : 'text-gray-500'
                                            }`}>
                                                AI Credibility: {report.ai_analysis.credibility}
                                            </div>
                                            <div className="text-xs italic text-gray-600">
                                                "{report.ai_analysis.reasoning}"
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:scale-105 hover:shadow-md"
                                            onClick={() => handleReportAction(report.id, 'approve')}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50"
                                            onClick={() => handleReportAction(report.id, 'reject')}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-400">No pending reports to verify.</div>
                        )}
                    </div>
                </div>

                {/* Advanced Analytics Panel */}
                <AnalyticsPanel stats={stats} />

                {showModal && pendingTicket && (
                    <ApprovalModal
                        ticket={pendingTicket}
                        onApprove={() => handleApproval(true)}
                        onReject={() => handleApproval(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default OfficialDashboard;
