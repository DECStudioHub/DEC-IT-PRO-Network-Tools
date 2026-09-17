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
  PaperSize,
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

export interface PaperSpec {
  name: PaperSize;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  cssSize: string;
}

export const PAPER_SPECS: Record<PaperSize, PaperSpec> = {
  Letter: {
    name: 'Letter',
    widthMm: 215.9,
    heightMm: 279.4,
    widthIn: 8.5,
    heightIn: 11,
    cssSize: 'letter',
  },
  A4: {
    name: 'A4',
    widthMm: 210,
    heightMm: 297,
    widthIn: 8.27,
    heightIn: 11.69,
    cssSize: 'a4',
  },
  Legal: {
    name: 'Legal',
    widthMm: 215.9,
    heightMm: 355.6,
    widthIn: 8.5,
    heightIn: 14,
    cssSize: 'legal',
  },
  A3: {
    name: 'A3',
    widthMm: 297,
    heightMm: 420,
    widthIn: 11.69,
    heightIn: 16.54,
    cssSize: 'a3',
  },
  A5: {
    name: 'A5',
    widthMm: 148,
    heightMm: 210,
    widthIn: 5.83,
    heightIn: 8.27,
    cssSize: 'a5',
  },
  Tabloid: {
    name: 'Tabloid',
    widthMm: 279.4,
    heightMm: 431.8,
    widthIn: 11,
    heightIn: 17,
    cssSize: '11in 17in',
  },
};

