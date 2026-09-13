/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CableType, LanCable, LanCableRoutePoint } from '../../types';
import { Cable, Calculator, Check, Sparkles, Trash2, X } from 'lucide-react';

interface DeviceOption {
  id: string;
  name: string;
  type: 'MDF' | 'IDF' | 'AP' | 'Point';
}

interface LanCableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cable: LanCable) => void;
  onDelete?: (id: string) => void;
  initialData?: LanCable | null;
  route?: LanCableRoutePoint[];
  fromDevice?: DeviceOption | null;
  toDevice?: DeviceOption | null;
  availableDevices?: DeviceOption[];
  allDevices?: DeviceOption[];
  estimatedMeters?: number;
  estimatedLength?: number;
  isScaleCalibrated?: boolean;
  existingCount?: number;
}

export const LanCableModal: React.FC<LanCableModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  route = [],
  fromDevice,
  toDevice,
  availableDevices: passedAvailableDevices,
  allDevices: passedAllDevices,
  estimatedMeters: passedEstimatedMeters,
  estimatedLength: passedEstimatedLength,
  isScaleCalibrated,
  existingCount = 0,
}) => {
  const availableDevices = passedAvailableDevices || passedAllDevices || [];
  const estimatedMeters = passedEstimatedMeters ?? passedEstimatedLength ?? 0;

  const [cableId, setCableId] = useState('');
  const [fromId, setFromId] = useState('');
  const [fromName, setFromName] = useState('');
  const [toId, setToId] = useState('');
  const [toName, setToName] = useState('');
  const [lengthStr, setLengthStr] = useState('25');
  const [cableType, setCableType] = useState<CableType>('CAT6');
  const [notes, setNotes] = useState('');
  const [isEstimatedApplied, setIsEstimatedApplied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setCableId(initialData.id);
      setFromId(initialData.fromId);
      setFromName(initialData.fromName);
      setToId(initialData.toId);
      setToName(initialData.toName);
      setLengthStr(String(initialData.length));
      setCableType(initialData.cableType);
      setNotes(initialData.notes || '');
      setIsEstimatedApplied(!!initialData.isEstimated);
    } else {
      const nextId = `LAN-${String((existingCount || 0) + 1).padStart(2, '0')}`;
      setCableId(nextId);

      const fId = fromDevice?.id || (availableDevices?.[0]?.id ?? 'Custom-Point');
      const fName = fromDevice?.name || (availableDevices?.[0]?.name ?? 'Starting Location');
      setFromId(fId);
      setFromName(fName);

      const tId = toDevice?.id || (availableDevices?.[1]?.id ?? 'Custom-Point');
      const tName = toDevice?.name || (availableDevices?.[1]?.name ?? 'Ending Location');
      setToId(tId);
      setToName(tName);

      if (estimatedMeters && estimatedMeters > 0) {
        setLengthStr(String(Math.round(estimatedMeters)));
        setIsEstimatedApplied(true);
      } else {
        setLengthStr('25');
        setIsEstimatedApplied(false);
      }

      setCableType('CAT6');
      setNotes('');
    }
  }, [initialData, existingCount, fromDevice, toDevice, availableDevices, estimatedMeters, isOpen]);

  if (!isOpen) return null;

  const handleApplyEstimate = () => {
    if (estimatedMeters && estimatedMeters > 0) {
      setLengthStr(String(Math.round(estimatedMeters * 10) / 10));
      setIsEstimatedApplied(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cableId.trim()) return;

    const parsedLength = parseFloat(lengthStr);
    const validLength = isNaN(parsedLength) || parsedLength <= 0 ? 1 : Math.round(parsedLength * 10) / 10;

    const rawRoute = initialData?.route || route || [];
    const validRoute = rawRoute
      .filter((p) => p && typeof p.x === 'number' && !isNaN(p.x) && typeof p.y === 'number' && !isNaN(p.y))
      .map((p) => ({
        x: Math.max(0, Math.min(1, p.x)),
        y: Math.max(0, Math.min(1, p.y)),
      }));

    if (validRoute.length < 2) {
      validRoute.push({ x: 0.2, y: 0.2 }, { x: 0.5, y: 0.5 });
    }

    try {
      onSave({
        id: cableId.trim().toUpperCase(),
        fromId: fromId || 'Custom-Point',
        fromName: fromName || 'Start Point',
        toId: toId || 'Custom-Point',
        toName: toName || 'End Point',
        length: validLength,
        unit: 'meters',
        cableType,
        route: validRoute,
        notes: notes.trim() || undefined,
        isEstimated: isEstimatedApplied,
      });
      onClose();
    } catch (err) {
      console.error('Error saving LAN cable:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Cable className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {initialData ? 'EDIT LAN CABLE ROUTE' : 'ADD LAN CABLE'}
              </h2>
              <p className="text-xs text-indigo-200">Network Cable Connection & Meter Measurement</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Cable ID
              </label>
              <input
                type="text"
                required
                value={cableId}
                onChange={(e) => setCableId(e.target.value)}
                placeholder="e.g. LAN-01"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Cable Type
              </label>
              <select
                value={cableType}
                onChange={(e) => setCableType(e.target.value as CableType)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
              >
                <option value="CAT5e">CAT5e (1 Gbps)</option>
                <option value="CAT6">CAT6 (10 Gbps standard)</option>
                <option value="CAT6A">CAT6A (10 Gbps shielded)</option>
                <option value="Fiber">Fiber (OM3/OM4 / Single-Mode)</option>
                <option value="Other">Other / Custom</option>
              </select>
            </div>
          </div>

          {/* Connection endpoints */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                From (Starting Point)
              </label>
              <select
                value={fromId}
                onChange={(e) => {
                  const sel = e.target.value;
                  setFromId(sel);
                  const found = availableDevices.find((d) => d.id === sel);
                  if (found) setFromName(found.name);
                }}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-600 bg-white"
              >
                {availableDevices.map((d) => (
                  <option key={`from-${d.id}`} value={d.id}>
                    {d.name}
                  </option>
                ))}
                <option value="Custom-Point">Custom Point on Plan</option>
              </select>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Starting device or location"
                className="mt-1.5 w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                To (Ending Point)
              </label>
              <select
                value={toId}
                onChange={(e) => {
                  const sel = e.target.value;
                  setToId(sel);
                  const found = availableDevices.find((d) => d.id === sel);
                  if (found) setToName(found.name);
                }}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-600 bg-white"
              >
                {availableDevices.map((d) => (
                  <option key={`to-${d.id}`} value={d.id}>
                    {d.name}
                  </option>
                ))}
                <option value="Custom-Point">Custom Point on Plan</option>
              </select>
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="Ending device or location"
                className="mt-1.5 w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Cable Length in Meters */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Cable Length (Meters)
              </label>
              {estimatedMeters !== undefined && estimatedMeters > 0 && (
                <span className="text-xs text-indigo-700 font-medium flex items-center gap-1">
                  <Calculator className="h-3 w-3" />
                  Estimated: <strong>{estimatedMeters} m</strong>
                  {!isScaleCalibrated && (
                    <span className="text-[10px] text-amber-600">(Uncalibrated scale)</span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  value={lengthStr}
                  onChange={(e) => {
                    setLengthStr(e.target.value);
                    setIsEstimatedApplied(false);
                  }}
                  placeholder="e.g. 35"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-base font-bold font-mono focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <span className="absolute right-3.5 top-2.5 text-sm font-semibold text-slate-500">
                  Meters
                </span>
              </div>

              {estimatedMeters !== undefined && estimatedMeters > 0 && (
                <button
                  type="button"
                  onClick={handleApplyEstimate}
                  title="Use route estimated distance"
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Use Estimate ({estimatedMeters}m)
                </button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Manual cable length entry is always supported and recorded in project statistics.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ceiling cable tray route, PoE+ uplink to sales floor..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete LAN Cable Route "${initialData.id}"?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Cable
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
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                SAVE CABLE
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
