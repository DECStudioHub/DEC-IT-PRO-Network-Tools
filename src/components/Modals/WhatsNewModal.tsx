/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, X, Check, History, Calendar, Tag } from 'lucide-react';
import { VERSION_HISTORY, APP_CURRENT_VERSION } from '../../data/versionHistory';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">WHAT'S NEW & VERSION HISTORY</h2>
                <span className="rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                  Current: {APP_CURRENT_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                DECStudioAiCreation • WIFI HITMAP Changelogs & Updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Changelogs */}
        <div className="p-6 overflow-y-auto space-y-6">
          {VERSION_HISTORY.map((rel) => (
            <div
              key={rel.version}
              className={`rounded-xl border p-5 transition-all ${
                rel.isLatest
                  ? 'border-blue-200 bg-blue-50/30 shadow-xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Version Title Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                    rel.isLatest ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                  }`}>
                    {rel.version}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {rel.releaseTitle}
                  </h3>
                  {rel.isLatest && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      LATEST UPDATE
                    </span>
                  )}
                </div>

                {rel.releaseDate && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Released: {rel.releaseDate}</span>
                  </div>
                )}
              </div>

              {/* Categorized Changes */}
              <div className="space-y-4">
                {rel.categories.map((cat, cIdx) => (
                  <div key={`${rel.version}-cat-${cIdx}`} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                      <span>{cat.emoji}</span>
                      <span>{cat.category}</span>
                    </div>
                    <ul className="space-y-1 pl-2">
                      {cat.items.map((item, iIdx) => (
                        <li
                          key={`${rel.version}-it-${iIdx}`}
                          className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <span>DECStudioAiCreation | WIFI HITMAP {APP_CURRENT_VERSION}</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-black transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
