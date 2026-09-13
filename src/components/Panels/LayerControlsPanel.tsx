/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisibilitySettings } from '../../types';
import { Eye, EyeOff, Layers } from 'lucide-react';

interface LayerControlsPanelProps {
  visibility: VisibilitySettings;
  onChange: (updated: VisibilitySettings) => void;
}

export const LayerControlsPanel: React.FC<LayerControlsPanelProps> = ({
  visibility,
  onChange,
}) => {
  const toggle = (key: keyof VisibilitySettings) => {
    onChange({
      ...visibility,
      [key]: !visibility[key],
    });
  };

  const layers: { key: keyof VisibilitySettings; label: string; desc: string; color: string }[] = [
    { key: 'showMdf', label: 'MDF / SERVER CABINETS', desc: 'Main server cabinet markers', color: 'text-blue-600' },
    { key: 'showIdf', label: 'IDF / SWITCH HUBS', desc: 'Selling area switch hubs', color: 'text-teal-600' },
    { key: 'showAps', label: 'AP MARKERS', desc: 'Wireless Access Points', color: 'text-emerald-600' },
    { key: 'showLanCables', label: 'LAN CABLE ROUTES', desc: 'Cable route overlay lines', color: 'text-indigo-600' },
    { key: 'showLanLengths', label: 'LAN CABLE LENGTHS', desc: 'Meters badges and IDs', color: 'text-indigo-700' },
    { key: 'showSignalValues', label: 'SIGNAL VALUES', desc: 'Black numeric readings', color: 'text-slate-900' },
    { key: 'showWifiBars', label: 'WIFI BARS', desc: '1, 2, or 3 bar signal icons', color: 'text-emerald-700' },
    { key: 'showHeatmap', label: 'HEATMAP', desc: 'Coverage gradient overlay', color: 'text-amber-600' },
    { key: 'showLegend', label: 'LEGEND', desc: 'Floor plan legend panel', color: 'text-slate-600' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            VISIBILITY CONTROLS
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">Independent Layers</span>
      </div>

      <div className="space-y-1.5">
        {layers.map((l) => {
          const isChecked = visibility[l.key];
          return (
            <label
              key={l.key}
              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                isChecked
                  ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/60'
                  : 'bg-white border-transparent text-slate-400 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(l.key)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className={`font-semibold tracking-wide ${isChecked ? l.color : 'text-slate-400'}`}>
                    {l.label}
                  </span>
                  <p className="text-[10px] text-slate-400">{l.desc}</p>
                </div>
              </div>

              {isChecked ? (
                <Eye className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-slate-300" />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};
