/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FloorPlanDocument,
  FloorScale,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  StoreInfo,
  VisibilitySettings,
  AppearanceSettings,
} from '../types';

export interface ProjectSnapshot {
  floorPlan: FloorPlanDocument | null;
  floorScale: FloorScale;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  storeInfo: StoreInfo;
  visibility: VisibilitySettings;
  appearanceSettings?: AppearanceSettings;
  label?: string;
  timestamp: number;
}

/**
 * Creates a clean serialized hash of the core functional project data
 * to track whether current workspace matches the last saved state.
 */
export function serializeProjectState(snapshot: ProjectSnapshot): string {
  try {
    return JSON.stringify({
      storeInfo: snapshot.storeInfo,
      floorPlanId: snapshot.floorPlan?.sourceName,
      floorPlanDims: snapshot.floorPlan ? { w: snapshot.floorPlan.originalWidth, h: snapshot.floorPlan.originalHeight } : null,
      floorScale: snapshot.floorScale,
      mdf: snapshot.mdfDevices.map((d) => ({ id: d.id, x: Math.round(d.position.x * 10000), y: Math.round(d.position.y * 10000), loc: d.location })),
      idf: snapshot.idfDevices.map((d) => ({ id: d.id, x: Math.round(d.position.x * 10000), y: Math.round(d.position.y * 10000), loc: d.location })),
      ap: snapshot.accessPoints.map((d) => ({ id: d.id, name: d.name, x: Math.round(d.position.x * 10000), y: Math.round(d.position.y * 10000) })),
      signals: snapshot.signalReadings.map((s) => ({ id: s.id, sig: s.signal, x: Math.round(s.position.x * 10000), y: Math.round(s.position.y * 10000) })),
      cables: snapshot.lanCables.map((c) => ({
        id: c.id,
        from: c.fromId,
        to: c.toId,
        len: c.length,
        type: c.cableType,
        points: c.route.map((p) => ({ x: Math.round(p.x * 10000), y: Math.round(p.y * 10000) })),
      })),
      visibility: snapshot.visibility,
      appearance: snapshot.appearanceSettings,
    });
  } catch (err) {
    return String(Date.now());
  }
}

export class HistoryManager {
  private stack: ProjectSnapshot[] = [];
  private pointer: number = -1;
  private readonly maxLimit: number = 60;
  private lastSavedHash: string = '';

  constructor(initialSnapshot?: ProjectSnapshot) {
    if (initialSnapshot) {
      this.init(initialSnapshot);
    }
  }

  public init(initialSnapshot: ProjectSnapshot) {
    const clone = JSON.parse(JSON.stringify(initialSnapshot));
    this.stack = [clone];
    this.pointer = 0;
    this.lastSavedHash = serializeProjectState(clone);
  }

  public push(snapshot: ProjectSnapshot, actionLabel?: string) {
    const clone: ProjectSnapshot = JSON.parse(JSON.stringify(snapshot));
    clone.label = actionLabel || 'Action';
    clone.timestamp = Date.now();

    // If we're not at the top of stack, discard redo forward branch (#30)
    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1);
    }

    // Append new snapshot
    this.stack.push(clone);

    // Limit maximum history entries (#32)
    if (this.stack.length > this.maxLimit) {
      this.stack.shift();
    }

    this.pointer = this.stack.length - 1;
  }

  public canUndo(): boolean {
    return this.pointer > 0;
  }

  public canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  public undo(): ProjectSnapshot | null {
    if (!this.canUndo()) return null;
    this.pointer -= 1;
    return JSON.parse(JSON.stringify(this.stack[this.pointer]));
  }

  public redo(): ProjectSnapshot | null {
    if (!this.canRedo()) return null;
    this.pointer += 1;
    return JSON.parse(JSON.stringify(this.stack[this.pointer]));
  }

  public markSaved(currentSnapshot: ProjectSnapshot) {
    this.lastSavedHash = serializeProjectState(currentSnapshot);
  }

  public isDirty(currentSnapshot: ProjectSnapshot): boolean {
    if (!this.lastSavedHash) return false;
    const currentHash = serializeProjectState(currentSnapshot);
    return currentHash !== this.lastSavedHash;
  }

  public getCurrent(): ProjectSnapshot | null {
    if (this.pointer >= 0 && this.pointer < this.stack.length) {
      return JSON.parse(JSON.stringify(this.stack[this.pointer]));
    }
    return null;
  }
}
