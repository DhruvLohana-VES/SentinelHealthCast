// src/components/StatsGrid.tsx
// Grid layout for ward statistics

import React from 'react';
import type { WardStats } from '../types';
import { LABELS, formatTimestamp } from '../utils/constants';

export interface StatsGridProps {
  stats: WardStats;
  loading?: boolean;
  className?: string;
}

export default function StatsGrid({ stats, loading = false, className = '' }: StatsGridProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-20 rounded bg-gray-100"></div>
            <div className="mt-2 h-8 w-16 rounded bg-gray-100"></div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: LABELS.stats.population,
      value: stats.population.toLocaleString(),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-sky-500',
      bgColor: 'bg-sky-50',
    },
    {
      label: LABELS.stats.activeReports,
      value: stats.activeReports.toString(),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: LABELS.stats.cases24h,
      value: stats.last24hCases.toString(),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: LABELS.stats.lastUpdated,
      value: formatTimestamp(stats.lastUpdated).split(',')[1] || 'N/A',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {statItems.map((item, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{item.value}</p>
            </div>
            <div className={`rounded-xl p-3 ${item.bgColor}`}>
              <div className={item.color}>{item.icon}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
