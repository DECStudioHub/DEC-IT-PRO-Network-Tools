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
  WifiIconStyle,
  CableLineStyle,
  CableThickness,
  CableArrowDirection,
  DEFAULT_APPEARANCE_SETTINGS,
} from '../../types';
import {
  Palette,
  Type,
  Maximize2,
  Server,
  HardDrive,
  Cpu,
  Boxes,
  Layers,
  Network,
  Split,
  Grid,
  Share2,
  Radio,
  Disc,
  Wifi,
  Router,
  Antenna,
  Cable,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface AppearancePanelProps {
  selectedItem?:
    | { type: 'mdf'; item: MDFDevice }
    | { type: 'idf'; item: IDFDevice }
    | { type: 'ap'; item: AccessPoint }
    | { type: 'cable'; item: LanCable }
    | { type: 'signal'; item: SignalReading }
    | null;
  appearanceSettings: AppearanceSettings;
  onUpdateGlobalSettings: (settings: AppearanceSettings) => void;
  onUpdateItemAppearance: (
    type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal',
    id: string,
    appearance: ItemAppearance
  ) => void;
  onApplyToAllType: (type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal', appearance: ItemAppearance) => void;
  onResetTypeToDefault: (type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal', id?: string) => void;
}

const PRESET_COLORS = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Yellow', hex: '#ca8a04' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Black', hex: '#0f172a' },
  { name: 'White', hex: '#ffffff' },
];

export const AppearancePanel: React.FC<AppearancePanelProps> = ({
  selectedItem,
  appearanceSettings,
  onUpdateGlobalSettings,
  onUpdateItemAppearance,
  onApplyToAllType,
  onResetTypeToDefault,
}) => {
  // Mode: if item is selected, user can edit selected item or global type
  const [scope, setScope] = useState<'item' | 'global'>('item');
  const [activeCategory, setActiveCategory] = useState<'mdf' | 'idf' | 'ap' | 'cable' | 'signal'>('mdf');

  const targetCategory = selectedItem ? selectedItem.type : activeCategory;

  // Resolve current appearance
  const getCurrentAppearance = (): ItemAppearance => {
    if (selectedItem && scope === 'item') {
      return selectedItem.item.appearance || (
        selectedItem.type === 'mdf'
          ? appearanceSettings.defaultMdf
          : selectedItem.type === 'idf'
          ? appearanceSettings.defaultIdf
          : selectedItem.type === 'ap'
          ? appearanceSettings.defaultAp
          : selectedItem.type === 'cable'
          ? appearanceSettings.defaultCable
          : appearanceSettings.defaultSignal
      );
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

  const handleFieldChange = (fields: Partial<ItemAppearance>) => {
    const updated = { ...currentApp, ...fields };

    if (selectedItem && scope === 'item') {
      onUpdateItemAppearance(selectedItem.type, selectedItem.item.id, updated);
    } else {
      // Update global defaults for this category
      const nextGlobal: AppearanceSettings = { ...appearanceSettings };
      if (targetCategory === 'mdf') nextGlobal.defaultMdf = updated;
      else if (targetCategory === 'idf') nextGlobal.defaultIdf = updated;
      else if (targetCategory === 'ap') nextGlobal.defaultAp = updated;
      else if (targetCategory === 'cable') nextGlobal.defaultCable = updated;
      else if (targetCategory === 'signal') nextGlobal.defaultSignal = updated;

      onUpdateGlobalSettings(nextGlobal);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Category or Selected Item Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {selectedItem
                ? `Styling: ${selectedItem.item.id} (${selectedItem.type.toUpperCase()})`
                : 'Customization & Appearance'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedItem && scope === 'item') {
                onResetTypeToDefault(selectedItem.type, selectedItem.item.id);
              } else {
                onResetTypeToDefault(targetCategory);
              }
            }}
            title="Reset to default style"
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        {/* If no selected item, show category switcher */}
        {!selectedItem ? (
          <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-center bg-slate-100 p-1 rounded-lg">
            {(['mdf', 'idf', 'ap', 'cable', 'signal'] as const).map((cat) => (
              <button
                key={`cat-${cat}`}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`py-1 rounded uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? 'bg-white text-indigo-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setScope('item')}
              className={`flex-1 py-1 px-2 rounded-lg border text-center transition-all ${
                scope === 'item'
                  ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              This Device Only
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyToAllType(selectedItem.type, currentApp);
              }}
              className="flex-1 py-1 px-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-center font-medium transition-all"
            >
              Apply to All {selectedItem.type.toUpperCase()}
            </button>
          </div>
        )}
      </div>

      {/* 1. RESIZABLE TEXT & ICONS (#129, #131) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-indigo-600" />
            Text & Icon Dimensions
          </span>
          <span className="text-[10px] text-slate-400">Never moves coordinates</span>
        </div>

        {/* Text Size Slider & Presets */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-600">Text Size (8–72 px)</label>
            <span className="text-xs font-mono font-bold text-indigo-600">
              {currentApp.textSize || 11} px
            </span>
          </div>
          <input
            type="range"
            min="8"
            max="36"
            step="1"
            value={currentApp.textSize || 11}
            onChange={(e) => handleFieldChange({ textSize: parseInt(e.target.value) })}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between gap-1 mt-1 text-[10px]">
            {[
              { label: 'Small', px: 10 },
              { label: 'Medium', px: 13 },
              { label: 'Large', px: 16 },
              { label: 'XL', px: 22 },
            ].map((p) => (
              <button
                key={`txt-pre-${p.label}`}
                type="button"
                onClick={() => handleFieldChange({ textSize: p.px })}
                className={`flex-1 py-0.5 rounded border ${
                  currentApp.textSize === p.px
                    ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Size Slider & Presets (#131: Independent of text size!) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-600">Icon Size (16–80 px)</label>
            <span className="text-xs font-mono font-bold text-indigo-600">
              {currentApp.iconSize || 36} px
            </span>
          </div>
          <input
            type="range"
            min="18"
            max="64"
            step="2"
            value={currentApp.iconSize || 36}
            onChange={(e) => handleFieldChange({ iconSize: parseInt(e.target.value) })}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between gap-1 mt-1 text-[10px]">
            {[
              { label: 'Small', px: 24 },
              { label: 'Medium', px: 36 },
              { label: 'Large', px: 48 },
              { label: 'XL', px: 60 },
            ].map((p) => (
              <button
                key={`ico-pre-${p.label}`}
                type="button"
                onClick={() => handleFieldChange({ iconSize: p.px })}
                className={`flex-1 py-0.5 rounded border ${
                  currentApp.iconSize === p.px
                    ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. DEVICE ICON SELECTION (#136, #137, #138, #140) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-1.5">
          {targetCategory === 'cable' ? 'LAN Cable Line Style' : 'Device Icon Style'}
        </span>

        {/* MDF Icon Options */}
        {targetCategory === 'mdf' && (
          <div className="grid grid-cols-5 gap-1 text-[10px]">
            {[
              { id: 'server-rack', label: 'Rack', icon: Server },
              { id: 'network-cabinet', label: 'Cabinet', icon: HardDrive },
              { id: 'server', label: 'Unit', icon: Cpu },
              { id: 'rack-cabinet', label: 'Boxes', icon: Boxes },
              { id: 'layers', label: 'Frame', icon: Layers },
            ].map((opt) => {
              const IconComp = opt.icon;
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
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* IDF Icon Options */}
        {targetCategory === 'idf' && (
          <div className="grid grid-cols-4 gap-1.5 text-[10px]">
            {[
              { id: 'network-switch', label: 'Switch', icon: Network },
              { id: 'switch-hub', label: 'Hub', icon: Split },
              { id: 'network-rack', label: 'Rack', icon: Grid },
              { id: 'distribution-unit', label: 'Dist Unit', icon: Share2 },
            ].map((opt) => {
              const IconComp = opt.icon;
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
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* AP Icon Options */}
        {targetCategory === 'ap' && (
          <div className="grid grid-cols-5 gap-1 text-[10px]">
            {[
              { id: 'standard-ap', label: 'Standard', icon: Radio },
              { id: 'ceiling-ap', label: 'Ceiling', icon: Disc },
              { id: 'wall-ap', label: 'Wall AP', icon: Wifi },
              { id: 'wireless-device', label: 'Router', icon: Router },
              { id: 'antenna', label: 'Antenna', icon: Antenna },
            ].map((opt) => {
              const IconComp = opt.icon;
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
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* LAN Cable Line Style & Thickness (#140) */}
        {targetCategory === 'cable' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Line Pattern
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

      {/* 3. COLOR PALETTE & CUSTOM HEX (#133) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {targetCategory === 'cable' ? 'Line & Label Color' : 'Accent Color Palette'}
          </span>
          <span className="text-xs font-mono font-bold text-slate-700">
            {currentApp.iconColor || currentApp.lineColor || '#2563eb'}
          </span>
        </div>

        {/* Swatch Presets */}
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

          {/* HTML5 Native Color Picker + Custom HEX Input */}
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

        {/* Background & Shadow Options (#145) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={currentApp.textShadow !== false}
              onChange={(e) => handleFieldChange({ textShadow: e.target.checked })}
              className="rounded accent-indigo-600"
            />
            <span>Drop Shadow / Outline</span>
          </label>

          <span className="text-[11px] text-slate-400">High contrast on plans</span>
        </div>
      </div>
    </div>
  );
};
