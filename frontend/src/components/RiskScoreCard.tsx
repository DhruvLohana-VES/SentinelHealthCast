// src/components/RiskScoreCard.tsx
// Displays ward risk score with color-coded band, drivers, and confidence

import React from 'react';
import type { RiskBand, RiskDriver } from '../types';
import { LABELS, RISK_COLORS, getRiskBandFromScore } from '../utils/constants';

export interface RiskScoreCardProps {
  score: number;
  wardName?: string;
  drivers?: RiskDriver[];
  loading?: boolean;
  error?: string;
  className?: string;
}

export default function RiskScoreCard({
  score,
  wardName,
  drivers = [],
  loading = false,
  error,
  className = '',
}: RiskScoreCardProps) {
  const riskBand: RiskBand = getRiskBandFromScore(score);
  const colors = RISK_COLORS[riskBand];
  const topDrivers = drivers.slice(0, 3);

  // Loading state
  if (loading) {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-white p-8 shadow-sm ${className}`}
        role="status"
        aria-label={LABELS.riskScore.loading}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-gray-100"></div>
          <div className="h-16 w-16 rounded-full bg-gray-100"></div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-gray-100"></div>
            <div className="h-3 w-5/6 rounded bg-gray-100"></div>
            <div className="h-3 w-4/6 rounded bg-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-2 text-red-800">
          <svg
            className="h-5 w-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">{LABELS.riskScore.error}</span>
        </div>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const riskLabel = LABELS.riskScore[riskBand];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md ${className}`}
      role="region"
      aria-label={`${LABELS.riskScore.title}${wardName ? ` for ${wardName}` : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
      {/* Header */}
      <div className="relative mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          {LABELS.riskScore.title}
          {wardName && <span className="ml-2 text-gray-400">· {wardName}</span>}
        </h3>
        <span
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${colors.text} ${colors.bg} border ${colors.border}`}
          aria-label={`Risk level: ${riskLabel}`}
        >
          {riskLabel}
        </span>
      </div>

      {/* Score Circle */}
      <div className="relative mb-8 flex items-center justify-center">
        <div
          className={`relative flex h-40 w-40 items-center justify-center rounded-full border-[8px] ${colors.border} bg-white shadow-md`}
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Risk score: ${score} out of 100`}
        >
          <div className="relative text-center">
            <div className="text-5xl font-bold text-gray-900">{score}</div>
            <div className="text-xs font-semibold text-gray-400">/ 100</div>
          </div>
        </div>
      </div>

      {/* Top Drivers */}
      {topDrivers.length > 0 && (
        <div className="relative space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            {LABELS.riskScore.drivers}
          </h4>
          <ul className="space-y-3" role="list">
            {topDrivers.map((driver, index) => (
              <li
                key={driver.name}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-all hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400 text-xs font-bold text-white"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{driver.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {Math.round(driver.impactScore * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {topDrivers.length === 0 && (
        <div className="relative text-center text-sm text-gray-400">
          No risk driver data available
        </div>
      )}
    </div>
  );
}
