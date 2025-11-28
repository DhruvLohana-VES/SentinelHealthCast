// src/components/TelegramRedirectCard.tsx
// Telegram bot integration with preview and redirect

import React, { useState } from 'react';
import type { Report } from '../types';
import { LABELS } from '../utils/constants';
import { getTelegramRedirectUrl } from '../api';

export interface TelegramRedirectCardProps {
  report: Report;
  className?: string;
}

export default function TelegramRedirectCard({
  report,
  className = '',
}: TelegramRedirectCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const telegramMessage = `🚨 Health Alert - ${report.wardName}

📍 Location: ${report.wardName}
🕐 Time: ${new Date(report.timestamp).toLocaleString()}

🤒 Symptoms Reported:
${report.symptoms.map(s => `• ${s}`).join('\n')}

${report.description ? `\n📝 Details:\n${report.description}` : ''}

✅ AI Verification: ${report.aiValidity} (${Math.round(report.aiConfidence * 100)}% confidence)

Report ID: ${report.id}`;

  const handleOpenTelegram = () => {
    window.open(getTelegramRedirectUrl(report.id), '_blank');
  };

  return (
    <div className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
      <div className="relative mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-400 shadow-sm">
          <svg
            className="h-7 w-7 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.235 5.45-1.745 7.24-.216.758-.64.848-1.027.848-.413 0-.733-.19-.966-.354-.337-.237-3.357-2.16-4.01-2.572-.428-.27-.925-.604-.28-1.134.18-.148 3.279-3.002 3.68-3.367.052-.047.092-.218-.072-.306-.193-.104-.48-.04-.672.035-.265.103-4.472 2.842-5.02 3.186-.428.27-.82.418-1.22.418-.275 0-.535-.054-.778-.133-.56-.181-1.001-.407-1.32-.624-.363-.245-.27-.517.072-.7.542-.29 5.76-2.426 7.79-3.253.94-.383 1.786-.567 2.035-.567.16 0 .29.023.402.066.26.1.387.313.388.583-.001.144-.014.357-.063.672z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Telegram Alert</h3>
      </div>

      <div className="relative space-y-6">
        <div className="rounded-lg bg-sky-50 p-5">
          <p className="text-sm font-medium text-gray-700">
            Share this health alert via Telegram bot for rapid community notification.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleOpenTelegram}
            className="flex-1 overflow-hidden rounded-lg bg-sky-400 px-6 py-3 font-bold text-white shadow-sm transition-all hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300/50"
          >
            {LABELS.telegram.openBot}
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-bold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {showPreview ? 'Hide' : LABELS.telegram.preview}
          </button>
        </div>

        {showPreview && (
          <div
            className="rounded-lg border border-gray-200 bg-gray-50 p-5 font-mono text-sm text-gray-700"
            role="region"
            aria-label="Telegram message preview"
          >
            <pre className="whitespace-pre-wrap">{telegramMessage}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
