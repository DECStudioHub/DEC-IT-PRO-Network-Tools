/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  HitmapInsights,
} from '../../types';
import { analyzeHitmapData } from '../../utils/insightsAnalyzer';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wifi,
  Server,
  Network,
  Radio,
  Cable,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';

interface InsightsPanelProps {
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  onOpenPrintReport?: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  mdfDevices,
  idfDevices,
  accessPoints,
  signalReadings,
  lanCables,
  onOpenPrintReport,
}) => {
  // Trigger manual or live refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  // Compute insights
  const insights: HitmapInsights = analyzeHitmapData(
    mdfDevices,
    idfDevices,
    accessPoints,
    signalReadings,
    lanCables
  );

  const { signalAnalysis, networkSummary } = insights;

  const handleGenerateFinalSummary = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastGeneratedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
    }, 400);
  };

  const getStatusBadge = () => {
    switch (signalAnalysis.overallStatus) {
      case 'EXCELLENT':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700',
          indicator: 'bg-emerald-500',
          title: 'EXCELLENT',
        };
      case 'GOOD':
        return {
          bg: 'bg-blue-500/10 text-blue-700 border-blue-300 dark:border-blue-700',
          indicator: 'bg-blue-500',
          title: 'GOOD',
        };
      case 'NEEDS ATTENTION':
        return {
          bg: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-700',
          indicator: 'bg-amber-500',
          title: 'NEEDS ATTENTION',
        };
      case 'INSUFFICIENT DATA':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-700 border-slate-300 dark:border-slate-700',
          indicator: 'bg-slate-400',
          title: 'INSUFFICIENT DATA',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="space-y-4 pb-8">
      {/* Header & Generate Button (#166) */}
      <div className="rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50/70 via-white to-slate-50 p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                INSIGHTS & RECOMMENDATIONS
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated Hitmap Analysis & Audit Summary
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateFinalSummary}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-75"
            title="Re-run comprehensive analysis across all devices and readings"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Analyzing...' : 'Generate Final Summary'}</span>
          </button>
        </div>

        {lastGeneratedAt && (
          <p className="mt-2 text-[10.5px] font-medium text-indigo-700 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
            <span>Summary updated at {lastGeneratedAt}</span>
          </p>
        )}
      </div>

      {/* OVERALL STATUS INDICATOR (#164) */}
      <div className={`rounded-xl border p-3.5 transition-all ${badge.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full animate-pulse ${badge.indicator}`} />
            <span className="text-xs font-bold uppercase tracking-wider">Overall WiFi Coverage</span>
          </div>
          <span className="rounded-md bg-white/80 px-2.5 py-0.5 text-xs font-black tracking-wide shadow-2xs border border-slate-200">
            {badge.title}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-700 font-medium">
          {signalAnalysis.statusDescription}
        </p>
        <p className="mt-1 text-[10px] text-slate-500 italic">
          * Assessment is strictly based on recorded measurements and placed infrastructure.
        </p>
      </div>

      {/* INSUFFICIENT DATA PROTECTION BANNER (#165) */}
      {!insights.hasSufficientData && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-amber-900 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold uppercase tracking-wider block">
                INSUFFICIENT DATA FOR A RELIABLE ASSESSMENT
              </span>
              <p className="text-amber-800 leading-relaxed">
                There are currently not enough recorded signal readings to generate a reliable WiFi
                coverage summary. Please add measurements across different areas of the floor plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* METRIC CARDS BREAKDOWN (#157) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Strong (81–100)
          </div>
          <div className="text-lg font-black text-slate-900">{signalAnalysis.strongCount}</div>
          <div className="text-[10px] text-slate-400 font-medium">
            {signalAnalysis.strongPercent}% of total
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
            Moderate (40–80)
          </div>
          <div className="text-lg font-black text-slate-900">{signalAnalysis.moderateCount}</div>
          <div className="text-[10px] text-slate-400 font-medium">
            {signalAnalysis.moderatePercent}% of total
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
            Weak (0–39)
          </div>
          <div className="text-lg font-black text-slate-900">{signalAnalysis.weakCount}</div>
          <div className="text-[10px] text-slate-400 font-medium">
            {signalAnalysis.weakPercent}% of total
          </div>
        </div>
      </div>

      {/* TECHNICAL MEASUREMENTS (dBm & Speed Mbps) */}
      {((signalAnalysis.dbmCount || 0) > 0 || (signalAnalysis.speedCount || 0) > 0) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              Signal Power (dBm)
            </div>
            {signalAnalysis.averageDbm !== undefined ? (
              <>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {signalAnalysis.averageDbm} <span className="text-xs font-normal text-slate-500">dBm avg</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {signalAnalysis.minDbm} to {signalAnalysis.maxDbm} dBm • {signalAnalysis.dbmCount} pts
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 italic">No dBm recorded</div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">
              Throughput Speed
            </div>
            {signalAnalysis.averageSpeedMbps !== undefined ? (
              <>
                <div className="text-lg font-black text-blue-700 font-mono">
                  {signalAnalysis.averageSpeedMbps} <span className="text-xs font-normal text-slate-500">Mbps avg</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {signalAnalysis.minSpeedMbps} to {signalAnalysis.maxSpeedMbps} Mbps • {signalAnalysis.speedCount} tests
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 italic">No speed recorded</div>
            )}
          </div>
        </div>
      )}

      {/* SIGNAL ANALYSIS KEY FINDINGS (#158, #163) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>KEY FINDINGS</span>
        </h4>
        <div className="space-y-2">
          {insights.keyFindings.map((finding, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                finding.type === 'success'
                  ? 'bg-emerald-50/80 text-emerald-900'
                  : finding.type === 'warning'
                  ? 'bg-amber-50/80 text-amber-900'
                  : 'bg-slate-50 text-slate-800'
              }`}
            >
              {finding.type === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              ) : finding.type === 'warning' ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{finding.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OBSERVATIONS (FACTUAL DATA) VS RECOMMENDATIONS (#160) */}
      <div className="grid grid-cols-1 gap-3">
        {/* OBSERVATION: Directly supported by measurements (#160) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
              OBSERVATION
            </span>
            <span>Data Directly Supported by Measurements</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {insights.observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span className="leading-relaxed">{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* RECOMMENDATION: Suggested Next Actions (#159, #160) */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
            <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px]">
              RECOMMENDATIONS
            </span>
            <span>Suggested Engineering Next Actions</span>
          </div>
          <ol className="space-y-2 text-xs text-indigo-950 list-decimal list-inside">
            {insights.recommendations.map((rec, i) => (
              <li key={i} className="leading-relaxed font-medium">
                {rec}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* NETWORK INFRASTRUCTURE SUMMARY (#161) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Network className="h-4 w-4 text-teal-600" />
          <span>NETWORK INFRASTRUCTURE SUMMARY</span>
        </h4>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="flex justify-between py-1.5">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-blue-600" />
              MDF / Server Cabinet
            </span>
            <span className="font-bold text-slate-900">{networkSummary.mdfCount}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5 text-teal-600" />
              IDF / Switch Hub for Selling Area
            </span>
            <span className="font-bold text-slate-900">{networkSummary.idfCount}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-emerald-600" />
              Wireless Access Points
            </span>
            <span className="font-bold text-slate-900">{networkSummary.apCount}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Cable className="h-3.5 w-3.5 text-indigo-600" />
              LAN Cable Connections
            </span>
            <span className="font-bold text-slate-900">{networkSummary.cableCount}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-600">Recorded LAN Cable Length</span>
            <span className="font-bold text-slate-900">
              {networkSummary.hasIncompleteCableLengths ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {networkSummary.totalRecordedCableLength}m (Incomplete)
                </span>
              ) : (
                `${networkSummary.totalRecordedCableLength} meters`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* LAN CABLE INSIGHTS (#162) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Cable className="h-4 w-4 text-blue-600" />
          <span>LAN CABLE INSIGHTS</span>
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-700">
            <span>Total LAN Cables:</span>
            <span className="font-bold">{networkSummary.cableCount}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Total Recorded Cable Length:</span>
            <span className="font-bold">
              {networkSummary.totalRecordedCableLength > 0
                ? `${networkSummary.totalRecordedCableLength} meters`
                : '0 meters'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Cable Types:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(networkSummary.cableTypesBreakdown).map(([type, count]) => (
                <div
                  key={type}
                  className="flex justify-between rounded bg-slate-50 px-2 py-1 text-slate-700 text-[11px]"
                >
                  <span className="font-medium">{type}:</span>
                  <span className="font-bold text-slate-900">{count}</span>
                </div>
              ))}
              {Object.keys(networkSummary.cableTypesBreakdown).length === 0 && (
                <span className="text-slate-400 italic text-[11px]">No cables recorded yet</span>
              )}
            </div>
          </div>

          {networkSummary.hasIncompleteCableLengths && (
            <div className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 flex items-start gap-1.5 border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">⚠ Some LAN cables do not have recorded lengths.</span>
                <span>Consider completing the cable length information for more accurate infrastructure documentation.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FINAL HITMAP SUMMARY COMPONENT (#163) */}
      <div className="rounded-xl border-2 border-indigo-500/30 bg-slate-900 p-4 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              FINAL WIFI HITMAP SUMMARY
            </h4>
          </div>
          <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[11px] font-bold text-indigo-300 border border-indigo-500/40">
            {badge.title}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-slate-300 font-medium">
          {insights.finalAssessmentText}
        </p>

        <div className="grid grid-cols-4 gap-1 text-center bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[9px]">STRONG</span>
            <span className="font-bold text-emerald-400">{signalAnalysis.strongCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">MODERATE</span>
            <span className="font-bold text-amber-400">{signalAnalysis.moderateCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">WEAK</span>
            <span className="font-bold text-rose-400">{signalAnalysis.weakCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">APS</span>
            <span className="font-bold text-teal-400">{networkSummary.apCount}</span>
          </div>
        </div>

        {onOpenPrintReport && (
          <button
            onClick={onOpenPrintReport}
            className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-xs font-bold transition-all shadow-xs"
          >
            <span>Open Report / Print View</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
