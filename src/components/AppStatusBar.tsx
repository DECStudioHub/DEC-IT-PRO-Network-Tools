/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveTool, FloorScale, StoreInfo } from '../types';
import {
  Maximize2,
  Minimize2,
  Ruler,
  Server,
  Network,
  Radio,
  Cable,
  Activity,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';

interface AppStatusBarProps {
  storeInfo: StoreInfo;
  activeTool: ActiveTool;
  mdfCount: number;
  idfCount: number;
  apCount: number;
  cablesCount: number;
  signalsCount: number;
  floorScale: FloorScale;
  zoom: number;
  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedTime?: string | null;
  isExpandedWorkspace: boolean;
  onToggleExpandedWorkspace: () => void;
  onFitFloorPlan: () => void;
  onOpenScaleModal: () => void;
}

export const AppStatusBar: React.FC<AppStatusBarProps> = ({
  storeInfo,
  activeTool,
  mdfCount,
  idfCount,
  apCount,
  cablesCount,
  signalsCount,
  floorScale,
  zoom,
  isDirty,
  saveStatus,
  lastSavedTime,
  isExpandedWorkspace,
  onToggleExpandedWorkspace,
  onFitFloorPlan,
  onOpenScaleModal,
}) => {
  const getToolHint = () => {
    switch (activeTool) {
      case 'select':
        return 'Select: Click and drag markers to reposition, or drag canvas to pan';
      case 'add-ap':
        return 'AP Tool: Click on floor plan to place Wireless Access Point';
      case 'add-mdf':
        return 'MDF Tool: Click on floor plan to place Main Server Cabinet';
      case 'add-idf':
        return 'IDF Tool: Click on floor plan to place IDF Switch Hub';
      case 'add-signal':
        return 'WiFi Reading: Click on floor plan to record signal dBm measurement';
      case 'add-cable':
        return 'LAN Cable: Click between devices to route and calculate cable run';
      case 'delete':
        return 'Delete Tool: Click any device, cable, or reading to delete';
      default:
        return 'Ready';
    }
  };

  const branchName = storeInfo.branchName || storeInfo.storeName || 'Branch Survey';

  return (
    <footer className="no-print relative z-30 flex h-6 w-full items-center justify-between border-t border-slate-700 bg-slate-900 px-3 text-[11px] text-slate-400 select-none shrink-0 font-sans">
      {/* Left: Brand & Branch */}
      <div className="flex items-center gap-2 truncate">
        <span className="font-semibold text-slate-300">DECStudioAiCreation</span>
        <span className="text-slate-600">•</span>
        <span className="font-bold text-emerald-400">WIFI HITMAP v1.0.1</span>
        <span className="hidden md:inline text-slate-600">•</span>
        <span className="hidden md:flex items-center gap-1 text-slate-300 truncate font-medium">
          <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="truncate max-w-[180px]">{branchName}</span>
        </span>
      </div>

      {/* Center: Tool Hint */}
      <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-center truncate max-w-[360px] xl:max-w-[500px]">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
        <span className="truncate text-slate-300">{getToolHint()}</span>
      </div>

      {/* Right: Counts, Scale, Zoom, Save Status, Expand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Device Counters */}
        <div className="hidden xl:flex items-center gap-2 text-slate-400 font-mono text-[10px]">
          <span title="MDF Cabinets" className="flex items-center gap-0.5 text-blue-300">
            <Server className="h-2.5 w-2.5 text-blue-400" />
            {mdfCount}
          </span>
          <span title="IDF Switches" className="flex items-center gap-0.5 text-teal-300">
            <Network className="h-2.5 w-2.5 text-teal-400" />
            {idfCount}
          </span>
          <span title="Access Points" className="flex items-center gap-0.5 text-emerald-300">
            <Radio className="h-2.5 w-2.5 text-emerald-400" />
            {apCount}
          </span>
          <span title="LAN Cables" className="flex items-center gap-0.5 text-indigo-300">
            <Cable className="h-2.5 w-2.5 text-indigo-400" />
            {cablesCount}
          </span>
          <span title="WiFi Readings" className="flex items-center gap-0.5 text-slate-300">
            <Activity className="h-2.5 w-2.5 text-amber-400" />
            {signalsCount}
          </span>
        </div>

        <div className="hidden xl:block h-3 w-[1px] bg-slate-700" />

        {/* Scale indicator */}
        <button
          onClick={onOpenScaleModal}
          title="Click to calibrate floor plan scale"
          className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Ruler className="h-3 w-3 text-amber-400" />
          <span className="font-mono text-[10.5px]">
            {floorScale.realMeters}m / {floorScale.pixelDistance}px
          </span>
        </button>

        <div className="hidden sm:block h-3 w-[1px] bg-slate-700" />

        {/* Zoom */}
        <button
          onClick={onFitFloorPlan}
          title="Zoom Level (Click to Auto-Fit)"
          className="font-mono text-slate-200 hover:text-white transition-colors cursor-pointer"
        >
          {Math.round(zoom * 100)}%
        </button>

        <div className="h-3 w-[1px] bg-slate-700" />

        {/* Save Status */}
        <div className="flex items-center gap-1 font-medium">
          {saveStatus === 'saving' ? (
            <span className="text-amber-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              Saving
            </span>
          ) : isDirty ? (
            <span className="text-amber-300 flex items-center gap-1" title="Unsaved changes">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Modified
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1" title="Project up to date">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Saved
            </span>
          )}
        </div>

        <div className="h-3 w-[1px] bg-slate-700" />

        {/* Expand Workspace Toggle Button */}
        <button
          onClick={onToggleExpandedWorkspace}
          title={isExpandedWorkspace ? 'Restore Standard Layout' : 'Expand Workspace (Maximize Floor Plan Canvas)'}
          className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {isExpandedWorkspace ? (
            <>
              <Minimize2 className="h-3 w-3 text-blue-400" />
              <span className="hidden sm:inline">Exit Full</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3 w-3 text-blue-400" />
              <span className="hidden sm:inline">Expand</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
