/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SignalReading } from '../../types';
import { Activity, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';

interface WifiCoverageSummaryPanelProps {
  apCount: number;
  signals: SignalReading[];
}

export const WifiCoverageSummaryPanel: React.FC<WifiCoverageSummaryPanelProps> = ({
  apCount,
  signals,
}) => {
  const totalReadings = signals.length;
  const excellentCount = signals.filter((s) => s.bars === 3).length;
  const goodCount = signals.filter((s) => s.bars === 2).length;
  const weakCount = signals.filter((s) => s.bars === 1).length;

  // Calculate Health
  let healthText = 'NO DATA';
  let healthBadge = 'bg-slate-100 text-slate-700 border-slate-200';
  if (totalReadings > 0) {
    const weakPct = (weakCount / totalReadings) * 100;
    const strongPct = (excellentCount / totalReadings) * 100;

    if (weakCount === 0 && strongPct >= 70) {
      healthText = 'EXCELLENT';
      healthBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    } else if (weakPct <= 15) {
      healthText = 'GOOD';
      healthBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    } else if (weakPct <= 30) {
      healthText = 'FAIR / MODERATE';
      healthBadge = 'bg-amber-50 text-amber-800 border-amber-300';
    } else {
      healthText = 'ATTENTION NEEDED';
      healthBadge = 'bg-rose-50 text-rose-800 border-rose-300';
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <Wifi className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              WIFI COVERAGE SUMMARY
            </h3>
            <p className="text-[11px] text-slate-500">Signal-strength distribution</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${healthBadge}`}>
          {healthText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 uppercase font-medium">Access Points</span>
          <div className="text-lg font-bold font-mono text-slate-900">{apCount}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 uppercase font-medium">Measurements</span>
          <div className="text-lg font-bold font-mono text-slate-900">{totalReadings}</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="font-semibold text-emerald-900">81–100 (3 Bars)</span>
            <span className="text-emerald-700 text-[11px]">Excellent</span>
          </div>
          <span className="font-bold font-mono text-emerald-950">{excellentCount}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-amber-900">40–80 (2 Bars)</span>
            <span className="text-amber-700 text-[11px]">Good / Moderate</span>
          </div>
          <span className="font-bold font-mono text-amber-950">{goodCount}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            <span className="font-semibold text-rose-900">0–39 (1 Bar)</span>
            <span className="text-rose-700 text-[11px]">Weak</span>
          </div>
          <span className="font-bold font-mono text-rose-950">{weakCount}</span>
        </div>
      </div>

      {/* Coverage Attention or Status Alert (#31) */}
      {weakCount > 0 ? (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold uppercase text-[11px] tracking-wider text-rose-800">
              Coverage Attention
            </div>
            <p className="mt-0.5 text-rose-700 leading-snug">
              <strong>{weakCount}</strong> measurement {weakCount === 1 ? 'point is' : 'points are'}{' '}
              classified as <strong>WEAK</strong>. Review these areas for possible AP placement improvement.
            </p>
          </div>
        </div>
      ) : totalReadings > 0 ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900 flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold uppercase text-[11px] tracking-wider text-emerald-800">
              Coverage Status
            </div>
            <p className="mt-0.5 text-emerald-700 leading-snug">
              All measured points have adequate signal coverage.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
