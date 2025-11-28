// src/components/__tests__/RiskScoreCard.test.tsx
// Unit tests for RiskScoreCard component

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskScoreCard from '../RiskScoreCard';
import type { RiskDriver } from '../../types';

describe('RiskScoreCard', () => {
  const mockDrivers: RiskDriver[] = [
    { name: 'High population density', impactScore: 0.42 },
    { name: 'Recent outbreak trend', impactScore: 0.31 },
    { name: 'Monsoon conditions', impactScore: 0.27 },
  ];

  it('renders risk score correctly', () => {
    render(<RiskScoreCard score={75} wardName="Andheri East" drivers={mockDrivers} />);
    
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Andheri East')).toBeInTheDocument();
  });

  it('displays correct risk band for high score', () => {
    render(<RiskScoreCard score={85} drivers={mockDrivers} />);
    
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('displays correct risk band for medium score', () => {
    render(<RiskScoreCard score={55} drivers={mockDrivers} />);
    
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('displays correct risk band for low score', () => {
    render(<RiskScoreCard score={25} drivers={mockDrivers} />);
    
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('renders top 3 drivers', () => {
    render(<RiskScoreCard score={75} drivers={mockDrivers} />);
    
    expect(screen.getByText('High population density')).toBeInTheDocument();
    expect(screen.getByText('Recent outbreak trend')).toBeInTheDocument();
    expect(screen.getByText('Monsoon conditions')).toBeInTheDocument();
  });

  it('displays driver impact scores as percentages', () => {
    render(<RiskScoreCard score={75} drivers={mockDrivers} />);
    
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('31%')).toBeInTheDocument();
    expect(screen.getByText('27%')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<RiskScoreCard score={75} loading={true} />);
    
    expect(screen.getByLabelText('Calculating risk...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to fetch risk data';
    render(<RiskScoreCard score={75} error={errorMessage} />);
    
    expect(screen.getByText('Unable to load risk data')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows empty state when no drivers provided', () => {
    render(<RiskScoreCard score={75} drivers={[]} />);
    
    expect(screen.getByText('No risk driver data available')).toBeInTheDocument();
  });

  it('has correct ARIA attributes for accessibility', () => {
    render(<RiskScoreCard score={75} wardName="Andheri East" drivers={mockDrivers} />);
    
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '75');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-label', 'Risk score: 75 out of 100');
  });

  it('applies custom className', () => {
    const { container } = render(<RiskScoreCard score={75} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
