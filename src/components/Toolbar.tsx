/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { ActiveTool, VisibilitySettings } from '../types';
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
  Minimize2,
  Crosshair,
  Save,
  FolderOpen,
  Download,
  Printer,
  Eye,
  Ruler,
  Building2,
  Sparkles,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  Undo2,
  Redo2,
  FileDown,
  FilePlus,
  Coffee,
  History,
  MoreHorizontal,
  Check,
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
  onOpenWelcome?: () => void;
  onOpenSupport?: () => void;
  onResetAllItems?: () => void;
  onOpenWhatsNew?: () => void;
  isExpandedWorkspace?: boolean;
  onToggleExpandedWorkspace?: () => void;
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
  onOpenWelcome,
  onOpenSupport,
  onResetAllItems,
  onOpenWhatsNew,
  isExpandedWorkspace = false,
  onToggleExpandedWorkspace,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVisDropdown, setShowVisDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

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
    <div className="no-print relative z-30 flex h-10 w-full items-center justify-between border-b border-slate-200 bg-white px-2.5 shadow-2xs select-none shrink-0 overflow-x-auto">
      {/* Hidden JSON File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleJsonUpload}
        accept=".project,.json"
        className="hidden"
      />

      {/* LEFT: COMMAND GROUPS (FILE & TOOLS) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* GROUP 1 — FILE */}
        <div className="flex items-center gap-0.5">
          {onNewProject && (
            <button
              onClick={onNewProject}
              title="New Project (Clean workspace)"
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <FilePlus className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          <button
            onClick={onUploadClick}
            title="Upload Floor Plan (PNG, JPG, PDF)"
            className="flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 text-xs font-bold transition-colors cursor-pointer border border-blue-200/60"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Upload Plan</span>
          </button>

          {!hasFloorPlan && (
            <button
              onClick={onLoadSample}
              title="Load Sample Retail Store Floor Plan"
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer border border-amber-200"
            >
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span>Sample</span>
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        {/* GROUP 2 — TOOLS (Primary priority) */}
        <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
          {/* SELECT */}
          <button
            onClick={() => setActiveTool('select')}
            title="Select & Pan Tool (V)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-slate-900 text-white shadow-2xs ring-1 ring-slate-800'
                : 'text-slate-700 hover:bg-white hover:text-slate-900'
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span>Select</span>
          </button>

          {/* AP */}
          <button
            onClick={() => setActiveTool('add-ap')}
            title="Add Wireless Access Point (A)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'add-ap'
                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-emerald-600 active-text-white" />
            <span>AP</span>
          </button>

          {/* MDF */}
          <button
            onClick={() => setActiveTool('add-mdf')}
            title="Add MDF Server Cabinet (M)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'add-mdf'
                ? 'bg-blue-600 text-white shadow-2xs ring-1 ring-blue-500'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Server className="h-3.5 w-3.5 text-blue-600" />
            <span>MDF</span>
          </button>

          {/* IDF */}
          <button
            onClick={() => setActiveTool('add-idf')}
            title="Add IDF Switch Hub (I)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'add-idf'
                ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-500'
                : 'text-teal-700 hover:bg-teal-50'
            }`}
          >
            <Network className="h-3.5 w-3.5 text-teal-600" />
            <span>IDF</span>
          </button>

          {/* READING */}
          <button
            onClick={() => setActiveTool('add-signal')}
            title="Add WiFi Signal Reading dBm (R)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'add-signal'
                ? 'bg-slate-900 text-white shadow-2xs ring-1 ring-slate-800'
                : 'text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-amber-500" />
            <span>Reading</span>
          </button>

          {/* LAN CABLE */}
          <button
            onClick={() => setActiveTool('add-cable')}
            title="Add LAN Cable Route (C)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'add-cable'
                ? 'bg-indigo-600 text-white shadow-2xs ring-1 ring-indigo-500'
                : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Cable className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">LAN Cable</span>
            <span className="sm:hidden">Cable</span>
          </button>

          {/* DELETE */}
          <button
            onClick={() => setActiveTool('delete')}
            title="Delete Mode (D)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'delete'
                ? 'bg-rose-600 text-white shadow-2xs ring-1 ring-rose-500'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>

          {/* SCALE CALIBRATION */}
          <button
            onClick={onOpenScaleModal}
            title="Calibrate Floor Plan Scale for Distance Measurement"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-white transition-colors cursor-pointer"
          >
            <Ruler className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden md:inline">Scale</span>
          </button>
        </div>

        {/* IN-PROGRESS CABLE DRAWING HELPER */}
        {activeCableDrawing && (
          <div className="flex items-center gap-2 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded-md text-xs text-indigo-900 animate-pulse">
            <Cable className="h-3 w-3 text-indigo-600 shrink-0" />
            <span className="font-semibold text-[11px] hidden sm:inline">Drawing Cable:</span>
            <button
              onClick={onFinishCableDrawing}
              className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[10.5px] hover:bg-indigo-700 cursor-pointer"
            >
              Done
            </button>
            <button
              onClick={onCancelCableDrawing}
              className="text-slate-600 hover:text-slate-900 text-[10.5px] underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: VIEW & SYSTEM GROUPS */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {/* GROUP 3 — VIEW */}
        <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
          {/* Zoom Out */}
          <button
            onClick={onZoomOut}
            title="Zoom Out (−)"
            className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          {/* Zoom Level */}
          <span className="px-1 text-xs font-mono font-bold text-slate-800 min-w-[36px] text-center select-none">
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In */}
          <button
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="h-3.5 w-[1px] bg-slate-300 mx-0.5" />

          {/* FIT */}
          <button
            onClick={onFitFloorPlan}
            title="Fit Floor Plan to Screen"
            className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-slate-700 hover:bg-white transition-colors cursor-pointer"
          >
            <Maximize2 className="h-3 w-3 text-blue-600" />
            <span className="hidden sm:inline">Fit</span>
          </button>

          {/* CENTER */}
          <button
            onClick={onCenterFloorPlan}
            title="Center Floor Plan"
            className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-slate-700 hover:bg-white transition-colors cursor-pointer"
          >
            <Crosshair className="h-3 w-3 text-emerald-600" />
            <span className="hidden md:inline">Center</span>
          </button>

          {/* RESET VIEW */}
          <button
            onClick={onResetView}
            title="Reset View (100% Zoom)"
            className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-slate-700 hover:bg-white transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 text-slate-500" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* LAYERS DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowVisDropdown(!showVisDropdown)}
              title="Toggle Independent Map Layers"
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-slate-600" />
              <span>Layers</span>
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
                    { key: 'showSignalValues', label: 'Signal Values (dBm)' },
                    { key: 'showWifiBars', label: 'WiFi Signal Icons' },
                    { key: 'showHeatmap', label: 'Coverage Heatmap' },
                    { key: 'showLegend', label: 'Show Legend' },
                  ].map((item) => {
                    const k = item.key as keyof VisibilitySettings;
                    return (
                      <label
                        key={item.key}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs select-none"
                      >
                        <span className="text-slate-700 font-medium">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(visibility[k])}
                          onChange={() => toggleLayer(k)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>

                {/* Cable Label Detail options */}
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <div className="px-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    CABLE BADGE DISPLAY
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
                        className={`px-1.5 py-1 text-[10px] rounded font-semibold capitalize transition-colors cursor-pointer ${
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

        {/* Separator */}
        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        {/* GROUP 4 — SYSTEM & WORKSPACE CONTROLS */}
        <div className="flex items-center gap-1">
          {/* UNDO */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`rounded p-1 text-slate-700 transition-colors ${
              canUndo
                ? 'hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>

          {/* REDO */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`rounded p-1 text-slate-700 transition-colors ${
              canRedo
                ? 'hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>

          {/* EXPAND WORKSPACE BUTTON */}
          {onToggleExpandedWorkspace && (
            <button
              onClick={onToggleExpandedWorkspace}
              title={isExpandedWorkspace ? 'Restore Normal Workspace Layout' : 'Expand Workspace (Maximize Editing Canvas)'}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                isExpandedWorkspace
                  ? 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isExpandedWorkspace ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Normal View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Expand</span>
                </>
              )}
            </button>
          )}

          {/* HIDE / SHOW SIDEBAR PANELS */}
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Hide Side Panels (Expand canvas width)' : 'Show Side Panels'}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
              isSidebarOpen
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-slate-900 hover:bg-black text-white border-transparent'
            }`}
          >
            {isSidebarOpen ? (
              <>
                <PanelRightClose className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Hide Panels</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Show Panels</span>
              </>
            )}
          </button>

          {/* MORE OPTIONS DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              title="More System & Project Tools"
              className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMoreDropdown && (
              <div
                onMouseLeave={() => setShowMoreDropdown(false)}
                className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 text-xs"
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  MORE ACTIONS
                </div>

                {/* Reset All Items */}
                {onResetAllItems && (
                  <button
                    onClick={() => {
                      setShowMoreDropdown(false);
                      onResetAllItems();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-left font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                    <span>Reset All Items</span>
                  </button>
                )}

                {/* Branch Info */}
                <button
                  onClick={() => {
                    setShowMoreDropdown(false);
                    onOpenStoreInfo();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 text-left font-semibold transition-colors cursor-pointer"
                >
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Branch Information</span>
                </button>

                {/* Scale Calibration */}
                <button
                  onClick={() => {
                    setShowMoreDropdown(false);
                    onOpenScaleModal();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 text-left font-semibold transition-colors cursor-pointer"
                >
                  <Ruler className="h-3.5 w-3.5 text-amber-500" />
                  <span>Calibrate Scale</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                {/* Export Project JSON Backup */}
                <button
                  onClick={() => {
                    setShowMoreDropdown(false);
                    onExportProjectJson();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 text-left font-semibold transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Export Project JSON</span>
                </button>

                {/* Import Project JSON Backup */}
                <button
                  onClick={() => {
                    setShowMoreDropdown(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 text-left font-semibold transition-colors cursor-pointer"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
                  <span>Import Project JSON</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                {/* What's New */}
                {onOpenWhatsNew && (
                  <button
                    onClick={() => {
                      setShowMoreDropdown(false);
                      onOpenWhatsNew();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 text-left font-semibold transition-colors cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5 text-blue-500" />
                    <span>What's New (v1.0.1)</span>
                  </button>
                )}

                {/* Support DECStudio */}
                {onOpenSupport && (
                  <button
                    onClick={() => {
                      setShowMoreDropdown(false);
                      onOpenSupport();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-amber-700 hover:bg-amber-50 text-left font-semibold transition-colors cursor-pointer"
                  >
                    <Coffee className="h-3.5 w-3.5 text-amber-500" />
                    <span>Support DECStudio</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
