/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IDFDevice } from '../../types';
import { Network, Trash2, X } from 'lucide-react';

interface IdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idf: IDFDevice) => void;
  onDelete?: (id: string) => void;
  initialData?: IDFDevice | null;
  position?: { x: number; y: number };
  existingCount?: number;
}

export const IdfModal: React.FC<IdfModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  position = { x: 0.5, y: 0.5 },
  existingCount = 0,
}) => {
  const [cabinetId, setCabinetId] = useState('');
  const [area, setArea] = useState('Selling Area');
  const [location, setLocation] = useState('Selling Area');
  const [description, setDescription] = useState('Switch Hub for Selling Area');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setCabinetId(initialData.id);
      setArea(initialData.area || 'Selling Area');
      setLocation(initialData.location);
      setDescription(initialData.description);
      setNotes(initialData.notes || '');
    } else {
      const nextId = `IDF-${String((existingCount || 0) + 1).padStart(2, '0')}`;
      setCabinetId(nextId);
      setArea('Selling Area');
      setLocation('Selling Area');
      setDescription('Switch Hub for Selling Area');
      setNotes('');
    }
  }, [initialData, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabinetId.trim()) return;

    onSave({
      id: cabinetId.trim(),
      type: 'Switch Hub',
      area: area.trim() || 'Selling Area',
      location: location.trim() || 'Selling Area',
      description: description.trim() || 'Switch Hub for Selling Area',
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {initialData ? 'EDIT IDF SWITCH HUB' : 'ADD IDF — SWITCH HUB'}
              </h2>
              <p className="text-xs text-teal-200">Intermediate Switch Hub for Selling Area</p>
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
              Cabinet ID
            </label>
            <input
              type="text"
              required
              value={cabinetId}
              onChange={(e) => setCabinetId(e.target.value)}
              placeholder="e.g. IDF-01"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Area
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Selling Area"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Selling Area / Column C2"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Switch Hub for Selling Area"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
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
              placeholder="e.g. Serves AP-01, AP-02, POS registers..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete IDF Cabinet "${initialData.id}"?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete IDF
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
                className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
              >
                SAVE IDF
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
