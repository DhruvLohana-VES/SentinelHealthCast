import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';

const BMCDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/bmc/stats');
            const data = await response.json();
            setStats(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching BMC stats:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading BMC Command Center...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">🏢 BMC Command Center</h2>
                            <p className="mt-1 text-sm font-medium text-gray-500">Brihanmumbai Municipal Corporation - Health Department</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Wards Monitored</span>
                                <div className="text-2xl font-bold text-green-700">{stats?.total_wards || 0}</div>
                            </div>
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Critical Wards</span>
                                <div className="text-2xl font-bold text-red-700">{stats?.critical_wards || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                    {/* Map Section */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                            <h3 className="text-lg font-bold text-gray-900">🗺️ Ward Heatmap</h3>
                        </div>
                        <div className="h-[600px]">
                            {stats?.ward_details ? (
                                <MapComponent riskZones={stats.ward_details} />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">Loading Map...</div>
                            )}
                        </div>
                    </div>

                    {/* Ward Table Section */}
                    <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                            <h3 className="text-lg font-bold text-gray-900">📋 Ward-wise Status & Action Plan</h3>
                        </div>
                        <div className="p-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Ward</th>
                                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Risk Score</th>
                                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Cases</th>
                                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Action Required</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.ward_details?.map((ward) => (
                                        <tr key={ward.ward_id} className="border-b border-gray-100">
                                            <td className="py-4">
                                                <div className="font-bold text-gray-900">{ward.ward_id}</div>
                                                <div className="text-sm text-gray-500">{ward.name}</div>
                                            </td>
                                            <td className="py-4 font-bold text-gray-900">
                                                {ward.risk_score.toFixed(1)}
                                            </td>
                                            <td className="py-4">
                                                <span className="text-gray-900">{ward.total_cases}</span>
                                                <span className="ml-1 text-green-600">({ward.verified_cases})</span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                                    ward.status === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    ward.status === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                    ward.status === 'CAUTION' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                                                    'bg-green-100 text-green-700 border border-green-200'
                                                }`}>
                                                    {ward.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-sm text-gray-600">
                                                {ward.action_plan}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Resource Allocation Panel */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h3 className="mb-6 text-lg font-bold text-gray-900">🚚 Resource Allocation Recommendations</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                            <h4 className="mb-3 text-sm font-bold text-blue-700">🦟 Fogging Trucks</h4>
                            <div className="text-2xl font-bold text-gray-900">{stats?.critical_wards * 2 + 2} Units</div>
                            <div className="mt-2 text-sm text-gray-600">Priority: Critical Wards first</div>
                        </div>
                        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                            <h4 className="mb-3 text-sm font-bold text-green-700">👨‍⚕️ Medical Teams</h4>
                            <div className="text-2xl font-bold text-gray-900">{stats?.critical_wards * 3} Teams</div>
                            <div className="mt-2 text-sm text-gray-600">Focus: Fever Camps in Slum Areas</div>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                            <h4 className="mb-3 text-sm font-bold text-red-700">🚑 Ambulances</h4>
                            <div className="text-2xl font-bold text-gray-900">{stats?.critical_wards + 5} Units</div>
                            <div className="mt-2 text-sm text-gray-600">Standby for Emergency Transfers</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BMCDashboard;
