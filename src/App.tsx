/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
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
  StoreInfo,
  FloorScale,
  ProjectData,
  AppearanceSettings,
  DEFAULT_APPEARANCE_SETTINGS,
  ItemAppearance,
  DEFAULT_PRINT_CONFIG,
  PrintConfiguration,
} from './types';
import { loadPdfDocument, renderPdfPage } from './utils/pdfLoader';
import { generateSampleFloorPlan } from './utils/sampleFloorPlan';
import { estimateRouteLengthInMeters } from './utils/distanceCalc';
import { generateCompositePng } from './utils/exportComposite';
import { validateAndSanitizeProject } from './utils/projectValidation';
import { HistoryManager, ProjectSnapshot } from './utils/historyManager';

// Components
import { AppHeader } from './components/AppHeader';
import { Toolbar } from './components/Toolbar';
import { FloorPlanWorkspace } from './components/FloorPlanWorkspace';
import { FloorPlanLeftToolbar } from './components/FloorPlanLeftToolbar';
import { Sidebar, MainSidebarTab } from './components/Sidebar';
import { AppStatusBar } from './components/AppStatusBar';
import { PrintView } from './components/PrintView';

// Modals
import { MdfModal } from './components/Modals/MdfModal';
import { IdfModal } from './components/Modals/IdfModal';
import { ApModal } from './components/Modals/ApModal';
import { SignalModal } from './components/Modals/SignalModal';
import { GuidedLanCableModal } from './components/Modals/GuidedLanCableModal';
import { PrintModal } from './components/PrintModal';
import { PdfPageSelectModal } from './components/Modals/PdfPageSelectModal';
import { ScaleCalibrationModal } from './components/Modals/ScaleCalibrationModal';
import { StoreInfoModal } from './components/Modals/StoreInfoModal';
import { SaveAsModal } from './components/Modals/SaveAsModal';
import { UnsavedChangesModal } from './components/Modals/UnsavedChangesModal';
import { LoadErrorModal } from './components/Modals/LoadErrorModal';
import { ExportModal } from './components/Modals/ExportModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SupportModal } from './components/Modals/SupportModal';
import { ResetAllItemsModal } from './components/Modals/ResetAllItemsModal';
import { WhatsNewModal } from './components/Modals/WhatsNewModal';

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';

const STORAGE_KEY = 'store_wifi_hitmap_project';

