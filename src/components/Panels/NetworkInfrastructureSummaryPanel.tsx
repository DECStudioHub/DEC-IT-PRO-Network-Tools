/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MDFDevice, IDFDevice, AccessPoint, LanCable } from '../../types';
import { Server, Network, Radio, Cable } from 'lucide-react';

interface NetworkInfrastructureSummaryPanelProps {
  mdfCount: number;
  idfCount: number;
  apCount: number;
  cables: LanCable[];
}

export const NetworkInfrastructureSummaryPanel: React.FC<NetworkInfrastructureSummaryPanelProps> = ({
  mdfCount,
  idfCount,
  apCount,
  cables,
}) => {
  const lanCableCount = cables.length;
  const totalCableLength = cables.reduce((sum, c) => sum + (c.length || 0), 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            NETWORK INFRASTRUCTURE SUMMARY
          </h3>
          <p className="text-[11px] text-slate-500">Hardware & Cable inventory</p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
          Live Inventory
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* MDF Cabinets */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shrink-0">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 leading-tight">
              MDF / Server Cabinets
            </div>
            <div className="text-base font-bold font-mono text-slate-900">{mdfCount}</div>
          </div>
        </div>

        {/* IDF Cabinets */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white shrink-0">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 leading-tight">
              IDF / Switch Hubs
            </div>
            <div className="text-base font-bold font-mono text-slate-900">{idfCount}</div>
          </div>
        </div>

        {/* APs */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white shrink-0">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 leading-tight">
              Access Points
            </div>
            <div className="text-base font-bold font-mono text-slate-900">{apCount}</div>
          </div>
        </div>

        {/* LAN Cables */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white shrink-0">
            <Cable className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 leading-tight">
              LAN Cables
            </div>
            <div className="text-base font-bold font-mono text-slate-900">{lanCableCount}</div>
          </div>
        </div>
      </div>

      {/* Total Cable Length Bar */}
      <div className="mt-3 rounded-lg bg-indigo-50/80 border border-indigo-100 p-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-900">
          Total LAN Cable Length:
        </span>
        <span className="text-sm font-bold font-mono text-indigo-950">
          {Math.round(totalCableLength * 10) / 10} m
        </span>
      </div>
    </div>
  );
};
