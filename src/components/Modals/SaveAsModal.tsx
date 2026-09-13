/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StoreInfo } from '../../types';
import { Save, X, FileText, CheckCircle2 } from 'lucide-react';

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeInfo: StoreInfo;
  onConfirmSaveAs: (projectName: string, fileName: string) => void;
}

export const SaveAsModal: React.FC<SaveAsModalProps> = ({
  isOpen,
  onClose,
  storeInfo,
  onConfirmSaveAs,
}) => {
  const defaultProjectName = storeInfo.storeName
    ? `${storeInfo.storeName} WiFi Hitmap`
    : 'Store WiFi Hitmap & Network Plan';

  const defaultFileName = () => {
    const raw = (storeInfo.storeName || storeInfo.storeCode || 'STORE')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0];
    return `STORE_WIFI_HITMAP_${raw}_${dateStr}.project`;
  };

  const [projectName, setProjectName] = useState(defaultProjectName);
  const [fileName, setFileName] = useState(defaultFileName);

  useEffect(() => {
    if (isOpen) {
      setProjectName(
        storeInfo.storeName ? `${storeInfo.storeName} WiFi Hitmap` : 'Store WiFi Hitmap & Network Plan'
      );
      setFileName(defaultFileName());
    }
  }, [isOpen, storeInfo.storeName, storeInfo.storeCode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let sanitized = fileName.trim();
    if (!sanitized.endsWith('.project') && !sanitized.endsWith('.json')) {
      sanitized += '.project';
    }
    onConfirmSaveAs(projectName.trim() || 'Store WiFi Hitmap', sanitized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Save className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">SAVE PROJECT AS</h2>
              <p className="text-xs text-slate-300">Export Complete Reconstructable Project File</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. ABC STORE - Phase 1 Assessment"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              File Name (.project) *
            </label>
            <div className="flex items-center rounded-lg border border-slate-300 px-3 py-2 focus-within:border-indigo-600">
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full text-sm focus:outline-none font-mono text-slate-800"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Saved as a native editable project file that can be re-opened anytime.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1.5 text-slate-600">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Includes Complete Workspace State:
            </span>
            <ul className="grid grid-cols-2 gap-1 text-[11px] list-disc list-inside">
              <li>Floor Plan & Scale</li>
              <li>MDF & IDF Cabinets</li>
              <li>Access Points (APs)</li>
              <li>LAN Cable Routes & Meters</li>
              <li>WiFi Signal Readings</li>
              <li>Project Metadata & Audits</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
