// src/utils/constants.ts
// Application constants and i18n labels

export const LABELS = {
  riskScore: {
    title: 'Risk Score',
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    drivers: 'Top Risk Drivers',
    loading: 'Calculating risk...',
    error: 'Unable to load risk data',
  },
  stats: {
    population: 'Population',
    activeReports: 'Active Reports',
    cases24h: 'Cases (24h)',
    lastUpdated: 'Last Updated',
  },
  predictions: {
    title: 'Outbreak Prediction',
    horizon24: '24 Hours',
    horizon72: '3 Days',
    horizon168: '7 Days',
    cases: 'Predicted Cases',
    confidence: 'Confidence',
  },
  reports: {
    title: 'Reports',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    symptoms: 'Symptoms',
    validity: 'AI Validity',
    confidence: 'Confidence',
    approve: 'Approve',
    reject: 'Reject',
  },
  telegram: {
    openBot: 'Open in Telegram',
    preview: 'Preview Message',
    sendNow: 'Send Now',
    autoSend: 'Auto-send Reports',
  },
  hospital: {
    supplies: 'Medical Supplies',
    currentStock: 'Current Stock',
    required: 'Required',
    urgency: 'Urgency',
    demand7d: '7-Day Demand',
  },
  llm: {
    status: 'LLM Performance',
    latency: 'Avg Latency',
    successRate: 'Success Rate',
    examples: 'Recent Examples',
  },
} as const;

export const RISK_COLORS = {
  low: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    ring: 'ring-green-500',
  },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    ring: 'ring-yellow-500',
  },
  high: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    ring: 'ring-red-500',
  },
} as const;

export const URGENCY_COLORS = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
} as const;

export function getRiskBandFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score < 40) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
