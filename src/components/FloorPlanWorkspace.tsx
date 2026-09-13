/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  FloorPlanDocument,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  LanCableRoutePoint,
  ActiveTool,
  VisibilitySettings,
  FloorScale,
  AppearanceSettings,
  ItemAppearance,
} from '../types';
import { renderHeatmapToCanvas } from '../utils/heatmapRenderer';
import { WifiSignalIcon } from './WifiSignalIcon';
import {
  Server,
  HardDrive,
  Cpu,
  Boxes,
  Layers,
  Network,
  Split,
  Grid,
  Share2,
  Radio,
  Disc,
  Wifi,
  Router,
  Antenna,
  Cable,
  Plus,
  Trash2,
  Move,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface FloorPlanWorkspaceProps {
  floorPlan: FloorPlanDocument | null;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  visibility: VisibilitySettings;
  floorScale: FloorScale;
  appearanceSettings?: AppearanceSettings;
  onSelectMdf: (mdf: MDFDevice) => void;
  onSelectIdf: (idf: IDFDevice) => void;
  onSelectAp: (ap: AccessPoint) => void;
  onSelectSignal: (sig: SignalReading) => void;
  onSelectCable: (cable: LanCable) => void;
  onAddPointClick: (normalizedPos: { x: number; y: number }, targetDeviceId?: string) => void;
  onUpdateMdfPos: (id: string, newPos: { x: number; y: number }) => void;
  onUpdateIdfPos: (id: string, newPos: { x: number; y: number }) => void;
  onUpdateApPos: (id: string, newPos: { x: number; y: number }) => void;
  onUpdateSignalPos: (id: string, newPos: { x: number; y: number }) => void;
  onUpdateCableLabelOffset?: (cableId: string, offset: { x: number; y: number }) => void;
  onDeleteMdf: (id: string) => void;
  onDeleteIdf: (id: string) => void;
  onDeleteAp: (id: string) => void;
  onDeleteSignal: (id: string) => void;
  onDeleteCable: (id: string) => void;
  onDragEnd?: () => void;
  // Cable in-progress drawing
  cableDrawingRoute: LanCableRoutePoint[];
  setCableDrawingRoute: React.Dispatch<React.SetStateAction<LanCableRoutePoint[]>>;
  onFinishCableDrawing: () => void;
  onUploadFloorPlan?: () => void;
}

export const FloorPlanWorkspace: React.FC<FloorPlanWorkspaceProps> = ({
  floorPlan,
  activeTool,
  setActiveTool,
  zoom,
  setZoom,
  pan,
  setPan,
  mdfDevices,
  idfDevices,
  accessPoints,
  signalReadings,
  lanCables,
  visibility,
  floorScale,
  appearanceSettings,
  onSelectMdf,
  onSelectIdf,
  onSelectAp,
  onSelectSignal,
  onSelectCable,
  onAddPointClick,
  onUpdateMdfPos,
  onUpdateIdfPos,
  onUpdateApPos,
  onUpdateSignalPos,
  onUpdateCableLabelOffset,
  onDeleteMdf,
  onDeleteIdf,
  onDeleteAp,
  onDeleteSignal,
  onDeleteCable,
  onDragEnd,
  cableDrawingRoute,
  setCableDrawingRoute,
  onFinishCableDrawing,
  onUploadFloorPlan,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Pan dragging state
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });

  // Icon component helper (#136, #137, #138)
  const getMdfIconComponent = (style?: string) => {
    switch (style) {
      case 'network-cabinet': return HardDrive;
      case 'server': return Cpu;
      case 'rack-cabinet': return Boxes;
      case 'layers': return Layers;
      case 'server-rack':
      default: return Server;
    }
  };

  const getIdfIconComponent = (style?: string) => {
    switch (style) {
      case 'switch-hub': return Split;
      case 'network-rack': return Grid;
      case 'distribution-unit': return Share2;
      case 'network-switch':
      default: return Network;
    }
  };

  const getApIconComponent = (style?: string) => {
    switch (style) {
      case 'ceiling-ap': return Disc;
      case 'wall-ap': return Wifi;
      case 'wireless-device': return Router;
      case 'antenna': return Antenna;
      case 'standard-ap':
      default: return Radio;
    }
  };

  // Marker & Cable Label dragging state (#84: draggable cable labels)
  const [draggedItem, setDraggedItem] = useState<{
    type: 'mdf' | 'idf' | 'ap' | 'signal' | 'cable-label';
    id: string;
    hasMoved: boolean;
    startOffset?: { x: number; y: number };
    startMouse?: { x: number; y: number };
  } | null>(null);

  // Re-render heatmap when signals or visibility changes
  useEffect(() => {
    if (!floorPlan || !heatmapCanvasRef.current) return;
    if (!visibility.showHeatmap) {
      const ctx = heatmapCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, heatmapCanvasRef.current.width, heatmapCanvasRef.current.height);
      return;
    }

    renderHeatmapToCanvas(
      heatmapCanvasRef.current,
      signalReadings,
      floorPlan.originalWidth,
      floorPlan.originalHeight,
      0.42
    );
  }, [floorPlan, signalReadings, visibility.showHeatmap]);

  // Convert mouse client coordinates to normalized (0..1) relative to floor plan
  const getNormalizedCoordinates = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!containerRef.current || !floorPlan) return null;
      const rect = containerRef.current.getBoundingClientRect();

      // Scaled floor plan dimensions
      const planW = floorPlan.originalWidth * zoom;
      const planH = floorPlan.originalHeight * zoom;

      // Center offset
      const offsetX = rect.width / 2 + (pan?.x || 0) - planW / 2;
      const offsetY = rect.height / 2 + (pan?.y || 0) - planH / 2;

      const clickX = clientX - rect.left - offsetX;
      const clickY = clientY - rect.top - offsetY;

      const normX = Math.max(0, Math.min(1, clickX / planW));
      const normY = Math.max(0, Math.min(1, clickY / planH));

      return { x: normX, y: normY };
    },
    [floorPlan, zoom, pan]
  );

  // Smart Mouse Scroll Zoom (focused around cursor, clamped 0.25 to 3.0) (#214 - #218)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !floorPlan) return;

    const onWheelHandler = (e: WheelEvent) => {
      // Prevent browser from scrolling the entire page (#218)
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Determine zoom direction: deltaY < 0 is wheel up (Zoom In), deltaY > 0 is wheel down (Zoom Out) (#214)
      const zoomStep = e.deltaY < 0 ? 1.12 : 0.88;

      setZoom((currentZoom) => {
        // Enforce limits: Min 25% (0.25), Max 300% (3.0) (#216)
        const nextZoom = Math.min(3.0, Math.max(0.25, Math.round(currentZoom * zoomStep * 100) / 100));
        if (nextZoom === currentZoom) return currentZoom;

        const ratio = nextZoom / currentZoom;

        // Keep the point underneath the mouse pointer static (#215)
        setPan((currentPan) => {
          const planCenterX = rect.width / 2 + (currentPan?.x || 0);
          const planCenterY = rect.height / 2 + (currentPan?.y || 0);

          const dx = mouseX - planCenterX;
          const dy = mouseY - planCenterY;

          return {
            x: Math.round(((currentPan?.x || 0) - dx * (ratio - 1)) * 10) / 10,
            y: Math.round(((currentPan?.y || 0) - dy * (ratio - 1)) * 10) / 10,
          };
        });

        return nextZoom;
      });
    };

    container.addEventListener('wheel', onWheelHandler, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelHandler);
    };
  }, [floorPlan, setZoom, setPan]);

  // Workspace pointer down (handles canvas panning)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle mouse button OR clicking empty space in select/pan mode
    if (
      e.button === 1 ||
      (e.button === 0 && (e.target === containerRef.current || activeTool === 'select'))
    ) {
      // If clicked on an interactive marker, do not pan
      const target = e.target as HTMLElement;
      if (target.closest('.interactive-marker')) return;

      setIsPanning(true);
      setStartPanPos({ x: e.clientX - (pan?.x || 0), y: e.clientY - (pan?.y || 0) });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanPos.x,
        y: e.clientY - startPanPos.y,
      });
      return;
    }

    if (draggedItem) {
      if (draggedItem.type === 'cable-label') {
        // Dragging cable label badge in canvas pixels
        if (draggedItem.startMouse && draggedItem.startOffset && onUpdateCableLabelOffset) {
          const deltaX = (e.clientX - draggedItem.startMouse.x) / zoom;
          const deltaY = (e.clientY - draggedItem.startMouse.y) / zoom;
          const newOffset = {
            x: Math.round(draggedItem.startOffset.x + deltaX),
            y: Math.round(draggedItem.startOffset.y + deltaY),
          };
          onUpdateCableLabelOffset(draggedItem.id, newOffset);
          setDraggedItem({ ...draggedItem, hasMoved: true });
        }
        return;
      }

      const norm = getNormalizedCoordinates(e.clientX, e.clientY);
      if (!norm) return;

      if (draggedItem.type === 'mdf') {
        onUpdateMdfPos(draggedItem.id, norm);
      } else if (draggedItem.type === 'idf') {
        onUpdateIdfPos(draggedItem.id, norm);
      } else if (draggedItem.type === 'ap') {
        onUpdateApPos(draggedItem.id, norm);
      } else if (draggedItem.type === 'signal') {
        onUpdateSignalPos(draggedItem.id, norm);
      }
      setDraggedItem({ ...draggedItem, hasMoved: true });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
    if (draggedItem) {
      if (draggedItem.hasMoved && onDragEnd) {
        onDragEnd();
      }
      setDraggedItem(null);
    }
  };

  // Click on floor plan background
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (isPanning || (draggedItem && draggedItem.hasMoved)) return;

    const norm = getNormalizedCoordinates(e.clientX, e.clientY);
    if (!norm) return;

    if (activeTool === 'add-cable') {
      // Add waypoint to route
      setCableDrawingRoute((prev) => [...prev, norm]);
      return;
    }

    if (
      activeTool === 'add-mdf' ||
      activeTool === 'add-idf' ||
      activeTool === 'add-ap' ||
      activeTool === 'add-signal'
    ) {
      onAddPointClick(norm);
    }
  };

  // Start dragging a device/signal marker
  const handleMarkerDragStart = (
    e: React.PointerEvent,
    type: 'mdf' | 'idf' | 'ap' | 'signal',
    id: string
  ) => {
    if (activeTool === 'delete') return;
    if (activeTool === 'add-cable') return; // let cable clicks attach to device

    e.stopPropagation();
    setDraggedItem({ type, id, hasMoved: false });
  };

  // Start dragging a cable label badge (#84: Reposition cable label)
  const handleCableLabelDragStart = (
    e: React.PointerEvent,
    cableId: string,
    currentOffset?: { x: number; y: number }
  ) => {
    if (activeTool === 'delete') return;
    e.stopPropagation();
    setDraggedItem({
      type: 'cable-label',
      id: cableId,
      hasMoved: false,
      startOffset: currentOffset || { x: 0, y: 0 },
      startMouse: { x: e.clientX, y: e.clientY },
    });
  };

  // Click on an existing device while in Add Cable mode
  const handleDeviceClickForCable = (devicePos: { x: number; y: number }, deviceId: string) => {
    if (activeTool === 'add-cable') {
      if (cableDrawingRoute.length === 0) {
        setCableDrawingRoute([devicePos]);
      } else {
        setCableDrawingRoute((prev) => [...prev, devicePos]);
        onFinishCableDrawing();
      }
    }
  };

  const getCableStrokeColor = (type: string) => {
    switch (type) {
      case 'CAT6':
        return '#2563eb'; // blue-600
      case 'CAT6A':
        return '#7c3aed'; // violet-600
      case 'Fiber':
        return '#d97706'; // amber-600
      case 'CAT5e':
        return '#475569'; // slate-600
      default:
        return '#059669'; // emerald-600
    }
  };

  const planW = floorPlan?.originalWidth || 1400;
  const planH = floorPlan?.originalHeight || 900;
  const safePan = { x: pan?.x || 0, y: pan?.y || 0 };

  // SMART COLLISION AVOIDANCE (#85)
  // Calculates intelligent non-overlapping badge positions for each cable
  const cableBadgePositions = useMemo(() => {
    const results: Record<string, { x: number; y: number; hasOffsetLine: boolean }> = {};

    // Collect all obstacle positions in canvas pixels:
    // Signal readings, APs, MDFs, IDFs
    const obstacles: { x: number; y: number; radius: number }[] = [];

    if (visibility.showSignalValues || visibility.showWifiBars) {
      signalReadings.forEach((s) => {
        if (s?.position?.x !== undefined && s?.position?.y !== undefined) {
          obstacles.push({ x: s.position.x * planW, y: s.position.y * planH, radius: 26 });
        }
      });
    }

    if (visibility.showAps) {
      accessPoints.forEach((a) => {
        if (a?.position?.x !== undefined && a?.position?.y !== undefined) {
          obstacles.push({ x: a.position.x * planW, y: a.position.y * planH, radius: 30 });
        }
      });
    }

    if (visibility.showMdf) {
      mdfDevices.forEach((m) => {
        if (m?.position?.x !== undefined && m?.position?.y !== undefined) {
          obstacles.push({ x: m.position.x * planW, y: m.position.y * planH, radius: 32 });
        }
      });
    }

    if (visibility.showIdf) {
      idfDevices.forEach((i) => {
        if (i?.position?.x !== undefined && i?.position?.y !== undefined) {
          obstacles.push({ x: i.position.x * planW, y: i.position.y * planH, radius: 30 });
        }
      });
    }

    lanCables.forEach((cable) => {
      if (!cable.route || cable.route.length < 2) return;

      const midIdx = Math.floor((cable.route.length - 1) / 2);
      const p1 = cable.route[midIdx];
      const p2 = cable.route[midIdx + 1] || p1;
      if (!p1 || !p2) return;

      // Base midpoint
      const baseX = ((p1.x + p2.x) / 2) * planW;
      const baseY = ((p1.y + p2.y) / 2) * planH;

      // If user provided a manual offset, use that directly
      if (cable.labelOffset && (cable.labelOffset.x !== 0 || cable.labelOffset.y !== 0)) {
        results[cable.id] = {
          x: baseX + cable.labelOffset.x,
          y: baseY + cable.labelOffset.y,
          hasOffsetLine: true,
        };
        return;
      }

      // Calculate direction vector and perpendicular normal
      const dx = (p2.x - p1.x) * planW;
      const dy = (p2.y - p1.y) * planH;
      const len = Math.hypot(dx, dy) || 1;
      const normX = -dy / len; // perpendicular unit vector
      const normY = dx / len;

      let bestX = baseX;
      let bestY = baseY;
      let hasOffsetLine = false;

      // Check collision with obstacles
      const collidesWith = (x: number, y: number) => {
        return obstacles.some((obs) => Math.hypot(x - obs.x, y - obs.y) < obs.radius + 20);
      };

      if (collidesWith(bestX, bestY)) {
        // Shift outward along normal (+28px)
        const tryX1 = baseX + normX * 28;
        const tryY1 = baseY + normY * 28;

        if (!collidesWith(tryX1, tryY1)) {
          bestX = tryX1;
          bestY = tryY1;
          hasOffsetLine = true;
        } else {
          // Shift opposite direction (-28px)
          const tryX2 = baseX - normX * 28;
          const tryY2 = baseY - normY * 28;
          bestX = tryX2;
          bestY = tryY2;
          hasOffsetLine = true;
        }
      }

      results[cable.id] = { x: bestX, y: bestY, hasOffsetLine };
      // Also register this badge as an obstacle for subsequent badges
      obstacles.push({ x: bestX, y: bestY, radius: 24 });
    });

    return results;
  }, [
    lanCables,
    signalReadings,
    accessPoints,
    mdfDevices,
    idfDevices,
    planW,
    planH,
    visibility.showSignalValues,
    visibility.showWifiBars,
    visibility.showAps,
    visibility.showMdf,
    visibility.showIdf,
  ]);

  if (!floorPlan) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-100 p-8 text-center select-none">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4 shadow-2xs">
            <Radio className="h-7 w-7" />
          </div>
          <div className="text-[10px] font-extrabold tracking-wider text-blue-600 uppercase mb-0.5">
            DECStudioAiCreation
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 mb-1">
            WIFI HITMAP WORKSPACE
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Upload a branch floor plan (PNG, JPG, or PDF) to start placing MDF server
            cabinets, IDF switch hubs, wireless APs, WiFi readings, and measuring LAN cable routes.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                if (onUploadFloorPlan) {
                  onUploadFloorPlan();
                } else {
                  onAddPointClick({ x: 0.5, y: 0.5 });
                }
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Branch Floor Plan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleBackgroundClick}
      className={`relative flex-1 w-full h-full overflow-hidden bg-slate-200 select-none ${
        activeTool === 'select'
          ? isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
          : activeTool === 'delete'
          ? 'cursor-crosshair'
          : 'cursor-crosshair'
      }`}
    >
      {/* Centered floor plan stage with scale & pan */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${planW}px`,
          height: `${planH}px`,
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning || draggedItem ? 'none' : 'transform 0.08s ease-out',
        }}
        className="shadow-2xl ring-1 ring-slate-900/10 rounded-xs bg-white pointer-events-auto"
      >
        {/* Layer 1: Architectural Floor Plan Background (Source of Truth - Pristine) */}
        <img
          src={floorPlan.backgroundDataUrl}
          alt="Branch Architectural Floor Plan"
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        />

        {/* Layer 2: Semi-Transparent Heatmap Canvas Overlay */}
        <canvas
          ref={heatmapCanvasRef}
          width={planW}
          height={planH}
          className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
            visibility.showHeatmap ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Layer 3: SVG Layer for LAN Cable Routes & Smart Collision Badges */}
        {visibility.showLanCables && (
          <svg
            width={planW}
            height={planH}
            className="absolute inset-0 pointer-events-none overflow-visible"
          >
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Existing Saved LAN Cable Routes */}
            {(lanCables || []).map((cable) => {
              if (!cable || !cable.id || !Array.isArray(cable.route) || cable.route.length < 2 || !cable.route[0] || !cable.route[1]) {
                return null;
              }
              // Defensive coordinate validation (#227)
              const hasValidCoords = cable.route.every(
                (p) => p && typeof p.x === 'number' && !isNaN(p.x) && typeof p.y === 'number' && !isNaN(p.y)
              );
              if (!hasValidCoords) {
                console.warn(`[WIFI HITMAP] Skipping corrupted cable route for: ${cable.id}`);
                return null;
              }
              const pointsStr = cable.route
                .map((p) => `${p.x * planW},${p.y * planH}`)
                .join(' ');

              const cableApp = cable.appearance || appearanceSettings?.defaultCable || {};
              const strokeCol = cableApp.lineColor || getCableStrokeColor(cable.cableType);
              const isFiber = cable.cableType === 'Fiber';
              const strokeThickness =
                cableApp.lineThickness === 'thin' ? 2 : cableApp.lineThickness === 'thick' ? 5 : 3.5;
              const strokeDasharray =
                cableApp.lineStyle === 'dashed'
                  ? '7, 4'
                  : cableApp.lineStyle === 'dotted'
                  ? '2, 3'
                  : isFiber
                  ? '7, 4'
                  : undefined;

              const badgePos = cableBadgePositions[cable.id] || {
                x: ((cable.route[0].x + cable.route[1].x) / 2) * planW,
                y: ((cable.route[0].y + cable.route[1].y) / 2) * planH,
                hasOffsetLine: false,
              };

              // Base midpoint for connector line if badge was offset
              const midIdx = Math.floor((cable.route.length - 1) / 2);
              const p1 = cable.route[midIdx];
              const p2 = cable.route[midIdx + 1] || p1;
              if (!p1 || !p2) return null;
              const baseX = ((p1.x + p2.x) / 2) * planW;
              const baseY = ((p1.y + p2.y) / 2) * planH;

              const labelMode = visibility.cableLabelMode || 'full';
              const showBadge = visibility.showLanLengths && labelMode !== 'hidden';

              return (
                <g key={`route-${cable.id}`}>
                  {/* Outer casing shadow line */}
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={strokeThickness + 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#shadow)"
                  />

                  {/* Main Cable Line */}
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke={strokeCol}
                    strokeWidth={strokeThickness}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="cursor-pointer pointer-events-auto group-hover:stroke-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'delete') {
                        onDeleteCable(cable.id);
                      } else {
                        onSelectCable(cable);
                      }
                    }}
                  />

                  {/* Route endpoint dots */}
                  {cable.route.map((pt, idx) => (
                    <circle
                      key={`pt-${cable.id}-${idx}`}
                      cx={pt.x * planW}
                      cy={pt.y * planH}
                      r={idx === 0 || idx === cable.route.length - 1 ? 4 : 2.5}
                      fill={strokeCol}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* Anti-collision connector leader line (#85) */}
                  {showBadge && badgePos.hasOffsetLine && (
                    <line
                      x1={baseX}
                      y1={baseY}
                      x2={badgePos.x}
                      y2={badgePos.y}
                      stroke={strokeCol}
                      strokeWidth="1.5"
                      strokeDasharray="2, 2"
                    />
                  )}

                  {/* Repositionable & Draggable Cable Badge (#84, #85) */}
                  {showBadge && (
                    <g
                      transform={`translate(${badgePos.x}, ${badgePos.y})`}
                      className="interactive-marker cursor-grab active:cursor-grabbing pointer-events-auto select-none"
                      onPointerDown={(e) => handleCableLabelDragStart(e, cable.id, cable.labelOffset)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeTool === 'delete') {
                          onDeleteCable(cable.id);
                        } else {
                          onSelectCable(cable);
                        }
                      }}
                    >
                      {labelMode === 'full' ? (
                        <>
                          <rect
                            x="-50"
                            y="-16"
                            width="100"
                            height="32"
                            rx="6"
                            fill="#0f172a"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            filter="url(#shadow)"
                          />
                          <text
                            x="0"
                            y="-4"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {cable.id}
                          </text>
                          <text
                            x="0"
                            y="9"
                            textAnchor="middle"
                            fill="#38bdf8"
                            fontSize="9.5"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {cable.length} m • {cable.cableType}
                          </text>
                        </>
                      ) : (
                        <>
                          {/* Length-Only Mode (#84) */}
                          <rect
                            x="-26"
                            y="-11"
                            width="52"
                            height="22"
                            rx="5"
                            fill="#0f172a"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            filter="url(#shadow)"
                          />
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="#38bdf8"
                            fontSize="10.5"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {cable.length} m
                          </text>
                        </>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Active drawing route in progress */}
            {cableDrawingRoute.length > 0 && (
              <g>
                <polyline
                  points={cableDrawingRoute
                    .map((p) => `${p.x * planW},${p.y * planH}`)
                    .join(' ')}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3.5"
                  strokeDasharray="6, 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {cableDrawingRoute.map((p, i) => (
                  <circle
                    key={`draw-pt-${i}`}
                    cx={p.x * planW}
                    cy={p.y * planH}
                    r={5}
                    fill="#4f46e5"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                ))}
              </g>
            )}
          </svg>
        )}

        {/* Layer 4: Interactive HTML Overlays (MDF, IDF, AP, Signal Markers) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* MDF SERVER CABINET MARKERS (#56, #59, #68, #128, #136) */}
          {visibility.showMdf &&
            mdfDevices.map((mdf) => {
              if (!mdf?.position || typeof mdf.position.x !== 'number') return null;
              const posX = mdf.position.x * planW;
              const posY = mdf.position.y * planH;

              const mdfApp = mdf.appearance || appearanceSettings?.defaultMdf || {};
              const MdfIcon = getMdfIconComponent(mdfApp.iconStyle);
              const iconBoxSize = mdfApp.iconSize || 40;
              const iconGraphicSize = Math.round(iconBoxSize * 0.52);
              const labelTextSize = mdfApp.textSize || 11;
              const subTextSize = Math.max(7.5, labelTextSize - 2.5);
              const accentColor = mdfApp.iconColor || '#60a5fa';
              const outlineColor = mdfApp.borderColor || '#60a5fa';

              return (
                <div
                  key={mdf.id}
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onPointerDown={(e) => handleMarkerDragStart(e, 'mdf', mdf.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'delete') {
                      onDeleteMdf(mdf.id);
                    } else if (activeTool === 'add-cable') {
                      handleDeviceClickForCable(mdf.position, mdf.id);
                    } else {
                      onSelectMdf(mdf);
                    }
                  }}
                  className="interactive-marker group absolute pointer-events-auto flex flex-col items-center cursor-pointer select-none"
                >
                  <div
                    style={{
                      width: `${iconBoxSize}px`,
                      height: `${iconBoxSize}px`,
                      borderColor: outlineColor,
                    }}
                    className="relative flex items-center justify-center rounded-xl bg-slate-900 border-2 text-white shadow-xl group-hover:scale-110 transition-transform"
                  >
                    <MdfIcon
                      style={{ width: `${iconGraphicSize}px`, height: `${iconGraphicSize}px`, color: accentColor }}
                    />
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>

                  <div
                    style={{ borderColor: `${outlineColor}99` }}
                    className="mt-1 flex flex-col items-center rounded bg-slate-950/90 backdrop-blur-xs px-2 py-0.5 border shadow-md text-center"
                  >
                    <span
                      style={{ fontSize: `${labelTextSize}px` }}
                      className="font-black font-mono tracking-wider text-white leading-tight"
                    >
                      {mdf.id}
                    </span>
                    <span
                      style={{ fontSize: `${subTextSize}px`, color: accentColor }}
                      className="font-extrabold tracking-tight uppercase leading-none"
                    >
                      SERVER CABINET
                    </span>
                  </div>
                </div>
              );
            })}

          {/* IDF SWITCH HUB MARKERS (#57, #60, #69, #128, #137) */}
          {visibility.showIdf &&
            idfDevices.map((idf) => {
              if (!idf?.position || typeof idf.position.x !== 'number') return null;
              const posX = idf.position.x * planW;
              const posY = idf.position.y * planH;

              const idfApp = idf.appearance || appearanceSettings?.defaultIdf || {};
              const IdfIcon = getIdfIconComponent(idfApp.iconStyle);
              const iconBoxSize = idfApp.iconSize || 36;
              const iconGraphicSize = Math.round(iconBoxSize * 0.52);
              const labelTextSize = idfApp.textSize || 11;
              const subTextSize = Math.max(7, labelTextSize - 3);
              const accentColor = idfApp.iconColor || '#2dd4bf';
              const outlineColor = idfApp.borderColor || '#2dd4bf';

              return (
                <div
                  key={idf.id}
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onPointerDown={(e) => handleMarkerDragStart(e, 'idf', idf.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'delete') {
                      onDeleteIdf(idf.id);
                    } else if (activeTool === 'add-cable') {
                      handleDeviceClickForCable(idf.position, idf.id);
                    } else {
                      onSelectIdf(idf);
                    }
                  }}
                  className="interactive-marker group absolute pointer-events-auto flex flex-col items-center cursor-pointer select-none"
                >
                  <div
                    style={{
                      width: `${iconBoxSize}px`,
                      height: `${iconBoxSize}px`,
                      borderColor: outlineColor,
                    }}
                    className="relative flex items-center justify-center rounded-xl bg-teal-950 border-2 text-white shadow-xl group-hover:scale-110 transition-transform"
                  >
                    <IdfIcon
                      style={{ width: `${iconGraphicSize}px`, height: `${iconGraphicSize}px`, color: accentColor }}
                    />
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-teal-300" />
                  </div>

                  <div
                    style={{ borderColor: `${outlineColor}99` }}
                    className="mt-1 flex flex-col items-center rounded bg-teal-950/90 backdrop-blur-xs px-2 py-0.5 border shadow-md text-center"
                  >
                    <span
                      style={{ fontSize: `${labelTextSize}px` }}
                      className="font-black font-mono tracking-wider text-white leading-tight"
                    >
                      {idf.id}
                    </span>
                    <span
                      style={{ fontSize: `${subTextSize}px`, color: accentColor }}
                      className="font-extrabold tracking-tight uppercase leading-none"
                    >
                      SWITCH HUB
                    </span>
                    <span
                      style={{ fontSize: `${Math.max(6.5, subTextSize - 1)}px`, color: accentColor }}
                      className="font-semibold tracking-tight uppercase leading-none"
                    >
                      {idf.area || 'SELLING AREA'}
                    </span>
                  </div>
                </div>
              );
            })}

          {/* ACCESS POINT MARKERS (#18, #19, #128, #138) */}
          {visibility.showAps &&
            accessPoints.map((ap) => {
              if (!ap?.position || typeof ap.position.x !== 'number') return null;
              const posX = ap.position.x * planW;
              const posY = ap.position.y * planH;

              const apApp = ap.appearance || appearanceSettings?.defaultAp || {};
              const ApIcon = getApIconComponent(apApp.iconStyle);
              const iconBoxSize = apApp.iconSize || 32;
              const iconGraphicSize = Math.round(iconBoxSize * 0.52);
              const labelTextSize = apApp.textSize || 11;
              const accentColor = apApp.iconColor || '#10b981';
              const outlineColor = apApp.borderColor || '#ffffff';

              return (
                <div
                  key={ap.id}
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onPointerDown={(e) => handleMarkerDragStart(e, 'ap', ap.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'delete') {
                      onDeleteAp(ap.id);
                    } else if (activeTool === 'add-cable') {
                      handleDeviceClickForCable(ap.position, ap.id);
                    } else {
                      onSelectAp(ap);
                    }
                  }}
                  className="interactive-marker group absolute pointer-events-auto flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <div
                    style={{
                      width: `${iconBoxSize}px`,
                      height: `${iconBoxSize}px`,
                      backgroundColor: accentColor,
                      borderColor: outlineColor,
                    }}
                    className="flex items-center justify-center rounded-full border-2 text-white shadow-lg group-hover:scale-110 transition-transform"
                  >
                    <ApIcon style={{ width: `${iconGraphicSize}px`, height: `${iconGraphicSize}px` }} />
                  </div>

                  <div
                    style={{ fontSize: `${labelTextSize}px` }}
                    className="rounded-md bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 border border-white/30 text-white font-mono font-bold shadow-md"
                  >
                    {ap.id}
                  </div>
                </div>
              );
            })}

          {/* WIFI SIGNAL READINGS (Black number + 3-state WiFi icon) */}
          {(visibility.showSignalValues || visibility.showWifiBars) &&
            signalReadings.map((sig) => {
              if (!sig?.position || typeof sig.position.x !== 'number') return null;
              const posX = sig.position.x * planW;
              const posY = sig.position.y * planH;

              const sigApp = sig.appearance || appearanceSettings?.defaultSignal || {};
              const textSize = sigApp.textSize || 12;
              const iconSize = sigApp.iconSize || 17;
              const textColor = sigApp.textColor || '#000000';

              return (
                <div
                  key={sig.id}
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onPointerDown={(e) => handleMarkerDragStart(e, 'signal', sig.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'delete') {
                      onDeleteSignal(sig.id);
                    } else {
                      onSelectSignal(sig);
                    }
                  }}
                  className="interactive-marker group absolute pointer-events-auto flex items-center gap-1 cursor-pointer select-none rounded-md bg-white/95 backdrop-blur-xs px-1.5 py-0.5 border border-slate-300 shadow-md hover:scale-110 hover:border-slate-400 transition-all"
                >
                  {/* Original Black Signal Number */}
                  {visibility.showSignalValues && (
                    <span
                      style={{ fontSize: `${textSize}px`, color: textColor }}
                      className="font-black font-mono leading-none"
                    >
                      {sig.signal}
                    </span>
                  )}

                  {/* Professional WiFi Signal Icon beside number */}
                  {visibility.showWifiBars && (
                    <WifiSignalIcon
                      bars={sig.bars}
                      size={iconSize}
                      activeColor={
                        sig.bars === 3 ? '#16a34a' : sig.bars === 2 ? '#ca8a04' : '#dc2626'
                      }
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
