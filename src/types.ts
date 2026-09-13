/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CableType = 'CAT5e' | 'CAT6' | 'CAT6A' | 'Fiber' | 'Other';

export interface Position {
  x: number; // Normalized coordinate 0.0 to 1.0 (relative to floor plan width)
  y: number; // Normalized coordinate 0.0 to 1.0 (relative to floor plan height)
}

export type CableLineStyle = 'solid' | 'dashed' | 'dotted';
export type CableThickness = 'thin' | 'medium' | 'thick';
export type CableArrowDirection = 'none' | 'from-to' | 'both';
export type WifiIconStyle = 'bars' | 'curved' | 'dots';

export interface ItemAppearance {
  textSize?: number; // 8 - 72 px
  iconSize?: number; // 16 - 80 px
  iconColor?: string; // HEX color code
  borderColor?: string; // HEX
  borderWidth?: number; // 0 - 6 px
  textColor?: string; // HEX
  bgColor?: string; // HEX
  bgOpacity?: number; // 0 - 100 %
  textOutline?: boolean;
  textShadow?: boolean;
  iconStyle?: string; // Icon identifier
  // For cables:
  lineColor?: string;
  lineStyle?: CableLineStyle;
  lineThickness?: CableThickness;
  arrowDirection?: CableArrowDirection;
}

export interface AppearanceSettings {
  defaultMdf: ItemAppearance;
  defaultIdf: ItemAppearance;
  defaultAp: ItemAppearance;
  defaultCable: ItemAppearance;
  defaultSignal: ItemAppearance;
  wifiIconStyle: WifiIconStyle;
}

export interface MDFDevice {
  id: string; // e.g. "MDF-01"
  type: 'Server Cabinet';
  location: string; // e.g. "Server Room"
  description: string; // e.g. "Main Server Cabinet"
  position: Position;
  notes?: string;
  appearance?: ItemAppearance;
}

export interface IDFDevice {
  id: string; // e.g. "IDF-01"
  type: 'Switch Hub';
  area: string; // e.g. "Selling Area"
  location: string; // e.g. "Selling Area"
  description: string; // e.g. "Switch Hub for Selling Area"
  position: Position;
  notes?: string;
  appearance?: ItemAppearance;
}

export interface AccessPoint {
  id: string; // e.g. "AP-01"
  name: string; // e.g. "Wireless Access Point"
  location: string; // e.g. "Sales Area"
  ssid: string; // e.g. "STORE-WIFI"
  position: Position;
  notes?: string;
  appearance?: ItemAppearance;
}

export interface SignalReading {
  id: string;
  signal: number; // 0 to 100
  bars: 1 | 2 | 3;
  classification: 'Excellent / Strong' | 'Good / Moderate' | 'Weak';
  position: Position;
  location?: string;
  notes?: string;
  appearance?: ItemAppearance;
}

export interface LanCableRoutePoint {
  x: number;
  y: number;
}

export interface LanCable {
  id: string; // e.g. "LAN-01"
  fromId: string; // Device ID or 'Custom-Point'
  fromName: string; // e.g. "MDF-01 (Server Cabinet)"
  toId: string; // Device ID or 'Custom-Point'
  toName: string; // e.g. "IDF-01 (Selling Area)"
  length: number; // in meters (user manual or accepted estimate)
  unit: 'meters';
  cableType: CableType;
  route: LanCableRoutePoint[]; // Normalized coordinates array from start to end including waypoints
  notes?: string;
  isEstimated?: boolean;
  labelOffset?: { x: number; y: number }; // User reposition offset in canvas pixels
  appearance?: ItemAppearance;
}

export interface FloorPlanDocument {
  type: 'image' | 'pdf';
  backgroundDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  sourceName: string;
  selectedPage?: number;
  totalPages?: number;
}

export interface FloorScale {
  isCalibrated: boolean;
  pixelDistance: number; // distance between two reference points in canvas pixel space
  realMeters: number; // user specified distance in meters
  metersPerPixel: number; // calculated: realMeters / pixelDistance
}

