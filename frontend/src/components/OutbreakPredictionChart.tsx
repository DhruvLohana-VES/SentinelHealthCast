// src/components/OutbreakPredictionChart.tsx
// Displays outbreak predictions with confidence bands

import React, { useState } from 'react';
import type { Prediction, PredictionHorizon } from '../types';
import { LABELS } from '../utils/constants';

export interface OutbreakPredictionChartProps {
  predictions: Prediction[];
  loading?: boolean;
  className?: string;
}

export default function OutbreakPredictionChart({
  predictions,
  loading = false,
  className = '',
}: OutbreakPredictionChartProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<PredictionHorizon>(24);

  const horizonOptions = [
    { value: 24 as PredictionHorizon, label: LABELS.predictions.horizon24 },
    { value: 72 as PredictionHorizon, label: LABELS.predictions.horizon72 },
    { value: 168 as PredictionHorizon, label: LABELS.predictions.horizon168 },
  ];

  const currentPrediction = predictions.find(p => p.horizon === selectedHorizon);

  if (loading) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white p-8 shadow-sm ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 rounded bg-gray-100"></div>
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded bg-gray-100"></div>
            <div className="h-8 w-20 rounded bg-gray-100"></div>
            <div className="h-8 w-20 rounded bg-gray-100"></div>
          </div>
          <div className="h-32 w-full rounded bg-gray-100"></div>
        </div>
      </div>
    );
  }

  if (!currentPrediction) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900">{LABELS.predictions.title}</h3>
        <p className="mt-4 text-center text-sm text-gray-500">No prediction data available</p>
      </div>
    );
  }

  const maxCases = Math.max(...predictions.map(p => p.predictedCases));
  const barHeight = (currentPrediction.predictedCases / maxCases) * 100;
  const confidenceColor = currentPrediction.confidence > 0.8 ? 'text-green-600' : 
                          currentPrediction.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
      <div className="relative mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">{LABELS.predictions.title}</h3>
        <span className="text-sm font-semibold text-gray-500">{currentPrediction.wardName}</span>
      </div>

      {/* Horizon Selector */}
      <div className="relative mb-8 flex gap-2">
        {horizonOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setSelectedHorizon(option.value)}
            className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${
              selectedHorizon === option.value
                ? 'bg-sky-400 text-white shadow-sm'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
            aria-pressed={selectedHorizon === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Prediction Display */}
      <div className="relative space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">{LABELS.predictions.cases}</p>
            <p className="mt-1 text-5xl font-bold text-gray-900">{currentPrediction.predictedCases}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-500">{LABELS.predictions.confidence}</p>
            <p className={`mt-1 text-3xl font-bold ${confidenceColor}`}>
              {Math.round(currentPrediction.confidence * 100)}%
            </p>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="relative h-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <div
            className="absolute bottom-0 w-full bg-gradient-to-t from-sky-400 to-sky-300 transition-all duration-500"
            style={{ height: `${barHeight}%` }}
            role="progressbar"
            aria-valuenow={currentPrediction.predictedCases}
            aria-valuemin={0}
            aria-valuemax={maxCases}
          />
        </div>

        {/* Drivers */}
        {currentPrediction.drivers.length > 0 && (
          <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Key Drivers
            </p>
            {currentPrediction.drivers.map((driver, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-all hover:bg-gray-100">
                <span className="text-sm font-semibold text-gray-700">{driver.name}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-sky-400"
                      style={{ width: `${driver.impactScore * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-gray-900">
                    {Math.round(driver.impactScore * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
