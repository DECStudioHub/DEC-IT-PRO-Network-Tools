/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StoreInfo } from '../../types';
import { Building2, X, User, Calendar, Clock, MapPin, Shield, FileText } from 'lucide-react';

interface StoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeInfo?: StoreInfo;
  currentInfo?: StoreInfo;
  onSave?: (info: StoreInfo) => void;
  onSaveInfo?: (info: StoreInfo) => void;
}

const DEFAULT_STORE_INFO: StoreInfo = {
  storeName: '',
  storeCode: '',
  location: '',
  floorArea: '',
  assessmentDate: new Date().toISOString().split('T')[0],
  preparedBy: '',
  technicianPosition: 'IT Technician',
  dateCreated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  timeCreated: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  remarks: '',
};

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onClose,
  storeInfo,
  currentInfo,
  onSave,
  onSaveInfo,
}) => {
  const initialSource = currentInfo || storeInfo || DEFAULT_STORE_INFO;

  const [formData, setFormData] = useState<StoreInfo>(() => ({
    ...initialSource,
    technicianPosition: initialSource.technicianPosition || 'IT Technician',
    dateCreated: initialSource.dateCreated || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    timeCreated: initialSource.timeCreated || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }));

  useEffect(() => {
    if (isOpen) {
      const active = currentInfo || storeInfo || DEFAULT_STORE_INFO;
      setFormData({
        ...active,
        technicianPosition: active.technicianPosition || 'IT Technician',
        dateCreated: active.dateCreated || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        timeCreated: active.timeCreated || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      });
    }
  }, [isOpen, currentInfo, storeInfo]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreInfo = {
      ...formData,
      lastModified: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
    if (onSave) onSave(updated);
    if (onSaveInfo) onSaveInfo(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">PROJECT DETAILS & STORE INFO</h2>
              <p className="text-xs text-slate-300">Survey Metadata & Inspector Information for Exports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* SECTION 1: STORE INFORMATION (#167, #169) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Store Information
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="e.g. ABC STORE"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Store Code / ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeCode}
                  onChange={(e) => setFormData({ ...formData, storeCode: e.target.value })}
                  placeholder="e.g. STR-001"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Store Location / Area *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Selling Area / Promenade"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Floor / Space Area
                </label>
                <input
                  type="text"
                  value={formData.floorArea}
                  onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                  placeholder="e.g. Ground Level (1,200 sq.m)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TECHNICIAN INFORMATION (#167, #169) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <User className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Technician Information
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Created By (Inspector Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.preparedBy}
                  onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Technician Position
                </label>
                <input
                  type="text"
                  value={formData.technicianPosition || 'IT Technician'}
                  onChange={(e) => setFormData({ ...formData, technicianPosition: e.target.value })}
                  placeholder="e.g. IT Technician"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Assessment Date
              </label>
              <input
                type="date"
                value={formData.assessmentDate}
                onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 3: AUTOMATIC DATE AUDITING (#167, #181) */}
          <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Project Audit Timestamps
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Date Created: <strong className="font-semibold text-slate-900">{formData.dateCreated}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Time Created: <strong className="font-semibold text-slate-900">{formData.timeCreated}</strong>
                </span>
              </div>
            </div>
            {formData.lastModified && (
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                Last Modified: <span className="font-medium text-slate-700">{formData.lastModified}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Assessment Remarks / Objectives
            </label>
            <textarea
              rows={2}
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. WiFi signal strength & network infrastructure survey for store opening."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
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
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Save Project Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
