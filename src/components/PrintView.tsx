/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  StoreInfo,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  CableType,
} from '../types';
import { WifiSignalIcon } from './WifiSignalIcon';
import { Server, Network, Radio, Cable, ShieldCheck, Calendar, MapPin, User } from 'lucide-react';

interface PrintViewProps {
  storeInfo: StoreInfo;
  compositeDataUrl: string;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  forceVisibleForPreview?: boolean;
}

export const PrintView: React.FC<PrintViewProps> = ({
  storeInfo,
  compositeDataUrl,
  mdfDevices,
  idfDevices,
  accessPoints,
  signalReadings,
  lanCables,
  forceVisibleForPreview = false,
}) => {
  const totalCableLength = lanCables.reduce((acc, c) => acc + (c.length || 0), 0);

  const excellentCount = signalReadings.filter((s) => s.bars === 3).length;
  const goodCount = signalReadings.filter((s) => s.bars === 2).length;
  const weakCount = signalReadings.filter((s) => s.bars === 1).length;

  return (
    <div
      className={`${
        forceVisibleForPreview ? 'block' : 'hidden print:block'
      } w-full bg-white text-slate-900 font-sans print-report-container`}
      style={{ minHeight: '100%' }}
    >
      {/* Document Header */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-extrabold tracking-wider text-blue-700 uppercase">
            DECStudioAiCreation
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
            WIFI HITMAP
          </h1>
          <p className="text-xs font-bold text-slate-700 mt-0.5">
            WiFi Signal Strength & Network Infrastructure Plan
          </p>
        </div>

        <div className="text-right text-xs">
          <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
            Engineering Site Assessment
          </span>
          <span className="text-slate-500 text-[10px]">
            Generated: {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Branch Information Grid (#104, #184) */}
      <div className="grid grid-cols-4 gap-3 p-3 rounded-lg border border-slate-300 bg-slate-50/70 mb-4 text-xs">
        <div>
          <span className="font-bold uppercase text-slate-500 text-[10px] block">Branch Name</span>
          <span className="font-bold text-slate-900 text-sm block">
            {storeInfo.branchName || storeInfo.storeName || 'Branch'}
          </span>
          {(storeInfo.branchCode || storeInfo.storeCode) && (
            <span className="text-slate-500 font-mono text-[11px]">
              Code: {storeInfo.branchCode || storeInfo.storeCode}
            </span>
          )}
        </div>

        <div>
          <span className="font-bold uppercase text-slate-500 text-[10px] block">Location / Area</span>
          <span className="font-semibold text-slate-800 block">
            {storeInfo.location || 'Main Floor'}
          </span>
          <span className="text-slate-500 text-[11px] block">{storeInfo.floorArea || 'Level 1'}</span>
        </div>

        <div>
          <span className="font-bold uppercase text-slate-500 text-[10px] block">Assessment Date</span>
          <span className="font-semibold text-slate-800 block">
            {storeInfo.assessmentDate || 'Current'}
          </span>
        </div>

        <div>
          <span className="font-bold uppercase text-slate-500 text-[10px] block">Prepared By</span>
          <span className="font-semibold text-slate-800 block">
            {storeInfo.preparedBy || 'Field IT Technician'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {storeInfo.position || 'IT Infrastructure Operations'}
          </span>
        </div>
      </div>

      {/* Floor Plan Composite (#104: Visible Floor Plan scaled properly preserving aspect ratio) */}
      <div className="mb-4 rounded-lg border border-slate-300 p-2 bg-white">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            FLOOR PLAN OVERLAY — INFRASTRUCTURE & SIGNAL READINGS
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {mdfDevices.length} MDF • {idfDevices.length} IDF • {accessPoints.length} AP • {lanCables.length} LAN Runs
          </span>
        </div>
        {compositeDataUrl ? (
          <div className="flex justify-center bg-slate-50 rounded border border-slate-200 overflow-hidden">
            <img
              src={compositeDataUrl}
              alt="Branch WiFi Hitmap and Network Plan"
              className="w-full max-h-[460px] object-contain"
            />
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-slate-400 italic text-xs border border-dashed rounded">
            Floor plan visual preview will render here
          </div>
        )}
      </div>

      {/* DEDICATED LEGENDS (#104: WIFI SIGNAL LEGEND & NETWORK INFRASTRUCTURE LEGEND) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* WIFI SIGNAL LEGEND */}
        <div className="border border-slate-300 rounded-lg p-3 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
            <span>WIFI SIGNAL LEGEND</span>
            <span className="text-[10px] font-normal text-slate-500">Signal Range (0–100)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                <WifiSignalIcon bars={3} size={15} activeColor="#16a34a" />
                <span>81–100 (3 Bars)</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">
                Excellent / Strong ({excellentCount})
              </span>
            </div>

            <div className="p-2 rounded bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px]">
                <WifiSignalIcon bars={2} size={15} activeColor="#d97706" />
                <span>40–80 (2 Bars)</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 block mt-0.5">
                Good / Moderate ({goodCount})
              </span>
            </div>

            <div className="p-2 rounded bg-rose-50 border border-rose-200">
              <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px]">
                <WifiSignalIcon bars={1} size={15} activeColor="#dc2626" />
                <span>0–39 (1 Bar)</span>
              </div>
              <span className="text-[10px] font-semibold text-rose-700 block mt-0.5">
                Weak / Warning ({weakCount})
              </span>
            </div>
          </div>
        </div>

        {/* NETWORK INFRASTRUCTURE LEGEND */}
        <div className="border border-slate-300 rounded-lg p-3 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
            <span>NETWORK INFRASTRUCTURE LEGEND</span>
            <span className="text-[10px] font-normal text-slate-500">Hardware & Cabling</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="p-1.5 rounded bg-blue-50 border border-blue-200 text-center">
              <div className="flex items-center justify-center gap-1 font-bold text-blue-900 text-[11px]">
                <Server className="h-3.5 w-3.5 text-blue-600" />
                <span>MDF</span>
              </div>
              <span className="text-[9px] text-blue-700 block mt-0.5">Server Cabinet ({mdfDevices.length})</span>
            </div>

            <div className="p-1.5 rounded bg-teal-50 border border-teal-200 text-center">
              <div className="flex items-center justify-center gap-1 font-bold text-teal-900 text-[11px]">
                <Network className="h-3.5 w-3.5 text-teal-600" />
                <span>IDF</span>
              </div>
              <span className="text-[9px] text-teal-700 block mt-0.5">Switch Hub ({idfDevices.length})</span>
            </div>

            <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-center">
              <div className="flex items-center justify-center gap-1 font-bold text-emerald-900 text-[11px]">
                <Radio className="h-3.5 w-3.5 text-emerald-600" />
                <span>AP</span>
              </div>
              <span className="text-[9px] text-emerald-700 block mt-0.5">Access Point ({accessPoints.length})</span>
            </div>

            <div className="p-1.5 rounded bg-indigo-50 border border-indigo-200 text-center">
              <div className="flex items-center justify-center gap-1 font-bold text-indigo-900 text-[11px]">
                <Cable className="h-3.5 w-3.5 text-indigo-600" />
                <span>LAN Cable</span>
              </div>
              <span className="text-[9px] text-indigo-700 block mt-0.5">
                {Math.round(totalCableLength * 10) / 10} m total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LAN CABLE SUMMARY TABLE (#104) */}
      <div className="border border-slate-300 rounded-lg p-3 mb-4 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            LAN CABLE SUMMARY & ROUTE SCHEDULE
          </span>
          <span className="text-xs font-mono font-bold text-indigo-900">
            Total Cable Length: {Math.round(totalCableLength * 10) / 10} Meters ({lanCables.length} Runs)
          </span>
        </div>

        {lanCables.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2 text-center">
            No LAN cable connections recorded in this project.
          </p>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-semibold text-[11px]">
                <th className="py-1 px-2">Cable ID</th>
                <th className="py-1 px-2">From (Source)</th>
                <th className="py-1 px-2">To (Destination)</th>
                <th className="py-1 px-2">Cable Type</th>
                <th className="py-1 px-2 text-right">Length (Meters)</th>
                <th className="py-1 px-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {lanCables.map((c) => (
                <tr key={`print-cable-${c.id}`} className="border-b border-slate-100 text-[11px]">
                  <td className="py-1 px-2 font-mono font-bold text-indigo-900">{c.id}</td>
                  <td className="py-1 px-2">{c.fromName}</td>
                  <td className="py-1 px-2">{c.toName}</td>
                  <td className="py-1 px-2 font-semibold">{c.cableType}</td>
                  <td className="py-1 px-2 text-right font-mono font-bold">{c.length} m</td>
                  <td className="py-1 px-2 text-slate-500 truncate max-w-[200px]">{c.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sign-off / Verification section (#184, #190) */}
      <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-300 text-xs">
        <div>
          <span className="font-bold text-slate-900 block mb-1">
            Prepared By (IT Infrastructure / Survey Engineer):
          </span>
          <div className="text-slate-800 font-semibold text-xs mb-0.5">
            {storeInfo.preparedBy || 'Field IT Specialist'}
          </div>
          <div className="text-slate-500 text-[11px] mb-4">
            {storeInfo.position || 'IT Infrastructure Operations'}
          </div>
          <div className="border-b border-slate-400 w-3/4 mb-1" />
          <span className="text-slate-500 text-[10px]">Signature & Verification Date</span>
        </div>

        <div>
          <span className="font-bold text-slate-900 block mb-1">
            Acknowledged & Approved By (Branch Management):
          </span>
          <div className="text-slate-800 font-semibold text-xs mb-0.5">
            {storeInfo.acknowledgedBy || 'Branch / Operations Lead'}
          </div>
          <div className="text-slate-500 text-[11px] mb-4">
            {storeInfo.acknowledgedPosition || 'Branch Manager / Site Lead'}
          </div>
          <div className="border-b border-slate-400 w-3/4 mb-1" />
          <span className="text-slate-500 text-[10px]">Signature & Approval Date</span>
        </div>
      </div>

      {/* Footer Branding (#184) */}
      <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400">
        DECStudioAiCreation • WIFI HITMAP Network Infrastructure Planning & Signal Survey System
      </div>
    </div>
  );
};
