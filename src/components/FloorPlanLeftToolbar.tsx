/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActiveTool } from '../types';
import {
  MousePointer,
  Radio,
  Server,
  Network,
  Activity,
  Cable,
  Ruler,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  Menu,
  Wrench,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';

export interface FloorPlanLeftToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onOpenScaleModal: () => void;
  hasFloorPlan: boolean;
  activeCableDrawing?: boolean;
  onFinishCableDrawing?: () => void;
  onCancelCableDrawing?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isCompact: boolean;
  onToggleCompact: () => void;
}

interface ToolDef {
  id: ActiveTool | 'scale';
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  shortcut: string;
  tooltip: string;
  activeBg: string;
  activeRing: string;
  textColor: string;
  iconColor: string;
  isDestructive?: boolean;
}

const PRIMARY_TOOLS: ToolDef[] = [
  {
    id: 'select',
    label: 'Select',
    shortLabel: 'Select',
    icon: MousePointer,
    shortcut: 'V',
    tooltip: 'Select and move items',
    activeBg: 'bg-slate-900 text-white',
    activeRing: 'ring-2 ring-slate-800 shadow-md',
    textColor: 'text-slate-800',
    iconColor: 'text-slate-700',
  },
  {
    id: 'add-ap',
    label: 'AP',
    shortLabel: 'AP',
    icon: Radio,
    shortcut: 'A',
    tooltip: 'Add Wireless Access Point',
    activeBg: 'bg-emerald-600 text-white',
    activeRing: 'ring-2 ring-emerald-500 shadow-md',
    textColor: 'text-emerald-800',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'add-mdf',
    label: 'MDF',
    shortLabel: 'MDF',
    icon: Server,
    shortcut: 'M',
    tooltip: 'Add MDF Server Cabinet',
    activeBg: 'bg-blue-600 text-white',
    activeRing: 'ring-2 ring-blue-500 shadow-md',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
  },
  {
    id: 'add-idf',
    label: 'IDF',
    shortLabel: 'IDF',
    icon: Network,
    shortcut: 'I',
    tooltip: 'Add IDF Switch Hub',
    activeBg: 'bg-teal-600 text-white',
    activeRing: 'ring-2 ring-teal-500 shadow-md',
    textColor: 'text-teal-800',
    iconColor: 'text-teal-600',
  },
  {
    id: 'add-signal',
    label: 'Reading',
    shortLabel: 'Reading',
    icon: Activity,
    shortcut: 'R',
    tooltip: 'Add WiFi Signal Reading',
    activeBg: 'bg-amber-600 text-white',
    activeRing: 'ring-2 ring-amber-500 shadow-md',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-600',
  },
  {
    id: 'add-cable',
    label: 'LAN Cable',
    shortLabel: 'LAN',
    icon: Cable,
    shortcut: 'L',
    tooltip: 'Draw LAN Cable Route and Add Cable Length',
    activeBg: 'bg-indigo-600 text-white',
    activeRing: 'ring-2 ring-indigo-500 shadow-md',
    textColor: 'text-indigo-800',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'delete',
    label: 'Delete',
    shortLabel: 'Delete',
    icon: Trash2,
    shortcut: 'Del',
    tooltip: 'Delete Selected Item',
    activeBg: 'bg-rose-600 text-white',
    activeRing: 'ring-2 ring-rose-500 shadow-md',
    textColor: 'text-rose-700',
    iconColor: 'text-rose-600',
    isDestructive: true,
  },
  {
    id: 'scale',
    label: 'Scale',
    shortLabel: 'Scale',
    icon: Ruler,
    shortcut: 'S',
    tooltip: 'Set Floor Plan Scale & Calibration',
    activeBg: 'bg-amber-700 text-white',
    activeRing: 'ring-2 ring-amber-600 shadow-md',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-600',
  },
];

