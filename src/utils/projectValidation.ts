/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProjectData,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  LanCableRoutePoint,
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  sanitizedData: ProjectData;
  warnings: string[];
  error?: string;
}

/**
 * Validates and sanitizes ProjectData before saving.
 * Fixes undefined coordinates, invalid markers, and missing routes so saving never fails silently or corrupts.
 */
export function validateAndSanitizeProject(data: ProjectData): ValidationResult {
  const warnings: string[] = [];

  try {
    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        sanitizedData: data,
        warnings,
        error: 'Project data is empty or invalid.',
      };
    }

    // Clone data to avoid mutating references directly
    const sanitized: ProjectData = JSON.parse(JSON.stringify(data));

    // 1. Sanitize Store Info
    if (!sanitized.storeInfo) {
      sanitized.storeInfo = {
        storeName: 'Survey Project',
        storeCode: 'STORE-01',
        location: 'Default Location',
        floorArea: '450 sq.m',
        assessmentDate: new Date().toISOString().split('T')[0],
        preparedBy: 'Field Technician',
      };
      warnings.push('Default store information was populated.');
    }

    // 2. Validate & Sanitize MDF Devices
    sanitized.mdfDevices = (sanitized.mdfDevices || []).map((mdf, idx) => {
      const validX = typeof mdf.position?.x === 'number' && !isNaN(mdf.position.x)
        ? Math.max(0, Math.min(1, mdf.position.x))
        : 0.1 + (idx * 0.05) % 0.8;
      const validY = typeof mdf.position?.y === 'number' && !isNaN(mdf.position.y)
        ? Math.max(0, Math.min(1, mdf.position.y))
        : 0.1 + (idx * 0.05) % 0.8;

      if (!mdf.position || typeof mdf.position.x !== 'number') {
        warnings.push(`MDF "${mdf.id || idx}" coordinates were repaired.`);
      }

      return {
        ...mdf,
        id: mdf.id || `MDF-${String(idx + 1).padStart(2, '0')}`,
        type: 'Server Cabinet' as const,
        location: mdf.location || 'Server Room',
        description: mdf.description || 'Main Server Cabinet',
        position: { x: validX, y: validY },
      };
    });

    // 3. Validate & Sanitize IDF Devices
    sanitized.idfDevices = (sanitized.idfDevices || []).map((idf, idx) => {
      const validX = typeof idf.position?.x === 'number' && !isNaN(idf.position.x)
        ? Math.max(0, Math.min(1, idf.position.x))
        : 0.2 + (idx * 0.05) % 0.8;
      const validY = typeof idf.position?.y === 'number' && !isNaN(idf.position.y)
        ? Math.max(0, Math.min(1, idf.position.y))
        : 0.2 + (idx * 0.05) % 0.8;

      if (!idf.position || typeof idf.position.x !== 'number') {
        warnings.push(`IDF "${idf.id || idx}" coordinates were repaired.`);
      }

      return {
        ...idf,
        id: idf.id || `IDF-${String(idx + 1).padStart(2, '0')}`,
        type: 'Switch Hub' as const,
        area: idf.area || 'Selling Area',
        location: idf.location || 'Selling Area',
        description: idf.description || 'Switch Hub',
        position: { x: validX, y: validY },
      };
    });

    // 4. Validate & Sanitize Access Points
    sanitized.accessPoints = (sanitized.accessPoints || []).map((ap, idx) => {
      const validX = typeof ap.position?.x === 'number' && !isNaN(ap.position.x)
        ? Math.max(0, Math.min(1, ap.position.x))
        : 0.3 + (idx * 0.05) % 0.8;
      const validY = typeof ap.position?.y === 'number' && !isNaN(ap.position.y)
        ? Math.max(0, Math.min(1, ap.position.y))
        : 0.3 + (idx * 0.05) % 0.8;

      if (!ap.position || typeof ap.position.x !== 'number') {
        warnings.push(`AP "${ap.id || idx}" coordinates were repaired.`);
      }

      return {
        ...ap,
        id: ap.id || `AP-${String(idx + 1).padStart(2, '0')}`,
        name: ap.name || 'Wireless Access Point',
        location: ap.location || 'Store Floor',
        ssid: ap.ssid || 'STORE-WIFI',
        position: { x: validX, y: validY },
      };
    });

    // 5. Validate & Sanitize Signal Readings
    sanitized.signalReadings = (sanitized.signalReadings || []).map((sig, idx) => {
      const validX = typeof sig.position?.x === 'number' && !isNaN(sig.position.x)
        ? Math.max(0, Math.min(1, sig.position.x))
        : 0.4 + (idx * 0.05) % 0.8;
      const validY = typeof sig.position?.y === 'number' && !isNaN(sig.position.y)
        ? Math.max(0, Math.min(1, sig.position.y))
        : 0.4 + (idx * 0.05) % 0.8;

      const rawSignal = typeof sig.signal === 'number' ? Math.round(sig.signal) : 75;
      const signal = Math.max(0, Math.min(100, rawSignal));
      const bars: 1 | 2 | 3 = signal >= 81 ? 3 : signal >= 40 ? 2 : 1;
      const classification =
        bars === 3
          ? 'Excellent / Strong'
          : bars === 2
          ? 'Good / Moderate'
          : 'Weak';

      const dbm = typeof sig.dbm === 'number' && !isNaN(sig.dbm) ? sig.dbm : undefined;
      const speedMbps = typeof sig.speedMbps === 'number' && !isNaN(sig.speedMbps) ? sig.speedMbps : undefined;

      return {
        ...sig,
        id: sig.id || `SIG-${idx + 1}`,
        signal,
        bars,
        classification,
        position: { x: validX, y: validY },
        dbm,
        speedMbps,
      };
    });

    // Device map to help resolve cable routes if missing
    const allDevicePos = new Map<string, { x: number; y: number }>();
    sanitized.mdfDevices.forEach((d) => allDevicePos.set(d.id, d.position));
    sanitized.idfDevices.forEach((d) => allDevicePos.set(d.id, d.position));
    sanitized.accessPoints.forEach((d) => allDevicePos.set(d.id, d.position));

    // 6. Validate & Sanitize LAN Cables
    sanitized.lanCables = (sanitized.lanCables || []).map((cable, idx) => {
      let route: LanCableRoutePoint[] = Array.isArray(cable.route) ? [...cable.route] : [];

      // Ensure all points in route have numeric coordinates
      route = route.filter(
        (p) => typeof p?.x === 'number' && !isNaN(p.x) && typeof p?.y === 'number' && !isNaN(p.y)
      );

      // If route has fewer than 2 points, auto-construct direct line between devices if known
      if (route.length < 2) {
        const pStart = allDevicePos.get(cable.fromId);
        const pEnd = allDevicePos.get(cable.toId);
        if (pStart && pEnd) {
          route = [{ x: pStart.x, y: pStart.y }, { x: pEnd.x, y: pEnd.y }];
          warnings.push(`LAN cable "${cable.id}" route was auto-connected directly.`);
        } else {
          // Default fallback line
          route = [
            { x: 0.2, y: 0.2 + idx * 0.05 },
            { x: 0.6, y: 0.2 + idx * 0.05 },
          ];
        }
      }

      const length = typeof cable.length === 'number' && !isNaN(cable.length) && cable.length > 0
        ? cable.length
        : 25;

      return {
        ...cable,
        id: cable.id || `LAN-${String(idx + 1).padStart(2, '0')}`,
        fromId: cable.fromId || 'MDF-01',
        fromName: cable.fromName || 'MDF-01',
        toId: cable.toId || 'IDF-01',
        toName: cable.toName || 'IDF-01',
        length,
        unit: 'meters' as const,
        cableType: cable.cableType || 'CAT6',
        route,
      };
    });

    // 7. Ensure zoom and pan are valid
    if (typeof sanitized.zoom !== 'number' || isNaN(sanitized.zoom) || sanitized.zoom <= 0) {
      sanitized.zoom = 1;
    }
    if (!sanitized.pan || typeof sanitized.pan.x !== 'number' || typeof sanitized.pan.y !== 'number') {
      sanitized.pan = { x: 0, y: 0 };
    }

    sanitized.savedAt = new Date().toISOString();

    return {
      isValid: true,
      sanitizedData: sanitized,
      warnings,
    };
  } catch (err: any) {
    return {
      isValid: false,
      sanitizedData: data,
      warnings,
      error: err?.message || 'Unexpected error during project data validation.',
    };
  }
}
