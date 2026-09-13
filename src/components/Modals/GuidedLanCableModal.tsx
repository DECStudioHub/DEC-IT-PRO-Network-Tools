/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LanCable,
  CableType,
  LanCableRoutePoint,
  FloorPlanDocument,
  FloorScale,
  ItemAppearance,
  MDFDevice,
  IDFDevice,
  AccessPoint,
} from '../../types';
import { estimateRouteLengthInMeters } from '../../utils/distanceCalc';
import {
  Cable,
  Server,
  Network,
  Radio,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  AlertCircle,
  Maximize2,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface DeviceItem {
  id: string;
  name: string;
  type: 'MDF' | 'IDF' | 'AP';
  position: { x: number; y: number };
}

interface GuidedLanCableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: LanCable | null;
  initialFromId?: string;
  initialRoute?: LanCableRoutePoint[];
  allDevices?: DeviceItem[];
  mdfDevices?: MDFDevice[];
  idfDevices?: IDFDevice[];
  accessPoints?: AccessPoint[];
  existingCables?: LanCable[];
  floorPlan: FloorPlanDocument | null;
  floorScale: FloorScale;
  onSave?: (cable: LanCable) => void;
  onSaveCable?: (cable: LanCable) => void;
  onDelete?: (id: string) => void;
  onDeleteCable?: (id: string) => void;
}

