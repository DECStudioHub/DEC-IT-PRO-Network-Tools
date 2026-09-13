/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ResetAllItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetAllItemsModal: React.FC<ResetAllItemsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 bg-linear-to-r from-rose-500 to-red-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">RESET ALL FLOOR PLAN ITEMS?</h2>
              <p className="text-xs text-rose-100">Danger Zone Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-slate-700">
          <p className="text-sm font-semibold text-slate-900">
            This will remove all placed:
          </p>

          <ul className="space-y-1.5 rounded-xl bg-rose-50/70 border border-rose-100 p-4 text-xs font-medium text-slate-800">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>MDF (Server Cabinets)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>IDF (Switch Hubs)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Access Points</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>WiFi Readings</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>LAN Cables & Cable Routes</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Custom Labels & Offsets</span>
            </li>
          </ul>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Note:</p>
            <p className="mt-0.5">The uploaded Floor Plan will <strong>NOT</strong> be deleted. Only placed items are removed.</p>
          </div>

          <p className="text-xs text-rose-600 font-semibold italic">
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset All Items</span>
          </button>
        </div>
      </div>
    </div>
  );
};
