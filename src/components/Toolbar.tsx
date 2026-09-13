/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { ActiveTool, VisibilitySettings, StoreInfo } from '../types';
import {
  Upload,
  Server,
  Network,
  Radio,
  Activity,
  Cable,
  MousePointer,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Crosshair,
  Save,
  FolderOpen,
  Download,
  FileUp,
  Printer,
  Eye,
  Ruler,
  Building2,
  Sparkles,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  SlidersHorizontal,
  Undo2,
  Redo2,
  FileDown,
  FilePlus,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitFloorPlan: () => void;
  onCenterFloorPlan: () => void;
  onUploadClick: () => void;
  onLoadSample: () => void;
  onNewProject?: () => void;
  onSaveProject: () => void;
  onSaveAsProject?: () => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isDirty?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onLoadProject: () => void;
  onExportProjectJson: () => void;
  onImportProjectJson: (file: File) => void;
  onExportPng: () => void;
  onOpenExportModal?: (mode?: 'pdf' | 'png' | 'both') => void;
  onPrint: () => void;
  isPreparingPrint?: boolean;
  onOpenStoreInfo: () => void;
  onOpenScaleModal: () => void;
  visibility: VisibilitySettings;
  onVisibilityChange: (updated: VisibilitySettings) => void;
  hasFloorPlan: boolean;
  activeCableDrawing?: boolean;
  onFinishCableDrawing?: () => void;
  onCancelCableDrawing?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitFloorPlan,
  onCenterFloorPlan,
  onUploadClick,
  onLoadSample,
  onNewProject,
  onSaveProject,
  onSaveAsProject,
  isSaving = false,
  saveStatus = 'idle',
  isDirty = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onLoadProject,
  onExportProjectJson,
  onImportProjectJson,
  onExportPng,
  onOpenExportModal,
  onPrint,
  isPreparingPrint = false,
  onOpenStoreInfo,
  onOpenScaleModal,
  visibility,
  onVisibilityChange,
  hasFloorPlan,
  activeCableDrawing,
  onFinishCableDrawing,
  onCancelCableDrawing,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVisDropdown, setShowVisDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportProjectJson(file);
      e.target.value = '';
    }
  };

  const toggleLayer = (key: keyof VisibilitySettings) => {
    onVisibilityChange({
      ...visibility,
      [key]: !visibility[key],
    });
  };

  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-md">
      {/* Hidden JSON File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleJsonUpload}
        accept=".project,.json"
        className="hidden"
      />

      {/* Brand & Left: FILE & HISTORY GROUPS */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <Radio className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-black tracking-tight text-slate-900 leading-tight">
              STORE WIFI HITMAP
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Network Planner</div>
          </div>
        </div>

        {/* UNDO / REDO GROUP (#23, #33) */}
        <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo — Ctrl+Z (Cmd+Z)"
            aria-label="Undo"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              canUndo
                ? 'text-slate-700 hover:bg-white hover:text-slate-900 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo — Ctrl+Y (Cmd+Shift+Z)"
            aria-label="Redo"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              canRedo
                ? 'text-slate-700 hover:bg-white hover:text-slate-900 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Redo</span>
          </button>
        </div>

        {/* Group: FILE (#15, #16, #17, #19) */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          {onNewProject && (
            <button
              onClick={onNewProject}
              title="New Clean Project (Start fresh site survey)"
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors shrink-0"
            >
              <FilePlus className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          <button
            onClick={onUploadClick}
            title="Upload Floor Plan (PNG, JPG, PDF)"
            className="flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs transition-colors shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Upload Plan</span>
          </button>

          {!hasFloorPlan && (
            <button
              onClick={onLoadSample}
              title="Load Sample Retail Store Floor Plan"
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors shrink-0"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Sample</span>
            </button>
          )}

          {/* SAVE BUTTON (#15, #16, #35) */}
          <button
            onClick={onSaveProject}
            disabled={isSaving}
            title="Save Project (Updates saved project file & last modified date)"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all shadow-2xs ${
              saveStatus === 'saving' || isSaving
                ? 'bg-amber-500 text-white cursor-wait opacity-90'
                : saveStatus === 'saved'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : isDirty
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-1 ring-indigo-400'
                : 'bg-slate-700 hover:bg-slate-800 text-white'
            }`}
          >
            <Save className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>
              {isSaving || saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? '✓ Saved'
                : 'Save'}
            </span>
            {isDirty && saveStatus !== 'saved' && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" title="Unsaved changes" />
            )}
          </button>

          {/* SAVE AS BUTTON (#17) */}
          <button
            onClick={onSaveAsProject}
            title="Save As (Download editable .project file with custom name)"
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors shrink-0"
          >
            <FileDown className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Save As</span>
          </button>

          {/* LOAD PROJECT BUTTON (#19) */}
          <button
            onClick={onLoadProject}
            title="Load Project File (.project / .json)"
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors shrink-0"
          >
            <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden lg:inline">Load Project</span>
          </button>

          {/* EXPANDABLE EXPORT OPTIONS DROPDOWN (#38, #170) */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              title="Export Options (PNG Image / PDF Report)"
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              <span>Export</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showExportDropdown && (
              <div
                onMouseLeave={() => setShowExportDropdown(false)}
                className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-xs"
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  EXPORT FORMAT (#38)
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
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-indigo-50/70 text-slate-800 text-left font-semibold transition-colors"
                >
                  <span className="text-base leading-none">🖼</span>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">PNG Image</span>
                    <span className="text-[10px] text-slate-500 font-normal">High-res floor plan</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    if (onOpenExportModal) {
                      onOpenExportModal('pdf');
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-indigo-50/70 text-slate-800 text-left font-semibold transition-colors"
                >
                  <span className="text-base leading-none">📄</span>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">PDF Report</span>
                    <span className="text-[10px] text-slate-500 font-normal">Multi-page survey audit</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    if (onOpenExportModal) {
                      onOpenExportModal('both');
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-indigo-50/70 text-slate-800 text-left font-semibold transition-colors"
                >
                  <span className="text-base leading-none">📦</span>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Both PNG + PDF</span>
                    <span className="text-[10px] text-slate-500 font-normal">Full survey documentation</span>
                  </div>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => setShowExportDropdown(false)}
                  className="w-full text-center py-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 rounded"
                >
                  [ Cancel ]
                </button>
              </div>
            )}
          </div>

          {/* PROMINENT PRINT REPORT BUTTON (#104) */}
          <button
            onClick={onPrint}
            disabled={isPreparingPrint}
            title="Print Store WiFi & Infrastructure Report (A4 Landscape)"
            className="flex items-center gap-1 rounded-md bg-slate-900 hover:bg-black text-white px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-blue-400" />
            <span>{isPreparingPrint ? 'Preparing...' : 'Print'}</span>
          </button>

          <button
            onClick={onOpenStoreInfo}
            title="Store Information"
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden 2xl:inline">Store</span>
          </button>
        </div>
      </div>

      {/* Center: ADD & EDIT GROUPS */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {/* ADD GROUP */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTool('select')}
            title="Select & Reposition Tool"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              activeTool === 'select'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            onClick={() => setActiveTool('add-mdf')}
            title="Add MDF (Server Cabinet)"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              activeTool === 'add-mdf'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-blue-700 bg-blue-50/80 hover:bg-white'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>MDF</span>
          </button>

          <button
            onClick={() => setActiveTool('add-idf')}
            title="Add IDF (Switch Hub for Selling Area)"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              activeTool === 'add-idf'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-teal-700 bg-teal-50/80 hover:bg-white'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>IDF</span>
          </button>

          <button
            onClick={() => setActiveTool('add-ap')}
            title="Add Wireless Access Point"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              activeTool === 'add-ap'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 bg-emerald-50/80 hover:bg-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>AP</span>
          </button>

          <button
            onClick={() => setActiveTool('add-signal')}
            title="Add WiFi Signal Reading (0–100)"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              activeTool === 'add-signal'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-800 bg-slate-100 hover:bg-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>Reading</span>
          </button>

          <button
            onClick={() => setActiveTool('add-cable')}
            title="Add LAN Cable Route (Connect devices & enter meters)"
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTool === 'add-cable'
                ? 'bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-400/50'
                : 'text-indigo-700 bg-indigo-50 hover:bg-white'
            }`}
          >
            <Cable className="h-3.5 w-3.5" />
            <span>Add LAN Cable</span>
          </button>
        </div>

        {/* Cable Drawing Assistant Banner */}
        {activeCableDrawing && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 animate-pulse">
            <Cable className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold hidden lg:inline">Drawing Route:</span>
            <button
              onClick={onFinishCableDrawing}
              className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[11px] hover:bg-indigo-700"
            >
              Done
            </button>
            <button
              onClick={onCancelCableDrawing}
              className="text-slate-600 hover:text-slate-900 text-[11px] underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* EDIT GROUP */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTool('delete')}
            title="Delete Item Mode"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              activeTool === 'delete'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-600 hover:bg-white'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={onOpenScaleModal}
            title="Calibrate Floor Plan Scale for Distance Estimation"
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors"
          >
            <Ruler className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden xl:inline">Scale</span>
          </button>
        </div>
      </div>

      {/* Right: VIEW GROUP (#89, #94: [ - ], [ 75% ], [ + ], [ Fit ], [ Center ], [ Reset ], [ Layers ]) */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200 gap-1">
          {/* Zoom controls */}
          <button
            onClick={onZoomOut}
            title="Zoom Out (−)"
            className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          <span className="px-1 text-xs font-mono font-bold text-slate-800 min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

          {/* FIT FLOOR PLAN (#77, #94) */}
          <button
            onClick={onFitFloorPlan}
            title="Fit Floor Plan to Screen (Auto-zoom to fit available workspace)"
            className="flex items-center gap-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800 transition-colors shadow-2xs"
          >
            <Maximize2 className="h-3 w-3 text-blue-600" />
            <span>Fit</span>
          </button>

          {/* CENTER FLOOR PLAN (#94) */}
          <button
            onClick={onCenterFloorPlan}
            title="Center Floor Plan in Workspace"
            className="flex items-center gap-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
          >
            <Crosshair className="h-3 w-3 text-emerald-600" />
            <span className="hidden sm:inline">Center</span>
          </button>

          {/* RESET VIEW (#94) */}
          <button
            onClick={onResetView}
            title="Reset View to 100% Zoom"
            className="flex items-center gap-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
          >
            <RotateCcw className="h-3 w-3 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* LAYERS MENU (#90) */}
          <div className="relative">
            <button
              onClick={() => setShowVisDropdown(!showVisDropdown)}
              title="Toggle Overlays and Cable Label Details"
              className="flex items-center gap-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
            >
              <Eye className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden md:inline">Layers</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showVisDropdown && (
              <div
                onMouseLeave={() => setShowVisDropdown(false)}
                className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-xs"
              >
                <div className="px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span>INDEPENDENT LAYERS</span>
                  <Eye className="h-3 w-3" />
                </div>
                <div className="space-y-0.5">
                  {[
                    { key: 'showMdf', label: 'MDF / Server Cabinets' },
                    { key: 'showIdf', label: 'IDF / Switch Hubs' },
                    { key: 'showAps', label: 'Access Points (APs)' },
                    { key: 'showLanCables', label: 'LAN Cable Routes' },
                    { key: 'showLanLengths', label: 'Cable Badges & Lengths' },
                    { key: 'showSignalValues', label: 'Signal Values (Black)' },
                    { key: 'showWifiBars', label: 'WiFi Signal Icons' },
                    { key: 'showHeatmap', label: 'Coverage Heatmap' },
                    { key: 'showLegend', label: 'Show Legend' },
                  ].map((item) => {
                    const k = item.key as keyof VisibilitySettings;
                    return (
                      <label
                        key={item.key}
                        className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs select-none"
                      >
                        <span className="text-slate-700 font-medium">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(visibility[k])}
                          onChange={() => toggleLayer(k)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                      </label>
                    );
                  })}
                </div>

                {/* Cable Label Detail options (#84) */}
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <div className="px-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    CABLE LABEL DISPLAY (#84)
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['full', 'length-only', 'hidden'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          onVisibilityChange({
                            ...visibility,
                            cableLabelMode: mode,
                            showLanLengths: mode !== 'hidden',
                          })
                        }
                        className={`px-1.5 py-1 text-[10px] rounded font-semibold capitalize transition-colors ${
                          visibility.cableLabelMode === mode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {mode === 'full' ? 'Full' : mode === 'length-only' ? 'Length' : 'Hide'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLLAPSIBLE SIDEBAR TOGGLE (#86) */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Hide Sidebar (Maximize floor plan workspace)' : 'Show Sidebar Panels'}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-2xs border transition-colors ${
            isSidebarOpen
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              : 'bg-slate-900 hover:bg-black text-white border-transparent ring-2 ring-blue-400/40'
          }`}
        >
          {isSidebarOpen ? (
            <>
              <PanelRightClose className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Hide Panels</span>
            </>
          ) : (
            <>
              <PanelRightOpen className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Show Panels</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
