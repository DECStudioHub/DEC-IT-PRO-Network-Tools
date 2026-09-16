/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AccessPoint } from '../../types';
import { Radio, Trash2, X } from 'lucide-react';

interface ApModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ap: AccessPoint) => void;
  onDelete?: (id: string) => void;
  initialData?: AccessPoint | null;
  position?: { x: number; y: number };
  existingCount?: number;
}

export const ApModal: React.FC<ApModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  position = { x: 0.5, y: 0.5 },
  existingCount = 0,
}) => {
  const [apId, setApId] = useState('');
  const [apName, setApName] = useState('');
  const [location, setLocation] = useState('');
  const [ssid, setSsid] = useState('STORE-WIFI');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setApId(initialData.id);
      setApName(initialData.name);
      setLocation(initialData.location);
      setSsid(initialData.ssid || 'STORE-WIFI');
      setNotes(initialData.notes || '');
    } else {
      const nextId = `AP-${String((existingCount || 0) + 1).padStart(2, '0')}`;
      setApId(nextId);
      setApName(`Wireless Access Point ${(existingCount || 0) + 1}`);
      setLocation('Sales Area');
      setSsid('STORE-WIFI');
      setNotes('');
    }
  }, [initialData, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apId.trim()) return;

    onSave({
      id: apId.trim(),
      name: apName.trim() || 'Wireless Access Point',
      location: location.trim() || 'Sales Area',
      ssid: ssid.trim() || 'STORE-WIFI',
      position: initialData ? initialData.position : position,
      notes: notes.trim() || undefined,
      appearance: initialData?.appearance,
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
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {initialData ? 'EDIT ACCESS POINT' : 'NEW ACCESS POINT'}
              </h2>
              <p className="text-xs text-emerald-200">WiFi AP Infrastructure Marker</p>
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
              AP ID
            </label>
            <input
              type="text"
              required
              value={apId}
              onChange={(e) => setApId(e.target.value)}
              placeholder="e.g. AP-01"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              AP Name
            </label>
            <input
              type="text"
              value={apName}
              onChange={(e) => setApName(e.target.value)}
              placeholder="e.g. AP-Sales-Main"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sales Area"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                SSID
              </label>
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="e.g. STORE-WIFI"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ceiling mount, 5GHz primary, PoE+ 802.3at..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete Access Point "${initialData.id}"?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete AP
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
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                {initialData ? 'SAVE AP' : 'ADD AP'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
