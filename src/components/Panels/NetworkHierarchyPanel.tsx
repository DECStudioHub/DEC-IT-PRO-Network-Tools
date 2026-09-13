/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MDFDevice, IDFDevice, AccessPoint, LanCable } from '../../types';
import { Server, Network, Radio, Cable, ArrowDown, GitBranch } from 'lucide-react';

interface NetworkHierarchyPanelProps {
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  lanCables: LanCable[];
  onSelectDevice?: (deviceId: string) => void;
}

export const NetworkHierarchyPanel: React.FC<NetworkHierarchyPanelProps> = ({
  mdfDevices,
  idfDevices,
  accessPoints,
  lanCables,
  onSelectDevice,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              NETWORK TOPOLOGY & HIERARCHY
            </h3>
            <p className="text-[11px] text-slate-500">MDF → IDF → Access Point Distribution</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {mdfDevices.map((mdf) => {
          // Find cables originating from or connected to this MDF
          const mdfCables = lanCables.filter((c) => c.fromId === mdf.id || c.toId === mdf.id);

          return (
            <div key={mdf.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              {/* MDF Root */}
              <div
                onClick={() => onSelectDevice?.(mdf.id)}
                className="flex items-center justify-between p-2 rounded-lg bg-blue-600 text-white shadow-xs cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span className="text-xs font-bold font-mono">{mdf.id}</span>
                  <span className="text-xs text-blue-100 font-medium">SERVER CABINET</span>
                </div>
                <span className="text-[11px] bg-blue-700 px-2 py-0.5 rounded text-blue-100">
                  {mdf.location}
                </span>
              </div>

              {/* IDFs connected */}
              <div className="pl-4 mt-3 space-y-3 border-l-2 border-dashed border-blue-200 ml-3">
                {idfDevices.map((idf) => {
                  // Check cable between this MDF and IDF
                  const uplinkCable = lanCables.find(
                    (c) =>
                      (c.fromId === mdf.id && c.toId === idf.id) ||
                      (c.fromId === idf.id && c.toId === mdf.id)
                  );

                  // APs connected to this IDF
                  const idfAps = accessPoints.filter((ap) => {
                    return lanCables.some(
                      (c) =>
                        (c.fromId === idf.id && c.toId === ap.id) ||
                        (c.fromId === ap.id && c.toId === idf.id)
                    );
                  });

                  return (
                    <div key={idf.id} className="rounded-md border border-slate-200 bg-white p-2.5 shadow-2xs">
                      {/* Uplink cable tag */}
                      {uplinkCable && (
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                          <Cable className="h-3 w-3 shrink-0" />
                          <span className="font-semibold">{uplinkCable.id}:</span>
                          <span>{uplinkCable.length} m</span>
                          <span className="text-indigo-500 font-sans">• {uplinkCable.cableType}</span>
                        </div>
                      )}

                      {/* IDF Node */}
                      <div
                        onClick={() => onSelectDevice?.(idf.id)}
                        className="flex items-center justify-between p-1.5 rounded bg-teal-50 border border-teal-200 cursor-pointer hover:bg-teal-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Network className="h-3.5 w-3.5 text-teal-700" />
                          <span className="text-xs font-bold font-mono text-teal-900">{idf.id}</span>
                          <span className="text-[11px] text-teal-700">SWITCH HUB ({idf.area})</span>
                        </div>
                        <span className="text-[10px] text-teal-600">{idf.location}</span>
                      </div>

                      {/* Access Points connected to this IDF */}
                      {idfAps.length > 0 && (
                        <div className="pl-3 mt-2 space-y-1.5 border-l-2 border-slate-200 ml-2">
                          {idfAps.map((ap) => {
                            const apCable = lanCables.find(
                              (c) =>
                                (c.fromId === idf.id && c.toId === ap.id) ||
                                (c.fromId === ap.id && c.toId === idf.id)
                            );

                            return (
                              <div
                                key={ap.id}
                                onClick={() => onSelectDevice?.(ap.id)}
                                className="flex items-center justify-between py-1 px-2 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Radio className="h-3 w-3 text-emerald-600" />
                                  <span className="font-mono font-bold text-slate-800">{ap.id}</span>
                                  <span className="text-slate-500 text-[11px]">{ap.name}</span>
                                </div>
                                {apCable && (
                                  <span className="font-mono text-[11px] text-indigo-700 font-semibold bg-indigo-50/70 px-1.5 py-0.5 rounded">
                                    {apCable.length} m ({apCable.cableType})
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Direct MDF to AP runs (e.g. Server Room AP or Warehouse) */}
                {accessPoints
                  .filter((ap) => {
                    return lanCables.some(
                      (c) =>
                        (c.fromId === mdf.id && c.toId === ap.id) ||
                        (c.fromId === ap.id && c.toId === mdf.id)
                    );
                  })
                  .map((ap) => {
                    const directCable = lanCables.find(
                      (c) =>
                        (c.fromId === mdf.id && c.toId === ap.id) ||
                        (c.fromId === ap.id && c.toId === mdf.id)
                    );
                    return (
                      <div
                        key={`mdf-direct-${ap.id}`}
                        onClick={() => onSelectDevice?.(ap.id)}
                        className="flex items-center justify-between p-2 rounded bg-emerald-50/70 border border-emerald-200 text-xs cursor-pointer hover:bg-emerald-100/60"
                      >
                        <div className="flex items-center gap-2">
                          <Radio className="h-3.5 w-3.5 text-emerald-700" />
                          <span className="font-mono font-bold text-emerald-900">{ap.id} (Direct from MDF)</span>
                          <span className="text-emerald-700 text-[11px]">{ap.location}</span>
                        </div>
                        {directCable && (
                          <span className="font-mono text-[11px] text-indigo-700 font-semibold bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {directCable.length} m {directCable.cableType}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}

        {mdfDevices.length === 0 && (
          <div className="space-y-2 py-1">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">MDF</span>
              <p className="text-xs font-semibold text-slate-700">No MDF Added</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click “Add MDF” to add a Server Cabinet.</p>
            </div>

            {idfDevices.length === 0 && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">IDF</span>
                <p className="text-xs font-semibold text-slate-700">No IDF Added</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click “Add IDF” to add a Switch Hub.</p>
              </div>
            )}

            {accessPoints.length === 0 && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">ACCESS POINTS</span>
                <p className="text-xs font-semibold text-slate-700">No Access Points Added</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click “Add AP” to place a Wireless Access Point.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
