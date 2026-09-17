/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FloorPlanDocument,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  VisibilitySettings,
  StoreInfo,
} from '../../types';
import {
  PdfExportSettings,
  DEFAULT_PDF_EXPORT_SETTINGS,
  generateAndDownloadPdfReport,
  generateExportFilename,
} from '../../utils/pdfReportGenerator';
import { generateCompositePng } from '../../utils/exportComposite';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Package,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sliders,
  Settings,
  Printer,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorPlan: FloorPlanDocument | null;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  visibility: VisibilitySettings;
  storeInfo: StoreInfo;
  initialMode?: 'pdf' | 'png' | 'both';
  onOpenPrint?: () => void;
}

type ExportMode = 'pdf' | 'png' | 'both';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  floorPlan,
  mdfDevices,
  idfDevices,
  accessPoints,
  signalReadings,
  lanCables,
  visibility,
  storeInfo,
  initialMode = 'pdf',
  onOpenPrint,
}) => {
  const [exportMode, setExportMode] = useState<ExportMode>(initialMode);
  const [pdfSettings, setPdfSettings] = useState<PdfExportSettings>(DEFAULT_PDF_EXPORT_SETTINGS);

  React.useEffect(() => {
    if (isOpen && initialMode) {
      setExportMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // PNG options toggles (#171)
  const [pngOptions, setPngOptions] = useState({
    floorPlan: true,
    mdf: visibility.showMdf,
    idf: visibility.showIdf,
    aps: visibility.showAps,
    lanCables: visibility.showLanCables,
    signalReadings: visibility.showSignalValues,
    heatmap: visibility.showHeatmap,
    labels: true,
  });

  // Export progress & error tracking (#178, #180)
  const [isExporting, setIsExporting] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!floorPlan) {
      setErrorMessage('No floor plan is currently loaded in this project.');
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressStep('Initializing export engine...');

    try {
      // Setup visibility for PNG
      const customVisibility: VisibilitySettings = {
        ...visibility,
        showMdf: pngOptions.mdf,
        showIdf: pngOptions.idf,
        showAps: pngOptions.aps,
        showLanCables: pngOptions.lanCables,
        showSignalValues: pngOptions.signalReadings,
        showHeatmap: pngOptions.heatmap,
        showLegend: pngOptions.labels,
      };

      if (exportMode === 'png' || exportMode === 'both') {
        setProgressStep('Generating high-resolution PNG image...');
        const pngData = await generateCompositePng(
          floorPlan,
          mdfDevices,
          idfDevices,
          accessPoints,
          signalReadings,
          lanCables,
          customVisibility,
          storeInfo
        );

        // Download PNG
        const pngFilename = generateExportFilename(storeInfo, 'png');
        const link = document.createElement('a');
        link.download = pngFilename;
        link.href = pngData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      if (exportMode === 'pdf') {
        if (onOpenPrint) {
          onClose();
          onOpenPrint();
          return;
        }
      }

      if (exportMode === 'both') {
        if (onOpenPrint) {
          // Trigger print after downloading PNG
          setTimeout(() => {
            onClose();
            onOpenPrint();
          }, 600);
        }
      }

      setSuccessMessage('Export completed successfully!');
      setTimeout(() => {
        setIsExporting(false);
      }, 800);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
      const msg = err instanceof Error ? err.message : 'Unknown rendering failure';
      setErrorMessage(`Unable to generate the requested document. Reason: ${msg}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">EXPORT WIFI HITMAP</h2>
              <p className="text-xs text-slate-300">Generate Multi-Page PDF Reports or High-Res PNG Images</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* FORMAT SELECTOR (#170) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExportMode('pdf')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3.5 border text-center transition-all ${
                  exportMode === 'pdf'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileText className={`h-6 w-6 ${exportMode === 'pdf' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs">PDF Report</span>
              </button>

              <button
                type="button"
                onClick={() => setExportMode('png')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3.5 border text-center transition-all ${
                  exportMode === 'png'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ImageIcon className={`h-6 w-6 ${exportMode === 'png' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs">PNG Image</span>
              </button>

              <button
                type="button"
                onClick={() => setExportMode('both')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3.5 border text-center transition-all ${
                  exportMode === 'both'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Package className={`h-6 w-6 ${exportMode === 'both' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs">Both PNG + PDF</span>
              </button>
            </div>
          </div>

          {/* PDF EXPORT SETTINGS (#177, #319, #320) */}
          {(exportMode === 'pdf' || exportMode === 'both') && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-blue-200">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Master Print / Save to PDF Engine
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                PDF output uses the unified <strong>Print / Save to PDF</strong> master engine. It supports Letter, A4, Legal, and A3 paper sizes, intelligent portrait/landscape fitting, full telemetry legends, and exact page breaks without content clipping.
              </p>
            </div>
          )}

          {/* PNG EXPORT OPTIONS (#171) */}
          {(exportMode === 'png' || exportMode === 'both') && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  PNG Export Layer Options
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pngOptions.floorPlan}
                    onChange={(e) => setPngOptions({ ...pngOptions, floorPlan: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Floor Plan Base</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pngOptions.mdf}
                    onChange={(e) => setPngOptions({ ...pngOptions, mdf: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>MDF Cabinets</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pngOptions.idf}
                    onChange={(e) => setPngOptions({ ...pngOptions, idf: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>IDF Switch Hubs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pngOptions.aps}
                    onChange={(e) => setPngOptions({ ...pngOptions, aps: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Access Points</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pngOptions.lanCables}
                    onChange={(e) => setPngOptions({ ...pngOptions, lanCables: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>LAN Cables</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pngOptions.signalReadings}
                    onChange={(e) =>
                      setPngOptions({ ...pngOptions, signalReadings: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>Signal Readings</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pngOptions.heatmap}
                    onChange={(e) => setPngOptions({ ...pngOptions, heatmap: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>WiFi Heatmap</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pngOptions.labels}
                    onChange={(e) => setPngOptions({ ...pngOptions, labels: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Legend & Labels</span>
                </label>
              </div>
            </div>
          )}

          {/* PROGRESS MODAL / FEEDBACK STEP (#178) */}
          {isExporting && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Generating Document...</span>
              </div>
              <p className="text-xs text-indigo-800 font-medium pl-6">{progressStep}</p>
              <p className="text-[11px] text-indigo-600 pl-6 italic">
                Please wait while high-resolution graphics and reports are rendered...
              </p>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ERROR DISPLAY (#180) */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2">
              <div className="flex items-start gap-2.5 text-rose-900 text-xs">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">EXPORT FAILED</strong>
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleExport}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* MODAL ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || !floorPlan}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {exportMode === 'pdf' ? (
                    <Printer className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {exportMode === 'pdf'
                      ? 'Open Print / Save to PDF'
                      : exportMode === 'png'
                      ? 'Export PNG'
                      : 'Export PNG + Print'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