export const FloorPlanLeftToolbar: React.FC<FloorPlanLeftToolbarProps> = ({
  activeTool,
  setActiveTool,
  onOpenScaleModal,
  hasFloorPlan,
  activeCableDrawing,
  onFinishCableDrawing,
  onCancelCableDrawing,
  isCollapsed,
  onToggleCollapse,
  isCompact,
  onToggleCompact,
}) => {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const handleToolClick = (toolId: ActiveTool | 'scale') => {
    if (toolId === 'scale') {
      onOpenScaleModal();
    } else {
      setActiveTool(toolId);
    }
  };

  // When collapsed, render only the unobtrusive floating/docked "Show Tools" button
  if (isCollapsed) {
    return (
      <div className="relative z-30 shrink-0 select-none">
        <button
          id="btn-unhide-left-toolbar"
          onClick={onToggleCollapse}
          title="Show Floor Plan Tools (Click to Unhide)"
          className="absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-black text-white px-3 py-2 text-xs font-bold shadow-xl border border-slate-700 transition-all hover:scale-105 cursor-pointer animate-in fade-in"
        >
          <Menu className="h-4 w-4 text-blue-400" />
          <span>Tools</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  const toolbarWidthClass = isCompact ? 'w-16' : 'w-56';

  return (
    <div
      id="floor-plan-left-toolbar"
      className={`relative z-20 flex flex-col h-full bg-white border-r border-slate-200 select-none shrink-0 transition-all duration-200 ease-in-out shadow-xs ${toolbarWidthClass}`}
    >
      {/* HEADER: ☰ Tools + COMPACT TOGGLE + HIDE BUTTON */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-3 py-2 shrink-0">
        {!isCompact ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <Menu className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 truncate">
              Tools
            </span>
          </div>
        ) : (
          <div className="mx-auto" title="Tools">
            <Menu className="h-4 w-4 text-blue-600" />
          </div>
        )}

        <div className="flex items-center gap-0.5 ml-auto">
          {/* Compact / Full mode toggle */}
          <button
            onClick={onToggleCompact}
            title={isCompact ? 'Expand to Full Toolbar' : 'Switch to Compact Icon Mode'}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            {isCompact ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>

          {/* Hide button */}
          <button
            onClick={onToggleCollapse}
            title="Hide Left Toolbar"
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CABLE DRAWING STATUS BANNER (If drawing in progress) */}
      {activeCableDrawing && (
        <div className="p-2 bg-indigo-50 border-b border-indigo-200 text-indigo-900 shrink-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Cable className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            {!isCompact && (
              <span className="text-[11px] font-bold text-indigo-950">Drawing Cable...</span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={onFinishCableDrawing}
              title="Finish Cable Route"
              className="flex-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1 px-1.5 text-center cursor-pointer shadow-2xs"
            >
              Done
            </button>
            <button
              onClick={onCancelCableDrawing}
              title="Cancel Cable Route"
              className="rounded bg-white hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold py-1 px-1.5 border border-indigo-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MAIN TOOLS LIST (Independently Scrollable) */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {PRIMARY_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <div
              key={tool.id}
              className="relative"
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
            >
              <button
                id={`btn-tool-${tool.id}`}
                onClick={() => handleToolClick(tool.id)}
                title={isCompact ? `${tool.label} (${tool.shortcut}): ${tool.tooltip}` : undefined}
                className={`w-full flex items-center rounded-lg transition-all cursor-pointer ${
                  isCompact ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2 text-left'
                } ${
                  isActive
                    ? `${tool.activeBg} ${tool.activeRing}`
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100 hover:border-slate-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-white' : tool.iconColor
                  }`}
                />

                {!isCompact && (
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {tool.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        isActive
                          ? 'bg-white/20 text-white font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tool.shortcut}
                    </span>
                  </div>
                )}
              </button>

              {/* FLOATING HOVER TOOLTIP IN COMPACT MODE */}
              {isCompact && hoveredTool === tool.id && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 whitespace-nowrap rounded-md bg-slate-900 text-white px-2.5 py-1.5 text-xs shadow-xl border border-slate-700 pointer-events-none animate-in fade-in duration-100">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{tool.label}</span>
                    <span className="bg-slate-800 text-blue-300 px-1 py-0.2 rounded text-[10px] font-mono">
                      {tool.shortcut}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-300 font-normal">
                    {tool.tooltip}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* DELETE SAFETY WARNING BOX (When activeTool === 'delete' - Requirement 305) */}
        {activeTool === 'delete' && !isCompact && (
          <div className="mt-2 rounded-lg bg-rose-50 border border-rose-300 p-2.5 text-rose-900 text-[11px] animate-in fade-in">
            <div className="flex items-center gap-1.5 font-extrabold text-rose-800 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span>DELETE MODE ACTIVE</span>
            </div>
            <p className="text-[10.5px] text-rose-700 leading-snug mb-2">
              Click any item on the floor plan to remove it.
            </p>
            <button
              onClick={() => setActiveTool('select')}
              className="w-full flex items-center justify-center gap-1 rounded bg-white hover:bg-rose-100 text-rose-800 text-[11px] font-bold py-1 px-2 border border-rose-300 cursor-pointer shadow-2xs transition-colors"
            >
              <X className="h-3 w-3 text-rose-600" />
              <span>Cancel Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* FOOTER: HIDE TOOLS BUTTON */}
      <div className="border-t border-slate-200 p-1.5 bg-slate-50/60 shrink-0">
        <button
          id="btn-hide-left-toolbar"
          onClick={onToggleCollapse}
          title="Hide Left Toolbar (Wider Floor Plan View)"
          className={`w-full flex items-center rounded-lg py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer ${
            isCompact ? 'justify-center px-1' : 'justify-center gap-1.5 px-2'
          }`}
        >
          <ChevronLeft className="h-3.5 w-3.5 text-slate-500" />
          {!isCompact && <span>Hide Tools</span>}
        </button>
      </div>
    </div>
  );
};
