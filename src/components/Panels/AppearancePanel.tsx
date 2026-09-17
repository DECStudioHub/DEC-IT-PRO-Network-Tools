/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ItemAppearance,
  AppearanceSettings,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  LanCable,
  SignalReading,
  CableLineStyle,
  CableThickness,
  clampIconSize,
  clampTextSize,
  MIN_ICON_SIZE,
  MAX_ICON_SIZE,
  MIN_TEXT_SIZE,
  MAX_TEXT_SIZE,
  DEFAULT_ICON_SIZE,
  DEFAULT_TEXT_SIZE,
} from '../../types';
import {
  DeviceIconBox,
  DeviceLabelBadge,
  MDF_ICON_STYLES,
  IDF_ICON_STYLES,
  AP_ICON_STYLES,
  CABLE_ICON_STYLES,
} from '../../utils/deviceIcons';
import { WifiSignalIcon } from '../WifiSignalIcon';
import {
  Palette,
  Type,
  Maximize2,
  Server,
  Network,
  Radio,
  Cable,
  Activity,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Minus,
  Plus,
  Eye,
  Shield,
  Layers,
  Square,
  Circle,
} from 'lucide-react';

export type SelectedAppearanceItem =
  | { type: 'mdf'; item: MDFDevice; id?: string; name?: string; appearance?: ItemAppearance }
  | { type: 'idf'; item: IDFDevice; id?: string; name?: string; appearance?: ItemAppearance }
  | { type: 'ap'; item: AccessPoint; id?: string; name?: string; appearance?: ItemAppearance }
  | { type: 'cable'; item: LanCable; id?: string; name?: string; appearance?: ItemAppearance }
  | { type: 'signal'; item: SignalReading; id?: string; name?: string; appearance?: ItemAppearance }
  | { type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal'; id: string; name: string; appearance?: ItemAppearance; item?: any }
  | null;

interface AppearancePanelProps {
  selectedItem?: SelectedAppearanceItem;
  appearanceSettings: AppearanceSettings;
  activeCategory?: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal';
  onActiveCategoryChange?: (cat: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal') => void;
  onUpdateGlobalSettings: (settings: AppearanceSettings) => void;
  onUpdateItemAppearance: (
    type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal',
    id: string,
    appearance: ItemAppearance
  ) => void;
  onApplyToAllType: (type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal', appearance: ItemAppearance) => void;
  onResetTypeToDefault: (type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal', id?: string) => void;
  onOpenEditModal?: (item: SelectedAppearanceItem) => void;
  onDeselectItem?: () => void;
}

const PRESET_COLORS = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Dark Slate', hex: '#0f172a' },
  { name: 'White', hex: '#ffffff' },
];

export const AppearancePanel: React.FC<AppearancePanelProps> = ({
  selectedItem,
  appearanceSettings,
  activeCategory: externalCategory,
  onActiveCategoryChange,
  onUpdateGlobalSettings,
  onUpdateItemAppearance,
  onApplyToAllType,
  onResetTypeToDefault,
  onOpenEditModal,
  onDeselectItem,
}) => {
  const [scope, setScope] = useState<'item' | 'global'>('item');
  const [internalCategory, setInternalCategory] = useState<'mdf' | 'idf' | 'ap' | 'cable' | 'signal'>('mdf');
  const [previewBg, setPreviewBg] = useState<'blueprint' | 'light' | 'dark'>('blueprint');

  // Resolved active category (#377-#379, #387)
  const activeCategory = externalCategory || internalCategory;
  const setActiveCategory = (cat: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal') => {
    if (onActiveCategoryChange) {
      onActiveCategoryChange(cat);
    }
    setInternalCategory(cat);
  };

  // Sync activeCategory when selectedItem changes
  React.useEffect(() => {
    if (selectedItem?.type) {
      setActiveCategory(selectedItem.type);
      setScope('item');
    }
  }, [selectedItem?.id, selectedItem?.type]);

  // Target category for rendering controls
  const targetCategory = activeCategory;
  const isEditingSelectedItem = selectedItem && selectedItem.type === activeCategory && scope === 'item';

  // Resolve current appearance safely
  const getCurrentAppearance = (): ItemAppearance => {
    if (isEditingSelectedItem) {
      const selectedItemAppearance =
        (selectedItem as any)?.item?.appearance || (selectedItem as any)?.appearance;
      if (selectedItemAppearance) {
        return selectedItemAppearance;
      }
    }

    switch (targetCategory) {
      case 'mdf':
        return appearanceSettings.defaultMdf;
      case 'idf':
        return appearanceSettings.defaultIdf;
      case 'ap':
        return appearanceSettings.defaultAp;
      case 'cable':
        return appearanceSettings.defaultCable;
      case 'signal':
        return appearanceSettings.defaultSignal;
    }
  };

  const currentApp = getCurrentAppearance();
  const selectedItemId =
    (selectedItem as any)?.item?.id || (selectedItem as any)?.id || '';

  // Safe handler with position protection
  const handleFieldChange = (fields: Partial<ItemAppearance>) => {
    const updated: ItemAppearance = { ...currentApp, ...fields };

    // Clamping validations
    if (updated.iconSize !== undefined) {
      updated.iconSize = clampIconSize(updated.iconSize);
    }
    if (updated.textSize !== undefined) {
      updated.textSize = clampTextSize(updated.textSize);
    }

    if (isEditingSelectedItem && selectedItemId) {
      onUpdateItemAppearance(selectedItem.type, selectedItemId, updated);
    } else {
      const nextGlobal: AppearanceSettings = { ...appearanceSettings };
      if (targetCategory === 'mdf') nextGlobal.defaultMdf = updated;
      else if (targetCategory === 'idf') nextGlobal.defaultIdf = updated;
      else if (targetCategory === 'ap') nextGlobal.defaultAp = updated;
      else if (targetCategory === 'cable') nextGlobal.defaultCable = updated;
      else if (targetCategory === 'signal') nextGlobal.defaultSignal = updated;

      onUpdateGlobalSettings(nextGlobal);
    }
  };

  // Stepper handlers
  const handleIconSizeStep = (delta: number) => {
    const current = clampIconSize(currentApp.iconSize, DEFAULT_ICON_SIZE);
    handleFieldChange({ iconSize: clampIconSize(current + delta) });
  };

  const handleTextSizeStep = (delta: number) => {
    const current = clampTextSize(currentApp.textSize, DEFAULT_TEXT_SIZE);
    handleFieldChange({ textSize: clampTextSize(current + delta) });
  };

  const activeIconSize = clampIconSize(currentApp.iconSize, DEFAULT_ICON_SIZE);
  const activeTextSize = clampTextSize(currentApp.textSize, DEFAULT_TEXT_SIZE);

  return (
    <div className="space-y-4 text-slate-800 pb-8 select-none">
      {/* 1. Header & Persistent Category Tabs (#371-#379, #387) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Icon & Text Appearance
              </h3>
              <p className="text-[10px] text-slate-400">
                Custom size, color, background, borders, and fonts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isEditingSelectedItem && selectedItemId) {
                onResetTypeToDefault(selectedItem.type, selectedItemId);
              } else {
                onResetTypeToDefault(targetCategory);
              }
            }}
            title="Reset to default settings"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        {/* ALWAYS PERSISTENT 5-CATEGORY TABS (#371, #377, #378) */}
        <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-center bg-slate-100 p-1 rounded-lg">
          {(['mdf', 'idf', 'ap', 'cable', 'signal'] as const).map((cat) => {
            const isActive = activeCategory === cat;
            const isSelectedDeviceType = selectedItem && selectedItem.type === cat;
            return (
              <button
                key={`cat-btn-${cat}`}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  if (selectedItem && selectedItem.type === cat) {
                    setScope('item');
                  } else {
                    setScope('global');
                  }
                }}
                className={`py-1.5 rounded uppercase tracking-wider transition-all relative cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs font-black ring-1 ring-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{cat}</span>
                {isSelectedDeviceType && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Badge & Scope Selectors (#379, #391, #392) */}
        {selectedItem && selectedItem.type === activeCategory ? (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                <span className="font-bold text-indigo-950 truncate">
                  Selected: {selectedItem.name || selectedItem.id}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onOpenEditModal && (
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(selectedItem)}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                  >
                    Edit Details
                  </button>
                )}
                {onDeselectItem && (
                  <button
                    type="button"
                    onClick={onDeselectItem}
                    title="Deselect item"
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setScope('item')}
                className={`py-1.5 px-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                  scope === 'item'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                This Device Only
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyToAllType(activeCategory, currentApp);
                }}
                className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-bold transition-all cursor-pointer"
              >
                Apply to All {activeCategory.toUpperCase()}
              </button>
            </div>
          </div>
        ) : selectedItem ? (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="text-[11px] text-slate-600 truncate">
              Editing defaults for <strong className="text-slate-900 uppercase font-black">{activeCategory}</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveCategory(selectedItem.type);
                setScope('item');
              }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline ml-2 shrink-0 cursor-pointer"
            >
              Back to {selectedItem.id}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[11px] text-slate-600">
              Default appearance for all <strong className="text-slate-900 uppercase font-bold">{activeCategory}</strong>
            </span>
            <span className="text-[10px] text-slate-400 italic">Click icon to customize</span>
          </div>
        )}
      </div>

      {/* 2. LIVE PREVIEW CONTAINER (Requirement 276, 277) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-indigo-600" />
            Live Preview (Real-Time)
          </span>
          {/* Background Contrast Selector */}
          <div className="flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => setPreviewBg('blueprint')}
              className={`px-1.5 py-0.5 rounded ${
                previewBg === 'blueprint' ? 'bg-slate-900 text-white font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setPreviewBg('light')}
              className={`px-1.5 py-0.5 rounded ${
                previewBg === 'light' ? 'bg-slate-900 text-white font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setPreviewBg('dark')}
              className={`px-1.5 py-0.5 rounded ${
                previewBg === 'dark' ? 'bg-slate-900 text-white font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div
          className={`relative flex min-h-[140px] items-center justify-center rounded-lg p-4 border transition-colors overflow-hidden ${
            previewBg === 'blueprint'
              ? 'bg-slate-900 border-slate-800 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]'
              : previewBg === 'light'
              ? 'bg-slate-100 border-slate-200'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex flex-col items-center">
            {targetCategory === 'cable' ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  style={{
                    width: '140px',
                    height:
                      currentApp.lineThickness === 'thick'
                        ? '5px'
                        : currentApp.lineThickness === 'thin'
                        ? '2px'
                        : '3.5px',
                    backgroundColor: currentApp.lineColor || '#2563eb',
                    borderTop:
                      currentApp.lineStyle === 'dashed'
                        ? '3px dashed #2563eb'
                        : currentApp.lineStyle === 'dotted'
                        ? '3px dotted #2563eb'
                        : undefined,
                  }}
                />
                <DeviceLabelBadge
                  label={selectedItemId || 'LAN-01'}
                  subLabel="18.5 m • CAT6"
                  type="cable"
                  appearance={currentApp}
                />
              </div>
            ) : targetCategory === 'signal' ? (
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 shadow-md border"
                  style={{
                    backgroundColor: currentApp.bgColor || '#ffffff',
                    opacity: (currentApp.bgOpacity ?? 95) / 100,
                    borderColor: currentApp.enableBorder !== false ? (currentApp.borderColor || '#cbd5e1') : 'transparent',
                    borderWidth: `${currentApp.enableBorder !== false ? (currentApp.borderWidth || 1) : 0}px`,
                  }}
                >
                  <span
                    style={{
                      fontSize: `${activeTextSize}px`,
                      color: currentApp.textColor || '#000000',
                      fontWeight: currentApp.fontWeight === 'bold' ? 'bold' : 'normal',
                    }}
                    className="font-mono font-black"
                  >
                    88%
                  </span>
                  <WifiSignalIcon
                    bars={3}
                    size={activeIconSize}
                    activeColor={currentApp.iconColor || '#16a34a'}
                  />
                  <span className="flex flex-col font-mono leading-tight pl-1.5 border-l border-slate-300">
                    <span
                      style={{ fontSize: `${currentApp.dbmTextSize || Math.max(8, Math.round(activeTextSize * 0.75))}px` }}
                      className="text-slate-700 font-semibold"
                    >
                      -58 dBm
                    </span>
                    <span
                      style={{ fontSize: `${currentApp.mbpsTextSize || Math.max(8, Math.round(activeTextSize * 0.75))}px` }}
                      className="text-blue-700 font-bold"
                    >
                      240 Mbps
                    </span>
                  </span>
                </div>
                <DeviceLabelBadge
                  label={selectedItemId || 'SIG-01'}
                  subLabel="EXCELLENT"
                  type="signal"
                  appearance={currentApp}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <DeviceIconBox
                  type={targetCategory}
                  appearance={currentApp}
                />
                <DeviceLabelBadge
                  label={selectedItemId || `${targetCategory.toUpperCase()}-01`}
                  subLabel={
                    targetCategory === 'mdf'
                      ? 'SERVER CABINET'
                      : targetCategory === 'idf'
                      ? 'SWITCH HUB'
                      : 'ACCESS POINT'
                  }
                  type={targetCategory}
                  appearance={currentApp}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. ICON SIZE CUSTOMIZATION (Max 100 px) (Requirement 268, 270, 271) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5 text-indigo-600" />
            Icon Size (10 – 100 px)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Default: 48 px</span>
        </div>

        {/* Direct Input & Stepper */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleIconSizeStep(-4)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Decrease icon size by 4px"
          >
            <Minus className="h-4 w-4" />
          </button>

          <input
            type="range"
            min={MIN_ICON_SIZE}
            max={MAX_ICON_SIZE}
            step="1"
            value={activeIconSize}
            onChange={(e) => handleFieldChange({ iconSize: parseInt(e.target.value) || DEFAULT_ICON_SIZE })}
            className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />

          <button
            type="button"
            onClick={() => handleIconSizeStep(4)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Increase icon size by 4px"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1">
            <input
              type="number"
              min={MIN_ICON_SIZE}
              max={MAX_ICON_SIZE}
              value={activeIconSize}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  handleFieldChange({ iconSize: val });
                }
              }}
              className="w-10 text-center text-xs font-mono font-bold text-indigo-700 bg-transparent focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-400 font-mono">px</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-5 gap-1 text-[10px]">
          {[
            { label: 'Small', px: 24 },
            { label: 'Medium', px: 36 },
            { label: 'Default', px: 48 },
            { label: 'Large', px: 64 },
            { label: '100px', px: 100 },
          ].map((p) => (
            <button
              key={`ico-preset-${p.px}`}
              type="button"
              onClick={() => handleFieldChange({ iconSize: p.px })}
              className={`py-1 rounded border transition-all ${
                activeIconSize === p.px
                  ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700 shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TEXT SIZE CUSTOMIZATION (Max 100 px) (Requirement 269, 270, 271) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-indigo-600" />
            Text Size (8 – 100 px)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Independent of icon size</span>
        </div>

        {/* Direct Input & Stepper */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTextSizeStep(-2)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Decrease text size by 2px"
          >
            <Minus className="h-4 w-4" />
          </button>

          <input
            type="range"
            min={MIN_TEXT_SIZE}
            max={MAX_TEXT_SIZE}
            step="1"
            value={activeTextSize}
            onChange={(e) => handleFieldChange({ textSize: parseInt(e.target.value) || DEFAULT_TEXT_SIZE })}
            className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />

          <button
            type="button"
            onClick={() => handleTextSizeStep(2)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Increase text size by 2px"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1">
            <input
              type="number"
              min={MIN_TEXT_SIZE}
              max={MAX_TEXT_SIZE}
              value={activeTextSize}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  handleFieldChange({ textSize: val });
                }
              }}
              className="w-10 text-center text-xs font-mono font-bold text-indigo-700 bg-transparent focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-400 font-mono">px</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-5 gap-1 text-[10px]">
          {[
            { label: 'Small', px: 11 },
            { label: 'Medium', px: 14 },
            { label: 'Default', px: 18 },
            { label: 'Large', px: 28 },
            { label: '100px', px: 100 },
          ].map((p) => (
            <button
              key={`txt-preset-${p.px}`}
              type="button"
              onClick={() => handleFieldChange({ textSize: p.px })}
              className={`py-1 rounded border transition-all ${
                activeTextSize === p.px
                  ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700 shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4B. SIGNAL DBM & MBPS TEXT SIZES (Requirement 340) */}
      {targetCategory === 'signal' && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-indigo-600" />
              dBm & Mbps Text Size (8 – 100 px)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Signal Metrics</span>
          </div>

          {/* dBm Text Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">dBm Text Size:</span>
              <span className="font-mono text-indigo-700 font-bold">{currentApp.dbmTextSize || 10} px</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFieldChange({ dbmTextSize: Math.max(8, (currentApp.dbmTextSize || 10) - 1) })}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min="8"
                max="100"
                value={currentApp.dbmTextSize || 10}
                onChange={(e) => handleFieldChange({ dbmTextSize: parseInt(e.target.value) || 10 })}
                className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleFieldChange({ dbmTextSize: Math.min(100, (currentApp.dbmTextSize || 10) + 1) })}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min="8"
                max="100"
                value={currentApp.dbmTextSize || 10}
                onChange={(e) => handleFieldChange({ dbmTextSize: parseInt(e.target.value) || 10 })}
                className="w-12 text-center text-xs font-mono font-bold text-indigo-700 rounded border border-slate-200 bg-slate-50 py-1"
              />
            </div>
          </div>

          {/* Mbps Text Size */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Mbps Text Size:</span>
              <span className="font-mono text-blue-700 font-bold">{currentApp.mbpsTextSize || 10} px</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFieldChange({ mbpsTextSize: Math.max(8, (currentApp.mbpsTextSize || 10) - 1) })}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min="8"
                max="100"
                value={currentApp.mbpsTextSize || 10}
                onChange={(e) => handleFieldChange({ mbpsTextSize: parseInt(e.target.value) || 10 })}
                className="flex-1 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleFieldChange({ mbpsTextSize: Math.min(100, (currentApp.mbpsTextSize || 10) + 1) })}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min="8"
                max="100"
                value={currentApp.mbpsTextSize || 10}
                onChange={(e) => handleFieldChange({ mbpsTextSize: parseInt(e.target.value) || 10 })}
                className="w-12 text-center text-xs font-mono font-bold text-blue-700 rounded border border-slate-200 bg-slate-50 py-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. ICON STYLE SELECTION (Requirement 267, 272) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-1.5">
          {targetCategory === 'cable' ? 'LAN Cable Line Style' : 'Device Icon Graphic Style'}
        </span>

        {/* MDF Styles */}
        {targetCategory === 'mdf' && (
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            {MDF_ICON_STYLES.map((opt) => {
              const IconComp = opt.component;
              const isSelected = (currentApp.iconStyle || 'server-rack') === opt.id;
              return (
                <button
                  key={`mdf-ico-${opt.id}`}
                  type="button"
                  onClick={() => handleFieldChange({ iconStyle: opt.id })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* IDF Styles */}
        {targetCategory === 'idf' && (
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {IDF_ICON_STYLES.map((opt) => {
              const IconComp = opt.component;
              const isSelected = (currentApp.iconStyle || 'network-switch') === opt.id;
              return (
                <button
                  key={`idf-ico-${opt.id}`}
                  type="button"
                  onClick={() => handleFieldChange({ iconStyle: opt.id })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* AP Styles */}
        {targetCategory === 'ap' && (
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            {AP_ICON_STYLES.map((opt) => {
              const IconComp = opt.component;
              const isSelected = (currentApp.iconStyle || 'standard-ap') === opt.id;
              return (
                <button
                  key={`ap-ico-${opt.id}`}
                  type="button"
                  onClick={() => handleFieldChange({ iconStyle: opt.id })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* LAN Cable Styles */}
        {targetCategory === 'cable' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Line Dash Pattern
              </label>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(['solid', 'dashed', 'dotted'] as CableLineStyle[]).map((ls) => (
                  <button
                    key={`line-style-${ls}`}
                    type="button"
                    onClick={() => handleFieldChange({ lineStyle: ls })}
                    className={`py-1.5 rounded-lg border capitalize ${
                      (currentApp.lineStyle || 'solid') === ls
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {ls}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Line Thickness
              </label>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(['thin', 'medium', 'thick'] as CableThickness[]).map((th) => (
                  <button
                    key={`line-thick-${th}`}
                    type="button"
                    onClick={() => handleFieldChange({ lineThickness: th })}
                    className={`py-1.5 rounded-lg border capitalize ${
                      (currentApp.lineThickness || 'medium') === th
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {th} ({th === 'thin' ? '2px' : th === 'medium' ? '3.5px' : '5px'})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. ICON BACKGROUND & BORDER CONTROLS (Requirement 273, 274) */}
      {targetCategory !== 'cable' && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-1.5">
            Icon Background & Border
          </span>

          {/* Background Shape */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Background Shape
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {[
                { id: 'transparent', label: 'Transparent', icon: Circle },
                { id: 'white-circle', label: 'White Circle', icon: Circle },
                { id: 'white-square', label: 'White Box', icon: Square },
                { id: 'dark-square', label: 'Dark Box', icon: Square },
                { id: 'custom', label: 'Custom Tint', icon: Palette },
                { id: 'none', label: 'No Box', icon: Circle },
              ].map((opt) => (
                <button
                  key={`bg-shape-${opt.id}`}
                  type="button"
                  onClick={() => handleFieldChange({ iconBgType: opt.id as any })}
                  className={`py-1.5 px-1 rounded-lg border text-center font-semibold transition-all ${
                    (currentApp.iconBgType || (targetCategory === 'ap' ? 'custom' : 'dark-square')) === opt.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Opacity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-600">Background Opacity</label>
              <span className="text-xs font-mono font-bold text-slate-700">
                {currentApp.bgOpacity ?? 95}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={currentApp.bgOpacity ?? 95}
              onChange={(e) => handleFieldChange({ bgOpacity: parseInt(e.target.value) })}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Border Controls (Requirement 274) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={currentApp.enableBorder !== false}
                  onChange={(e) => handleFieldChange({ enableBorder: e.target.checked })}
                  className="rounded accent-indigo-600 h-4 w-4"
                />
                <span>Enable Icon Border</span>
              </label>

              {/* Border Width */}
              <div className="flex items-center gap-1 text-xs">
                {[1, 2, 3, 4, 5].map((w) => (
                  <button
                    key={`bw-${w}`}
                    type="button"
                    onClick={() => handleFieldChange({ borderWidth: w, enableBorder: true })}
                    className={`h-6 w-6 rounded border font-mono font-bold ${
                      (currentApp.borderWidth || 2) === w && currentApp.enableBorder !== false
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {w}p
                  </button>
                ))}
              </div>
            </div>

            {/* Border Color Picker */}
            {currentApp.enableBorder !== false && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-600">Border Color:</span>
                <input
                  type="color"
                  value={currentApp.borderColor || currentApp.iconColor || '#3b82f6'}
                  onChange={(e) => handleFieldChange({ borderColor: e.target.value })}
                  className="h-6 w-6 rounded border border-slate-300 p-0.5 cursor-pointer bg-white"
                />
                <span className="text-xs font-mono font-bold text-slate-700">
                  {currentApp.borderColor || currentApp.iconColor || '#3b82f6'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. COLOR PALETTE & CUSTOM HEX (Requirement 272, 275) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {targetCategory === 'cable' ? 'Line Color' : 'Icon Accent Color'}
          </span>
          <span className="text-xs font-mono font-bold text-slate-700">
            {currentApp.iconColor || currentApp.lineColor || '#2563eb'}
          </span>
        </div>

        {/* Swatches */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_COLORS.map((c) => {
            const activeColor = currentApp.iconColor || currentApp.lineColor || '#2563eb';
            const isSelected = activeColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={`color-swatch-${c.name}`}
                type="button"
                onClick={() => {
                  if (targetCategory === 'cable') {
                    handleFieldChange({ lineColor: c.hex });
                  } else {
                    handleFieldChange({ iconColor: c.hex, borderColor: c.hex });
                  }
                }}
                title={c.name}
                style={{ backgroundColor: c.hex }}
                className={`h-6 w-6 rounded-full border border-slate-300 shadow-2xs flex items-center justify-center transition-transform hover:scale-110 ${
                  isSelected ? 'ring-2 ring-indigo-600 ring-offset-1 scale-110' : ''
                }`}
              >
                {isSelected && (
                  <Check
                    className={`h-3 w-3 ${c.hex === '#ffffff' ? 'text-slate-900' : 'text-white'}`}
                  />
                )}
              </button>
            );
          })}

          {/* HTML5 Native Color Picker */}
          <div className="relative flex items-center ml-auto">
            <input
              type="color"
              value={currentApp.iconColor || currentApp.lineColor || '#2563eb'}
              onChange={(e) => {
                const val = e.target.value;
                if (targetCategory === 'cable') {
                  handleFieldChange({ lineColor: val });
                } else {
                  handleFieldChange({ iconColor: val, borderColor: val });
                }
              }}
              className="h-7 w-7 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
            />
          </div>
        </div>
      </div>

      {/* 8. TEXT APPEARANCE CONTROLS (Requirement 275) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-1.5">
          Label Typography & Contrast
        </span>

        {/* Font Weight */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
            Font Weight
          </label>
          <div className="grid grid-cols-4 gap-1 text-[11px]">
            {[
              { id: 'normal', label: 'Normal' },
              { id: 'medium', label: 'Medium' },
              { id: 'bold', label: 'Bold' },
              { id: 'black', label: 'Black' },
            ].map((fw) => (
              <button
                key={`fw-${fw.id}`}
                type="button"
                onClick={() => handleFieldChange({ fontWeight: fw.id as any })}
                className={`py-1 rounded border text-center ${
                  (currentApp.fontWeight || 'bold') === fw.id
                    ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {fw.label}
              </button>
            ))}
          </div>
        </div>

        {/* Label Background Style */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
            Label Background Pill
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            {[
              { id: 'transparent', label: 'Transparent' },
              { id: 'white-pill', label: 'White Badge' },
              { id: 'dark-pill', label: 'Dark Badge' },
            ].map((bg) => (
              <button
                key={`text-bg-${bg.id}`}
                type="button"
                onClick={() => handleFieldChange({ textBgType: bg.id as any })}
                className={`py-1.5 rounded-lg border font-semibold ${
                  (currentApp.textBgType || 'dark-pill') === bg.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Shadows & Outlines */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={currentApp.textShadow !== false}
              onChange={(e) => handleFieldChange({ textShadow: e.target.checked })}
              className="rounded accent-indigo-600 h-3.5 w-3.5"
            />
            <span>Drop Shadow</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={currentApp.textOutline === true}
              onChange={(e) => handleFieldChange({ textOutline: e.target.checked })}
              className="rounded accent-indigo-600 h-3.5 w-3.5"
            />
            <span>Text Outline</span>
          </label>
        </div>
      </div>

      {/* 9. ACTION BUTTONS (Requirement 278) */}
      <div className="space-y-2 pt-1">
        {selectedItem && scope === 'item' && (
          <button
            type="button"
            onClick={() => {
              if (selectedItemId) {
                onUpdateItemAppearance(selectedItem.type, selectedItemId, currentApp);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
          >
            <Check className="h-4 w-4" />
            Apply to This Item
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onApplyToAllType(targetCategory, currentApp);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shadow-2xs transition-all active:scale-98"
        >
          <Sparkles className="h-4 w-4" />
          Apply to All {targetCategory.toUpperCase()} Devices
        </button>
      </div>
    </div>
  );
};
