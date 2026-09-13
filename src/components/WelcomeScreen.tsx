/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Radio,
  Server,
  Network,
  Cable,
  ArrowRight,
  Coffee,
  Sparkles,
  ShieldAlert,
  Upload,
  FileCheck2,
  History,
  FolderOpen,
} from 'lucide-react';
import { APP_CURRENT_VERSION } from '../data/versionHistory';

interface WelcomeScreenProps {
  onEnterWorkspace: () => void;
  onOpenSupport: () => void;
  onLoadSampleProject?: () => void;
  onUploadFloorPlan?: () => void;
  onOpenWhatsNew?: () => void;
  hasSavedProject?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnterWorkspace,
  onOpenSupport,
  onLoadSampleProject,
  onUploadFloorPlan,
  onOpenWhatsNew,
  hasSavedProject = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 select-none">
      {/* Subtle architectural grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Atmospheric lighting accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-72 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl p-6 sm:p-9 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header: Brand & Version */}
        <div className="text-center space-y-2 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>DECStudioAiCreation</span>
            <span className="h-1 w-1 rounded-full bg-blue-400" />
            <span className="font-mono text-[11px] text-blue-300 font-bold">{APP_CURRENT_VERSION}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase">
            WIFI HITMAP
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed pt-1">
            WIFI HITMAP is a WiFi signal strength and network infrastructure planning system designed to help users visualize WiFi coverage, Access Points, MDF, IDF, LAN Cable routes, signal readings, and generate heatmaps on store floor plans.
          </p>
        </div>

        {/* Philosophy Quote Card (#186) */}
        <div className="my-5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4 sm:p-5 text-center relative overflow-hidden shadow-inner">
          <div className="absolute top-1 right-2 text-indigo-500/15 text-5xl font-serif leading-none select-none pointer-events-none">
            “
          </div>
          <p className="text-xs sm:text-sm font-medium italic text-indigo-200 leading-relaxed max-w-xl mx-auto">
            “I’m not a programmer. I’m a human with a bold imagination—and AI is the tool that brings my ideas to life.”
          </p>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">
            — Philosophy & Vision
          </div>
        </div>

        {/* Feature Capabilities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-5 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-center flex flex-col items-center">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1.5">
              <Server className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-200">MDF & IDF</span>
            <span className="text-[10.5px] text-slate-500 mt-0.5">Core Cabinets & Hubs</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-center flex flex-col items-center">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5">
              <Radio className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-200">Access Points</span>
            <span className="text-[10.5px] text-slate-500 mt-0.5">Wireless Deployments</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-center flex flex-col items-center">
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-1.5">
              <Cable className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-200">LAN Cable Runs</span>
            <span className="text-[10.5px] text-slate-500 mt-0.5">Route Length Metering</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-center flex flex-col items-center">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1.5">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-200">Audit Reports</span>
            <span className="text-[10.5px] text-slate-500 mt-0.5">PDF & High-Res PNG</span>
          </div>
        </div>

        {/* System Disclaimer Note */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-slate-400 flex items-start gap-2.5 my-4 text-[11px] leading-relaxed">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-amber-300">Note:</strong> This is a prototype system developed with the assistance of Artificial Intelligence to assist IT professionals and technicians in visualizing WiFi coverage and infrastructure layout.
          </p>
        </div>

        {/* Action Buttons Section (#185, #210, #236) */}
        <div className="pt-2 space-y-3">
          {/* Main Action Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={onEnterWorkspace}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>{hasSavedProject ? 'Open WIFI HITMAP (Resume Session)' : 'Open WIFI HITMAP'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {onUploadFloorPlan && (
              <button
                onClick={onUploadFloorPlan}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Upload className="h-4 w-4 text-blue-400" />
                <span>Upload Floor Plan</span>
              </button>
            )}

            {onLoadSampleProject && (
              <button
                onClick={onLoadSampleProject}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 text-xs font-semibold transition-colors cursor-pointer"
              >
                <FolderOpen className="h-4 w-4 text-amber-400" />
                <span>Load Sample Project</span>
              </button>
            )}
          </div>

          {/* Secondary Options: Support & What's New */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSupport}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 font-bold transition-all cursor-pointer"
              >
                <Coffee className="h-3.5 w-3.5 text-amber-400" />
                <span>Buy Me a Coffee</span>
              </button>

              {onOpenWhatsNew && (
                <button
                  onClick={onOpenWhatsNew}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 font-semibold transition-all cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-blue-400" />
                  <span>What's New</span>
                  <span className="rounded-full bg-blue-500/20 text-blue-300 px-1.5 py-0.2 text-[10px]">
                    {APP_CURRENT_VERSION}
                  </span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              DECStudioAiCreation | WIFI HITMAP {APP_CURRENT_VERSION}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
