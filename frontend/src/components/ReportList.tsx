// src/components/ReportList.tsx
// List of health reports with filtering and AI validity tags

import React from 'react';
import type { Report, ReportStatus, AIValidity } from '../types';
import { LABELS, formatRelativeTime, URGENCY_COLORS } from '../utils/constants';

export interface ReportListProps {
  reports: Report[];
  onReportClick?: (report: Report) => void;
  onApprove?: (reportId: string) => void;
  onReject?: (reportId: string) => void;
  loading?: boolean;
  showActions?: boolean;
  className?: string;
}

const validityColors: Record<AIValidity, string> = {
  valid: 'bg-green-100 text-green-800 border-green-300',
  invalid: 'bg-red-100 text-red-800 border-red-300',
  uncertain: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const validityIcons: Record<AIValidity, React.ReactNode> = {
  valid: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  invalid: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  uncertain: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function ReportList({
  reports,
  onReportClick,
  onApprove,
  onReject,
  loading = false,
  showActions = false,
  className = '',
}: ReportListProps) {
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 rounded bg-gray-100"></div>
                <div className="h-3 w-full rounded bg-gray-100"></div>
                <div className="h-3 w-2/3 rounded bg-gray-100"></div>
              </div>
              <div className="h-6 w-20 rounded bg-gray-100"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-400">No reports found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {reports.map(report => (
        <div
          key={report.id}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md"
          onClick={() => onReportClick?.(report)}
          role={onReportClick ? 'button' : undefined}
          tabIndex={onReportClick ? 0 : undefined}
          onKeyDown={e => {
            if (onReportClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onReportClick(report);
            }
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900">{report.wardName}</h4>
                <span className="text-sm text-gray-300">•</span>
                <span className="text-sm font-medium text-gray-500">{formatRelativeTime(report.timestamp)}</span>
              </div>

              {/* Symptoms */}
              <div className="flex flex-wrap gap-2">
                {report.symptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600"
                  >
                    {symptom}
                  </span>
                ))}
              </div>

              {/* Description */}
              {report.description && (
                <p className="text-sm text-gray-600">{report.description}</p>
              )}

              {/* AI Validity & Confidence */}
              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${validityColors[report.aiValidity]}`}>
                  {validityIcons[report.aiValidity]}
                  <span className="font-bold capitalize">{report.aiValidity}</span>
                </div>
                <span className="font-semibold text-gray-500">
                  {Math.round(report.aiConfidence * 100)}% confidence
                </span>
              </div>

              {/* Actions */}
              {showActions && report.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onApprove?.(report.id);
                    }}
                    className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400/50"
                  >
                    {LABELS.reports.approve}
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onReject?.(report.id);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  >
                    {LABELS.reports.reject}
                  </button>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div>
              {report.status === 'approved' && (
                <span className="rounded-full bg-green-100 border border-green-200 px-3 py-1.5 text-xs font-bold text-green-700">
                  Approved
                </span>
              )}
              {report.status === 'rejected' && (
                <span className="rounded-full bg-red-100 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700">
                  Rejected
                </span>
              )}
              {report.status === 'pending' && (
                <span className="rounded-full bg-yellow-100 border border-yellow-200 px-3 py-1.5 text-xs font-bold text-yellow-700">
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
