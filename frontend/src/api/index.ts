// src/api/index.ts
// API client with mock data and fetch helpers

import type {
  WardStats,
  Report,
  Prediction,
  Ticket,
  LLMStatus,
  HospitalSupply,
  ReportsResponse,
  ActionSuggestion,
  PredictionHorizon,
} from '../types';

const API_BASE = 'http://localhost:8000';

// Mock Data
export const MOCK_WARDS = [
  { id: 'W001', name: 'Andheri East', population: 45000, coordinates: { lat: 19.1197, lng: 72.8697 } },
  { id: 'W002', name: 'Bandra West', population: 38000, coordinates: { lat: 19.0596, lng: 72.8295 } },
  { id: 'W003', name: 'Dadar', population: 52000, coordinates: { lat: 19.0176, lng: 72.8478 } },
  { id: 'W004', name: 'Malad East', population: 41000, coordinates: { lat: 19.1865, lng: 72.8490 } },
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'R001',
    timestamp: '2025-11-28T10:30:00Z',
    wardId: 'W001',
    wardName: 'Andheri East',
    symptoms: ['fever', 'cough', 'body_ache'],
    photos: ['photo1.jpg'],
    reporterHash: 'usr_a3f8d9c2',
    aiValidity: 'valid',
    aiConfidence: 0.92,
    status: 'pending',
    description: 'High fever for 3 days with persistent dry cough',
  },
  {
    id: 'R002',
    timestamp: '2025-11-28T09:15:00Z',
    wardId: 'W001',
    wardName: 'Andheri East',
    symptoms: ['headache', 'nausea'],
    reporterHash: 'usr_b7e1f4a9',
    aiValidity: 'valid',
    aiConfidence: 0.85,
    status: 'approved',
    description: 'Severe headache with nausea since yesterday',
  },
  {
    id: 'R003',
    timestamp: '2025-11-28T08:45:00Z',
    wardId: 'W002',
    wardName: 'Bandra West',
    symptoms: ['rash', 'itching'],
    reporterHash: 'usr_c9d2e6b1',
    aiValidity: 'uncertain',
    aiConfidence: 0.58,
    status: 'pending',
    description: 'Red rash on arms and legs',
  },
  {
    id: 'R004',
    timestamp: '2025-11-28T07:20:00Z',
    wardId: 'W003',
    wardName: 'Dadar',
    symptoms: ['fever', 'chills', 'vomiting'],
    reporterHash: 'usr_d4a8c7f3',
    aiValidity: 'valid',
    aiConfidence: 0.95,
    status: 'approved',
    description: 'High grade fever with chills and vomiting',
  },
];

export const MOCK_PREDICTIONS: Prediction[] = [
  {
    wardId: 'W001',
    wardName: 'Andheri East',
    horizon: 24,
    predictedCases: 12,
    confidence: 0.87,
    drivers: [
      { name: 'Recent outbreak trend', impactScore: 0.42 },
      { name: 'High population density', impactScore: 0.31 },
      { name: 'Monsoon conditions', impactScore: 0.27 },
    ],
    timestamp: '2025-11-28T11:00:00Z',
  },
  {
    wardId: 'W001',
    wardName: 'Andheri East',
    horizon: 72,
    predictedCases: 28,
    confidence: 0.74,
    drivers: [
      { name: 'Recent outbreak trend', impactScore: 0.45 },
      { name: 'High population density', impactScore: 0.35 },
      { name: 'Monsoon conditions', impactScore: 0.20 },
    ],
    timestamp: '2025-11-28T11:00:00Z',
  },
];

export const MOCK_WARD_STATS: WardStats[] = [
  {
    wardId: 'W001',
    wardName: 'Andheri East',
    population: 45000,
    activeReports: 8,
    last24hCases: 3,
    riskScore: 72,
    riskBand: 'high',
    coordinates: { lat: 19.1197, lng: 72.8697 },
    lastUpdated: '2025-11-28T11:00:00Z',
  },
  {
    wardId: 'W002',
    wardName: 'Bandra West',
    population: 38000,
    activeReports: 4,
    last24hCases: 1,
    riskScore: 45,
    riskBand: 'medium',
    coordinates: { lat: 19.0596, lng: 72.8295 },
    lastUpdated: '2025-11-28T11:00:00Z',
  },
  {
    wardId: 'W003',
    wardName: 'Dadar',
    population: 52000,
    activeReports: 2,
    last24hCases: 1,
    riskScore: 28,
    riskBand: 'low',
    coordinates: { lat: 19.0176, lng: 72.8478 },
    lastUpdated: '2025-11-28T11:00:00Z',
  },
];

