/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WifiSignalIcon } from '../WifiSignalIcon';
import { ChevronDown, ChevronUp, Server, Network, Radio, Cable, Layers } from 'lucide-react';

interface LegendOverlayProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const LegendOverlay: React.FC<LegendOverlayProps> = ({ isOpen, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-5 right-5 z-30 w-72 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl overflow-hidden select-none transition-all">
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wide">WIFI HITMAP & INFRASTRUCTURE LEGEND</span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Signal Strength */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              SIGNAL STRENGTH (0–100)
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                <div className="flex items-center gap-2">
                  <WifiSignalIcon bars={3} size={16} activeColor="#16a34a" />
                  <span className="font-bold text-slate-800">81–100</span>
                  <span className="text-slate-500 text-[11px]">3 Bars</span>
                </div>
                <span className="font-semibold text-emerald-700 text-[11px]">Excellent / Strong</span>
              </div>

              <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                <div className="flex items-center gap-2">
                  <WifiSignalIcon bars={2} size={16} activeColor="#d97706" />
                  <span className="font-bold text-slate-800">40–80</span>
                  <span className="text-slate-500 text-[11px]">2 Bars</span>
                </div>
                <span className="font-semibold text-amber-700 text-[11px]">Good / Moderate</span>
              </div>

              <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                <div className="flex items-center gap-2">
                  <WifiSignalIcon bars={1} size={16} activeColor="#dc2626" />
                  <span className="font-bold text-slate-800">0–39</span>
                  <span className="text-slate-500 text-[11px]">1 Bar</span>
                </div>
                <span className="font-semibold text-rose-700 text-[11px]">Weak</span>
              </div>
            </div>
          </div>

          {/* Network Devices */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              NETWORK INFRASTRUCTURE
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 rounded bg-blue-50/60 border border-blue-100 px-2 py-1">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-white shrink-0">
                  <Server className="h-3 w-3" />
                </div>
                <div>
                  <span className="font-bold font-mono text-blue-950">MDF</span>
                  <span className="text-slate-600 ml-1.5 text-[11px]">Server Cabinet</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded bg-teal-50/60 border border-teal-100 px-2 py-1">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-teal-600 text-white shrink-0">
                  <Network className="h-3 w-3" />
                </div>
                <div>
                  <span className="font-bold font-mono text-teal-950">IDF</span>
                  <span className="text-slate-600 ml-1.5 text-[11px]">Switch Hub for Selling Area</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded bg-emerald-50/60 border border-emerald-100 px-2 py-1">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-white shrink-0">
                  <Radio className="h-3 w-3" />
                </div>
                <div>
                  <span className="font-bold font-mono text-emerald-950">AP</span>
                  <span className="text-slate-600 ml-1.5 text-[11px]">Wireless Access Point</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded bg-indigo-50/60 border border-indigo-100 px-2 py-1">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white shrink-0">
                  <Cable className="h-3 w-3" />
                </div>
                <div>
                  <span className="font-bold font-mono text-indigo-950">LAN Cable</span>
                  <span className="text-slate-600 ml-1.5 text-[11px]">Route with Meters (CAT6/Fiber)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reading Interpretation Rule */}
          <div className="rounded-md bg-slate-100/80 p-2 text-[11px] text-slate-600 leading-snug border border-slate-200">
            <span className="font-bold text-slate-900">Black Numbers:</span> Floor plan WiFi signal measurement readings. The original numbers and floor plan remain unmodified.
          </div>
        </div>
      )}
    </div>
  );
};