export interface StoreInfo {
  storeName: string;
  storeCode: string;
  location: string;
  floorArea: string;
  assessmentDate: string;
  preparedBy: string; // Created By / IT Technician name
  technicianPosition?: string; // e.g. "IT Technician"
  dateCreated?: string; // Persistent initial creation date
  timeCreated?: string; // Persistent initial creation time
  lastModified?: string; // Updated on each save
  remarks?: string;
}

export type OverallHitmapStatus = 'EXCELLENT' | 'GOOD' | 'NEEDS ATTENTION' | 'INSUFFICIENT DATA';

export interface SignalAnalysisData {
  totalReadings: number;
  strongCount: number;
  moderateCount: number;
  weakCount: number;
  strongPercent: number;
  moderatePercent: number;
  weakPercent: number;
  averageSignal: number;
  overallStatus: OverallHitmapStatus;
  statusDescription: string;
}

export interface NetworkSummaryData {
  mdfCount: number;
  idfCount: number;
  apCount: number;
  cableCount: number;
  totalRecordedCableLength: number;
  hasIncompleteCableLengths: boolean;
  incompleteCableCount: number;
  cableTypesBreakdown: Record<string, number>;
}

export interface HitmapInsights {
  hasSufficientData: boolean;
  signalAnalysis: SignalAnalysisData;
  networkSummary: NetworkSummaryData;
  observations: string[];
  recommendations: string[];
  keyFindings: { type: 'success' | 'warning' | 'info'; text: string }[];
  finalAssessmentText: string;
  generatedAt: string;
}

export interface VisibilitySettings {
  showMdf: boolean;
  showIdf: boolean;
  showAps: boolean;
  showLanCables: boolean;
  showLanLengths: boolean;
  showSignalValues: boolean;
  showWifiBars: boolean;
  showHeatmap: boolean;
  showLegend: boolean;
  showCableBadges: boolean;
  cableLabelMode: 'full' | 'length-only' | 'hidden';
}

export type ActiveTool =
  | 'select'
  | 'add-mdf'
  | 'add-idf'
  | 'add-ap'
  | 'add-signal'
  | 'add-cable'
  | 'calibrate-scale'
  | 'delete';

export interface ProjectData {
  version: string;
  storeInfo: StoreInfo;
  floorPlan: FloorPlanDocument | null;
  floorScale: FloorScale;
  mdfDevices: MDFDevice[];
  idfDevices: IDFDevice[];
  accessPoints: AccessPoint[];
  signalReadings: SignalReading[];
  lanCables: LanCable[];
  visibility: VisibilitySettings;
  zoom: number;
  pan: { x: number; y: number };
  savedAt: string;
  appearanceSettings?: AppearanceSettings;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  defaultMdf: {
    textSize: 11,
    iconSize: 40,
    iconColor: '#3b82f6', // blue-500
    borderColor: '#60a5fa', // blue-400
    borderWidth: 2,
    textColor: '#ffffff',
    bgColor: '#020617', // slate-950
    bgOpacity: 90,
    iconStyle: 'server-rack',
    textOutline: false,
    textShadow: true,
  },
  defaultIdf: {
    textSize: 11,
    iconSize: 36,
    iconColor: '#14b8a6', // teal-500
    borderColor: '#2dd4bf', // teal-400
    borderWidth: 2,
    textColor: '#ffffff',
    bgColor: '#042f2e', // teal-950
    bgOpacity: 90,
    iconStyle: 'network-switch',
    textOutline: false,
    textShadow: true,
  },
  defaultAp: {
    textSize: 11,
    iconSize: 32,
    iconColor: '#10b981', // emerald-500
    borderColor: '#ffffff',
    borderWidth: 2,
    textColor: '#ffffff',
    bgColor: '#0f172a', // slate-900
    bgOpacity: 90,
    iconStyle: 'standard-ap',
    textOutline: false,
    textShadow: true,
  },
  defaultCable: {
    textSize: 10,
    iconSize: 20,
    lineColor: '#2563eb', // blue-600
    lineStyle: 'solid',
    lineThickness: 'medium',
    arrowDirection: 'none',
    textColor: '#38bdf8',
    bgColor: '#0f172a',
    bgOpacity: 95,
  },
  defaultSignal: {
    textSize: 12,
    iconSize: 18,
    textColor: '#000000',
    bgColor: '#ffffff',
    bgOpacity: 95,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  wifiIconStyle: 'bars',
};
