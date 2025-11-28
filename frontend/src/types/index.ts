// src/types/index.ts
// Core TypeScript interfaces for the Urban Health Forecasting system

export type RiskBand = 'low' | 'medium' | 'high';
export type AIValidity = 'valid' | 'invalid' | 'uncertain';
export type ReportStatus = 'pending' | 'approved' | 'rejected';
export type PredictionHorizon = 24 | 72 | 168;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Ward {
  id: string;
  name: string;
  coordinates: Coordinates;
  population: number;
}

export interface RiskDriver {
  name: string;
  impactScore: number;
}

export interface WardStats {
  wardId: string;
  wardName: string;
  population: number;
  activeReports: number;
  last24hCases: number;
  riskScore: number;
  riskBand: RiskBand;
  coordinates: Coordinates;
  lastUpdated: string;
}

export interface Report {
  id: string;
  timestamp: string;
  wardId: string;
  wardName: string;
  symptoms: string[];
  photos?: string[];
  reporterHash: string;
  aiValidity: AIValidity;
  aiConfidence: number;
  status: ReportStatus;
  description?: string;
}

export interface Prediction {
  wardId: string;
  wardName: string;
  horizon: PredictionHorizon;
  predictedCases: number;
  confidence: number;
  drivers: RiskDriver[];
  timestamp: string;
}

export interface Ticket {
  id: string;
  wardId: string;
  wardName: string;
  actionPlan: string[];
  assignedTo?: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface LLMStatus {
  avgLatencyMs: number;
  successRate: number;
  lastUpdated: string;
  examples: Array<{
    input: string;
    output: string;
    score: number;
  }>;
}

export interface HospitalSupply {
  medicationName: string;
  currentStock: number;
  requiredStock: number;
  urgency: 'low' | 'medium' | 'high';
  predictedDemand7d: number;
}

export interface DashboardUser {
  id: string;
  role: 'user' | 'bmc' | 'admin' | 'hospital';
  name: string;
  wardId?: string;
}

export interface ReportsResponse {
  reports: Report[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActionSuggestion {
  rank: number;
  action: string;
  wardIds: string[];
  estimatedImpact: number;
  urgency: 'low' | 'medium' | 'high';
}
