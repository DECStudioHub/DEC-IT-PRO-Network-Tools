/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FloorScale } from '../../types';
import { Ruler, Check, X } from 'lucide-react';

interface ScaleCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScale?: FloorScale;
  planWidth?: number;
  planHeight?: number;
  onSaveScale: (scale: FloorScale) => void;
}

export const ScaleCalibrationModal: React.FC<ScaleCalibrationModalProps> = ({
  isOpen,
  onClose,
  currentScale,
  planWidth = 1400,
  onSaveScale,
}) => {
  const [knownDistanceMeters, setKnownDistanceMeters] = useState<string>(
    currentScale?.isCalibrated ? String(currentScale.realMeters) : '45.0'
  );
  const [referenceDimension, setReferenceDimension] = useState<'width' | 'custom'>('width');

  useEffect(() => {
    if (isOpen && currentScale) {
      setKnownDistanceMeters(currentScale.isCalibrated ? String(currentScale.realMeters) : '45.0');
    }
  }, [isOpen, currentScale]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const meters = parseFloat(knownDistanceMeters);
    if (isNaN(meters) || meters <= 0) return;

    // Use full floor plan width as calibrated baseline
    const pixelDistance = planWidth || 1400;
    const metersPerPixel = meters / pixelDistance;

    onSaveScale({
      isCalibrated: true,
      pixelDistance,
      realMeters: meters,
      metersPerPixel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-slate-950 shadow-xs">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">CALIBRATE FLOOR PLAN SCALE</h2>
              <p className="text-xs text-amber-200">Enables Automatic LAN Cable Distance Estimation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Configure the real-world scale of your store floor plan. Once calibrated, the system can estimate cable route lengths automatically while always allowing manual meter overrides.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Reference Dimension
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReferenceDimension('width')}
                className={`flex-1 rounded-lg border py-2 px-3 text-xs font-semibold transition-colors ${
                  referenceDimension === 'width'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Entire Floor Plan Width
              </button>
              <button
                type="button"
                onClick={() => setReferenceDimension('custom')}
                className={`flex-1 rounded-lg border py-2 px-3 text-xs font-semibold transition-colors ${
                  referenceDimension === 'custom'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Known Wall / Section
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Known Real Distance (Meters)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                required
                value={knownDistanceMeters}
                onChange={(e) => setKnownDistanceMeters(e.target.value)}
                placeholder="e.g. 45.0"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-base font-bold font-mono focus:border-blue-600 focus:outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-sm font-semibold text-slate-400">
                Meters
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              For retail stores, average building widths range from 30m to 80m.
            </p>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <strong>Rule #54:</strong> The system displays estimated cable lengths clearly as{' '}
            <span className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300">
              Estimated Length: 24.5 m
            </span>
            . Technicians can always enter or replace with the exact physical cable length.
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
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-lg shadow-xs transition-colors"
            >
              <Check className="h-4 w-4" />
              SAVE SCALE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
