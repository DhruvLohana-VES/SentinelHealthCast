// src/pages/user/Dashboard.tsx
// User dashboard - complete page with all components wired up

import React, { useState, useEffect } from 'react';
import RiskScoreCard from '../../components/RiskScoreCard';
import StatsGrid from '../../components/StatsGrid';
import OutbreakPredictionChart from '../../components/OutbreakPredictionChart';
import TelegramRedirectCard from '../../components/TelegramRedirectCard';
import ReportList from '../../components/ReportList';
import {
  fetchWardStats,
  fetchPrediction,
  fetchReports,
  MOCK_WARD_STATS,
  MOCK_PREDICTIONS,
  MOCK_REPORTS,
} from '../../api';
import type { WardStats, Prediction, Report } from '../../types';

export default function UserDashboard() {
  const [selectedWardId, setSelectedWardId] = useState<string>('W001');
  const [stats, setStats] = useState<WardStats | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedWardId]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Fetch stats for selected ward
      const statsData = await fetchWardStats(selectedWardId);
      setStats(Array.isArray(statsData) ? statsData[0] : statsData);

      // Fetch predictions for 24h and 72h
      const pred24 = await fetchPrediction(selectedWardId, 24);
      const pred72 = await fetchPrediction(selectedWardId, 72);
      setPredictions([pred24, pred72]);

      // Fetch reports for this ward
      const reportsData = await fetchReports({ wardId: selectedWardId });
      setReports(reportsData.reports);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Fallback to mock data
      setStats(MOCK_WARD_STATS.find(s => s.wardId === selectedWardId) || MOCK_WARD_STATS[0]);
      setPredictions(MOCK_PREDICTIONS.filter(p => p.wardId === selectedWardId));
      setReports(MOCK_REPORTS.filter(r => r.wardId === selectedWardId));
    } finally {
      setLoading(false);
    }
  }

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 shadow-sm">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900">Health Dashboard</h1>
                  <p className="mt-1 text-sm font-medium text-gray-500">AI-Powered Health Monitoring System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Ward Selector */}
              <select
                value={selectedWardId}
                onChange={e => setSelectedWardId(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label="Select ward"
              >
                <option value="W001">📍 Andheri East</option>
                <option value="W002">📍 Bandra West</option>
                <option value="W003">📍 Dadar</option>
                <option value="W004">📍 Malad East</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Stats Grid */}
          {stats && <StatsGrid stats={stats} loading={loading} />}

          {/* Risk Score and Predictions Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {stats && (
              <RiskScoreCard
                score={stats.riskScore}
                wardName={stats.wardName}
                drivers={predictions[0]?.drivers || []}
                loading={loading}
              />
            )}
            <OutbreakPredictionChart predictions={predictions} loading={loading} />
          </div>

          {/* Reports Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Recent Reports</h2>
                <button className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/50">
                  ✨ New Report
                </button>
              </div>
              <ReportList
                reports={reports}
                onReportClick={handleReportClick}
                loading={loading}
              />
            </div>

            {/* Telegram Card */}
            <div>
              {selectedReport ? (
                <TelegramRedirectCard report={selectedReport} />
              ) : reports[0] ? (
                <TelegramRedirectCard report={reports[0]} />
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-center text-sm text-gray-500">
                    Select a report to view Telegram options
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
