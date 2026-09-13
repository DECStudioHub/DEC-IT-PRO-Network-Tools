/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface LoadErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
  onTryAgain: () => void;
}

export const LoadErrorModal: React.FC<LoadErrorModalProps> = ({
  isOpen,
  onClose,
  errorMessage,
  onTryAgain,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-rose-200 bg-rose-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-700 text-white shadow-xs">
              <AlertOctagon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white uppercase">UNABLE TO LOAD PROJECT</h2>
              <p className="text-xs text-rose-100">Project Validation Error</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-rose-200 hover:bg-rose-700 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-sm font-semibold text-slate-800">
            The selected project file could not be loaded.
          </p>

          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Reason:
            </span>
            <p className="text-xs text-rose-900 font-mono break-words leading-relaxed">
              {errorMessage || 'The file format or contents do not match expected project structure.'}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-slate-600 text-[11px]">
            <ShieldAlert className="h-4 w-4 text-slate-500 shrink-0" />
            <span>Your current Workspace and unsaved work remain safe and unchanged.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTryAgain();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
