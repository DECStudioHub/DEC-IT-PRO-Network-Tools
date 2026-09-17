/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  StoreInfo,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  PrintConfiguration,
  PrintMode,
  PrintOrientation,
  PrintQuality,
  DEFAULT_PRINT_CONFIG,
  FloorPlanDocument,
  VisibilitySettings,
} from '../types';
import { PrintView } from './PrintView';
import { generateAndDownloadPdfReport } from '../utils/pdfReportGenerator';
import {
  Printer,
  Download,
  X,
  Check,
  Sparkles,
  Settings2,
  FileText,
  Sliders,
  Layers,
  ChevronDown,
  Info,
  Loader2,
} from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeInfo: StoreInfo;
  compositeDataUrl: string;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  floorPlan?: FloorPlanDocument | null;
  visibility?: VisibilitySettings;
  onDownloadPng?: () => void;
  onPrintConfigChange?: (config: PrintConfiguration) => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  storeInfo,
  compositeDataUrl,
  mdfDevices,
  idfDevices,
  accessPoints,
  signalReadings,
  lanCables,
  floorPlan,
  visibility,
  onDownloadPng,
  onPrintConfigChange,
}) => {
  const [printConfig, setPrintConfig] = useState<PrintConfiguration>(DEFAULT_PRINT_CONFIG);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'options'>('preview');

  if (!isOpen) return null;

  const updateConfig = (newConfig: PrintConfiguration) => {
    setPrintConfig(newConfig);
    onPrintConfigChange?.(newConfig);
  };

  // Change preset mode
  const handleSelectMode = (mode: PrintMode) => {
    let nextConfig: PrintConfiguration;
    if (mode === 'floor-plan-only') {
      nextConfig = {
        ...printConfig,
        mode,
        options: {
          includeFloorPlan: true,
          includeInfrastructureLegend: true,
          includeSignalLegend: true,
          includeCableSchedule: false,
          includeInsights: false,
          includeRecommendations: false,
          includeSummary: false,
          includeSignOff: false,
        },
      };
    } else if (mode === 'standard') {
      nextConfig = {
        ...printConfig,
        mode,
        options: {
          includeFloorPlan: true,
          includeInfrastructureLegend: true,
          includeSignalLegend: true,
          includeCableSchedule: true,
          includeInsights: false,
          includeRecommendations: false,
          includeSummary: true,
          includeSignOff: true,
        },
      };
    } else {
      // Complete
      nextConfig = {
        ...printConfig,
        mode,
        options: {
          includeFloorPlan: true,
          includeInfrastructureLegend: true,
          includeSignalLegend: true,
          includeCableSchedule: true,
          includeInsights: true,
          includeRecommendations: true,
          includeSummary: true,
          includeSignOff: true,
        },
      };
    }
    updateConfig(nextConfig);
  };

  const handleToggleOption = (key: keyof typeof printConfig.options) => {
    const nextConfig = {
      ...printConfig,
      options: {
        ...printConfig.options,
        [key]: !printConfig.options[key],
      },
    };
    updateConfig(nextConfig);
  };

  // 1. Direct PDF Generation & Download
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setStatusMessage('Compiling A4 multi-page PDF report...');
    try {
      const activeFloorPlan: FloorPlanDocument = floorPlan || {
        type: 'image',
        sourceName: storeInfo.storeName || 'Store Floor Plan',
        backgroundDataUrl: compositeDataUrl,
        originalWidth: 1920,
        originalHeight: 1080,
      };

      await generateAndDownloadPdfReport(
        activeFloorPlan,
        mdfDevices,
        idfDevices,
        accessPoints,
        signalReadings,
        lanCables,
        visibility || {
          showMdf: true,
          showIdf: true,
          showAps: true,
          showLanCables: true,
          showLanLengths: true,
          showSignalValues: true,
          showWifiBars: true,
          showHeatmap: true,
          showLegend: true,
          showCableBadges: true,
          cableLabelMode: 'full',
        },
        storeInfo,
        {
          pageSize: printConfig.orientation === 'portrait' ? 'a4' : 'a4-landscape',
          includeProjectInfo: true,
          includeFloorPlan: printConfig.options.includeFloorPlan,
          includeLegendAndInfrastructure:
            printConfig.options.includeInfrastructureLegend ||
            printConfig.options.includeSignalLegend,
          includeInsightsAndRecommendations:
            printConfig.options.includeInsights ||
            printConfig.options.includeRecommendations,
          includeLanCableSummary: printConfig.options.includeCableSchedule,
        },
        (msg) => setStatusMessage(msg),
        printConfig
      );
      setStatusMessage('PDF report generated and downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setStatusMessage('PDF generation encountered an error: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Browser Print Trigger with Iframe & Sandbox Fallback
  const handleTriggerPrint = () => {
    setIsPrinting(true);
    setStatusMessage('Initiating print dialog...');

    setTimeout(() => {
      let printFailed = false;
      try {
        window.print();
      } catch (err: any) {
        console.warn('Direct window.print() failed (iframe restrictions):', err);
        printFailed = true;
      }

      setIsPrinting(false);

      if (printFailed) {
        setStatusMessage('Browser print dialog blocked in embedded preview. Generating direct PDF file...');
        handleDownloadPdf();
      } else {
        setStatusMessage('Print request sent to browser.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-xs no-print animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-6xl h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Print / Export Report — WIFI HITMAP v1.0.2
              </h3>
              <p className="text-xs text-slate-300">
                Multi-page report engine • A4 Landscape • DECStudioAiCreation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDownloadPng && (
              <button
                type="button"
                onClick={onDownloadPng}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                title="Download high-resolution image"
              >
                <Download className="h-3.5 w-3.5" />
                PNG Export
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition-colors"
              title="Download professional A4 multi-page PDF report file directly"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>

            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition-colors"
              title="Open browser print dialog (supports Print to PDF)"
            >
              {isPrinting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              {isPrinting ? 'Opening Print...' : 'Print / Save to PDF'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body with Presets & Options */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Settings Sidebar */}
          <div className="w-80 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto space-y-4">
            {/* Presets */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Report Preset
              </label>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'complete',
                    title: 'Complete Engineering Report',
                    desc: 'Page 1 Floor Plan, Page 2 Insights, Page 3 Schedule & Sign-Off',
                  },
                  {
                    id: 'standard',
                    title: 'Standard Report',
                    desc: 'Page 1 Floor Plan + Page 2 Cable Schedule & Sign-Off',
                  },
                  {
                    id: 'floor-plan-only',
                    title: 'Floor Plan Only',
                    desc: 'Page 1 only: Dominant visual floor plan & legends',
                  },
                ].map((p) => (
                  <button
                    key={`preset-${p.id}`}
                    type="button"
                    onClick={() => handleSelectMode(p.id as PrintMode)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      printConfig.mode === p.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{p.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Options */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Included Content Sections
              </label>
              <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                {[
                  { key: 'includeFloorPlan', label: 'Floor Plan & Heatmap' },
                  { key: 'includeSignalLegend', label: 'WiFi Signal Legend' },
                  { key: 'includeInfrastructureLegend', label: 'Network Hardware Legend' },
                  { key: 'includeInsights', label: 'Engineering Insights' },
                  { key: 'includeRecommendations', label: 'Recommendations Plan' },
                  { key: 'includeCableSchedule', label: 'LAN Cable Schedule' },
                  { key: 'includeSummary', label: 'Executive Summary Verdict' },
                  { key: 'includeSignOff', label: 'Dual Sign-off Blocks' },
                ].map((item) => (
                  <label
                    key={`opt-${item.key}`}
                    className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={!!printConfig.options[item.key as keyof typeof printConfig.options]}
                      onChange={() => handleToggleOption(item.key as any)}
                      className="rounded accent-blue-600 h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Paper Size (#327) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Paper Size
              </label>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(['A4', 'A3', 'A5', 'Letter', 'Legal', 'Tabloid'] as const).map((size) => (
                  <button
                    key={`paper-${size}`}
                    type="button"
                    onClick={() => setPrintConfig({ ...printConfig, paperSize: size })}
                    className={`py-1.5 rounded-lg border font-medium ${
                      printConfig.paperSize === size
                        ? 'border-blue-600 bg-blue-50 font-bold text-blue-800 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Orientation (#325) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Page Orientation
              </label>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(['auto', 'landscape', 'portrait'] as PrintOrientation[]).map((orient) => (
                  <button
                    key={`orient-${orient}`}
                    type="button"
                    onClick={() => setPrintConfig({ ...printConfig, orientation: orient })}
                    className={`py-1.5 rounded-lg border capitalize ${
                      printConfig.orientation === orient
                        ? 'border-blue-600 bg-blue-50 font-bold text-blue-800 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {orient}
                  </button>
                ))}
              </div>
            </div>

            {/* Margins (#329) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Print Margins
              </label>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(
                  [
                    { id: 'standard', label: 'Standard (8mm)' },
                    { id: 'compact', label: 'Compact (5mm)' },
                    { id: 'wide', label: 'Wide (12mm)' },
                  ] as const
                ).map((m) => (
                  <button
                    key={`margin-${m.id}`}
                    type="button"
                    onClick={() => setPrintConfig({ ...printConfig, margins: m.id })}
                    className={`py-1.5 px-1 text-[11px] rounded-lg border truncate ${
                      (printConfig.margins || 'standard') === m.id
                        ? 'border-blue-600 bg-blue-50 font-bold text-blue-800 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality / Resolution */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Resolution Quality
              </label>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {(['standard', 'high-res'] as PrintQuality[]).map((q) => (
                  <button
                    key={`qual-${q}`}
                    type="button"
                    onClick={() => setPrintConfig({ ...printConfig, quality: q })}
                    className={`py-1.5 rounded-lg border capitalize ${
                      printConfig.quality === q
                        ? 'border-blue-600 bg-blue-50 font-bold text-blue-800 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {q === 'standard' ? 'Standard (150 DPI)' : 'High-Res (300 DPI)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Helper Tip */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
              <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                <strong>"Print / Save to PDF"</strong> and <strong>"Download PDF"</strong> produce the exact same layout.
              </span>
            </div>
          </div>

          {/* Right Scrollable Document Preview Area */}
          <div className="flex-1 overflow-y-auto bg-slate-200 p-6 flex justify-center">
            <div className="w-full max-w-5xl bg-white rounded-lg shadow-xl p-6 border border-slate-300">
              <PrintView
                storeInfo={storeInfo}
                compositeDataUrl={compositeDataUrl}
                mdfDevices={mdfDevices}
                idfDevices={idfDevices}
                accessPoints={accessPoints}
                signalReadings={signalReadings}
                lanCables={lanCables}
                floorPlan={floorPlan}
                printConfig={printConfig}
                forceVisibleForPreview={true}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            {statusMessage ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 animate-pulse">
                <Info className="h-3.5 w-3.5" /> {statusMessage}
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Ready for Print & PDF Export
                </span>
                <span className="text-slate-400">•</span>
                <span>Target Paper: A4 Landscape (Margins: 8mm–10mm)</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition-colors"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              {isPrinting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {isPrinting ? 'Opening Print...' : 'Print to PDF / Printer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
