/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WifiClassificationResult {
  bars: 1 | 2 | 3;
  classification: 'Excellent / Strong' | 'Good / Moderate' | 'Weak';
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export function validateSignalInput(value: string | number): {
  isValid: boolean;
  errorMessage?: string;
  numericValue?: number;
} {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, errorMessage: 'Please enter a numeric signal-strength value.' };
  }

  const num = typeof value === 'number' ? value : Number(value);

  if (isNaN(num)) {
    return { isValid: false, errorMessage: 'Please enter a numeric signal-strength value.' };
  }

  if (num < 0) {
    return { isValid: false, errorMessage: 'Invalid signal strength. Enter a value from 0 to 100.' };
  }

  if (num > 100) {
    return { isValid: false, errorMessage: 'Invalid signal strength. Maximum value is 100.' };
  }

  return { isValid: true, numericValue: Math.round(num) };
}

export function classifySignalStrength(signal: number): WifiClassificationResult {
  if (signal >= 81 && signal <= 100) {
    return {
      bars: 3,
      classification: 'Excellent / Strong',
      color: '#16a34a', // green-600
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeText: 'text-emerald-700',
      borderColor: '#22c55e',
    };
  } else if (signal >= 40 && signal <= 80) {
    return {
      bars: 2,
      classification: 'Good / Moderate',
      color: '#ca8a04', // yellow-600
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeText: 'text-amber-700',
      borderColor: '#eab308',
    };
  } else if (signal >= 0 && signal <= 39) {
    return {
      bars: 1,
      classification: 'Weak',
      color: '#dc2626', // red-600
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeText: 'text-rose-700',
      borderColor: '#ef4444',
    };
  }

  // Fallback if boundary edge case
  return {
    bars: 1,
    classification: 'Weak',
    color: '#dc2626',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    badgeText: 'text-rose-700',
    borderColor: '#ef4444',
  };
}
