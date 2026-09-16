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
  PrintConfiguration,
  DEFAULT_PRINT_CONFIG,
} from '../types';
import { WifiSignalIcon } from './WifiSignalIcon';
import {
  Server,
  Network,
  Radio,
  Cable,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Info,
} from 'lucide-react';

interface PrintViewProps {
  storeInfo: StoreInfo;
  compositeDataUrl: string;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  printConfig?: PrintConfiguration;
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
  printConfig = DEFAULT_PRINT_CONFIG,
  forceVisibleForPreview = false,
}) => {
  const options = printConfig.options;
  const totalCableLength = lanCables.reduce((acc, c) => acc + (c.length || 0), 0);

  const totalReadings = signalReadings.length;
  const excellentCount = signalReadings.filter((s) => s.bars === 3).length;
  const goodCount = signalReadings.filter((s) => s.bars === 2).length;
  const weakCount = signalReadings.filter((s) => s.bars === 1).length;

  const excellentPct = totalReadings > 0 ? Math.round((excellentCount / totalReadings) * 100) : 0;
  const goodPct = totalReadings > 0 ? Math.round((goodCount / totalReadings) * 100) : 0;
  const weakPct = totalReadings > 0 ? Math.round((weakCount / totalReadings) * 100) : 0;

  // Technical RF & Throughput calculations
  let dbmSum = 0;
  let dbmCount = 0;
  let minDbm: number | undefined = undefined;
  let maxDbm: number | undefined = undefined;

  let speedSum = 0;
  let speedCount = 0;
  let minSpeed: number | undefined = undefined;
  let maxSpeed: number | undefined = undefined;

  signalReadings.forEach((s) => {
    if (typeof s.dbm === 'number' && !isNaN(s.dbm)) {
      dbmSum += s.dbm;
      dbmCount++;
      if (minDbm === undefined || s.dbm < minDbm) minDbm = s.dbm;
      if (maxDbm === undefined || s.dbm > maxDbm) maxDbm = s.dbm;
    }
    if (typeof s.speedMbps === 'number' && !isNaN(s.speedMbps)) {
      speedSum += s.speedMbps;
      speedCount++;
      if (minSpeed === undefined || s.speedMbps < minSpeed) minSpeed = s.speedMbps;
      if (maxSpeed === undefined || s.speedMbps > maxSpeed) maxSpeed = s.speedMbps;
    }
  });

  const avgDbm = dbmCount > 0 ? Math.round((dbmSum / dbmCount) * 10) / 10 : undefined;
  const avgSpeed = speedCount > 0 ? Math.round((speedSum / speedCount) * 10) / 10 : undefined;

  // Decide which pages to show based on preset and options
  const showPage1 = options.includeFloorPlan || options.includeSignalLegend || options.includeInfrastructureLegend;
  const showPage2 =
    printConfig.mode === 'complete' &&
    (options.includeInsights || options.includeRecommendations);
  const showPage3 =
    (printConfig.mode === 'complete' || printConfig.mode === 'standard') &&
    (options.includeCableSchedule || options.includeSummary || options.includeSignOff);

  const totalPages = (showPage1 ? 1 : 0) + (showPage2 ? 1 : 0) + (showPage3 ? 1 : 0);
  let currentPageCounter = 0;

  return (
    <div
      className={`${
        forceVisibleForPreview ? 'block' : 'hidden print:block'
      } w-full bg-white text-slate-900 font-sans print-report-container`}
    >
      {/* ========================================================================= */}
      {/* PAGE 1: FLOOR PLAN (DOMINANT VISUAL FOCUS) (#251)                          */}
      {/* ========================================================================= */}
      {showPage1 && (
        <div
          className="print-page flex flex-col justify-between bg-white text-slate-900 p-4 border-b-2 border-dashed border-slate-200 print:border-none print:p-0 print:m-0"
          style={{ minHeight: forceVisibleForPreview ? 'auto' : '100vh' }}
        >
          <div>
            {/* Header Banner */}
            <div className="border-b-2 border-slate-900 pb-2 mb-3 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-extrabold tracking-wider text-blue-700 uppercase">
                  DECStudioAiCreation • Professional Survey v1.0.2
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-none">
                  WIFI HITMAP
                </h1>
                <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                  WiFi Signal Strength & Network Infrastructure Plan
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Site Engineering Survey
                </span>
                <span className="text-slate-500 text-[10px]">
                  Date: {storeInfo.assessmentDate || new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Branch Information Bar */}
            <div className="grid grid-cols-4 gap-2 p-2 rounded border border-slate-300 bg-slate-50/80 mb-3 text-xs">
              <div>
                <span className="font-bold uppercase text-slate-500 text-[9px] block">Branch Name</span>
                <span className="font-bold text-slate-900 text-xs block truncate">
                  {storeInfo.branchName || storeInfo.storeName || 'Branch'}
                </span>
                {(storeInfo.branchCode || storeInfo.storeCode) && (
                  <span className="text-slate-500 font-mono text-[10px]">
                    Code: {storeInfo.branchCode || storeInfo.storeCode}
                  </span>
                )}
              </div>

              <div>
                <span className="font-bold uppercase text-slate-500 text-[9px] block">Location / Area</span>
                <span className="font-semibold text-slate-800 text-xs block truncate">
                  {storeInfo.location || 'Retail Floor'}
                </span>
                <span className="text-slate-500 text-[10px] block truncate">
                  {storeInfo.floorArea || 'Level 1'}
                </span>
              </div>

              <div>
                <span className="font-bold uppercase text-slate-500 text-[9px] block">Prepared By</span>
                <span className="font-semibold text-slate-800 text-xs block truncate">
                  {storeInfo.preparedBy || 'Field IT Engineer'}
                </span>
                <span className="text-slate-500 text-[10px] block truncate">
                  {storeInfo.position || 'Infrastructure Ops'}
                </span>
              </div>

              <div>
                <span className="font-bold uppercase text-slate-500 text-[9px] block">Device Count</span>
                <span className="font-semibold text-slate-800 text-xs block font-mono">
                  {mdfDevices.length} MDF • {idfDevices.length} IDF • {accessPoints.length} AP
                </span>
                <span className="text-slate-500 text-[10px] block font-mono">
                  {lanCables.length} Cables ({Math.round(totalCableLength * 10) / 10} m)
                </span>
              </div>
            </div>

            {/* Visual Floor Plan (Takes 70% to 85% of available space) */}
            {options.includeFloorPlan && (
              <div className="rounded-lg border border-slate-300 p-2 bg-white mb-3">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    FLOOR PLAN OVERLAY — INFRASTRUCTURE, DEVICES & SIGNAL READINGS
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    High-Resolution 1:1 Scale
                  </span>
                </div>

                {compositeDataUrl ? (
                  <div className="flex justify-center bg-slate-50 rounded border border-slate-200 overflow-hidden max-h-[540px] print:max-h-[580px]">
                    <img
                      src={compositeDataUrl}
                      alt="Floor Plan Network Composite"
                      className="w-full h-auto object-contain max-h-[540px] print:max-h-[580px]"
                    />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 italic text-xs border border-dashed rounded">
                    Composite floor plan rendering...
                  </div>
                )}
              </div>
            )}

            {/* Side-by-Side Compact Legends */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              {/* WiFi Signal Strength Legend */}
              {options.includeSignalLegend && (
                <div className="border border-slate-300 rounded p-2 bg-white">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                    <span>WIFI SIGNAL LEGEND</span>
                    <span className="text-[9px] text-slate-500">0–100 Scale</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="p-1 rounded bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-1 font-bold text-emerald-800">
                        <WifiSignalIcon bars={3} size={13} activeColor="#16a34a" />
                        <span>81–100</span>
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-700 block">
                        Excellent ({excellentCount})
                      </span>
                    </div>

                    <div className="p-1 rounded bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-1 font-bold text-amber-800">
                        <WifiSignalIcon bars={2} size={13} activeColor="#d97706" />
                        <span>40–80</span>
                      </div>
                      <span className="text-[9px] font-semibold text-amber-700 block">
                        Good ({goodCount})
                      </span>
                    </div>

                    <div className="p-1 rounded bg-rose-50 border border-rose-200">
                      <div className="flex items-center gap-1 font-bold text-rose-800">
                        <WifiSignalIcon bars={1} size={13} activeColor="#dc2626" />
                        <span>0–39</span>
                      </div>
                      <span className="text-[9px] font-semibold text-rose-700 block">
                        Weak ({weakCount})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Network Infrastructure Legend */}
              {options.includeInfrastructureLegend && (
                <div className="border border-slate-300 rounded p-2 bg-white">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                    <span>NETWORK INFRASTRUCTURE LEGEND</span>
                    <span className="text-[9px] text-slate-500">Hardware Symbols</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    <div className="p-1 rounded bg-blue-50 border border-blue-200 text-center">
                      <div className="flex items-center justify-center gap-1 font-bold text-blue-900">
                        <Server className="h-3 w-3 text-blue-600" />
                        <span>MDF</span>
                      </div>
                      <span className="text-[8.5px] text-blue-700 block">Server ({mdfDevices.length})</span>
                    </div>

                    <div className="p-1 rounded bg-teal-50 border border-teal-200 text-center">
                      <div className="flex items-center justify-center gap-1 font-bold text-teal-900">
                        <Network className="h-3 w-3 text-teal-600" />
                        <span>IDF</span>
                      </div>
                      <span className="text-[8.5px] text-teal-700 block">Hub ({idfDevices.length})</span>
                    </div>

                    <div className="p-1 rounded bg-emerald-50 border border-emerald-200 text-center">
                      <div className="flex items-center justify-center gap-1 font-bold text-emerald-900">
                        <Radio className="h-3 w-3 text-emerald-600" />
                        <span>AP</span>
                      </div>
                      <span className="text-[8.5px] text-emerald-700 block">Access Pt ({accessPoints.length})</span>
                    </div>

                    <div className="p-1 rounded bg-indigo-50 border border-indigo-200 text-center">
                      <div className="flex items-center justify-center gap-1 font-bold text-indigo-900">
                        <Cable className="h-3 w-3 text-indigo-600" />
                        <span>LAN</span>
                      </div>
                      <span className="text-[8.5px] text-indigo-700 block">
                        {Math.round(totalCableLength * 10) / 10} m
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Page 1 Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>DECStudioAiCreation • WIFI HITMAP v1.0.2</span>
            <span>
              Page {++currentPageCounter} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: ENGINEERING INSIGHTS & RECOMMENDATIONS (#251)                      */}
      {/* ========================================================================= */}
      {showPage2 && (
        <div
          className="print-page flex flex-col justify-between bg-white text-slate-900 p-4 border-b-2 border-dashed border-slate-200 print:border-none print:p-0 print:m-0 print:mt-6"
          style={{ minHeight: forceVisibleForPreview ? 'auto' : '100vh' }}
        >
          <div>
            {/* Header Banner */}
            <div className="border-b-2 border-slate-900 pb-2 mb-4 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-extrabold tracking-wider text-blue-700 uppercase">
                  Engineering Analysis & Recommendations
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase leading-none">
                  WiFi Coverage Health & Site Evaluation
                </h2>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-500 text-[10px]">
                  Branch: {storeInfo.branchName || storeInfo.storeName || 'Branch'}
                </span>
              </div>
            </div>

            {/* Coverage Statistics Cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Readings</span>
                <span className="text-2xl font-black text-slate-900">{totalReadings}</span>
                <span className="text-[10px] text-slate-400 block">Sample Survey Points</span>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Excellent Coverage</span>
                <span className="text-2xl font-black text-emerald-800">{excellentPct}%</span>
                <span className="text-[10px] text-emerald-600 block">{excellentCount} points (81–100)</span>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Good Coverage</span>
                <span className="text-2xl font-black text-amber-800">{goodPct}%</span>
                <span className="text-[10px] text-amber-600 block">{goodCount} points (40–80)</span>
              </div>

              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Weak / Dead Zone</span>
                <span className="text-2xl font-black text-rose-800">{weakPct}%</span>
                <span className="text-[10px] text-rose-600 block">{weakCount} points (0–39)</span>
              </div>
            </div>

            {/* Optional RF Signal Power & Throughput Summary Cards */}
            {(dbmCount > 0 || speedCount > 0) && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      Recorded RF Signal Power
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {dbmCount > 0 ? `Range: ${minDbm} to ${maxDbm} dBm (${dbmCount} points)` : 'No readings'}
                    </span>
                  </div>
                  {avgDbm !== undefined && (
                    <span className="text-lg font-black font-mono text-slate-900">
                      {avgDbm} <span className="text-[10px] font-normal text-slate-500">dBm avg</span>
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase block">
                      Measured Data Throughput
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {speedCount > 0 ? `Range: ${minSpeed} to ${maxSpeed} Mbps (${speedCount} tests)` : 'No tests'}
                    </span>
                  </div>
                  {avgSpeed !== undefined && (
                    <span className="text-lg font-black font-mono text-blue-700">
                      {avgSpeed} <span className="text-[10px] font-normal text-slate-500">Mbps avg</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Key Engineering Insights */}
            {options.includeInsights && (
              <div className="border border-slate-300 rounded-lg p-3 mb-4 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Infrastructure & Coverage Insights
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Access Point Density: </span>
                      <span>
                        Currently deploying {accessPoints.length} Access Point(s) supporting{' '}
                        {signalReadings.length} measured operational zones. Coverage ratio is{' '}
                        {accessPoints.length > 0
                          ? Math.round(signalReadings.length / accessPoints.length)
                          : 0}{' '}
                        readings per AP.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Cabling Infrastructure: </span>
                      <span>
                        Total LAN cabling runs: {lanCables.length} connection(s) spanning a measured{' '}
                        {Math.round(totalCableLength * 10) / 10} meters across MDF server cabinet and{' '}
                        {idfDevices.length} IDF distribution switch hub(s).
                      </span>
                    </div>
                  </div>

                  {weakCount > 0 && (
                    <div className="flex items-start gap-2 p-2 rounded bg-rose-50 border border-rose-200">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-900">Coverage Vulnerability: </span>
                        <span>
                          Identified {weakCount} weak spot(s) below acceptable operational threshold (39
                          or lower). Recommended for remediation prior to POS / handheld deployment.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actionable Recommendations */}
            {options.includeRecommendations && (
              <div className="border border-slate-300 rounded-lg p-3 mb-4 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Actionable Recommendations & Remediation Plan
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded border border-slate-200 bg-white">
                    <span className="font-bold text-indigo-900 block mb-0.5">
                      1. AP Placement Optimization
                    </span>
                    <p className="text-slate-600 text-[11px]">
                      Ensure access points are ceiling-mounted at least 2.8m above finished floor level
                      away from heavy metal shelving or refrigeration units to minimize signal attenuation.
                    </p>
                  </div>

                  <div className="p-2 rounded border border-slate-200 bg-white">
                    <span className="font-bold text-indigo-900 block mb-0.5">
                      2. Cable Certification & Channel Standards
                    </span>
                    <p className="text-slate-600 text-[11px]">
                      Verify all Category 6 / 6A horizontal cabling runs conform strictly to the 90m
                      permanent link limit. Utilize certified patch panels inside IDF distribution cabinets.
                    </p>
                  </div>

                  <div className="p-2 rounded border border-slate-200 bg-white">
                    <span className="font-bold text-indigo-900 block mb-0.5">
                      3. Frequency Band Balancing & Roaming
                    </span>
                    <p className="text-slate-600 text-[11px]">
                      Configure 5 GHz band steering for mobile POS and scanner terminals to prevent 2.4 GHz
                      co-channel congestion during peak operational hours.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page 2 Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>DECStudioAiCreation • WIFI HITMAP v1.0.2</span>
            <span>
              Page {++currentPageCounter} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: LAN CABLE SCHEDULE & EXECUTIVE SUMMARY (#251)                      */}
      {/* ========================================================================= */}
      {showPage3 && (
        <div
          className="print-page flex flex-col justify-between bg-white text-slate-900 p-4 print:border-none print:p-0 print:m-0 print:mt-6"
          style={{ minHeight: forceVisibleForPreview ? 'auto' : '100vh' }}
        >
          <div>
            {/* Header Banner */}
            <div className="border-b-2 border-slate-900 pb-2 mb-4 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-extrabold tracking-wider text-blue-700 uppercase">
                  Infrastructure Documentation & Sign-Off
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase leading-none">
                  Cable Run Schedule & Verification
                </h2>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-500 text-[10px]">
                  Branch: {storeInfo.branchName || storeInfo.storeName || 'Branch'}
                </span>
              </div>
            </div>

            {/* LAN Cable Summary Table */}
            {options.includeCableSchedule && (
              <div className="border border-slate-300 rounded-lg p-3 mb-4 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    LAN CABLE RUN SCHEDULE
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
            )}

            {/* Executive Summary */}
            {options.includeSummary && (
              <div className="border border-slate-300 rounded-lg p-3 mb-4 bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block border-b border-slate-200 pb-1 mb-2">
                  Executive Assessment Verdict
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  This site survey and infrastructure plan certifies that {storeInfo.branchName || 'the branch'}{' '}
                  has been surveyed with a total of {signalReadings.length} measurement points.{' '}
                  {excellentPct >= 70
                    ? 'The wireless network demonstrates robust signal integrity suitable for mission-critical enterprise operations.'
                    : 'The wireless coverage exhibits areas requiring signal reinforcement as detailed in the recommendations section.'}
                </p>
              </div>
            )}

            {/* Official Dual Signature & Sign-Off Section */}
            {options.includeSignOff && (
              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block mb-3">
                  Verification & Official Approval
                </span>
                <div className="grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">
                      Prepared By (IT Survey Engineer):
                    </span>
                    <div className="text-slate-800 font-semibold text-xs mb-0.5">
                      {storeInfo.preparedBy || 'Field IT Specialist'}
                    </div>
                    <div className="text-slate-500 text-[11px] mb-6">
                      {storeInfo.position || 'IT Infrastructure Operations'}
                    </div>
                    <div className="border-b border-slate-400 w-4/5 mb-1" />
                    <span className="text-slate-500 text-[10px]">Signature & Date</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block mb-1">
                      Acknowledged & Approved By (Branch Management):
                    </span>
                    <div className="text-slate-800 font-semibold text-xs mb-0.5">
                      {storeInfo.acknowledgedBy || 'Branch Operations Lead'}
                    </div>
                    <div className="text-slate-500 text-[11px] mb-6">
                      {storeInfo.acknowledgedPosition || 'Branch Manager / Site Lead'}
                    </div>
                    <div className="border-b border-slate-400 w-4/5 mb-1" />
                    <span className="text-slate-500 text-[10px]">Signature & Date</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page 3 Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>DECStudioAiCreation • WIFI HITMAP v1.0.2</span>
            <span>
              Page {++currentPageCounter} of {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
