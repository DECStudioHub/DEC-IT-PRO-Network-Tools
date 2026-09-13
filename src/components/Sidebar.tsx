/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  VisibilitySettings,
  StoreInfo,
  AppearanceSettings,
  ItemAppearance,
} from '../types';
import { LanCableSummaryPanel } from './Panels/LanCableSummaryPanel';
import { NetworkInfrastructureSummaryPanel } from './Panels/NetworkInfrastructureSummaryPanel';
import { NetworkHierarchyPanel } from './Panels/NetworkHierarchyPanel';
import { WifiCoverageSummaryPanel } from './Panels/WifiCoverageSummaryPanel';
import { LayerControlsPanel } from './Panels/LayerControlsPanel';
import { AppearancePanel } from './Panels/AppearancePanel';
import { InsightsPanel } from './Panels/InsightsPanel';
import { WifiSignalIcon } from './WifiSignalIcon';
import {
  Layers,
  GitBranch,
  Cable,
  BarChart3,
  Search,
  Server,
  Network,
  Radio,
  Plus,
  ChevronRight,
  ChevronDown,
  X,
  GripVertical,
  Check,
  Eye,
  Sliders,
  Sparkles,
  FileCheck2,
  Settings,
} from 'lucide-react';

export type MainSidebarTab = 'details' | 'appearance' | 'insights' | 'summary';
export type DetailsSubTab = 'cables' | 'network' | 'legend' | 'layers';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  onResize: (newWidth: number) => void;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  visibility: VisibilitySettings;
  onVisibilityChange: (v: VisibilitySettings) => void;
  storeInfo: StoreInfo;
  appearanceSettings?: AppearanceSettings;
  onUpdateGlobalSettings?: (settings: AppearanceSettings) => void;
  onUpdateItemAppearance?: (type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal', id: string, appearance: ItemAppearance) => void;
  onApplyToAllType?: (type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal', appearance: ItemAppearance) => void;
  onResetTypeToDefault?: (type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal', id?: string) => void;
  selectedItem?: { type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal'; id: string; name: string; appearance?: ItemAppearance } | null;
  onSelectMdf: (mdf: MDFDevice) => void;
  onSelectIdf: (idf: IDFDevice) => void;
  onSelectAp: (ap: AccessPoint) => void;
  onSelectCable: (cable: LanCable) => void;
  onAddCableClick: () => void;
  onAddMdfClick: () => void;
  onAddIdfClick: () => void;
  onAddApClick: () => void;
  onOpenProjectDetails?: () => void;
  onOpenPrintReport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  width,
  onResize,
  mdfDevices,
  idfDevices,
  accessPoints,
  signalReadings,
  lanCables,
  visibility,
  onVisibilityChange,
  storeInfo,
  appearanceSettings,
  onUpdateGlobalSettings,
  onUpdateItemAppearance,
  onApplyToAllType,
  onResetTypeToDefault,
  selectedItem,
  onSelectMdf,
  onSelectIdf,
  onSelectAp,
  onSelectCable,
  onAddCableClick,
  onAddMdfClick,
  onAddIdfClick,
  onAddApClick,
  onOpenProjectDetails,
  onOpenPrintReport,
}) => {
  // Primary Tabs (#157): [ Details ] [ Appearance ] [ Insights ] [ Summary ]
  const [activeMainTab, setActiveMainTab] = useState<MainSidebarTab>('details');
  const [detailsSubTab, setDetailsSubTab] = useState<DetailsSubTab>('cables');
  const [cableSearch, setCableSearch] = useState('');
  const [expandedCableId, setExpandedCableId] = useState<string | null>(null);

  // Resize drag handling (#87)
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = startXRef.current - e.clientX; // dragging left increases width
    const newWidth = Math.max(280, Math.min(560, startWidthRef.current + deltaX));
    onResize(newWidth);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };

  if (!isOpen) return null;

  // Filter cables
  const filteredCables = lanCables.filter((c) => {
    if (!cableSearch.trim()) return true;
    const q = cableSearch.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.fromName.toLowerCase().includes(q) ||
      c.toName.toLowerCase().includes(q) ||
      c.cableType.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative z-30 flex flex-col h-full bg-white border-l border-slate-200 shadow-xl transition-[width] duration-75 select-none"
    >
      {/* Draggable Divider on Left Edge (#87) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Drag to resize sidebar width"
        className="absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-40 flex items-center justify-center group"
      >
        <div className="w-1.5 h-12 rounded-full bg-slate-300 group-hover:bg-blue-600 transition-colors shadow-xs" />
      </div>

      {/* Top Header & Section Tabs (#79: Tabbed structure) */}
      <div className="border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Information & Inspection Panel
          </span>
          <button
            onClick={onClose}
            title="Collapse Sidebar"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 4 PRIMARY HITMAP INSIGHTS DASHBOARD TABS (#157) */}
        {/* [ Details ] [ Appearance ] [ Insights ] [ Summary ] */}
        <div className="grid grid-cols-4 text-xs font-semibold text-center border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1">
          <button
            onClick={() => setActiveMainTab('details')}
            className={`py-2 rounded-lg transition-all ${
              activeMainTab === 'details'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveMainTab('appearance')}
            className={`py-2 rounded-lg transition-all ${
              activeMainTab === 'appearance'
                ? 'bg-white text-purple-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveMainTab('insights')}
            className={`py-2 rounded-lg transition-all ${
              activeMainTab === 'insights'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>Insights</span>
            </span>
          </button>
          <button
            onClick={() => setActiveMainTab('summary')}
            className={`py-2 rounded-lg transition-all ${
              activeMainTab === 'summary'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Summary
          </button>
        </div>

        {/* Sub-Tabs under Details for rapid inspection of Cables, Network, Legend, Layers */}
        {activeMainTab === 'details' && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[11px]">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setDetailsSubTab('cables')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  detailsSubTab === 'cables'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cables ({lanCables.length})
              </button>
              <button
                onClick={() => setDetailsSubTab('network')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  detailsSubTab === 'network'
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Network
              </button>
              <button
                onClick={() => setDetailsSubTab('legend')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  detailsSubTab === 'legend'
                    ? 'bg-slate-800 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Legend
              </button>
              <button
                onClick={() => setDetailsSubTab('layers')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  detailsSubTab === 'layers'
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Layers
              </button>
            </div>
            {onOpenProjectDetails && (
              <button
                onClick={onOpenProjectDetails}
                className="text-[10.5px] text-blue-600 hover:text-blue-800 font-semibold underline shrink-0 ml-1"
                title="Edit Store & Technician Metadata"
              >
                Edit Info
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Tab Content: Strictly One Section at a time (#79, #80) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* DETAILS -> LEGEND SUBTAB */}
        {activeMainTab === 'details' && detailsSubTab === 'legend' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  WIFI HITMAP LEGEND (#81)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Standardized survey color codes and infrastructure symbols
                </p>
              </div>

              {/* Signal Strength */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SIGNAL STRENGTH (0–100)
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
                    <div className="flex items-center gap-2">
                      <WifiSignalIcon bars={3} size={17} activeColor="#16a34a" />
                      <span className="font-bold text-slate-900">81–100</span>
                      <span className="text-emerald-700 font-medium">(3 Bars)</span>
                    </div>
                    <span className="font-bold text-emerald-800 text-[11px]">Strong / Excellent</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-xs">
                    <div className="flex items-center gap-2">
                      <WifiSignalIcon bars={2} size={17} activeColor="#d97706" />
                      <span className="font-bold text-slate-900">40–80</span>
                      <span className="text-amber-700 font-medium">(2 Bars)</span>
                    </div>
                    <span className="font-bold text-amber-800 text-[11px]">Good / Moderate</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 border border-rose-100 text-xs">
                    <div className="flex items-center gap-2">
                      <WifiSignalIcon bars={1} size={17} activeColor="#dc2626" />
                      <span className="font-bold text-slate-900">0–39</span>
                      <span className="text-rose-700 font-medium">(1 Bar)</span>
                    </div>
                    <span className="font-bold text-rose-800 text-[11px]">Weak</span>
                  </div>
                </div>
              </div>

              {/* Network Infrastructure Icons */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  NETWORK INFRASTRUCTURE
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white shrink-0">
                      <Server className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold font-mono text-slate-900">MDF</span>
                      <span className="text-slate-600 ml-1.5 text-[11px]">Main Server Cabinet</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-teal-600 text-white shrink-0">
                      <Network className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold font-mono text-slate-900">IDF</span>
                      <span className="text-slate-600 ml-1.5 text-[11px]">Switch Hub (Selling Area)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0 border border-white">
                      <Radio className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold font-mono text-slate-900">AP</span>
                      <span className="text-slate-600 ml-1.5 text-[11px]">Wireless Access Point</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white shrink-0">
                      <Cable className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold font-mono text-slate-900">LAN Cable</span>
                      <span className="text-slate-600 ml-1.5 text-[11px]">Route with Meters (CAT6/Fiber)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Black numbers note */}
              <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-200">
                <span className="font-bold text-slate-900">Black Numbers:</span> Directly indicate raw measured WiFi signal values (0–100). The original architectural floor plan remains pristine.
              </div>
            </div>
          </div>
        )}

        {/* DETAILS -> NETWORK DEVICES SUBTAB */}
        {activeMainTab === 'details' && detailsSubTab === 'network' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-700">Infrastructure Inventory</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={onAddMdfClick}
                  className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100"
                >
                  + MDF
                </button>
                <button
                  onClick={onAddIdfClick}
                  className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 hover:bg-teal-100"
                >
                  + IDF
                </button>
                <button
                  onClick={onAddApClick}
                  className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100"
                >
                  + AP
                </button>
              </div>
            </div>

            {/* Topology & Distribution Tree */}
            <NetworkHierarchyPanel
              mdfDevices={mdfDevices}
              idfDevices={idfDevices}
              accessPoints={accessPoints}
              lanCables={lanCables}
              onSelectDevice={(id) => {
                const mdf = mdfDevices.find((d) => d.id === id);
                if (mdf) return onSelectMdf(mdf);
                const idf = idfDevices.find((d) => d.id === id);
                if (idf) return onSelectIdf(idf);
                const ap = accessPoints.find((d) => d.id === id);
                if (ap) return onSelectAp(ap);
              }}
            />
          </div>
        )}

        {/* DETAILS -> LAN CABLES SUBTAB (#82) */}
        {activeMainTab === 'details' && detailsSubTab === 'cables' && (
          <div className="space-y-3.5">
            {/* Action Bar & Search Filter */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-700">
                LAN Cables ({filteredCables.length})
              </span>
              <button
                onClick={onAddCableClick}
                className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-md shadow-2xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Cable</span>
              </button>
            </div>

            {/* Search Input for Cables */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, device, or type..."
                value={cableSearch}
                onChange={(e) => setCableSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Summary KPI Strip */}
            <LanCableSummaryPanel cables={lanCables} />

            {/* Scrollable Compact Cable Cards List (#82) */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredCables.map((cable) => {
                const isExpanded = expandedCableId === cable.id;

                return (
                  <div
                    key={`cable-card-${cable.id}`}
                    className="rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs overflow-hidden"
                  >
                    {/* Compact Card Header */}
                    <div
                      onClick={() => setExpandedCableId(isExpanded ? null : cable.id)}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50/70 select-none"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-50 text-indigo-700 shrink-0">
                          <Cable className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-indigo-950">
                              {cable.id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600">
                              {cable.cableType}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium truncate max-w-[160px]">
                            {(cable.fromName || 'Start').split(' ')[0]} → {(cable.toName || 'End').split(' ')[0]}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                          {cable.length} m
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Click to expand details (#82) */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 text-xs space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">From</span>
                            <span className="font-medium text-slate-800">{cable.fromName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">To</span>
                            <span className="font-medium text-slate-800">{cable.toName}</span>
                          </div>
                        </div>

                        {cable.notes && (
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/80">
                            <span className="font-semibold text-slate-700">Notes: </span>
                            {cable.notes}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400">
                            {cable.route.length} route waypoints
                          </span>
                          <button
                            onClick={() => onSelectCable(cable)}
                            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
                          >
                            Edit Cable
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredCables.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  {cableSearch ? 'No cables match your search.' : 'No LAN cables recorded yet.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DETAILS -> INDEPENDENT LAYER VISIBILITY SUBTAB (#90) */}
        {activeMainTab === 'details' && detailsSubTab === 'layers' && (
          <div className="space-y-4">
            <LayerControlsPanel
              visibility={visibility}
              onChange={onVisibilityChange}
            />
          </div>
        )}

        {/* PRIMARY TAB 2: APPEARANCE & STYLE CUSTOMIZATION (#120-#140) */}
        {activeMainTab === 'appearance' && (
          <div className="space-y-4">
            <AppearancePanel
              appearanceSettings={appearanceSettings}
              onUpdateGlobalSettings={onUpdateGlobalSettings}
              onUpdateItemAppearance={onUpdateItemAppearance}
              onApplyToAllType={onApplyToAllType}
              onResetTypeToDefault={onResetTypeToDefault}
              selectedItem={selectedItem}
            />
          </div>
        )}

        {/* PRIMARY TAB 3: HITMAP INSIGHTS & RECOMMENDATIONS (#156 - #166) */}
        {activeMainTab === 'insights' && (
          <InsightsPanel
            mdfDevices={mdfDevices}
            idfDevices={idfDevices}
            accessPoints={accessPoints}
            signalReadings={signalReadings}
            lanCables={lanCables}
            onOpenPrintReport={onOpenPrintReport}
          />
        )}

        {/* PRIMARY TAB 4: SUMMARY & LIVE AUDIT (#157, #163) */}
        {activeMainTab === 'summary' && (
          <div className="space-y-4">
            <NetworkInfrastructureSummaryPanel
              mdfCount={mdfDevices.length}
              idfCount={idfDevices.length}
              apCount={accessPoints.length}
              cables={lanCables}
            />

            <WifiCoverageSummaryPanel
              apCount={accessPoints.length}
              signals={signalReadings}
            />

            {onOpenPrintReport && (
              <button
                onClick={onOpenPrintReport}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-xs font-bold transition-all shadow-xs"
              >
                <span>Generate Official Report / Print</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-slate-200 p-2.5 bg-slate-50 text-[10.5px] text-slate-500 flex items-center justify-between">
        <span className="font-semibold text-slate-700">{storeInfo.storeName || 'Store Survey'}</span>
        <span className="font-mono text-slate-400">{storeInfo.storeCode || 'PRO-SITE'}</span>
      </div>
    </aside>
  );
};
