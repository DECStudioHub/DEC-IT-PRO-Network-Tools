/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SignalReading } from '../../types';
import { validateSignalInput, classifySignalStrength } from '../../utils/wifiClassification';
import { WifiSignalIcon } from '../WifiSignalIcon';
import { Activity, AlertCircle, Trash2, X } from 'lucide-react';

interface SignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signal: SignalReading) => void;
  onDelete?: (id: string) => void;
  initialData?: SignalReading | null;
  position?: { x: number; y: number };
  existingCount?: number;
}

export const SignalModal: React.FC<SignalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  position = { x: 0.5, y: 0.5 },
  existingCount = 0,
}) => {
  const [signalValue, setSignalValue] = useState<string>('');
  const [dbmValue, setDbmValue] = useState<string>('');
  const [speedMbpsValue, setSpeedMbpsValue] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setSignalValue(String(initialData.signal));
      setDbmValue(initialData.dbm !== undefined ? String(initialData.dbm) : '');
      setSpeedMbpsValue(initialData.speedMbps !== undefined ? String(initialData.speedMbps) : '');
      setLocation(initialData.location || '');
      setNotes(initialData.notes || '');
      setValidationError(null);
    } else {
      setSignalValue('85');
      setDbmValue('-55');
      setSpeedMbpsValue('150');
      setLocation('');
      setNotes('');
      setValidationError(null);
    }
  }, [initialData, existingCount, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation check
  const valResult = validateSignalInput(signalValue);
  const previewCalculation = valResult.isValid && valResult.numericValue !== undefined
    ? classifySignalStrength(valResult.numericValue)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateSignalInput(signalValue);
    if (!result.isValid || result.numericValue === undefined) {
      setValidationError(result.errorMessage || 'Invalid signal strength.');
      return;
    }

    const classification = classifySignalStrength(result.numericValue);
    const readingId = initialData?.id || `SIG-${String(existingCount + 1).padStart(2, '0')}`;

    // Parse optional technical fields
    const parsedDbm = dbmValue.trim() ? Number(dbmValue.replace(/[^0-9.-]/g, '')) : undefined;
    const parsedSpeed = speedMbpsValue.trim() ? Number(speedMbpsValue.replace(/[^0-9.]/g, '')) : undefined;

    onSave({
      id: readingId,
      signal: result.numericValue,
      bars: classification.bars,
      classification: classification.classification,
      position: initialData ? initialData.position : position,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      dbm: !isNaN(parsedDbm as number) ? parsedDbm : undefined,
      speedMbps: !isNaN(parsedSpeed as number) ? parsedSpeed : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {initialData ? 'EDIT SIGNAL READING' : 'NEW SIGNAL READING'}
              </h2>
              <p className="text-xs text-slate-300">WiFi Measurement Point (0–100)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Signal Strength (0–100)
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={signalValue}
                onChange={(e) => {
                  setSignalValue(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Enter value from 0 to 100"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-base font-bold font-mono focus:outline-none focus:ring-1 ${
                  validationError
                    ? 'border-red-500 text-red-700 focus:border-red-600 focus:ring-red-600'
                    : 'border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-blue-600'
                }`}
              />
              <span className="absolute right-3.5 top-2.5 text-sm font-semibold text-slate-400">
                / 100
              </span>
            </div>

            {/* Error Message */}
            {validationError && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Automatic Calculation Preview (Fixed rules cannot be overridden) */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Automatic WiFi Classification (Locked)
            </div>
            {previewCalculation ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <WifiSignalIcon bars={previewCalculation.bars} size={22} activeColor={previewCalculation.color} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {previewCalculation.bars} {previewCalculation.bars === 1 ? 'Bar' : 'Bars'}
                    </div>
                    <div className="text-xs font-medium" style={{ color: previewCalculation.color }}>
                      {previewCalculation.classification}
                    </div>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${previewCalculation.badgeBg}`}>
                  {previewCalculation.bars === 3 ? '81–100' : previewCalculation.bars === 2 ? '40–80' : '0–39'}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Enter a numeric value from 0 to 100 to preview bars and classification.
              </p>
            )}
          </div>

          {/* Technical Measurement Fields: DBM and SPEED MBPS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                DBM <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dbmValue}
                  onChange={(e) => setDbmValue(e.target.value)}
                  placeholder="e.g. -65"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-12 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400 pointer-events-none">
                  dBm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                SPEED MBPS <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={speedMbpsValue}
                  onChange={(e) => setSpeedMbpsValue(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-14 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400 pointer-events-none">
                  Mbps
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Location <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sales Area / Aisle 2"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handheld scanner reading, 2.4GHz / 5GHz..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete Signal Reading "${initialData.id}"?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-lg shadow-xs transition-colors"
              >
                {initialData ? 'SAVE READING' : 'ADD READING'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
