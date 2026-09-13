/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LanCable, CableType } from '../../types';
import { Cable, Layers, Hash } from 'lucide-react';

interface LanCableSummaryPanelProps {
  cables: LanCable[];
}

export const LanCableSummaryPanel: React.FC<LanCableSummaryPanelProps> = ({ cables }) => {
  const totalCount = cables.length;
  const totalLength = cables.reduce((sum, c) => sum + (c.length || 0), 0);

  // Group by cable type
  const typeMap: Record<CableType, { count: number; length: number }> = {
    CAT5e: { count: 0, length: 0 },
    CAT6: { count: 0, length: 0 },
    CAT6A: { count: 0, length: 0 },
    Fiber: { count: 0, length: 0 },
    Other: { count: 0, length: 0 },
  };

  cables.forEach((c) => {
    const t = c.cableType || 'Other';
    if (!typeMap[t]) {
      typeMap[t] = { count: 0, length: 0 };
    }
    typeMap[t].count += 1;
    typeMap[t].length += c.length || 0;
  });

  const typeColorMap: Record<CableType, { badge: string; text: string; dot: string }> = {
    CAT6: { badge: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-600' },
    CAT6A: { badge: 'bg-violet-50 border-violet-200', text: 'text-violet-700', dot: 'bg-violet-600' },
    Fiber: { badge: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    CAT5e: { badge: 'bg-slate-50 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' },
    Other: { badge: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
            <Cable className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              LAN CABLE SUMMARY
            </h3>
            <p className="text-[11px] text-slate-500">Calculated from user-entered routes</p>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
          {totalCount} {totalCount === 1 ? 'Route' : 'Routes'}
        </span>
      </div>

      {/* Main Totals */}
      <div className="grid grid-cols-2 gap-3 mb-3.5">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total LAN Cables
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {totalCount}
          </div>
        </div>
        <div className="rounded-lg bg-indigo-50/70 p-3 border border-indigo-100">
          <span className="text-[11px] font-medium text-indigo-700 uppercase tracking-wider">
            Total Cable Length
          </span>
          <div className="text-xl font-bold font-mono text-indigo-900 mt-0.5">
            {Math.round(totalLength * 10) / 10} <span className="text-sm font-sans font-medium">m</span>
          </div>
        </div>
      </div>

      {/* Breakdown by Cable Type */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
          <span>Cable Type Breakdown</span>
          <span>Meters</span>
        </div>

        {(Object.keys(typeMap) as CableType[])
          .filter((t) => typeMap[t].count > 0)
          .map((type) => {
            const data = typeMap[type];
            const styling = typeColorMap[type] || typeColorMap.Other;
            const pct = totalLength > 0 ? Math.round((data.length / totalLength) * 100) : 0;

            return (
              <div
                key={`cable-summary-${type}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs bg-slate-50/50"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${styling.dot}`} />
                  <span className="font-semibold text-slate-800">{type}</span>
                  <span className="text-slate-400">({data.count} cables)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">{pct}%</span>
                  <span className="font-bold font-mono text-slate-900">
                    {Math.round(data.length * 10) / 10} m
                  </span>
                </div>
              </div>
            );
          })}

        {totalCount === 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-center my-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">LAN CABLES</span>
            <p className="text-xs font-semibold text-slate-700">No LAN Cables Added</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Create a connection between network devices.</p>
          </div>
        )}
      </div>
    </div>
  );
};
