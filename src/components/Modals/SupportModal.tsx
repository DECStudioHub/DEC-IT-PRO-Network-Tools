/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Coffee, X, Copy, Check, Heart } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = useState<'gcash' | 'paypal' | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: 'gcash' | 'paypal') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 bg-linear-to-r from-amber-500 via-amber-600 to-orange-500 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs shadow-inner">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                ☕ SUPPORT DECStudioAiCreation
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body (#211, #212, #213) */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">
              Thank you for supporting this project!
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Your contribution fuels continuous innovation and free tooling for IT infrastructure engineers.
            </p>
          </div>

          {/* Success message banner when copied */}
          {copiedField && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 p-2 text-xs font-bold text-emerald-700 animate-in fade-in slide-in-from-top-1">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>✓ Copied Successfully</span>
            </div>
          )}

          {/* GCash Section */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 font-bold text-white text-[11px]">
                  G
                </span>
                <span className="text-xs font-bold text-slate-900">GCash</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white border border-blue-200 px-3 py-2">
              <span className="font-mono text-sm font-bold text-slate-800 tracking-wider">
                09454026319
              </span>
            </div>

            <button
              onClick={() => handleCopy('09454026319', 'gcash')}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                copiedField === 'gcash'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
            >
              {copiedField === 'gcash' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>✓ Copied Successfully</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy GCash Number</span>
                </>
              )}
            </button>
          </div>

          {/* PayPal Section */}
          <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 font-bold text-white text-[11px]">
                  P
                </span>
                <span className="text-xs font-bold text-slate-900">PayPal</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white border border-indigo-200 px-3 py-2">
              <span className="font-mono text-xs font-bold text-slate-800 truncate">
                dantecustodio13@gmail.com
              </span>
            </div>

            <button
              onClick={() => handleCopy('dantecustodio13@gmail.com', 'paypal')}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                copiedField === 'paypal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              {copiedField === 'paypal' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>✓ Copied Successfully</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy PayPal Email</span>
                </>
              )}
            </button>
          </div>

          {/* Heart notice */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 pt-1">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            <span>Thank you for your support!</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
