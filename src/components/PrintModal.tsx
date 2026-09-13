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
} from '../types';
import { PrintView } from './PrintView';
import { Printer, Download, X, AlertCircle, Check, Sparkles } from 'lucide-react';

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
  onDownloadPng?: () => void;
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
  onDownloadPng,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const handleTriggerPrint = () => {
    setIsPrinting(true);
    // Give DOM a frame to prepare
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs no-print animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Print & Engineering Report Preview</h3>
              <p className="text-xs text-slate-300">
                A4 Landscape format with floor plan, signal heatmap, device overlays & cable schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadPng}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Image
            </button>
            <button
              onClick={handleTriggerPrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 shadow-md transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              {isPrinting ? 'Opening...' : 'Open Print Dialog'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto bg-slate-200 p-6 flex justify-center">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-6 border border-slate-300">
            <PrintView
              storeInfo={storeInfo}
              compositeDataUrl={compositeDataUrl}
              mdfDevices={mdfDevices}
              idfDevices={idfDevices}
              accessPoints={accessPoints}
              signalReadings={signalReadings}
              lanCables={lanCables}
              forceVisibleForPreview={true}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Ready for Print
            </span>
            <span className="text-slate-400">•</span>
            <span>Target Paper: A4 Landscape (Margins: 8mm–10mm)</span>
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
              onClick={handleTriggerPrint}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print to PDF / Printer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
