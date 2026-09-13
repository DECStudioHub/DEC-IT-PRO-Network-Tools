/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Save, FileDown, Trash2, X } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onDiscard: () => void;
  actionDescription?: string;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveAs,
  onDiscard,
  actionDescription,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-amber-200 bg-amber-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white uppercase">UNSAVED CHANGES</h2>
              <p className="text-xs text-amber-100">Project Protection Alert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-amber-200 hover:bg-amber-600 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            This project contains unsaved changes.
            {actionDescription ? ` ${actionDescription}` : ' If you proceed without saving, any uncommitted edits will be lost.'}
          </p>

          <p className="text-xs text-slate-500">
            Please choose how you would like to proceed:
          </p>

          <div className="flex flex-col gap-2 pt-2">
            {/* SAVE */}
            <button
              onClick={() => {
                onClose();
                onSave();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 text-xs font-bold transition-colors shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>

            {/* SAVE AS */}
            <button
              onClick={() => {
                onClose();
                onSaveAs();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-4 text-xs font-bold transition-colors border border-slate-300"
            >
              <FileDown className="h-4 w-4 text-indigo-600" />
              <span>Save As</span>
            </button>

            {/* DISCARD CHANGES */}
            <button
              onClick={() => {
                onClose();
                onDiscard();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 px-4 text-xs font-bold transition-colors border border-rose-200"
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
              <span>Discard Changes</span>
            </button>

            {/* CANCEL */}
            <button
              onClick={onClose}
              className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
