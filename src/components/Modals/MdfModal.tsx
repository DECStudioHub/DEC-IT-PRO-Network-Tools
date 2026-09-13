/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MDFDevice } from '../../types';
import { Server, Trash2, X } from 'lucide-react';

interface MdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mdf: MDFDevice) => void;
  onDelete?: (id: string) => void;
  initialData?: MDFDevice | null;
  position?: { x: number; y: number };
  existingCount?: number;
}

export const MdfModal: React.FC<MdfModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  position = { x: 0.1, y: 0.1 },
  existingCount = 0,
}) => {
  const [cabinetId, setCabinetId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setCabinetId(initialData.id);
      setLocation(initialData.location);
      setDescription(initialData.description);
      setNotes(initialData.notes || '');
    } else {
      const nextId = `MDF-${String((existingCount || 0) + 1).padStart(2, '0')}`;
      setCabinetId(nextId);
      setLocation('Server Room');
      setDescription('Main Server Cabinet');
      setNotes('');
    }
  }, [initialData, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabinetId.trim()) return;

    onSave({
      id: cabinetId.trim(),
      type: 'Server Cabinet',
      location: location.trim() || 'Server Room',
      description: description.trim() || 'Main Server Cabinet',
      position: initialData ? initialData.position : position,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {initialData ? 'EDIT MDF CABINET' : 'ADD MDF — SERVER CABINET'}
              </h2>
              <p className="text-xs text-blue-200">Main Network & Core Distribution Hub</p>
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
              placeholder="e.g. MDF-01"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
              placeholder="e.g. Server Room / Back Office"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
              placeholder="e.g. Main 42U Server Cabinet"
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
              placeholder="e.g. Core switch, firewall, fiber demarcation..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete MDF Cabinet "${initialData.id}"?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete MDF
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
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                SAVE MDF
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