export const MOCK_LLM_STATUS: LLMStatus = {
  avgLatencyMs: 342,
  successRate: 0.94,
  lastUpdated: '2025-11-28T11:00:00Z',
  examples: [
    {
      input: 'fever cough headache',
      output: 'Possible viral infection - monitor for 24h',
      score: 0.92,
    },
    {
      input: 'rash itching swelling',
      output: 'Allergic reaction - recommend antihistamine',
      score: 0.88,
    },
  ],
};

export const MOCK_HOSPITAL_SUPPLIES: HospitalSupply[] = [
  {
    medicationName: 'Paracetamol 500mg',
    currentStock: 5000,
    requiredStock: 8000,
    urgency: 'medium',
    predictedDemand7d: 6200,
  },
  {
    medicationName: 'Amoxicillin 250mg',
    currentStock: 1200,
    requiredStock: 4000,
    urgency: 'high',
    predictedDemand7d: 3800,
  },
  {
    medicationName: 'ORS Packets',
    currentStock: 8000,
    requiredStock: 10000,
    urgency: 'low',
    predictedDemand7d: 9500,
  },
];

// Fetch helpers
export async function fetchWardStats(wardId?: string): Promise<WardStats | WardStats[]> {
  try {
    const url = wardId ? `${API_BASE}/api/stats?wardId=${wardId}` : `${API_BASE}/api/stats`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (error) {
    console.warn('Using mock data:', error);
    return wardId ? MOCK_WARD_STATS.find(s => s.wardId === wardId)! : MOCK_WARD_STATS;
  }
}

export async function fetchReports(params?: {
  wardId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ReportsResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.wardId) query.set('wardId', params.wardId);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());

    const response = await fetch(`${API_BASE}/api/reports?${query}`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return await response.json();
  } catch (error) {
    console.warn('Using mock data:', error);
    let filtered = MOCK_REPORTS;
    if (params?.wardId) filtered = filtered.filter(r => r.wardId === params.wardId);
    if (params?.status) filtered = filtered.filter(r => r.status === params.status);
    
    return {
      reports: filtered,
      total: filtered.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  }
}

export async function fetchPrediction(
  wardId: string,
  horizon: PredictionHorizon = 24
): Promise<Prediction> {
  try {
    const response = await fetch(`${API_BASE}/api/predictions/wards/${wardId}?horizon=${horizon}`);
    if (!response.ok) throw new Error('Failed to fetch prediction');
    return await response.json();
  } catch (error) {
    console.warn('Using mock data:', error);
    return MOCK_PREDICTIONS.find(p => p.wardId === wardId && p.horizon === horizon)!;
  }
}

export async function approveReport(reportId: string): Promise<{ ok: boolean }> {
  const response = await fetch(`${API_BASE}/api/reports/${reportId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return await response.json();
}

export async function rejectReport(reportId: string, reason: string): Promise<{ ok: boolean; reason: string }> {
  const response = await fetch(`${API_BASE}/api/reports/${reportId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return await response.json();
}

export async function createTicket(data: Partial<Ticket>): Promise<Ticket> {
  const response = await fetch(`${API_BASE}/api/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await response.json();
}

export async function fetchLLMStatus(): Promise<LLMStatus> {
  try {
    const response = await fetch(`${API_BASE}/api/llm/status`);
    if (!response.ok) throw new Error('Failed to fetch LLM status');
    return await response.json();
  } catch (error) {
    console.warn('Using mock data:', error);
    return MOCK_LLM_STATUS;
  }
}

export async function fetchHospitalSupplies(): Promise<HospitalSupply[]> {
  try {
    const response = await fetch(`${API_BASE}/api/hospital/supplies`);
    if (!response.ok) throw new Error('Failed to fetch supplies');
    return await response.json();
  } catch (error) {
    console.warn('Using mock data:', error);
    return MOCK_HOSPITAL_SUPPLIES;
  }
}

export function getTelegramRedirectUrl(reportId: string): string {
  return `${API_BASE}/api/telegram/redirect?reportId=${reportId}`;
}

export function getTelegramPreviewUrl(reportId: string): string {
  return `${API_BASE}/api/telegram/preview?reportId=${reportId}`;
}