export const App: React.FC = () => {
  // Welcome & Support UI States (#185, #191, #208)
  // Welcome UI MUST show on every startup, refresh, and reload (#208)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(true);
  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);
  const [resetAllModalOpen, setResetAllModalOpen] = useState<boolean>(false);
  const [whatsNewModalOpen, setWhatsNewModalOpen] = useState<boolean>(false);
  const [hasSavedProject, setHasSavedProject] = useState<boolean>(false);

  // Branch & Store Information (#184)
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    storeName: 'Downtown Flagship Branch',
    branchName: 'Downtown Flagship Branch',
    storeCode: 'BR-408',
    branchCode: 'BR-408',
    location: 'Building B, Ground Floor, Central Commercial Complex',
    floorArea: '1,450 sq. meters',
    assessmentDate: new Date().toISOString().split('T')[0],
    preparedBy: 'Field IT Infrastructure Engineer',
    position: 'IT Infrastructure Specialist',
    acknowledgedBy: 'Branch Operations Lead',
    acknowledgedPosition: 'Branch General Manager',
    remarks: 'Pre-deployment WiFi coverage assessment & LAN cable route planning.',
  });

  // Architectural Floor Plan Document (Image or PDF)
  const [floorPlan, setFloorPlan] = useState<FloorPlanDocument | null>(null);

  // Floor Scale Calibration (#54)
  const [floorScale, setFloorScale] = useState<FloorScale>({
    isCalibrated: true,
    pixelDistance: 240,
    realMeters: 10,
    metersPerPixel: 10 / 240, // 0.0416 meters per pixel
  });

  // Hardware and Measurements
  const [mdfDevices, setMdfDevices] = useState<MDFDevice[]>([]);
  const [idfDevices, setIdfDevices] = useState<IDFDevice[]>([]);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [signalReadings, setSignalReadings] = useState<SignalReading[]>([]);
  const [lanCables, setLanCables] = useState<LanCable[]>([]);

  // Active Tool & View
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Independent Visibility Settings (#65, #84)
  const [visibility, setVisibility] = useState<VisibilitySettings>({
    showMdf: true,
    showIdf: true,
    showAps: true,
    showLanCables: true,
    showLanLengths: true,
    showSignalValues: true,
    showWifiBars: true,
    showHeatmap: true,
    showLegend: true,
    showCableBadges: true,
    cableLabelMode: 'full',
  });

  // Cable drawing route in progress
  const [cableDrawingRoute, setCableDrawingRoute] = useState<LanCableRoutePoint[]>([]);

  // Redesigned Sidebar controls (#79, #86, #87, #371-#395)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [activeSidebarTab, setActiveSidebarTab] = useState<MainSidebarTab>('appearance');
  const [activeAppearanceCategory, setActiveAppearanceCategory] = useState<'mdf' | 'idf' | 'ap' | 'cable' | 'signal'>('mdf');

  // Left Vertical Toolbar state (#294-#304)
  const [isLeftToolbarCollapsed, setIsLeftToolbarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wifi_hitmap_left_toolbar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isLeftToolbarCompact, setIsLeftToolbarCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wifi_hitmap_left_toolbar_compact') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wifi_hitmap_left_toolbar_collapsed', String(isLeftToolbarCollapsed));
    } catch {}
  }, [isLeftToolbarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem('wifi_hitmap_left_toolbar_compact', String(isLeftToolbarCompact));
    } catch {}
  }, [isLeftToolbarCompact]);

  // Loading and error states
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Rendering Floor Plan...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hidden File input ref for upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Multi-page state
  const [pdfSelectOpen, setPdfSelectOpen] = useState(false);
  const [activePdfDoc, setActivePdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [activePdfName, setActivePdfName] = useState('');
  const [activePdfPages, setActivePdfPages] = useState(1);

  // Modals state
  const [mdfModalOpen, setMdfModalOpen] = useState(false);
  const [editingMdf, setEditingMdf] = useState<MDFDevice | null>(null);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  const [idfModalOpen, setIdfModalOpen] = useState(false);
  const [editingIdf, setEditingIdf] = useState<IDFDevice | null>(null);

  const [apModalOpen, setApModalOpen] = useState(false);
  const [editingAp, setEditingAp] = useState<AccessPoint | null>(null);

  const [signalModalOpen, setSignalModalOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState<SignalReading | null>(null);

  const [cableModalOpen, setCableModalOpen] = useState(false);
  const [editingCable, setEditingCable] = useState<LanCable | null>(null);
  const [pendingRoute, setPendingRoute] = useState<LanCableRoutePoint[]>([]);
  const [estimatedLength, setEstimatedLength] = useState<number>(0);

  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [storeInfoModalOpen, setStoreInfoModalOpen] = useState(false);

  // Saving & Feedback State (#99, #100, #101, #102)
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Print State & Modal (#103 - #108)
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printCompositeUrl, setPrintCompositeUrl] = useState<string>('');
  const [activePrintConfig, setActivePrintConfig] = useState<PrintConfiguration>(DEFAULT_PRINT_CONFIG);

  // Styling & Appearance Customization State (#120 - #140)
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE_SETTINGS);
  const [selectedItemForStyle, setSelectedItemForStyle] = useState<{
    type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal';
    id: string;
    name: string;
    appearance?: ItemAppearance;
  } | null>(null);

  // History, Dirty State & Persistence Tracking (#23, #30, #31, #32, #33)
  const historyManagerRef = useRef<HistoryManager>(new HistoryManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);

  // New Modals State (#17, #19, #20, #22, #38)
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);
  const [unsavedChangesPendingAction, setUnsavedChangesPendingAction] = useState<'load' | 'new' | null>(null);
  const [loadErrorModalOpen, setLoadErrorModalOpen] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalMode, setExportModalMode] = useState<'pdf' | 'png' | 'both'>('pdf');
  const [isExpandedWorkspace, setIsExpandedWorkspace] = useState(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fit calculation helper (#77, #78, #92, #94)
  const calculateFitZoom = useCallback(
    (plan: FloorPlanDocument | null, isSideOpen: boolean, sideWidth: number, isExpanded: boolean = false) => {
      if (!plan) return 1.0;
      const reservedWidth = isSideOpen ? sideWidth : 0;
      const availW = Math.max(300, window.innerWidth - reservedWidth - 48);
      const topOffset = (isExpanded ? 0 : 44) + 40 + 24 + 32;
      const availH = Math.max(200, window.innerHeight - topOffset);

      const scaleX = availW / plan.originalWidth;
      const scaleY = availH / plan.originalHeight;
      const fitScale = Math.min(scaleX, scaleY);
      return Math.max(0.2, Math.min(3.0, Math.round(fitScale * 100) / 100));
    },
    []
  );

  const handleFitFloorPlan = useCallback(() => {
    if (!floorPlan) return;
    const fitZoom = calculateFitZoom(floorPlan, sidebarOpen, sidebarWidth, isExpandedWorkspace);
    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  }, [floorPlan, sidebarOpen, sidebarWidth, isExpandedWorkspace, calculateFitZoom]);

  const handleCenterFloorPlan = useCallback(() => {
    setPan({ x: 0, y: 0 });
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Snapshot builder for History and Persistence (#23, #30, #31, #32, #33)
  const buildCurrentSnapshot = useCallback(
    (overrides?: Partial<ProjectSnapshot>): ProjectSnapshot => ({
      floorPlan,
      floorScale,
      mdfDevices,
      idfDevices,
      accessPoints,
      signalReadings,
      lanCables,
      storeInfo,
      visibility,
      appearanceSettings,
      timestamp: Date.now(),
      ...overrides,
    }),
    [
      floorPlan,
      floorScale,
      mdfDevices,
      idfDevices,
      accessPoints,
      signalReadings,
      lanCables,
      storeInfo,
      visibility,
      appearanceSettings,
    ]
  );

  const recordHistoryAction = useCallback(
    (actionLabel: string, updatedState?: Partial<ProjectSnapshot>) => {
      const snap = buildCurrentSnapshot(updatedState);
      historyManagerRef.current.push(snap, actionLabel);
      setCanUndo(historyManagerRef.current.canUndo());
      setCanRedo(historyManagerRef.current.canRedo());
      setIsDirty(true);
      isDirtyRef.current = true;
    },
    [buildCurrentSnapshot]
  );

  const applySnapshot = useCallback((snap: ProjectSnapshot) => {
    if (snap.floorPlan !== undefined) setFloorPlan(snap.floorPlan);
    setFloorScale(snap.floorScale);
    setMdfDevices(snap.mdfDevices || []);
    setIdfDevices(snap.idfDevices || []);
    setAccessPoints(snap.accessPoints || []);
    setSignalReadings(snap.signalReadings || []);
    setLanCables(snap.lanCables || []);
    setStoreInfo(snap.storeInfo);
    setVisibility(snap.visibility);
    if (snap.appearanceSettings) {
      setAppearanceSettings(snap.appearanceSettings);
    }
  }, []);

  const handleUndo = useCallback(() => {
    const prev = historyManagerRef.current.undo();
    if (prev) {
      applySnapshot(prev);
      setCanUndo(historyManagerRef.current.canUndo());
      setCanRedo(historyManagerRef.current.canRedo());
      const dirty = historyManagerRef.current.isDirty(prev);
      setIsDirty(dirty);
      isDirtyRef.current = dirty;
    }
  }, [applySnapshot]);

  const handleRedo = useCallback(() => {
    const next = historyManagerRef.current.redo();
    if (next) {
      applySnapshot(next);
      setCanUndo(historyManagerRef.current.canUndo());
      setCanRedo(historyManagerRef.current.canRedo());
      const dirty = historyManagerRef.current.isDirty(next);
      setIsDirty(dirty);
      isDirtyRef.current = dirty;
    }
  }, [applySnapshot]);

  // Atomic history snapshot on drag release (#30, #31, #32)
  const handleDragEnd = useCallback(() => {
    recordHistoryAction('Move Device');
  }, [recordHistoryAction]);

  // Initialize: Load saved project and ensure Welcome UI shows on startup (#185, #191, #208, #209, #210)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ProjectData;
        if (parsed.floorPlan) {
          setHasSavedProject(true);
          setFloorPlan(parsed.floorPlan);
          const rawMdf = Array.isArray(parsed.mdfDevices) ? (parsed.mdfDevices as any[]).flat() : [];
          const rawIdf = Array.isArray(parsed.idfDevices) ? (parsed.idfDevices as any[]).flat() : [];
          setMdfDevices(rawMdf);
          setIdfDevices(rawIdf);
          setAccessPoints(parsed.accessPoints || []);
          setSignalReadings(parsed.signalReadings || []);
          setLanCables(parsed.lanCables || []);
          setFloorScale(parsed.floorScale || floorScale);
          setStoreInfo(parsed.storeInfo || storeInfo);
          if (parsed.visibility) {
            setVisibility({
              ...parsed.visibility,
              cableLabelMode: parsed.visibility.cableLabelMode || 'full',
            });
          }
          if (parsed.appearanceSettings) {
            setAppearanceSettings(parsed.appearanceSettings);
          }
          if (parsed.zoom) setZoom(parsed.zoom);
          if (parsed.pan) setPan(parsed.pan);

          const initialSnap: ProjectSnapshot = {
            floorPlan: parsed.floorPlan,
            floorScale: parsed.floorScale || floorScale,
            mdfDevices: rawMdf,
            idfDevices: rawIdf,
            accessPoints: parsed.accessPoints || [],
            signalReadings: parsed.signalReadings || [],
            lanCables: parsed.lanCables || [],
            storeInfo: parsed.storeInfo || storeInfo,
            visibility: parsed.visibility || visibility,
            appearanceSettings: parsed.appearanceSettings,
            timestamp: Date.now(),
          };
          historyManagerRef.current.init(initialSnap);
          setCanUndo(false);
          setCanRedo(false);
          setIsDirty(false);
          isDirtyRef.current = false;
        }
      } catch (err) {
        console.error('Failed to parse saved project data:', err);
      }
    }

    // Always keep Welcome UI active on initial app load / refresh (#208, #209)
    setShowWelcomeScreen(true);
  }, []);

  // Keyboard Shortcuts for Undo (Ctrl+Z), Redo (Ctrl+Y / Ctrl+Shift+Z), Save (Ctrl+S) (#33)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (modifier && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      } else if (modifier && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveProjectLocal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Unsaved Changes Protection on Browser Exit / Reload (#22)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'This project contains unsaved changes.';
        return 'This project contains unsaved changes.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Mark project dirty on user modifications (#102)
  useEffect(() => {
    isDirtyRef.current = true;
  }, [
    storeInfo,
    floorPlan,
    floorScale,
    mdfDevices,
    idfDevices,
    accessPoints,
    signalReadings,
    lanCables,
    visibility,
    appearanceSettings,
  ]);

  // Periodic Auto-Save Every 45s (#102: Prevent data loss)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDirtyRef.current || !floorPlan) return;
      const project: ProjectData = {
        version: '2.1.0',
        storeInfo,
        floorPlan,
        floorScale,
        mdfDevices,
        idfDevices,
        accessPoints,
        signalReadings,
        lanCables,
        visibility,
        appearanceSettings,
        zoom,
        pan,
        savedAt: new Date().toISOString(),
      };
      const validation = validateAndSanitizeProject(project);
      if (validation.isValid) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validation.sanitizedData));
          isDirtyRef.current = false;
        } catch {
          // ignore background auto-save storage full
        }
      }
    }, 45000);

    return () => clearInterval(timer);
  }, [
    storeInfo,
    floorPlan,
    floorScale,
    mdfDevices,
    idfDevices,
    accessPoints,
    signalReadings,
    lanCables,
    visibility,
    appearanceSettings,
    zoom,
    pan,
  ]);

  const loadSampleData = () => {
    const sample = generateSampleFloorPlan();
    setFloorPlan(sample.document);
    setMdfDevices(sample.sampleMdf);
    setIdfDevices(sample.sampleIdf);
    setAccessPoints(sample.sampleAps);
    setSignalReadings(sample.sampleSignals);
    setLanCables(sample.sampleCables);

    const initialSnap: ProjectSnapshot = {
      floorPlan: sample.document,
      floorScale,
      mdfDevices: sample.sampleMdf,
      idfDevices: sample.sampleIdf,
      accessPoints: sample.sampleAps,
      signalReadings: sample.sampleSignals,
      lanCables: sample.sampleCables,
      storeInfo,
      visibility,
      appearanceSettings,
      timestamp: Date.now(),
    };
    historyManagerRef.current.init(initialSnap);
    setCanUndo(false);
    setCanRedo(false);
    setIsDirty(false);
    isDirtyRef.current = false;

    // Calculate auto-fit zoom immediately (#77, #92)
    const fit = calculateFitZoom(sample.document, sidebarOpen, sidebarWidth);
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  };

  // Start fresh blank project (#15, #19, #22)
  const executeNewProject = () => {
    const blankStoreInfo: StoreInfo = {
      storeName: 'New Branch Survey',
      branchName: 'New Branch Survey',
      storeCode: 'BR-01',
      branchCode: 'BR-01',
      location: 'Branch Location',
      floorArea: '500 sq. meters',
      assessmentDate: new Date().toISOString().split('T')[0],
      preparedBy: 'IT Network Engineer',
      remarks: '',
    };
    setStoreInfo(blankStoreInfo);
    setFloorPlan(null);
    setMdfDevices([]);
    setIdfDevices([]);
    setAccessPoints([]);
    setSignalReadings([]);
    setLanCables([]);
    setCableDrawingRoute([]);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });

    const initialSnap: ProjectSnapshot = {
      floorPlan: null,
      floorScale,
      mdfDevices: [],
      idfDevices: [],
      accessPoints: [],
      signalReadings: [],
      lanCables: [],
      storeInfo: blankStoreInfo,
      visibility,
      appearanceSettings,
      timestamp: Date.now(),
    };
    historyManagerRef.current.init(initialSnap);
    setCanUndo(false);
    setCanRedo(false);
    setIsDirty(false);
    isDirtyRef.current = false;
    setSaveSuccessMessage('✓ Clean Project Initialized. Upload a floor plan to begin.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Reset All Items Functionality (#219 - #222)
  // Clears all MDF, IDF, APs, Readings, and Cables, but keeps floor plan, scale & branch info
  const handleConfirmResetAllItems = () => {
    setMdfDevices([]);
    setIdfDevices([]);
    setAccessPoints([]);
    setSignalReadings([]);
    setLanCables([]);
    setCableDrawingRoute([]);
    setEditingMdf(null);
    setEditingIdf(null);
    setEditingAp(null);
    setEditingSignal(null);
    setEditingCable(null);
    setResetAllModalOpen(false);

    recordHistoryAction('Reset All Items', {
      mdfDevices: [],
      idfDevices: [],
      accessPoints: [],
      signalReadings: [],
      lanCables: [],
    });

    setSaveSuccessMessage('✓ All floor plan items reset. Floor plan, scale, and branch info preserved.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleNewProjectClick = () => {
    if (isDirty) {
      setUnsavedChangesPendingAction('new');
      setUnsavedChangesModalOpen(true);
    } else {
      executeNewProject();
    }
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom((z) => Math.min(3.0, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.25, Math.round((z - 0.15) * 100) / 100));

  // Toggle sidebar (#86) with intelligent workspace update (#78)
  const handleToggleSidebar = () => {
    const nextState = !sidebarOpen;
    setSidebarOpen(nextState);
    if (floorPlan) {
      const nextZoom = calculateFitZoom(floorPlan, nextState, sidebarWidth, isExpandedWorkspace);
      setZoom(nextZoom);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleToggleExpandedWorkspace = () => {
    const nextExpanded = !isExpandedWorkspace;
    setIsExpandedWorkspace(nextExpanded);
    if (floorPlan) {
      const nextZoom = calculateFitZoom(floorPlan, sidebarOpen, sidebarWidth, nextExpanded);
      setZoom(nextZoom);
    }
  };

  // Resize sidebar (#87)
  const handleSidebarResize = (newWidth: number) => {
    setSidebarWidth(newWidth);
  };

  // File Upload Handling (Images & PDFs)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    e.target.value = '';
  };

  const processUploadedFile = async (file: File) => {
    setErrorMessage(null);
    const lowerName = file.name.toLowerCase();

    // 1. PDF Floor Plan Upload
    if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
      setIsLoadingPdf(true);
      setLoadingMessage('Reading and validating PDF document...');

      try {
        const docSummary = await loadPdfDocument(file);
        setActivePdfDoc(docSummary.pdfDoc);
        setActivePdfName(file.name);
        setActivePdfPages(docSummary.numPages);

        if (docSummary.numPages === 1) {
          // Single-page PDF workflow: automatically render page 1 at high-res scale=2.0
          setLoadingMessage('Rendering high-resolution floor plan (Page 1)...');
          const rendered = await renderPdfPage(docSummary.pdfDoc, 1, 2.0);

          const newDoc: FloorPlanDocument = {
            type: 'pdf',
            backgroundDataUrl: rendered.dataUrl,
            originalWidth: rendered.width,
            originalHeight: rendered.height,
            sourceName: file.name,
            selectedPage: 1,
            totalPages: 1,
          };
          setFloorPlan(newDoc);
          recordHistoryAction('Upload Floor Plan', { floorPlan: newDoc });

          // Auto-fit immediately (#77)
          const autoZoom = calculateFitZoom(newDoc, sidebarOpen, sidebarWidth);
          setZoom(autoZoom);
          setPan({ x: 0, y: 0 });
          setIsLoadingPdf(false);
        } else {
          // Multi-page PDF workflow: show page selector modal
          setIsLoadingPdf(false);
          setPdfSelectOpen(true);
        }
      } catch (err: unknown) {
        setIsLoadingPdf(false);
        const msg = err instanceof Error ? err.message : 'Failed to read PDF';
        setErrorMessage(msg);
      }
      return;
    }

    // 2. Standard Image Upload (PNG, JPG, JPEG)
    if (
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      file.type.startsWith('image/')
    ) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const newDoc: FloorPlanDocument = {
            type: 'image',
            backgroundDataUrl: dataUrl,
            originalWidth: img.naturalWidth || 1400,
            originalHeight: img.naturalHeight || 900,
            sourceName: file.name,
          };
          setFloorPlan(newDoc);
          recordHistoryAction('Upload Floor Plan', { floorPlan: newDoc });

          // Auto-fit immediately (#77)
          const autoZoom = calculateFitZoom(newDoc, sidebarOpen, sidebarWidth);
          setZoom(autoZoom);
          setPan({ x: 0, y: 0 });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      return;
    }

    setErrorMessage('Unsupported file format. Please upload a PNG, JPG, JPEG, or PDF floor plan.');
  };

  // Multi-page PDF page selection
  const handlePdfPageSelected = async (pageNumber: number) => {
    if (!activePdfDoc) return;
    setPdfSelectOpen(false);
    setIsLoadingPdf(true);
    setLoadingMessage(`Rendering Page ${pageNumber} of ${activePdfPages}...`);

    try {
      const rendered = await renderPdfPage(activePdfDoc, pageNumber, 2.0);
      const newDoc: FloorPlanDocument = {
        type: 'pdf',
        backgroundDataUrl: rendered.dataUrl,
        originalWidth: rendered.width,
        originalHeight: rendered.height,
        sourceName: activePdfName,
        selectedPage: pageNumber,
        totalPages: activePdfPages,
      };
      setFloorPlan(newDoc);
      recordHistoryAction(`Select PDF Page ${pageNumber}`, { floorPlan: newDoc });

      const autoZoom = calculateFitZoom(newDoc, sidebarOpen, sidebarWidth);
      setZoom(autoZoom);
      setPan({ x: 0, y: 0 });
    } catch (err) {
      setErrorMessage(`Failed to render PDF page ${pageNumber}.`);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Placement click on floor plan
  const handleAddPointClick = (normPos: { x: number; y: number }) => {
    setTargetPos(normPos);

    if (activeTool === 'add-mdf') {
      setEditingMdf(null);
      setMdfModalOpen(true);
    } else if (activeTool === 'add-idf') {
      setEditingIdf(null);
      setIdfModalOpen(true);
    } else if (activeTool === 'add-ap') {
      setEditingAp(null);
      setApModalOpen(true);
    } else if (activeTool === 'add-signal') {
      setEditingSignal(null);
      setSignalModalOpen(true);
    }
  };

  // Complete Cable drawing workflow
  const handleFinishCableDrawing = () => {
    if (cableDrawingRoute.length < 2) {
      setCableDrawingRoute([]);
      return;
    }

    const route = [...cableDrawingRoute];
    setPendingRoute(route);

    // Calculate optional estimated distance
    if (floorPlan) {
      const estimation = estimateRouteLengthInMeters(
        route,
        floorPlan.originalWidth,
        floorPlan.originalHeight,
        floorScale
      );
      setEstimatedLength(estimation.estimatedMeters);
    }

    setEditingCable(null);
    setCableModalOpen(true);
    setCableDrawingRoute([]);
    setActiveTool('select');
  };

  const handleCancelCableDrawing = () => {
    setCableDrawingRoute([]);
    setActiveTool('select');
  };

  // Global Keyboard Shortcuts (#306)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'a':
          setActiveTool('add-ap');
          break;
        case 'm':
          setActiveTool('add-mdf');
          break;
        case 'i':
          setActiveTool('add-idf');
          break;
        case 'r':
          setActiveTool('add-signal');
          break;
        case 'l':
        case 'c':
          setActiveTool('add-cable');
          break;
        case 's':
          setScaleModalOpen(true);
          break;
        case 'delete':
        case 'd':
          setActiveTool('delete');
          break;
        case 'escape':
          if (activeTool === 'delete') {
            setActiveTool('select');
          }
          if (cableDrawingRoute.length > 0) {
            handleCancelCableDrawing();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, cableDrawingRoute.length]);

  // Reposition cable label handler (#84)
  const handleUpdateCableLabelOffset = (cableId: string, offset: { x: number; y: number }) => {
    setLanCables((prev) =>
      prev.map((c) => (c.id === cableId ? { ...c, labelOffset: offset } : c))
    );
  };

  // Device list for cable dropdown selection
  const allDeviceOptions = [
    ...mdfDevices.map((d) => ({
      id: d.id,
      name: `${d.id} — ${d.description || 'Server Cabinet'} (${d.location})`,
      type: 'MDF' as const,
    })),
    ...idfDevices.map((d) => ({
      id: d.id,
      name: `${d.id} — Switch Hub (${d.location})`,
      type: 'IDF' as const,
    })),
    ...accessPoints.map((d) => ({
      id: d.id,
      name: `${d.id} — ${d.name} (${d.location})`,
      type: 'AP' as const,
    })),
  ];

  // Save / Load Project in LocalStorage (#99, #100, #101, #102)
  const handleSaveProjectLocal = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    // Provide visual feedback for saving progress
    await new Promise((resolve) => setTimeout(resolve, 350));

    const updatedStoreInfo: StoreInfo = {
      ...storeInfo,
      lastModified: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
    setStoreInfo(updatedStoreInfo);

    const rawProject: ProjectData = {
      version: '2.1.0',
      storeInfo: updatedStoreInfo,
      floorPlan,
      floorScale,
      mdfDevices,
      idfDevices,
      accessPoints,
      signalReadings,
      lanCables,
      visibility,
      appearanceSettings,
      zoom,
      pan,
      savedAt: new Date().toISOString(),
    };

    const validation = validateAndSanitizeProject(rawProject);
    if (!validation.isValid || !validation.sanitizedData) {
      setIsSaving(false);
      setSaveStatus('error');
      setSaveErrorMessage(`✕ Unable to Save Project - Reason: ${validation.error || 'Data validation failed'}`);
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validation.sanitizedData));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(now);
      setIsSaving(false);
      setSaveStatus('saved');
      setSaveSuccessMessage(`✓ Project Saved Successfully (${now})`);
      
      const snap = buildCurrentSnapshot({ storeInfo: updatedStoreInfo });
      historyManagerRef.current.markSaved(snap);
      setIsDirty(false);
      isDirtyRef.current = false;

      // Auto revert save status icon after 4s
      setTimeout(() => {
        setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 4000);
    } catch (e: any) {
      setIsSaving(false);
      setSaveStatus('error');
      const isQuota = e?.name === 'QuotaExceededError' || e?.code === 22;
      const reason = isQuota
        ? 'Browser storage quota exceeded. The uploaded floor plan is large; please use Save As or Export Project JSON for backup.'
        : e?.message || 'Storage write failed';
      setSaveErrorMessage(`✕ Unable to Save Project - Reason: ${reason}`);
    }
  };

  // Save As Project (#17, #18)
  const handleConfirmSaveAs = (projectName: string, fileName: string) => {
    const updatedStoreInfo: StoreInfo = {
      ...storeInfo,
      storeName: projectName,
      lastModified: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
    setStoreInfo(updatedStoreInfo);

    const rawProject: ProjectData = {
      version: '2.1.0',
      storeInfo: updatedStoreInfo,
      floorPlan,
      floorScale,
      mdfDevices,
      idfDevices,
      accessPoints,
      signalReadings,
      lanCables,
      visibility,
      appearanceSettings,
      zoom,
      pan,
      savedAt: new Date().toISOString(),
    };

    const validation = validateAndSanitizeProject(rawProject);
    if (!validation.isValid || !validation.sanitizedData) {
      setErrorMessage(`Unable to Save As: ${validation.error || 'Validation error'}`);
      return;
    }

    const jsonStr = JSON.stringify(validation.sanitizedData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validation.sanitizedData));
    } catch {
      // ignore
    }

    const snap = buildCurrentSnapshot({ storeInfo: updatedStoreInfo });
    historyManagerRef.current.markSaved(snap);
    setIsDirty(false);
    isDirtyRef.current = false;
    setSaveSuccessMessage(`✓ Project Saved As "${fileName}"`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Load Project Trigger (#19, #20, #22)
  const handleLoadProjectClick = () => {
    if (isDirty) {
      setUnsavedChangesPendingAction('load');
      setUnsavedChangesModalOpen(true);
    } else {
      projectFileInputRef.current?.click();
    }
  };

  // Process selected project file (#20, #21)
  const handleProjectFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateAndSanitizeProject(parsed);
        if (!validation.isValid || !validation.sanitizedData) {
          setLoadErrorMessage(validation.error || 'The file structure is corrupted or missing essential properties.');
          setLoadErrorModalOpen(true);
          return;
        }

        const project = validation.sanitizedData;
        setStoreInfo(project.storeInfo);
        if (project.floorPlan) setFloorPlan(project.floorPlan);
        setFloorScale(project.floorScale);
        setMdfDevices(project.mdfDevices || []);
        setIdfDevices(project.idfDevices || []);
        setAccessPoints(project.accessPoints || []);
        setSignalReadings(project.signalReadings || []);
        setLanCables(project.lanCables || []);
        if (project.visibility) {
          setVisibility({
            ...project.visibility,
            cableLabelMode: project.visibility.cableLabelMode || 'full',
          });
        }
        if (project.appearanceSettings) {
          setAppearanceSettings(project.appearanceSettings);
        }
        if (project.zoom) setZoom(project.zoom);
        if (project.pan) setPan(project.pan);

        // Reset history stack with newly loaded project as base snapshot (#31, #32)
        const newSnapshot: ProjectSnapshot = {
          floorPlan: project.floorPlan,
          floorScale: project.floorScale,
          mdfDevices: project.mdfDevices || [],
          idfDevices: project.idfDevices || [],
          accessPoints: project.accessPoints || [],
          signalReadings: project.signalReadings || [],
          lanCables: project.lanCables || [],
          storeInfo: project.storeInfo,
          visibility: project.visibility,
          appearanceSettings: project.appearanceSettings,
          timestamp: Date.now(),
        };
        historyManagerRef.current.init(newSnapshot);
        setCanUndo(false);
        setCanRedo(false);
        setIsDirty(false);
        isDirtyRef.current = false;

        setSaveSuccessMessage(`✓ Project "${file.name}" Loaded Successfully`);
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      } catch (err: any) {
        setLoadErrorMessage(`File reading error: ${err?.message || 'Could not parse JSON project file.'}`);
        setLoadErrorModalOpen(true);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadProjectLocal = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setErrorMessage('No saved project found in local storage.');
      return;
    }
    try {
      const parsed = JSON.parse(saved) as ProjectData;
      setStoreInfo(parsed.storeInfo || storeInfo);
      if (parsed.floorPlan) setFloorPlan(parsed.floorPlan);
      setFloorScale(parsed.floorScale || floorScale);
      const rawMdf = Array.isArray(parsed.mdfDevices) ? (parsed.mdfDevices as any[]).flat() : [];
      const rawIdf = Array.isArray(parsed.idfDevices) ? (parsed.idfDevices as any[]).flat() : [];
      setMdfDevices(rawMdf);
      setIdfDevices(rawIdf);
      setAccessPoints(parsed.accessPoints || []);
      setSignalReadings(parsed.signalReadings || []);
      setLanCables(parsed.lanCables || []);
      if (parsed.visibility) {
        setVisibility({
          ...parsed.visibility,
          cableLabelMode: parsed.visibility.cableLabelMode || 'full',
        });
      }
      if (parsed.appearanceSettings) {
        setAppearanceSettings(parsed.appearanceSettings);
      }
      setZoom(parsed.zoom || 1.0);
      setPan(parsed.pan || { x: 0, y: 0 });
      setSaveSuccessMessage('✓ Project Loaded Successfully');
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    } catch (e) {
      setSaveErrorMessage('✕ Unable to Load Project - Corrupted storage format');
    }
  };

  // Export Project JSON
  const handleExportProjectJson = () => {
    const project: ProjectData = {
      version: '2.1.0',
      storeInfo,
      floorPlan,
      floorScale,
      mdfDevices,
      idfDevices,
      accessPoints,
      signalReadings,
      lanCables,
      visibility,
      appearanceSettings,
      zoom,
      pan,
      savedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(storeInfo.storeName || 'store-survey').toLowerCase().replace(/\s+/g, '-')}-project.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Project JSON
  const handleImportProjectJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as ProjectData;
        setStoreInfo(parsed.storeInfo || storeInfo);
        if (parsed.floorPlan) setFloorPlan(parsed.floorPlan);
        setFloorScale(parsed.floorScale || floorScale);
        const rawMdf = Array.isArray(parsed.mdfDevices) ? (parsed.mdfDevices as any[]).flat() : [];
        const rawIdf = Array.isArray(parsed.idfDevices) ? (parsed.idfDevices as any[]).flat() : [];
        setMdfDevices(rawMdf);
        setIdfDevices(rawIdf);
        setAccessPoints(parsed.accessPoints || []);
        setSignalReadings(parsed.signalReadings || []);
        setLanCables(parsed.lanCables || []);
        if (parsed.visibility) {
          setVisibility({
            ...parsed.visibility,
            cableLabelMode: parsed.visibility.cableLabelMode || 'full',
          });
        }
        if (parsed.appearanceSettings) {
          setAppearanceSettings(parsed.appearanceSettings);
        }
        setZoom(parsed.zoom || 1.0);
        setPan(parsed.pan || { x: 0, y: 0 });
        setSaveSuccessMessage('✓ Project JSON Imported Successfully');
        setTimeout(() => setSaveSuccessMessage(null), 3500);
      } catch (err) {
        setSaveErrorMessage('✕ Unable to Import - Invalid Project JSON format');
      }
    };
    reader.readAsText(file);
  };

  // Export High-Resolution PNG
  const handleExportPng = async () => {
    if (!floorPlan) {
      setErrorMessage('Please upload or load a floor plan first.');
      return;
    }
    try {
      const dataUrl = await generateCompositePng(
        floorPlan,
        mdfDevices,
        idfDevices,
        accessPoints,
        signalReadings,
        lanCables,
        visibility,
        storeInfo,
        appearanceSettings
      );
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${(storeInfo.storeName || 'wifi-hitmap').toLowerCase().replace(/\s+/g, '-')}-hitmap.png`;
      link.click();
    } catch (err) {
      console.error('Export PNG failed:', err);
      setErrorMessage('Failed to generate high-resolution PNG export.');
    }
  };

  // Print Report Handler (#103 - #108: Dedicated A4 Landscape Modal)
  const handlePrint = async () => {
    if (!floorPlan) {
      setErrorMessage('Please upload or load a floor plan first.');
      return;
    }
    setIsPreparingPrint(true);
    try {
      const dataUrl = await generateCompositePng(
        floorPlan,
        mdfDevices,
        idfDevices,
        accessPoints,
        signalReadings,
        lanCables,
        visibility,
        storeInfo,
        appearanceSettings
      );
      setPrintCompositeUrl(dataUrl);
      setPrintModalOpen(true);
    } catch (err) {
      console.error('Print composite generation failed:', err);
      // Fallback directly to print modal with backgroundDataUrl
      setPrintCompositeUrl(floorPlan.backgroundDataUrl);
      setPrintModalOpen(true);
    } finally {
      setIsPreparingPrint(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-100 font-sans">
      {/* Hidden File Input for Floor Plan Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
        className="hidden"
      />

      {/* Hidden File Input for .project file loading (#19, #20) */}
      <input
        type="file"
        ref={projectFileInputRef}
        onChange={handleProjectFileSelected}
        accept=".project,.json"
        className="hidden"
      />

      {/* Top Application Header (Can be collapsed in Expanded Workspace mode) */}
      {!isExpandedWorkspace && (
        <AppHeader
          storeInfo={storeInfo}
          onOpenStoreInfo={() => setStoreInfoModalOpen(true)}
          onOpenWelcome={() => setShowWelcomeScreen(true)}
          onSaveProject={handleSaveProjectLocal}
          onSaveAsProject={() => setSaveAsModalOpen(true)}
          isSaving={isSaving}
          saveStatus={saveStatus}
          isDirty={isDirty}
          onLoadProject={handleLoadProjectClick}
          onOpenExportModal={(mode) => {
            setExportModalMode(mode || 'pdf');
            setExportModalOpen(true);
          }}
          onExportPng={handleExportPng}
          onPrint={handlePrint}
          isPreparingPrint={isPreparingPrint}
          onOpenSupport={() => setSupportModalOpen(true)}
          onOpenWhatsNew={() => setWhatsNewModalOpen(true)}
        />
      )}

      {/* Main Professional Toolbar (#88, #89, #94, #99, #104) */}
      <div className="no-print shrink-0">
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onFitFloorPlan={handleFitFloorPlan}
          onCenterFloorPlan={handleCenterFloorPlan}
          onNewProject={handleNewProjectClick}
          onUploadClick={() => fileInputRef.current?.click()}
          onLoadSample={loadSampleData}
          onSaveProject={handleSaveProjectLocal}
          onSaveAsProject={() => setSaveAsModalOpen(true)}
          isSaving={isSaving}
          saveStatus={saveStatus}
          isDirty={isDirty}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onLoadProject={handleLoadProjectClick}
          onExportProjectJson={handleExportProjectJson}
          onImportProjectJson={handleImportProjectJson}
          onExportPng={handleExportPng}
          onOpenExportModal={(mode) => {
            setExportModalMode(mode || 'pdf');
            setExportModalOpen(true);
          }}
          onPrint={handlePrint}
          isPreparingPrint={isPreparingPrint}
          onOpenStoreInfo={() => setStoreInfoModalOpen(true)}
          onOpenScaleModal={() => setScaleModalOpen(true)}
          visibility={visibility}
          onVisibilityChange={(v) => {
            setVisibility(v);
            recordHistoryAction('Update Layer Visibility', { visibility: v });
          }}
          hasFloorPlan={!!floorPlan}
          activeCableDrawing={cableDrawingRoute.length > 0}
          onFinishCableDrawing={handleFinishCableDrawing}
          onCancelCableDrawing={handleCancelCableDrawing}
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onOpenWelcome={() => setShowWelcomeScreen(true)}
          onOpenSupport={() => setSupportModalOpen(true)}
          onResetAllItems={() => setResetAllModalOpen(true)}
          onOpenWhatsNew={() => setWhatsNewModalOpen(true)}
          isExpandedWorkspace={isExpandedWorkspace}
          onToggleExpandedWorkspace={handleToggleExpandedWorkspace}
        />
      </div>

      {/* Main View Area: Maximized Floor Plan Workspace + Collapsible/Resizable Sidebar (#76, #88) */}
      <div className="relative flex flex-1 w-full min-h-0 overflow-hidden no-print">
        {/* Success notification banner (#99, #101: ✓ Project Saved Successfully) */}
        {saveSuccessMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-top-2 border border-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
            <span>{saveSuccessMessage}</span>
            <button
              onClick={() => setSaveSuccessMessage(null)}
              className="ml-3 font-bold text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Save error notification banner (#100, #101: ✕ Unable to Save Project) */}
        {saveErrorMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-top-2 border border-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-white" />
            <span>{saveErrorMessage}</span>
            <button
              onClick={handleSaveProjectLocal}
              className="ml-2 px-2.5 py-1 rounded bg-white text-rose-700 text-[11px] font-bold hover:bg-rose-50 shadow-xs"
            >
              Retry
            </button>
            <button
              onClick={() => setSaveErrorMessage(null)}
              className="ml-1 font-bold text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* General error notification banner */}
        {errorMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2 border border-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-3 font-bold hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Delete Mode Safety Notification Banner (Requirement 305) */}
        {activeTool === 'delete' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-2xl border border-rose-400 animate-in fade-in slide-in-from-top-2">
            <Trash2 className="h-4 w-4 shrink-0 text-white animate-pulse" />
            <span>DELETE MODE ACTIVE: Click any device, cable, or reading to delete it</span>
            <button
              onClick={() => setActiveTool('select')}
              className="ml-2 px-2.5 py-1 rounded bg-white text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Loading overlay for PDF rendering */}
        {isLoadingPdf && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs text-white">
            <div className="flex flex-col items-center max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-2xl border border-slate-200 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">Rendering Floor Plan...</h3>
              <p className="mt-1 text-xs text-slate-500">{loadingMessage}</p>
              <div className="mt-4 w-48 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          </div>
        )}

        {/* LEFT VERTICAL TOOLBAR (#294-#304) */}
        <FloorPlanLeftToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onOpenScaleModal={() => setScaleModalOpen(true)}
          hasFloorPlan={!!floorPlan}
          activeCableDrawing={cableDrawingRoute.length > 0}
          onFinishCableDrawing={handleFinishCableDrawing}
          onCancelCableDrawing={handleCancelCableDrawing}
          isCollapsed={isLeftToolbarCollapsed}
          onToggleCollapse={() => setIsLeftToolbarCollapsed((prev) => !prev)}
          isCompact={isLeftToolbarCompact}
          onToggleCompact={() => setIsLeftToolbarCompact((prev) => !prev)}
        />

        {/* PRIORITY 1: Interactive Floor Plan Workspace (Receives Largest Space #76) */}
        <div className="relative flex-1 h-full overflow-hidden flex flex-col min-w-0">
          <FloorPlanWorkspace
            floorPlan={floorPlan}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
            mdfDevices={mdfDevices}
            idfDevices={idfDevices}
            accessPoints={accessPoints}
            signalReadings={signalReadings}
            lanCables={lanCables}
            visibility={visibility}
            floorScale={floorScale}
            appearanceSettings={appearanceSettings}
            onSelectMdf={(mdf) => {
              setSelectedItemForStyle({ type: 'mdf', id: mdf.id, name: `${mdf.id} - ${mdf.name}`, appearance: mdf.appearance });
              setActiveAppearanceCategory('mdf');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
            }}
            onEditMdf={(mdf) => {
              setSelectedItemForStyle({ type: 'mdf', id: mdf.id, name: `${mdf.id} - ${mdf.name}`, appearance: mdf.appearance });
              setActiveAppearanceCategory('mdf');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
              setEditingMdf(mdf);
              setMdfModalOpen(true);
            }}
            onSelectIdf={(idf) => {
              setSelectedItemForStyle({ type: 'idf', id: idf.id, name: `${idf.id} - ${idf.name}`, appearance: idf.appearance });
              setActiveAppearanceCategory('idf');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
            }}
            onEditIdf={(idf) => {
              setSelectedItemForStyle({ type: 'idf', id: idf.id, name: `${idf.id} - ${idf.name}`, appearance: idf.appearance });
              setActiveAppearanceCategory('idf');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
              setEditingIdf(idf);
              setIdfModalOpen(true);
            }}
            onSelectAp={(ap) => {
              setSelectedItemForStyle({ type: 'ap', id: ap.id, name: `${ap.id} - ${ap.name}`, appearance: ap.appearance });
              setActiveAppearanceCategory('ap');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
            }}
            onEditAp={(ap) => {
              setSelectedItemForStyle({ type: 'ap', id: ap.id, name: `${ap.id} - ${ap.name}`, appearance: ap.appearance });
              setActiveAppearanceCategory('ap');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
              setEditingAp(ap);
              setApModalOpen(true);
            }}
            onSelectSignal={(sig) => {
              setSelectedItemForStyle({ type: 'signal', id: sig.id, name: `${sig.id} - ${sig.ssid}`, appearance: sig.appearance });
              setActiveAppearanceCategory('signal');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
            }}
            onEditSignal={(sig) => {
              setSelectedItemForStyle({ type: 'signal', id: sig.id, name: `${sig.id} - ${sig.ssid}`, appearance: sig.appearance });
              setActiveAppearanceCategory('signal');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
              setEditingSignal(sig);
              setSignalModalOpen(true);
            }}
            onSelectCable={(cable) => {
              setSelectedItemForStyle({ type: 'cable', id: cable.id, name: `${cable.id} - ${cable.cableType}`, appearance: cable.appearance });
              setActiveAppearanceCategory('cable');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
            }}
            onEditCable={(cable) => {
              setSelectedItemForStyle({ type: 'cable', id: cable.id, name: `${cable.id} - ${cable.cableType}`, appearance: cable.appearance });
              setActiveAppearanceCategory('cable');
              setActiveSidebarTab('appearance');
              setSidebarOpen(true);
              setEditingCable(cable);
              setPendingRoute(cable.route);
              setCableModalOpen(true);
            }}
            onAddPointClick={handleAddPointClick}
            onUpdateMdfPos={(id, pos) => {
              setMdfDevices((prev) => prev.map((d) => (d.id === id ? { ...d, position: pos } : d)));
            }}
            onUpdateIdfPos={(id, pos) => {
              setIdfDevices((prev) => prev.map((d) => (d.id === id ? { ...d, position: pos } : d)));
            }}
            onUpdateApPos={(id, pos) => {
              setAccessPoints((prev) => prev.map((d) => (d.id === id ? { ...d, position: pos } : d)));
            }}
            onUpdateSignalPos={(id, pos) => {
              setSignalReadings((prev) => prev.map((d) => (d.id === id ? { ...d, position: pos } : d)));
            }}
            onUpdateCableLabelOffset={handleUpdateCableLabelOffset}
            onDeleteMdf={(id) => setMdfDevices((prev) => prev.filter((d) => d.id !== id))}
            onDeleteIdf={(id) => setIdfDevices((prev) => prev.filter((d) => d.id !== id))}
            onDeleteAp={(id) => setAccessPoints((prev) => prev.filter((d) => d.id !== id))}
            onDeleteSignal={(id) => setSignalReadings((prev) => prev.filter((d) => d.id !== id))}
            onDeleteCable={(id) => {
              setLanCables((prev) => prev.filter((c) => c.id !== id));
              recordHistoryAction('Delete LAN Cable');
            }}
            cableDrawingRoute={cableDrawingRoute}
            setCableDrawingRoute={setCableDrawingRoute}
            onFinishCableDrawing={handleFinishCableDrawing}
            onDragEnd={handleDragEnd}
            onUploadFloorPlan={() => fileInputRef.current?.click()}
          />
        </div>

        {/* PRIORITY 3: Redesigned Collapsible & Resizable Sidebar (#79, #80, #81, #82, #86, #87) */}
        {/* Strictly separated from floor plan, never overlaps LAN cable displays */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          width={sidebarWidth}
          onResize={handleSidebarResize}
          mdfDevices={mdfDevices}
          idfDevices={idfDevices}
          accessPoints={accessPoints}
          signalReadings={signalReadings}
          lanCables={lanCables}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          storeInfo={storeInfo}
          appearanceSettings={appearanceSettings}
          onUpdateGlobalSettings={setAppearanceSettings}
          onUpdateItemAppearance={(type, id, app) => {
            if (type === 'mdf') setMdfDevices((prev) => prev.map((d) => (d.id === id ? { ...d, appearance: app } : d)));
            else if (type === 'idf') setIdfDevices((prev) => prev.map((d) => (d.id === id ? { ...d, appearance: app } : d)));
            else if (type === 'ap') setAccessPoints((prev) => prev.map((d) => (d.id === id ? { ...d, appearance: app } : d)));
            else if (type === 'cable') setLanCables((prev) => prev.map((c) => (c.id === id ? { ...c, appearance: app } : c)));
            else if (type === 'signal') setSignalReadings((prev) => prev.map((s) => (s.id === id ? { ...s, appearance: app } : s)));
          }}
          onApplyToAllType={(type, app) => {
            if (type === 'mdf') setMdfDevices((prev) => prev.map((d) => ({ ...d, appearance: { ...app } })));
            else if (type === 'idf') setIdfDevices((prev) => prev.map((d) => ({ ...d, appearance: { ...app } })));
            else if (type === 'ap') setAccessPoints((prev) => prev.map((d) => ({ ...d, appearance: { ...app } })));
            else if (type === 'cable') setLanCables((prev) => prev.map((c) => ({ ...c, appearance: { ...app } })));
            else if (type === 'signal') setSignalReadings((prev) => prev.map((s) => ({ ...s, appearance: { ...app } })));
          }}
          onResetTypeToDefault={(type, id) => {
            if (id) {
              if (type === 'mdf') setMdfDevices((prev) => prev.map((d) => (d.id === id ? { ...d, appearance: undefined } : d)));
              else if (type === 'idf') setIdfDevices((prev) => prev.map((d) => (d.id === id ? { ...d, appearance: undefined } : d)));
              else if (type === 'ap') setAccessPoints((prev) => prev.map((d) => (d.id === id ? { ...d, appearance: undefined } : d)));
              else if (type === 'cable') setLanCables((prev) => prev.map((c) => (c.id === id ? { ...c, appearance: undefined } : c)));
              else if (type === 'signal') setSignalReadings((prev) => prev.map((s) => (s.id === id ? { ...s, appearance: undefined } : s)));
            } else {
              if (type === 'mdf') setMdfDevices((prev) => prev.map((d) => ({ ...d, appearance: undefined })));
              else if (type === 'idf') setIdfDevices((prev) => prev.map((d) => ({ ...d, appearance: undefined })));
              else if (type === 'ap') setAccessPoints((prev) => prev.map((d) => ({ ...d, appearance: undefined })));
              else if (type === 'cable') setLanCables((prev) => prev.map((c) => ({ ...c, appearance: undefined })));
              else if (type === 'signal') setSignalReadings((prev) => prev.map((s) => ({ ...s, appearance: undefined })));
            }
          }}
          selectedItem={selectedItemForStyle}
          activeMainTab={activeSidebarTab}
          onActiveMainTabChange={setActiveSidebarTab}
          activeAppearanceCategory={activeAppearanceCategory}
          onActiveAppearanceCategoryChange={setActiveAppearanceCategory}
          onOpenEditModal={(item) => {
            if (item.type === 'mdf') {
              const m = mdfDevices.find((d) => d.id === item.id);
              if (m) { setEditingMdf(m); setMdfModalOpen(true); }
            } else if (item.type === 'idf') {
              const idf = idfDevices.find((d) => d.id === item.id);
              if (idf) { setEditingIdf(idf); setIdfModalOpen(true); }
            } else if (item.type === 'ap') {
              const ap = accessPoints.find((a) => a.id === item.id);
              if (ap) { setEditingAp(ap); setApModalOpen(true); }
            } else if (item.type === 'signal') {
              const sig = signalReadings.find((s) => s.id === item.id);
              if (sig) { setEditingSignal(sig); setSignalModalOpen(true); }
            } else if (item.type === 'cable') {
              const cab = lanCables.find((c) => c.id === item.id);
              if (cab) { setEditingCable(cab); setPendingRoute(cab.route); setCableModalOpen(true); }
            }
          }}
          onDeselectItem={() => setSelectedItemForStyle(null)}
          onSelectMdf={(mdf) => {
            setSelectedItemForStyle({ type: 'mdf', id: mdf.id, name: `${mdf.id} - ${mdf.name}`, appearance: mdf.appearance });
            setActiveAppearanceCategory('mdf');
            setActiveSidebarTab('appearance');
          }}
          onSelectIdf={(idf) => {
            setSelectedItemForStyle({ type: 'idf', id: idf.id, name: `${idf.id} - ${idf.name}`, appearance: idf.appearance });
            setActiveAppearanceCategory('idf');
            setActiveSidebarTab('appearance');
          }}
          onSelectAp={(ap) => {
            setSelectedItemForStyle({ type: 'ap', id: ap.id, name: `${ap.id} - ${ap.name}`, appearance: ap.appearance });
            setActiveAppearanceCategory('ap');
            setActiveSidebarTab('appearance');
          }}
          onSelectCable={(cable) => {
            setSelectedItemForStyle({ type: 'cable', id: cable.id, name: `${cable.id} - ${cable.cableType}`, appearance: cable.appearance });
            setActiveAppearanceCategory('cable');
            setActiveSidebarTab('appearance');
          }}
          onAddCableClick={() => {
            setEditingCable(null);
            setPendingRoute([]);
            setCableModalOpen(true);
          }}
          onAddMdfClick={() => setActiveTool('add-mdf')}
          onAddIdfClick={() => setActiveTool('add-idf')}
          onAddApClick={() => setActiveTool('add-ap')}
        />
      </div>

      {/* Bottom Application Status Bar */}
      <AppStatusBar
        storeInfo={storeInfo}
        activeTool={activeTool}
        mdfCount={mdfDevices.length}
        idfCount={idfDevices.length}
        apCount={accessPoints.length}
        cablesCount={lanCables.length}
        signalsCount={signalReadings.length}
        floorScale={floorScale}
        zoom={zoom}
        isDirty={isDirty}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        isExpandedWorkspace={isExpandedWorkspace}
        onToggleExpandedWorkspace={handleToggleExpandedWorkspace}
        onFitFloorPlan={handleFitFloorPlan}
        onOpenScaleModal={() => setScaleModalOpen(true)}
      />

      {/* PRINT VIEW COMPONENT (Visible exclusively in window.print()) */}
      <div className="hidden print:block print-view-wrapper">
        <PrintView
          storeInfo={storeInfo}
          compositeDataUrl={printCompositeUrl || floorPlan?.backgroundDataUrl || ''}
          mdfDevices={mdfDevices}
          idfDevices={idfDevices}
          accessPoints={accessPoints}
          signalReadings={signalReadings}
          lanCables={lanCables}
          printConfig={activePrintConfig}
        />
      </div>

      {/* ALL MODALS (MDF, IDF, AP, Signal, Cable, PDF, Scale, Store, SaveAs, UnsavedChanges, LoadError, Export) */}
      <MdfModal
        isOpen={mdfModalOpen}
        onClose={() => setMdfModalOpen(false)}
        initialData={editingMdf}
        position={targetPos}
        existingCount={mdfDevices.length}
        onSave={(device) => {
          if (editingMdf) {
            setMdfDevices((prev) =>
              prev.map((d) => (d.id === editingMdf.id ? { ...d, ...device, appearance: device.appearance || d.appearance } : d))
            );
            recordHistoryAction('Update MDF');
          } else {
            setMdfDevices((prev) => [...prev, device]);
            recordHistoryAction('Add MDF');
          }
          setSelectedItemForStyle({
            type: 'mdf',
            id: device.id,
            name: `${device.id} - ${device.name}`,
            appearance: device.appearance,
          });
          setActiveAppearanceCategory('mdf');
          setActiveSidebarTab('appearance');
          setSidebarOpen(true);
          setMdfModalOpen(false);
          setEditingMdf(null);
        }}
        onDelete={(id) => {
          setMdfDevices((prev) => prev.filter((d) => d.id !== id));
          if (selectedItemForStyle?.id === id) setSelectedItemForStyle(null);
          recordHistoryAction('Delete MDF');
          setMdfModalOpen(false);
          setEditingMdf(null);
        }}
      />

      <IdfModal
        isOpen={idfModalOpen}
        onClose={() => {
          setIdfModalOpen(false);
          setEditingIdf(null);
        }}
        initialData={editingIdf}
        position={targetPos}
        existingCount={idfDevices.length}
        onSave={(device) => {
          if (editingIdf) {
            setIdfDevices((prev) =>
              prev.map((d) => (d.id === editingIdf.id ? { ...d, ...device, appearance: device.appearance || d.appearance } : d))
            );
            recordHistoryAction('Update IDF');
          } else {
            setIdfDevices((prev) => [...prev, device]);
            recordHistoryAction('Add IDF');
          }
          setSelectedItemForStyle({
            type: 'idf',
            id: device.id,
            name: `${device.id} - ${device.name}`,
            appearance: device.appearance,
          });
          setActiveAppearanceCategory('idf');
          setActiveSidebarTab('appearance');
          setSidebarOpen(true);
          setIdfModalOpen(false);
          setEditingIdf(null);
        }}
        onDelete={(id) => {
          setIdfDevices((prev) => prev.filter((d) => d.id !== id));
          if (selectedItemForStyle?.id === id) setSelectedItemForStyle(null);
          recordHistoryAction('Delete IDF');
          setIdfModalOpen(false);
          setEditingIdf(null);
        }}
      />

      <ApModal
        isOpen={apModalOpen}
        onClose={() => {
          setApModalOpen(false);
          setEditingAp(null);
        }}
        initialData={editingAp}
        position={targetPos}
        existingCount={accessPoints.length}
        onSave={(ap) => {
          if (editingAp) {
            setAccessPoints((prev) =>
              prev.map((d) => (d.id === editingAp.id ? { ...d, ...ap, appearance: ap.appearance || d.appearance } : d))
            );
            recordHistoryAction('Update Access Point');
          } else {
            setAccessPoints((prev) => [...prev, ap]);
            recordHistoryAction('Add Access Point');
          }
          setSelectedItemForStyle({
            type: 'ap',
            id: ap.id,
            name: `${ap.id} - ${ap.name}`,
            appearance: ap.appearance,
          });
          setActiveAppearanceCategory('ap');
          setActiveSidebarTab('appearance');
          setSidebarOpen(true);
          setApModalOpen(false);
          setEditingAp(null);
        }}
        onDelete={(id) => {
          setAccessPoints((prev) => prev.filter((d) => d.id !== id));
          if (selectedItemForStyle?.id === id) setSelectedItemForStyle(null);
          recordHistoryAction('Delete Access Point');
          setApModalOpen(false);
          setEditingAp(null);
        }}
      />

      <SignalModal
        isOpen={signalModalOpen}
        onClose={() => {
          setSignalModalOpen(false);
          setEditingSignal(null);
        }}
        initialData={editingSignal}
        position={targetPos}
        existingCount={signalReadings.length}
        onSave={(reading) => {
          if (editingSignal) {
            setSignalReadings((prev) =>
              prev.map((d) => (d.id === editingSignal.id ? { ...d, ...reading, appearance: reading.appearance || d.appearance } : d))
            );
            recordHistoryAction('Update Signal');
          } else {
            setSignalReadings((prev) => [...prev, reading]);
            recordHistoryAction('Add Signal');
          }
          setSelectedItemForStyle({
            type: 'signal',
            id: reading.id,
            name: `${reading.id} - ${reading.ssid}`,
            appearance: reading.appearance,
          });
          setActiveAppearanceCategory('signal');
          setActiveSidebarTab('appearance');
          setSidebarOpen(true);
          setSignalModalOpen(false);
          setEditingSignal(null);
        }}
        onDelete={(id) => {
          setSignalReadings((prev) => prev.filter((d) => d.id !== id));
          if (selectedItemForStyle?.id === id) setSelectedItemForStyle(null);
          recordHistoryAction('Delete Signal');
          setSignalModalOpen(false);
          setEditingSignal(null);
        }}
      />

      {/* PRIORITY 3: Guided Step-by-Step LAN Cable Workflow (#109 - #116) */}
      <GuidedLanCableModal
        isOpen={cableModalOpen}
        onClose={() => {
          setCableModalOpen(false);
          setEditingCable(null);
          setPendingRoute([]);
        }}
        initialData={editingCable}
        initialRoute={pendingRoute}
        floorPlan={floorPlan}
        floorScale={floorScale}
        mdfDevices={mdfDevices}
        idfDevices={idfDevices}
        accessPoints={accessPoints}
        existingCables={lanCables}
        onSaveCable={(cable) => {
          if (editingCable) {
            setLanCables((prev) =>
              prev.map((c) => (c.id === editingCable.id ? { ...c, ...cable, appearance: cable.appearance || c.appearance } : c))
            );
            recordHistoryAction('Update LAN Cable');
          } else {
            setLanCables((prev) => [...prev, cable]);
            recordHistoryAction('Add LAN Cable');
          }
          setSelectedItemForStyle({
            type: 'cable',
            id: cable.id,
            name: `${cable.id} - ${cable.cableType}`,
            appearance: cable.appearance,
          });
          setActiveAppearanceCategory('cable');
          setActiveSidebarTab('appearance');
          setSidebarOpen(true);
          setCableModalOpen(false);
          setEditingCable(null);
          setPendingRoute([]);
        }}
        onDeleteCable={(id) => {
          setLanCables((prev) => prev.filter((c) => c.id !== id));
          if (selectedItemForStyle?.id === id) setSelectedItemForStyle(null);
          recordHistoryAction('Delete LAN Cable');
          setCableModalOpen(false);
          setEditingCable(null);
          setPendingRoute([]);
        }}
      />

      {/* PRIORITY 2: Dedicated A4 Landscape Print Modal & Preview (#103 - #108) */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        storeInfo={storeInfo}
        floorPlan={floorPlan}
        compositeDataUrl={printCompositeUrl || floorPlan?.backgroundDataUrl || ''}
        mdfDevices={mdfDevices}
        idfDevices={idfDevices}
        accessPoints={accessPoints}
        signalReadings={signalReadings}
        lanCables={lanCables}
        visibility={visibility}
        onDownloadPng={handleExportPng}
        onPrintConfigChange={setActivePrintConfig}
      />

      <PdfPageSelectModal
        isOpen={pdfSelectOpen}
        onClose={() => setPdfSelectOpen(false)}
        pdfDoc={activePdfDoc}
        numPages={activePdfPages}
        documentName={activePdfName}
        onSelectPage={handlePdfPageSelected}
      />

      <ScaleCalibrationModal
        isOpen={scaleModalOpen}
        onClose={() => setScaleModalOpen(false)}
        currentScale={floorScale}
        planWidth={floorPlan?.originalWidth || 1400}
        planHeight={floorPlan?.originalHeight || 900}
        onSaveScale={(scale) => {
          setFloorScale(scale);
          recordHistoryAction('Calibrate Scale', { floorScale: scale });
        }}
      />

      <StoreInfoModal
        isOpen={storeInfoModalOpen}
        onClose={() => setStoreInfoModalOpen(false)}
        storeInfo={storeInfo}
        currentInfo={storeInfo}
        onSave={(info) => {
          setStoreInfo(info);
          recordHistoryAction('Update Store Info', { storeInfo: info });
        }}
        onSaveInfo={(info) => {
          setStoreInfo(info);
          recordHistoryAction('Update Store Info', { storeInfo: info });
        }}
      />

      {/* Save As Project Modal (#17, #18) */}
      <SaveAsModal
        isOpen={saveAsModalOpen}
        onClose={() => setSaveAsModalOpen(false)}
        storeInfo={storeInfo}
        onConfirmSaveAs={handleConfirmSaveAs}
      />

      {/* Unsaved Changes Protection Modal (#22) */}
      <UnsavedChangesModal
        isOpen={unsavedChangesModalOpen}
        onClose={() => {
          setUnsavedChangesModalOpen(false);
          setUnsavedChangesPendingAction(null);
        }}
        onSave={async () => {
          await handleSaveProjectLocal();
          if (unsavedChangesPendingAction === 'new') {
            executeNewProject();
          } else {
            projectFileInputRef.current?.click();
          }
          setUnsavedChangesPendingAction(null);
        }}
        onSaveAs={() => {
          setSaveAsModalOpen(true);
        }}
        onDiscard={() => {
          if (unsavedChangesPendingAction === 'new') {
            executeNewProject();
          } else {
            projectFileInputRef.current?.click();
          }
          setUnsavedChangesPendingAction(null);
        }}
        actionDescription={
          unsavedChangesPendingAction === 'new'
            ? 'Starting a new project will clear the current workspace.'
            : 'Opening a new project file will replace your current workspace.'
        }
      />

      {/* Load Corrupted / Invalid Project Error Modal (#21) */}
      <LoadErrorModal
        isOpen={loadErrorModalOpen}
        onClose={() => setLoadErrorModalOpen(false)}
        errorMessage={loadErrorMessage}
        onTryAgain={() => {
          projectFileInputRef.current?.click();
        }}
      />

      {/* Unified Professional Export Modal (PDF Report, Hitmap PNG, Combined) (#24 - #29) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        floorPlan={floorPlan}
        mdfDevices={mdfDevices}
        idfDevices={idfDevices}
        accessPoints={accessPoints}
        signalReadings={signalReadings}
        lanCables={lanCables}
        visibility={visibility}
        storeInfo={storeInfo}
        initialMode={exportModalMode}
      />

      {/* Reset All Items Confirmation Modal (#219 - #222) */}
      <ResetAllItemsModal
        isOpen={resetAllModalOpen}
        onClose={() => setResetAllModalOpen(false)}
        onConfirm={handleConfirmResetAllItems}
      />

      {/* What's New & Version History Modal (#236 - #244) */}
      <WhatsNewModal
        isOpen={whatsNewModalOpen}
        onClose={() => setWhatsNewModalOpen(false)}
      />

      {/* Welcome Screen (#185, #191, #208, #209, #210) */}
      {showWelcomeScreen && (
        <WelcomeScreen
          onEnterWorkspace={() => {
            setShowWelcomeScreen(false);
          }}
          onLoadSampleProject={() => {
            setShowWelcomeScreen(false);
            loadSampleData();
          }}
          onUploadFloorPlan={() => {
            setShowWelcomeScreen(false);
            setTimeout(() => {
              fileInputRef.current?.click();
            }, 100);
          }}
          onOpenSupport={() => {
            setSupportModalOpen(true);
          }}
          onOpenWhatsNew={() => {
            setWhatsNewModalOpen(true);
          }}
          hasSavedProject={hasSavedProject}
        />
      )}

      {/* Buy Me a Coffee / Support Modal (#186) */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </div>
  );
};
export default App;
