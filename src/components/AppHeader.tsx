/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreInfo } from '../types';
import { APP_CURRENT_VERSION } from '../data/versionHistory';
import {
  Radio,
  Save,
  FileDown,
  FolderOpen,
  Download,
  Printer,
  ChevronDown,
  Coffee,
  History,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface AppHeaderProps {
  storeInfo: StoreInfo;
  onOpenStoreInfo: () => void;
  onOpenWelcome?: () => void;
  onSaveProject: () => void;
  onSaveAsProject?: () => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isDirty?: boolean;
  onLoadProject: () => void;
  onOpenExportModal?: (mode?: 'pdf' | 'png' | 'both') => void;
  onExportPng: () => void;
  onPrint: () => void;
  isPreparingPrint?: boolean;
  onOpenSupport?: () => void;
  onOpenWhatsNew?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  storeInfo,
  onOpenStoreInfo,
  onOpenWelcome,
  onSaveProject,
  onSaveAsProject,
  isSaving = false,
  saveStatus = 'idle',
  isDirty = false,
  onLoadProject,
  onOpenExportModal,
  onExportPng,
  onPrint,
  isPreparingPrint = false,
  onOpenSupport,
  onOpenWhatsNew,
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const branchTitle = storeInfo.branchName || storeInfo.storeName || 'Branch Network Survey';
  const branchCode = storeInfo.branchCode || storeInfo.storeCode || 'BR-01';

  return (
    <header className="no-print relative z-40 flex h-11 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 text-white shadow-xs select-none shrink-0">
      {/* Left side: Brand Identity */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenWelcome}
          title="About DECStudioAiCreation - WIFI HITMAP"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group text-left"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs group-hover:bg-blue-500 transition-colors">
            <Radio className="h-3.5 w-3.5 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <div className="text-[8.5px] font-extrabold tracking-widest text-blue-400 uppercase leading-none">
              DECStudioAiCreation
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-black tracking-tight text-white leading-tight">
                WIFI HITMAP
              </span>
              <span className="rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[9px] px-1 py-0.2 font-bold leading-none">
                {APP_CURRENT_VERSION}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Center: Project / Branch Name */}
      <div className="flex items-center justify-center">
        <button
          onClick={onOpenStoreInfo}
          title="Click to view or edit Branch Information"
          className="group flex items-center gap-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-2xs"
        >
          <Building2 className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="max-w-[200px] sm:max-w-[320px] md:max-w-[420px] truncate font-bold text-white tracking-tight">
            {branchTitle}
          </span>
          <span className="rounded bg-slate-700 px-1 py-0.2 text-[10px] font-mono font-medium text-slate-300 shrink-0">
            {branchCode}
          </span>
        </button>
      </div>

      {/* Right side: File Actions & Reports */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* SAVE BUTTON */}
        <button
          onClick={onSaveProject}
          disabled={isSaving}
          title="Save Project (Ctrl+S / Cmd+S)"
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
            saveStatus === 'saving' || isSaving
              ? 'bg-amber-500 text-white cursor-wait opacity-90'
              : saveStatus === 'saved'
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : isDirty
              ? 'bg-blue-600 hover:bg-blue-500 text-white ring-1 ring-blue-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Save className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isSaving || saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
              ? '✓ Saved'
              : 'Save'}
          </span>
          {isDirty && saveStatus !== 'saved' && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
          )}
        </button>

        {/* SAVE AS */}
        {onSaveAsProject && (
          <button
            onClick={onSaveAsProject}
            title="Save As (Download editable .project file with custom name)"
            className="hidden md:flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden lg:inline">Save As</span>
          </button>
        )}

        {/* LOAD PROJECT */}
        <button
          onClick={onLoadProject}
          title="Load Project File (.project / .json)"
          className="hidden sm:flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
        >
          <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden lg:inline">Load</span>
        </button>

        {/* EXPORT DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            title="Export Options (PNG Image / PDF Report)"
            className="flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            <span>Export</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showExportDropdown && (
            <div
              onMouseLeave={() => setShowExportDropdown(false)}
              className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 text-xs text-slate-200"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                EXPORT FORMAT
              </div>

              <button
                onClick={() => {
                  setShowExportDropdown(false);
                  if (onOpenExportModal) {
                    onOpenExportModal('png');
                  } else {
                    onExportPng();
                  }
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 text-left font-semibold transition-colors cursor-pointer"
              >
                <ImageIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-white">PNG Image</span>
                  <span className="text-[10px] text-slate-400 font-normal">High-res floor plan</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowExportDropdown(false);
                  if (onOpenExportModal) {
                    onOpenExportModal('pdf');
                  }
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 text-left font-semibold transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-white">PDF Report</span>
                  <span className="text-[10px] text-slate-400 font-normal">Multi-page survey audit</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowExportDropdown(false);
                  if (onOpenExportModal) {
                    onOpenExportModal('both');
                  }
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 text-left font-semibold transition-colors cursor-pointer"
              >
                <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-white">Both PNG + PDF</span>
                  <span className="text-[10px] text-slate-400 font-normal">Full survey documentation</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* PRINT REPORT BUTTON */}
        <button
          onClick={onPrint}
          disabled={isPreparingPrint}
          title="Print Branch WiFi & Infrastructure Report"
          className="flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5 text-blue-200" />
          <span className="hidden sm:inline">{isPreparingPrint ? 'Preparing...' : 'Print'}</span>
        </button>

        {/* What's New Link */}
        {onOpenWhatsNew && (
          <button
            onClick={onOpenWhatsNew}
            title={`Version ${APP_CURRENT_VERSION} — What's New & Release Notes`}
            className="hidden xl:flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <History className="h-3 w-3 text-blue-400" />
            <span>{APP_CURRENT_VERSION}</span>
          </button>
        )}

        {/* Support Coffee Button */}
        {onOpenSupport && (
          <button
            onClick={onOpenSupport}
            title="Support DECStudioAiCreation — Buy Me a Coffee"
            className="flex items-center gap-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Coffee className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden 2xl:inline">Support</span>
          </button>
        )}
      </div>
    </header>
  );
};