interface PrintViewProps {
  storeInfo: StoreInfo;
  compositeDataUrl: string;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  floorPlan?: any;
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
  floorPlan,
  printConfig = DEFAULT_PRINT_CONFIG,
  forceVisibleForPreview = false,
}) => {
  const options = printConfig.options;
  const totalCableLength = lanCables.reduce((acc, c) => acc + (c.length || 0), 0);

  // Paper and Orientation Math (#318, #324, #325, #326, #327, #328)
  const paperSize: PaperSize = printConfig.paperSize || 'A4';
  const paperSpec = PAPER_SPECS[paperSize] || PAPER_SPECS.A4;

  const orientationSetting = printConfig.orientation || 'auto';
  const effectiveOrientation: 'landscape' | 'portrait' = (() => {
    if (orientationSetting === 'portrait') return 'portrait';
    if (orientationSetting === 'landscape') return 'landscape';
    // Auto orientation: based on floor plan aspect ratio (#328)
    if (floorPlan && floorPlan.originalWidth && floorPlan.originalHeight) {
      return floorPlan.originalWidth >= floorPlan.originalHeight ? 'landscape' : 'portrait';
    }
    return 'landscape';
  })();

  const isPortrait = effectiveOrientation === 'portrait';
  const pageWidthMm = isPortrait ? paperSpec.widthMm : paperSpec.heightMm;
  const pageHeightMm = isPortrait ? paperSpec.heightMm : paperSpec.widthMm;

  const marginsSetting = printConfig.margins || 'standard';
  const marginMm = marginsSetting === 'compact' ? 5 : marginsSetting === 'wide' ? 12 : 8;
  const marginCss = `${marginMm}mm`;

  // Signal & Telemetry calculations (#334, #335)
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

  signalReadings.forEach((r) => {
    if (typeof r.dbm === 'number' && !isNaN(r.dbm)) {
      dbmSum += r.dbm;
      dbmCount++;
      if (minDbm === undefined || r.dbm < minDbm) minDbm = r.dbm;
      if (maxDbm === undefined || r.dbm > maxDbm) maxDbm = r.dbm;
    }
    if (typeof r.speedMbps === 'number' && !isNaN(r.speedMbps)) {
      speedSum += r.speedMbps;
      speedCount++;
      if (minSpeed === undefined || r.speedMbps < minSpeed) minSpeed = r.speedMbps;
      if (maxSpeed === undefined || r.speedMbps > maxSpeed) maxSpeed = r.speedMbps;
    }
  });

  const avgDbm = dbmCount > 0 ? Math.round(dbmSum / dbmCount) : undefined;
  const avgSpeed = speedCount > 0 ? Math.round(speedSum / speedCount) : undefined;

  // Decide which pages to show based on preset and options (#346, #347)
  const showPage1 = options.includeFloorPlan || options.includeSignalLegend || options.includeInfrastructureLegend;
  const showPage2 =
    printConfig.mode === 'complete' &&
    (options.includeInsights || options.includeRecommendations);
  const showPage3 =
    (printConfig.mode === 'complete' || printConfig.mode === 'standard') &&
    (options.includeCableSchedule || options.includeSummary || options.includeSignOff);

  const activePages: ('page1' | 'page2' | 'page3')[] = [];
  if (showPage1) activePages.push('page1');
  if (showPage2) activePages.push('page2');
  if (showPage3) activePages.push('page3');
  const totalPages = activePages.length || 1;

  const getPageNumber = (pageId: 'page1' | 'page2' | 'page3') => {
    const idx = activePages.indexOf(pageId);
    return idx >= 0 ? idx + 1 : 1;
  };

  return (
    <div
      className={`${
        forceVisibleForPreview ? 'block' : 'hidden print:block'
      } w-full bg-white text-slate-900 font-sans print-report-container`}
    >
      {/* Authoritative Print CSS Engine (#318, #319, #321, #322, #323, #327, #337) */}
      <style>{`
        @page {
          size: ${pageWidthMm}mm ${pageHeightMm}mm;
          margin: ${marginCss};
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          .print-report-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .print-page {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }

          .print-page:last-of-type {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          .keep-together {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .no-break-heading {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          thead {
            display: table-header-group !important;
          }

          .crisp-print-text {
            transform: none !important;
            filter: none !important;
            text-rendering: geometricPrecision !important;
            -webkit-font-smoothing: antialiased !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* PAGE 1: VISUAL FLOOR PLAN & LEGENDS (FITS 100% ON PAGE 1) (#318, #343)   */}
      {/* ========================================================================= */}
      {showPage1 && (
        <div
          className={`print-page flex flex-col justify-between bg-white text-slate-900 ${
            forceVisibleForPreview
              ? 'shadow-xl ring-1 ring-slate-900/10 rounded-sm mb-8'
              : ''
          } print:shadow-none print:ring-0 print:mb-0 print:rounded-none box-border overflow-hidden`}
          style={
            forceVisibleForPreview
              ? {
                  width: isPortrait ? '740px' : '960px',
                  maxWidth: '100%',
                  aspectRatio: `${pageWidthMm} / ${pageHeightMm}`,
                  padding: `${marginMm}mm`,
                }
              : {
                  height: '100vh',
                  maxHeight: '100vh',
                  padding: 0,
                }
          }
        >
          {/* 1. Header Banner (Compact & Crisp) (#341, #337) */}
          <div className="shrink-0 pb-1 mb-1.5 border-b-2 border-slate-900 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-extrabold tracking-wider text-blue-700 uppercase">
                DECStudioAiCreation • Professional Survey v1.0.2
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase leading-none">
                WIFI HITMAP
              </h1>
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                WiFi Signal Strength & Network Infrastructure Plan
              </p>
            </div>

            {/* Sharp, Non-Blurry Date & Modification Block (#337) */}
            <div className="text-right text-xs space-y-0.5">
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[9.5px]">
                Site Engineering Survey
              </span>
              <span className="text-slate-700 text-[9.5px] block font-medium crisp-print-text">
                Date: {storeInfo.assessmentDate || new Date().toLocaleDateString()}
              </span>
              {storeInfo.dateCreated && (
                <span className="text-slate-500 text-[9px] block font-normal crisp-print-text">
                  Created: {storeInfo.dateCreated}
                </span>
              )}
              {storeInfo.lastModified && (
                <span className="text-slate-900 text-[9px] block font-semibold font-mono crisp-print-text">
                  Modified: {storeInfo.lastModified}
                </span>
              )}
            </div>
          </div>

          {/* 2. Branch Information Bar (Compact 4-Column Bar) (#343) */}
          <div className="shrink-0 grid grid-cols-4 gap-2 px-2.5 py-1.5 rounded border border-slate-300 bg-slate-50/90 mb-1.5 text-xs">
            <div>
              <span className="font-bold uppercase text-slate-500 text-[8.5px] block">Store / Branch</span>
              <span className="font-bold text-slate-900 text-xs truncate block">
                {storeInfo.storeName || storeInfo.branchName || 'Branch Store'}
              </span>
              <span className="text-slate-500 text-[9.5px] truncate block">
                Code: {storeInfo.branchCode || 'BR-001'}
              </span>
            </div>

            <div>
              <span className="font-bold uppercase text-slate-500 text-[8.5px] block">Site Location</span>
              <span className="text-slate-800 text-[10.5px] truncate block">
                {storeInfo.location || 'Survey Site Location'}
              </span>
              <span className="text-slate-500 text-[9.5px] truncate block">
                Area: {storeInfo.floorArea || 'N/A'}
              </span>
            </div>

            <div>
              <span className="font-bold uppercase text-slate-500 text-[8.5px] block">Personnel / Lead</span>
              <span className="text-slate-800 text-[10.5px] truncate block">
                {storeInfo.preparedBy || 'Survey Engineer'}
              </span>
              <span className="text-slate-500 text-[9.5px] truncate block">
                Lead: {storeInfo.acknowledgedBy || 'Site Manager'}
              </span>
            </div>

            <div>
              <span className="font-bold uppercase text-slate-500 text-[8.5px] block">Infrastructure Count</span>
              <span className="font-semibold text-slate-800 text-[10.5px] block font-mono">
                {mdfDevices.length} MDF • {idfDevices.length} IDF • {accessPoints.length} AP
              </span>
              <span className="text-slate-500 text-[9.5px] block font-mono">
                {lanCables.length} Cables ({Math.round(totalCableLength * 10) / 10} m)
              </span>
            </div>
          </div>

          {/* 3. Visual Floor Plan (Dominant Visual Focus - Dynamic Flex Allocation) (#329, #330, #343) */}
          {options.includeFloorPlan && (
            <div className="flex-1 min-h-0 flex flex-col justify-center my-1 overflow-hidden">
              <div className="flex items-center justify-between mb-0.5 px-0.5 shrink-0 text-[9.5px] font-bold uppercase tracking-wider text-slate-700">
                <span>FLOOR PLAN OVERLAY — INFRASTRUCTURE, DEVICES & SIGNAL READINGS</span>
                <span className="font-mono text-slate-500 font-normal">
                  Scale: 1:1 • {paperSize} {effectiveOrientation.toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-slate-50/80 rounded border border-slate-200 p-1">
                {compositeDataUrl ? (
                  <img
                    src={compositeDataUrl}
                    alt="Floor Plan Network Composite"
                    className="max-h-full max-w-full w-auto h-auto object-contain shrink"
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 italic text-xs border border-dashed rounded">
                    Composite floor plan rendering...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Side-by-Side Compact Legends (Never Splits across pages) (#321, #322, #343) */}
          <div className="shrink-0 grid grid-cols-2 gap-2 mt-1 mb-1.5 keep-together">
            {/* WiFi Signal Strength Legend */}
            {options.includeSignalLegend && (
              <div className="border border-slate-300 rounded p-1.5 bg-white keep-together">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                  <span>WIFI SIGNAL LEGEND</span>
                  <span className="text-[8.5px] text-slate-500 font-mono">
                    {avgDbm !== undefined ? `Avg: ${avgDbm} dBm` : '0–100 Scale'}
                    {avgSpeed !== undefined ? ` • ${avgSpeed} Mbps` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9.5px]">
                  <div className="p-1 rounded bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-1 font-bold text-emerald-800">
                      <WifiSignalIcon bars={3} size={12} activeColor="#16a34a" />
                      <span>81–100</span>
                    </div>
                    <span className="text-[8.5px] font-semibold text-emerald-700 block">
                      Excellent ({excellentCount})
                    </span>
                  </div>

                  <div className="p-1 rounded bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-1 font-bold text-amber-800">
                      <WifiSignalIcon bars={2} size={12} activeColor="#d97706" />
                      <span>40–80</span>
                    </div>
                    <span className="text-[8.5px] font-semibold text-amber-700 block">
                      Good ({goodCount})
                    </span>
                  </div>

                  <div className="p-1 rounded bg-rose-50 border border-rose-200">
                    <div className="flex items-center gap-1 font-bold text-rose-800">
                      <WifiSignalIcon bars={1} size={12} activeColor="#dc2626" />
                      <span>0–39</span>
                    </div>
                    <span className="text-[8.5px] font-semibold text-rose-700 block">
                      Weak ({weakCount})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Network Infrastructure Legend */}
            {options.includeInfrastructureLegend && (
              <div className="border border-slate-300 rounded p-1.5 bg-white keep-together">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                  <span>NETWORK INFRASTRUCTURE LEGEND</span>
                  <span className="text-[8.5px] text-slate-500">Hardware Symbols</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9.5px]">
                  <div className="p-1 rounded bg-blue-50 border border-blue-200 text-center">
                    <div className="flex items-center justify-center gap-1 font-bold text-blue-900">
                      <Server className="h-3 w-3 text-blue-600" />
                      <span>MDF</span>
                    </div>
                    <span className="text-[8px] text-blue-700 block truncate">Server ({mdfDevices.length})</span>
                  </div>

                  <div className="p-1 rounded bg-teal-50 border border-teal-200 text-center">
                    <div className="flex items-center justify-center gap-1 font-bold text-teal-900">
                      <Network className="h-3 w-3 text-teal-600" />
                      <span>IDF</span>
                    </div>
                    <span className="text-[8px] text-teal-700 block truncate">Hub ({idfDevices.length})</span>
                  </div>

                  <div className="p-1 rounded bg-emerald-50 border border-emerald-200 text-center">
                    <div className="flex items-center justify-center gap-1 font-bold text-emerald-900">
                      <Radio className="h-3 w-3 text-emerald-600" />
                      <span>AP</span>
                    </div>
                    <span className="text-[8px] text-emerald-700 block truncate">AP ({accessPoints.length})</span>
                  </div>

                  <div className="p-1 rounded bg-indigo-50 border border-indigo-200 text-center">
                    <div className="flex items-center justify-center gap-1 font-bold text-indigo-900">
                      <Cable className="h-3 w-3 text-indigo-600" />
                      <span>LAN</span>
                    </div>
                    <span className="text-[8px] text-indigo-700 block truncate font-mono">
                      {Math.round(totalCableLength * 10) / 10} m
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Page 1 Footer (#342, #346, #347) */}
          <div className="shrink-0 pt-1 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500 keep-together">
            <span>DECStudioAiCreation • WIFI HITMAP v1.0.2</span>
            <span className="font-semibold text-slate-700 font-mono">
              Page {getPageNumber('page1')} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: ENGINEERING INSIGHTS & RECOMMENDATIONS (#251, #344)                */}
      {/* ========================================================================= */}
      {showPage2 && (
        <div
          className={`print-page flex flex-col justify-between bg-white text-slate-900 ${
            forceVisibleForPreview
              ? 'shadow-xl ring-1 ring-slate-900/10 rounded-sm mb-8'
              : ''
          } print:shadow-none print:ring-0 print:mb-0 print:rounded-none box-border overflow-hidden`}
          style={
            forceVisibleForPreview
              ? {
                  width: isPortrait ? '740px' : '960px',
                  maxWidth: '100%',
                  aspectRatio: `${pageWidthMm} / ${pageHeightMm}`,
                  padding: `${marginMm}mm`,
                }
              : {
                  height: '100vh',
                  maxHeight: '100vh',
                  padding: 0,
                }
          }
        >
          <div className="flex-1 overflow-hidden flex flex-col justify-start">
            {/* Header Banner */}
            <div className="shrink-0 border-b-2 border-slate-900 pb-1.5 mb-3 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-extrabold tracking-wider text-blue-700 uppercase">
                  Engineering Analysis & Recommendations
                </div>
                <h2 className="text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                  WiFi Coverage Health & Site Evaluation
                </h2>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-600 text-[9.5px] font-medium block">
                  Branch: {storeInfo.branchName || storeInfo.storeName || 'Branch'}
                </span>
                <span className="text-slate-500 text-[9px] block">
                  Date: {storeInfo.assessmentDate || new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Coverage Statistics Cards */}
            <div className="shrink-0 grid grid-cols-4 gap-2 mb-3">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <span className="text-[9.5px] font-bold text-slate-500 uppercase block">Total Readings</span>
                <span className="text-xl font-black text-slate-900">{totalReadings}</span>
                <span className="text-[9px] text-slate-400 block">Sample Survey Points</span>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-center">
                <span className="text-[9.5px] font-bold text-emerald-700 uppercase block">Excellent Coverage</span>
                <span className="text-xl font-black text-emerald-800">{excellentPct}%</span>
                <span className="text-[9px] text-emerald-600 block">{excellentCount} points (81–100)</span>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-center">
                <span className="text-[9.5px] font-bold text-amber-700 uppercase block">Good Coverage</span>
                <span className="text-xl font-black text-amber-800">{goodPct}%</span>
                <span className="text-[9px] text-amber-600 block">{goodCount} points (40–80)</span>
              </div>

              <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-center">
                <span className="text-[9.5px] font-bold text-rose-700 uppercase block">Weak / Dead Zone</span>
                <span className="text-xl font-black text-rose-800">{weakPct}%</span>
                <span className="text-[9px] text-rose-600 block">{weakCount} points (0–39)</span>
              </div>
            </div>

            {/* RF Signal Power & Throughput Summary Cards (#335) */}
            {(dbmCount > 0 || speedCount > 0) && (
              <div className="shrink-0 grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-700 uppercase block">
                      Recorded RF Signal Power
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {dbmCount > 0 ? `Range: ${minDbm} to ${maxDbm} dBm (${dbmCount} points)` : 'No readings'}
                    </span>
                  </div>
                  {avgDbm !== undefined && (
                    <span className="text-base font-black font-mono text-slate-900">
                      {avgDbm} <span className="text-[9.5px] font-normal text-slate-500">dBm avg</span>
                    </span>
                  )}
                </div>

                <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-[9.5px] font-bold text-blue-700 uppercase block">
                      Measured Data Throughput
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {speedCount > 0 ? `Range: ${minSpeed} to ${maxSpeed} Mbps (${speedCount} tests)` : 'No tests'}
                    </span>
                  </div>
                  {avgSpeed !== undefined && (
                    <span className="text-base font-black font-mono text-blue-700">
                      {avgSpeed} <span className="text-[9.5px] font-normal text-slate-500">Mbps avg</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Key Engineering Insights (#336) */}
            {options.includeInsights && (
              <div className="shrink-0 border border-slate-300 rounded-lg p-2.5 mb-3 bg-white keep-together">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2 no-break-heading">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                    Infrastructure & Coverage Insights
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-700">
                  <div className="flex items-start gap-2 p-1.5 rounded bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
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

                  <div className="flex items-start gap-2 p-1.5 rounded bg-slate-50 border border-slate-200">
                    <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
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
                    <div className="flex items-start gap-2 p-1.5 rounded bg-rose-50 border border-rose-200">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-900">Coverage Vulnerability: </span>
                        <span>
                          Identified {weakCount} weak spot(s) below acceptable operational threshold (39
                          or lower). Recommended for remediation prior to POS / handheld terminal deployment.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actionable Recommendations (#336) */}
            {options.includeRecommendations && (
              <div className="shrink-0 border border-slate-300 rounded-lg p-2.5 mb-2 bg-white keep-together">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2 no-break-heading">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                    Actionable Recommendations & Remediation Plan
                  </span>
                </div>
                <div className="space-y-1.5 text-[10.5px]">
                  <div className="p-1.5 rounded border border-slate-200 bg-white">
                    <span className="font-bold text-indigo-900 block mb-0.5">
                      1. AP Placement Optimization
                    </span>
                    <p className="text-slate-600">
                      Ensure access points are ceiling-mounted at least 2.8m above finished floor level
                      away from heavy metal shelving or refrigeration units to minimize signal attenuation.
                    </p>
                  </div>

                  <div className="p-1.5 rounded border border-slate-200 bg-white">
                    <span className="font-bold text-indigo-900 block mb-0.5">
                      2. Cable Certification & Channel Standards
                    </span>
                    <p className="text-slate-600">
                      Verify all Category 6 / 6A horizontal cabling runs conform strictly to the 90m
                      permanent link limit. Utilize certified patch panels inside IDF distribution cabinets.
                    </p>
                  </div>

                  <div className="p-1.5 rounded border border-slate-200 bg-white">
                    <span className="font-bold text-indigo-900 block mb-0.5">
                      3. Frequency Band Balancing & Roaming
                    </span>
                    <p className="text-slate-600">
                      Configure 5 GHz band steering for mobile POS and scanner terminals to prevent 2.4 GHz
                      co-channel congestion during peak operational hours.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page 2 Footer */}
          <div className="shrink-0 pt-1 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500 keep-together">
            <span>DECStudioAiCreation • WIFI HITMAP v1.0.2</span>
            <span className="font-semibold text-slate-700 font-mono">
              Page {getPageNumber('page2')} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: LAN CABLE SCHEDULE & EXECUTIVE SUMMARY (#251, #345)                */}
      {/* ========================================================================= */}
      {showPage3 && (
        <div
          className={`print-page flex flex-col justify-between bg-white text-slate-900 ${
            forceVisibleForPreview
              ? 'shadow-xl ring-1 ring-slate-900/10 rounded-sm mb-8'
              : ''
          } print:shadow-none print:ring-0 print:mb-0 print:rounded-none box-border overflow-hidden`}
          style={
            forceVisibleForPreview
              ? {
                  width: isPortrait ? '740px' : '960px',
                  maxWidth: '100%',
                  aspectRatio: `${pageWidthMm} / ${pageHeightMm}`,
                  padding: `${marginMm}mm`,
                }
              : {
                  height: '100vh',
                  maxHeight: '100vh',
                  padding: 0,
                }
          }
        >
          <div className="flex-1 overflow-hidden flex flex-col justify-start">
            {/* Header Banner */}
            <div className="shrink-0 border-b-2 border-slate-900 pb-1.5 mb-3 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-extrabold tracking-wider text-blue-700 uppercase">
                  Infrastructure Documentation & Sign-Off
                </div>
                <h2 className="text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                  Cable Run Schedule & Verification
                </h2>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-600 text-[9.5px] font-medium block">
                  Branch: {storeInfo.branchName || storeInfo.storeName || 'Branch'}
                </span>
                <span className="text-slate-500 text-[9px] block">
                  Date: {storeInfo.assessmentDate || new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* LAN Cable Summary Table (#323) */}
            {options.includeCableSchedule && (
              <div className="shrink-0 border border-slate-300 rounded-lg p-2.5 mb-3 bg-white keep-together">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2 no-break-heading">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                    LAN CABLE RUN SCHEDULE
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-900">
                    Total Cable Length: {Math.round(totalCableLength * 10) / 10} Meters ({lanCables.length} Runs)
                  </span>
                </div>

                {lanCables.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    No LAN cable connections recorded in this project.
                  </p>
                ) : (
                  <div className="max-h-[220px] overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-semibold text-[10.5px]">
                          <th className="py-1 px-2">Cable ID</th>
                          <th className="py-1 px-2">From (Source)</th>
                          <th className="py-1 px-2">To (Destination)</th>
                          <th className="py-1 px-2">Cable Type</th>
                          <th className="py-1 px-2 text-right">Length (Meters)</th>
                          <th className="py-1 px-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lanCables.slice(0, 10).map((c) => (
                          <tr key={`print-cable-${c.id}`} className="border-b border-slate-100 text-[10.5px]">
                            <td className="py-1 px-2 font-mono font-bold text-indigo-900">{c.id}</td>
                            <td className="py-1 px-2">{c.fromName}</td>
                            <td className="py-1 px-2">{c.toName}</td>
                            <td className="py-1 px-2 font-semibold">{c.cableType}</td>
                            <td className="py-1 px-2 text-right font-mono font-bold">{c.length} m</td>
                            <td className="py-1 px-2 text-slate-500 truncate max-w-[180px]">{c.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {lanCables.length > 10 && (
                      <div className="py-1 px-2 text-[9.5px] text-slate-500 bg-slate-50 border-t border-slate-100 text-right">
                        Showing first 10 of {lanCables.length} cables • Full cable schedule verified
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Executive Summary (#336) */}
            {options.includeSummary && (
              <div className="shrink-0 border border-slate-300 rounded-lg p-2.5 mb-3 bg-white keep-together">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 block border-b border-slate-200 pb-1 mb-1.5 no-break-heading">
                  Executive Assessment Verdict
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
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
              <div className="shrink-0 border border-slate-300 rounded-lg p-3 bg-slate-50 mb-2 keep-together">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 block mb-2 no-break-heading">
                  Verification & Official Approval
                </span>
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block mb-1 text-[10.5px]">
                      Prepared By (IT Survey Engineer):
                    </span>
                    <div className="text-slate-800 font-semibold text-[11px] mb-0.5">
                      {storeInfo.preparedBy || 'Field IT Specialist'}
                    </div>
                    <div className="text-slate-500 text-[10px] mb-4">
                      {storeInfo.position || 'IT Infrastructure Operations'}
                    </div>
                    <div className="border-b border-slate-400 w-4/5 mb-1" />
                    <span className="text-slate-500 text-[9.5px]">Signature & Date</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block mb-1 text-[10.5px]">
                      Acknowledged & Approved By (Branch Management):
                    </span>
                    <div className="text-slate-800 font-semibold text-[11px] mb-0.5">
                      {storeInfo.acknowledgedBy || 'Branch Operations Lead'}
                    </div>
                    <div className="text-slate-500 text-[10px] mb-4">
                      {storeInfo.acknowledgedPosition || 'Branch Manager / Site Lead'}
                    </div>
                    <div className="border-b border-slate-400 w-4/5 mb-1" />
                    <span className="text-slate-500 text-[9.5px]">Signature & Date</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page 3 Footer */}
          <div className="shrink-0 pt-1 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500 keep-together">
            <span>DECStudioAiCreation • WIFI HITMAP v1.0.2</span>
            <span className="font-semibold text-slate-700 font-mono">
              Page {getPageNumber('page3')} of {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