export const GuidedLanCableModal: React.FC<GuidedLanCableModalProps> = ({
  isOpen,
  onClose,
  initialData,
  initialFromId,
  initialRoute,
  allDevices: passedAllDevices,
  mdfDevices = [],
  idfDevices = [],
  accessPoints = [],
  existingCables = [],
  floorPlan,
  floorScale,
  onSave,
  onSaveCable,
  onDelete,
  onDeleteCable,
}) => {
  // Step state: 1: From, 2: To, 3: Route Mode, 4: Details
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Safely assemble devices if passedAllDevices is not provided (#224, #225)
  const allDevices: DeviceItem[] = React.useMemo(() => {
    if (passedAllDevices && Array.isArray(passedAllDevices) && passedAllDevices.length > 0) {
      return passedAllDevices;
    }
    const items: DeviceItem[] = [];
    (mdfDevices || []).forEach((d) => {
      if (d && d.id && d.position && typeof d.position.x === 'number' && typeof d.position.y === 'number') {
        items.push({ id: d.id, name: d.name || d.id, type: 'MDF', position: d.position });
      }
    });
    (idfDevices || []).forEach((d) => {
      if (d && d.id && d.position && typeof d.position.x === 'number' && typeof d.position.y === 'number') {
        items.push({ id: d.id, name: d.name || d.id, type: 'IDF', position: d.position });
      }
    });
    (accessPoints || []).forEach((d) => {
      if (d && d.id && d.position && typeof d.position.x === 'number' && typeof d.position.y === 'number') {
        items.push({ id: d.id, name: d.name || d.id, type: 'AP', position: d.position });
      }
    });
    return items;
  }, [passedAllDevices, mdfDevices, idfDevices, accessPoints]);

  // Form states
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [routeMode, setRouteMode] = useState<'direct' | 'custom'>('direct');
  const [routePoints, setRoutePoints] = useState<LanCableRoutePoint[]>([]);
  const [cableId, setCableId] = useState('');
  const [cableType, setCableType] = useState<CableType>('CAT6');
  const [lengthStr, setLengthStr] = useState('25');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // When opening or changing initialData
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFromId(initialData.fromId);
      setToId(initialData.toId);
      setCableId(initialData.id);
      setCableType(initialData.cableType);
      setLengthStr(String(initialData.length));
      setNotes(initialData.notes || '');
      setRoutePoints(initialData.route || []);
      setRouteMode((initialData.route && initialData.route.length > 2) ? 'custom' : 'direct');
      setStep(4); // Editing existing cable jumps to details
    } else {
      // Determine next auto ID
      const nextNum = (existingCables?.length || 0) + 1;
      const genId = `LAN-${String(nextNum).padStart(2, '0')}`;
      setCableId(genId);

      // Pre-select initialFromId if passed via quick-add (#122)
      if (initialFromId && allDevices.some((d) => d.id === initialFromId)) {
        setFromId(initialFromId);
        // Default To device to first other device
        const otherDevice = allDevices.find((d) => d.id !== initialFromId);
        setToId(otherDevice ? otherDevice.id : '');
        setStep(2); // Jump straight to step 2
      } else {
        const firstMdf = allDevices.find((d) => d.type === 'MDF') || allDevices[0];
        setFromId(firstMdf ? firstMdf.id : '');
        const secondDev = allDevices.find((d) => d.id !== firstMdf?.id) || allDevices[1];
        setToId(secondDev ? secondDev.id : '');
        setStep(1);
      }

      if (initialRoute && initialRoute.length >= 2) {
        setRoutePoints(initialRoute);
        setRouteMode('custom');
      } else {
        setRouteMode('direct');
        setRoutePoints([]);
      }
      setCableType('CAT6');
      setLengthStr('25');
      setNotes('');
      setValidationError(null);
    }
  }, [isOpen, initialData, initialFromId, initialRoute, allDevices, existingCables?.length]);

  if (!isOpen) return null;

  // Selected device helpers
  const fromDevice = allDevices.find((d) => d.id === fromId);
  const toDevice = allDevices.find((d) => d.id === toId);

  // Recalculate automatic direct route points
  const getDirectRoutePoints = (): LanCableRoutePoint[] => {
    if (fromDevice && toDevice) {
      return [
        { x: fromDevice.position.x, y: fromDevice.position.y },
        { x: toDevice.position.x, y: toDevice.position.y },
      ];
    }
    return [
      { x: 0.2, y: 0.2 },
      { x: 0.6, y: 0.6 },
    ];
  };

  // Estimate distance based on selected devices and floor scale
  const computeEstimatedMeters = (): number => {
    if (!floorPlan || !fromDevice || !toDevice) return 25;
    const pts = routeMode === 'custom' && routePoints.length >= 2 ? routePoints : getDirectRoutePoints();
    const est = estimateRouteLengthInMeters(
      pts,
      floorPlan.originalWidth,
      floorPlan.originalHeight,
      floorScale
    );
    return est.estimatedMeters > 0 ? est.estimatedMeters : 25;
  };

  // Step transitions & validation
  const handleNextFromStep1 = () => {
    if (!fromId) {
      setValidationError('Please select a starting device.');
      return;
    }
    setValidationError(null);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!toId) {
      setValidationError('Please select a destination device.');
      return;
    }
    if (toId === fromId) {
      setValidationError('Destination must be different from the starting device.');
      return;
    }
    setValidationError(null);

    // If direct route mode, auto-compute estimate and update length
    const autoLength = computeEstimatedMeters();
    if (autoLength > 0 && lengthStr === '25') {
      setLengthStr(String(autoLength));
    }
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    setValidationError(null);
    // If route mode is direct, ensure routePoints reflect direct line
    if (routeMode === 'direct') {
      setRoutePoints(getDirectRoutePoints());
    } else if (routePoints.length < 2) {
      // Default to direct if custom points were not added
      setRoutePoints(getDirectRoutePoints());
    }
    const autoLength = computeEstimatedMeters();
    if (autoLength > 0) {
      setLengthStr(String(autoLength));
    }
    setStep(4);
  };

  const handleFinalSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!cableId || !cableId.trim()) {
      setValidationError('Unable to save LAN Cable: Cable ID is required (e.g. LAN-01).');
      return;
    }

    if (!fromId || !toId) {
      setValidationError('Unable to save LAN Cable: Please select both a starting and destination device.');
      return;
    }

    if (fromId === toId) {
      setValidationError('Unable to save LAN Cable: Starting device and destination cannot be identical.');
      return;
    }

    const fromDev = allDevices.find((d) => d.id === fromId);
    const toDev = allDevices.find((d) => d.id === toId);

    if (!fromDev || !toDev) {
      setValidationError('Unable to save LAN Cable: Selected devices could not be found.');
      return;
    }

    if (
      typeof fromDev.position?.x !== 'number' ||
      typeof fromDev.position?.y !== 'number' ||
      typeof toDev.position?.x !== 'number' ||
      typeof toDev.position?.y !== 'number'
    ) {
      setValidationError('Unable to save LAN Cable: Device positions are not ready on floor plan.');
      return;
    }

    const lenNum = parseFloat(lengthStr);
    if (isNaN(lenNum) || lenNum <= 0) {
      setValidationError('Unable to save LAN Cable: Please enter a valid cable length in meters.');
      return;
    }

    // Check duplicate ID if new cable
    if (!initialData) {
      const dup = (existingCables || []).some(
        (c) => c && c.id && c.id.trim().toLowerCase() === cableId.trim().toLowerCase()
      );
      if (dup) {
        setValidationError(`A cable with ID "${cableId}" already exists. Please choose another ID.`);
        return;
      }
    }

    // Generate and strictly validate route points (#226)
    const rawRoute =
      routeMode === 'direct' || !routePoints || routePoints.length < 2
        ? [
            { x: fromDev.position.x, y: fromDev.position.y },
            { x: toDev.position.x, y: toDev.position.y },
          ]
        : routePoints;

    const validatedRoute: LanCableRoutePoint[] = rawRoute
      .filter((p) => p && typeof p.x === 'number' && !isNaN(p.x) && typeof p.y === 'number' && !isNaN(p.y))
      .map((p) => ({
        x: Math.max(0, Math.min(1, p.x)),
        y: Math.max(0, Math.min(1, p.y)),
      }));

    if (validatedRoute.length < 2) {
      validatedRoute.length = 0;
      validatedRoute.push(
        { x: Math.max(0, Math.min(1, fromDev.position.x)), y: Math.max(0, Math.min(1, fromDev.position.y)) },
        { x: Math.max(0, Math.min(1, toDev.position.x)), y: Math.max(0, Math.min(1, toDev.position.y)) }
      );
    }

    const fromLabel = `${fromDev.id} (${fromDev.name})`;
    const toLabel = `${toDev.id} (${toDev.name})`;

    const savedCable: LanCable = {
      id: cableId.trim().toUpperCase(),
      fromId,
      fromName: fromLabel,
      toId,
      toName: toLabel,
      length: Math.round(lenNum * 10) / 10,
      unit: 'meters',
      cableType,
      route: validatedRoute,
      notes: notes.trim() || undefined,
      isEstimated: routeMode === 'direct',
      labelOffset: initialData?.labelOffset,
      appearance: initialData?.appearance,
    };

    const saveFn = onSave || onSaveCable;
    if (typeof saveFn === 'function') {
      try {
        saveFn(savedCable);
        onClose();
      } catch (err) {
        console.error('Failed to save LAN Cable:', err);
        setValidationError('Unable to save LAN Cable: Unexpected state update error.');
      }
    } else {
      console.warn('No save handler provided to GuidedLanCableModal');
      onClose();
    }
  };

  const getDeviceIcon = (type: 'MDF' | 'IDF' | 'AP') => {
    if (type === 'MDF') return <Server className="h-4 w-4 text-blue-500" />;
    if (type === 'IDF') return <Network className="h-4 w-4 text-teal-500" />;
    return <Radio className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Step Tracker (#110: STEP 1 OF 4) */}
        <div className="bg-slate-900 px-6 py-4 text-white border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Cable className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {initialData ? `Edit LAN Cable — ${initialData.id}` : 'Add LAN Cable'}
                </h3>
                <p className="text-xs text-indigo-200">
                  Step {step} of 4: {step === 1 ? 'Select Starting Device' : step === 2 ? 'Select Destination' : step === 3 ? 'Cable Route Mode' : 'Cable Details & Length'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="mt-3 flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={`step-indicator-${s}`}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= s ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        {/* Step Content Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: SELECT STARTING DEVICE (#110) */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 1 of 4
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Select Starting Device (From)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the origin device for this LAN cable run (usually an MDF cabinet or switch).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                {allDevices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                    No devices placed yet. Please place an MDF, IDF, or AP on the floor plan first.
                  </div>
                ) : (
                  allDevices.map((dev) => {
                    const isSelected = fromId === dev.id;
                    return (
                      <button
                        key={`from-dev-${dev.id}`}
                        type="button"
                        onClick={() => {
                          setFromId(dev.id);
                          setValidationError(null);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                            {getDeviceIcon(dev.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{dev.id}</span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                {dev.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                              {dev.name}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DESTINATION DEVICE (#111) */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 2 of 4
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Select Destination Device (To)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Connecting from <strong className="text-indigo-600">{fromId}</strong> to:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                {allDevices
                  .filter((d) => d.id !== fromId) // Exclude starting device
                  .map((dev) => {
                    const isSelected = toId === dev.id;
                    return (
                      <button
                        key={`to-dev-${dev.id}`}
                        type="button"
                        onClick={() => {
                          setToId(dev.id);
                          setValidationError(null);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                            {getDeviceIcon(dev.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{dev.id}</span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                {dev.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                              {dev.name}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 3: CABLE ROUTE — EASY MODE (#112) */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 3 of 4
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Choose Cable Route Style
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  How should the connection between <strong className="text-indigo-600">{fromId}</strong> and <strong className="text-indigo-600">{toId}</strong> be drawn?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* OPTION A: SIMPLE CONNECTION (DEFAULT) (#112) */}
                <div
                  onClick={() => setRouteMode('direct')}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    routeMode === 'direct'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                      <span className="text-sm font-bold text-slate-900">
                        Option A — Direct Connection (Recommended)
                      </span>
                    </div>
                    {routeMode === 'direct' && (
                      <span className="rounded-full bg-indigo-600 text-white p-0.5">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    The system automatically generates a clean straight connection line between the devices. No drawing required!
                  </p>

                  {/* Visual Diagram */}
                  <div className="mt-3 flex items-center justify-center gap-3 p-2.5 rounded-lg bg-white border border-indigo-200 font-mono text-xs">
                    <span className="font-bold text-blue-700">{fromId}</span>
                    <div className="flex-1 h-0.5 bg-indigo-600 relative">
                      <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-600 border border-white" />
                    </div>
                    <span className="font-bold text-teal-700">{toId}</span>
                  </div>
                </div>

                {/* OPTION B: CUSTOM ROUTE WITH WAYPOINTS */}
                <div
                  onClick={() => setRouteMode('custom')}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    routeMode === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                      <span className="text-sm font-bold text-slate-900">
                        Option B — Custom Waypoint Route
                      </span>
                    </div>
                    {routeMode === 'custom' && (
                      <span className="rounded-full bg-indigo-600 text-white p-0.5">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Follow corridors or cable trays with turn points. You can adjust waypoints anytime later by clicking the cable on the floor plan.
                  </p>
                  {routeMode === 'custom' && (
                    <div className="mt-2.5 flex items-center justify-between text-xs text-indigo-800 bg-indigo-100/70 p-2 rounded-lg">
                      <span>Waypoints: {routePoints.length > 0 ? `${routePoints.length} points` : 'Direct path (will be editable)'}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoutePoints(getDirectRoutePoints());
                        }}
                        className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reset Points
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CABLE DETAILS (#114) */}
          {step === 4 && (
            <form id="cable-details-form" onSubmit={handleFinalSave} className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 4 of 4
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Cable Identification & Length
                </h4>
              </div>

              {/* Endpoint Summary Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <span className="text-blue-700">{fromId}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-teal-700">{toId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Change Endpoints
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cable ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={cableId}
                    onChange={(e) => setCableId(e.target.value)}
                    placeholder="e.g. LAN-01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold font-mono focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cable Type
                  </label>
                  <select
                    value={cableType}
                    onChange={(e) => setCableType(e.target.value as CableType)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    <option value="CAT6">CAT6 (10 Gbps standard)</option>
                    <option value="CAT6A">CAT6A (10 Gbps shielded)</option>
                    <option value="Fiber">Fiber (OM3/OM4 / Single-Mode)</option>
                    <option value="CAT5e">CAT5e (1 Gbps legacy)</option>
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>
              </div>

              {/* Cable Length */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Cable Length (Meters) *
                  </label>
                  {computeEstimatedMeters() > 0 && (
                    <button
                      type="button"
                      onClick={() => setLengthStr(String(computeEstimatedMeters()))}
                      className="text-xs text-indigo-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Use Estimated ({computeEstimatedMeters()} m)
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={lengthStr}
                    onChange={(e) => setLengthStr(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-base font-bold font-mono focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <span className="absolute right-3.5 top-2.5 text-sm font-semibold text-slate-500">
                    Meters
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ceiling cable tray route, PoE+ uplink to sales floor..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                setStep((prev) => (prev - 1) as any);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : initialData && (onDelete || onDeleteCable) ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete LAN Cable "${initialData.id}"?`)) {
                  (onDeleteCable || onDelete)?.(initialData.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Cable
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                Next: Destination
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                Next: Cable Route
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNextFromStep3}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                Next: Details
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {step === 4 && (
              <button
                type="submit"
                form="cable-details-form"
                className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                <Check className="h-4 w-4" />
                SAVE LAN CABLE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
