/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  FloorPlanDocument,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  VisibilitySettings,
  StoreInfo,
  HitmapInsights,
  PrintConfiguration,
} from '../types';
import { analyzeHitmapData } from './insightsAnalyzer';
import { generateCompositePng } from './exportComposite';

export interface PdfExportSettings {
  pageSize: 'a4-landscape' | 'a4' | 'letter';
  includeProjectInfo: boolean;
  includeFloorPlan: boolean;
  includeLegendAndInfrastructure: boolean;
  includeInsightsAndRecommendations: boolean;
  includeLanCableSummary: boolean;
}

export const DEFAULT_PDF_EXPORT_SETTINGS: PdfExportSettings = {
  pageSize: 'a4-landscape',
  includeProjectInfo: true,
  includeFloorPlan: true,
  includeLegendAndInfrastructure: true,
  includeInsightsAndRecommendations: true,
  includeLanCableSummary: true,
};

/**
 * Sanitizes a string for inclusion in safe export filenames (#179)
 */
export function sanitizeFilename(str: string): string {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 50);
}

/**
 * Generates the standardized filename according to requirement #179:
 * STORE_WIFI_HITMAP_{StoreNameOrCode}_{YYYY-MM-DD}.[ext]
 */
export function generateExportFilename(storeInfo: StoreInfo, extension: 'pdf' | 'png'): string {
  const codeOrName = sanitizeFilename(storeInfo.storeCode || storeInfo.storeName || 'SURVEY');
  const dateStr = storeInfo.assessmentDate || new Date().toISOString().split('T')[0];
  return `STORE_WIFI_HITMAP_${codeOrName}_${dateStr}.${extension}`;
}

export type PdfProgressCallback = (step: string) => void;

/**
 * Generates and downloads a multi-page professional engineering PDF report (#172 - #182)
 */
export async function generateAndDownloadPdfReport(
  floorPlan: FloorPlanDocument,
  mdfDevices: MDFDevice[],
  idfDevices: IDFDevice[],
  accessPoints: AccessPoint[],
  signalReadings: SignalReading[],
  lanCables: LanCable[],
  visibility: VisibilitySettings,
  storeInfo: StoreInfo,
  settings: PdfExportSettings = DEFAULT_PDF_EXPORT_SETTINGS,
  onProgress?: PdfProgressCallback,
  printConfig?: PrintConfiguration
): Promise<string> {
  onProgress?.('Preparing Master Print Layout...');

  // =========================================================================
  // PRIORITY #318 & #320: MASTER PRINT VIEW DIRECT PDF EXPORT
  // Render the master PrintView DOM elements directly to PDF for 100% fidelity.
  // =========================================================================
  const masterContainers = document.querySelectorAll('.print-report-container');
  let activeContainer: HTMLElement | null = null;
  masterContainers.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.offsetParent !== null || htmlEl.classList.contains('block') || !htmlEl.classList.contains('hidden')) {
      activeContainer = htmlEl;
    }
  });

  if (activeContainer) {
    const pages = Array.from((activeContainer as HTMLElement).querySelectorAll('.print-page')) as HTMLElement[];
    if (pages.length > 0) {
      try {
        onProgress?.('Rendering Master Print Layout pages to high-resolution PDF...');

        const paperSize = printConfig?.paperSize || 'A4';
        const paperDimensions: Record<string, [number, number]> = {
          A4: [210, 297],
          A3: [297, 420],
          A5: [148, 210],
          Letter: [215.9, 279.4],
          Legal: [215.9, 355.6],
          Tabloid: [279.4, 431.8],
        };

        const baseDims = paperDimensions[paperSize] || [210, 297];
        const orientationSetting = printConfig?.orientation || 'auto';
        const effectiveOrientation: 'landscape' | 'portrait' = (() => {
          if (orientationSetting === 'portrait') return 'portrait';
          if (orientationSetting === 'landscape') return 'landscape';
          if (floorPlan && floorPlan.originalWidth && floorPlan.originalHeight) {
            return floorPlan.originalWidth >= floorPlan.originalHeight ? 'landscape' : 'portrait';
          }
          return 'landscape';
        })();

        const pageWidth =
          effectiveOrientation === 'landscape'
            ? Math.max(baseDims[0], baseDims[1])
            : Math.min(baseDims[0], baseDims[1]);
        const pageHeight =
          effectiveOrientation === 'landscape'
            ? Math.min(baseDims[0], baseDims[1])
            : Math.max(baseDims[0], baseDims[1]);

        const doc = new jsPDF({
          orientation: effectiveOrientation,
          unit: 'mm',
          format: [pageWidth, pageHeight],
        });

        for (let i = 0; i < pages.length; i++) {
          onProgress?.(`Rendering Page ${i + 1} of ${pages.length}...`);
          const pageEl = pages[i];
          const canvas = await html2canvas(pageEl, {
            scale: 2.2, // ~300 DPI high resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: effectiveOrientation === 'portrait' ? 840 : 1200,
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          if (i > 0) {
            doc.addPage([pageWidth, pageHeight], effectiveOrientation);
          }
          doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        }

        const filename = generateExportFilename(storeInfo, 'pdf');
        doc.save(filename);
        onProgress?.('Download complete!');
        return filename;
      } catch (domCaptureErr) {
        console.warn('DOM PDF generation failed, falling back to programmatic PDF:', domCaptureErr);
        onProgress?.('Falling back to vector composite engine...');
      }
    }
  }

  // Fallback programmatic rendering (if DOM container is not mounted)
  onProgress?.('Preparing Floor Plan...');

  // 1. Determine orientation and page dimensions
  const isLandscape = settings.pageSize === 'a4-landscape' || settings.pageSize === 'letter';
  const format = settings.pageSize === 'letter' ? 'letter' : 'a4';
  const orientation = isLandscape ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Pre-calculate insights
  onProgress?.('Generating Summary & Insights...');
  const insights: HitmapInsights = analyzeHitmapData(
    mdfDevices,
    idfDevices,
    accessPoints,
    signalReadings,
    lanCables
  );

  // Generate high-resolution floor plan image
  const floorPlanDataUrl = await generateCompositePng(
    floorPlan,
    mdfDevices,
    idfDevices,
    accessPoints,
    signalReadings,
    lanCables,
    visibility,
    storeInfo
  );

  onProgress?.('Preparing Pages & Tables...');

  // Track pages to write footer (#182)
  interface PageJob {
    render: () => void;
  }
  const pageJobs: PageJob[] = [];

  // ----------------------------------------------------
  // PAGE 1: COVER / PROJECT INFORMATION (#172)
  // ----------------------------------------------------
  if (settings.includeProjectInfo) {
    pageJobs.push({
      render: () => {
        // Dark Top Header Banner (#168)
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 55, 'F');

        doc.setTextColor(56, 189, 248); // sky-400
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('DECSTUDIOAICREATION', 20, 17);

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('WIFI HITMAP', 20, 27);

        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('WiFi Signal Strength & Network Infrastructure Plan', 20, 37);

        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225); // slate-300
        doc.text('Technical Site Survey & Branch Infrastructure Report', 20, 47);

        // Project Information Card (#167, #169, #184)
        let y = 70;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(20, y, pageWidth - 40, 115, 3, 3, 'FD');

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('PROJECT & BRANCH DETAILS', 28, y + 14);

        doc.setDrawColor(203, 213, 225);
        doc.line(28, y + 18, pageWidth - 28, y + 18);

        // 2-column info layout
        const col1 = 30;
        const col2 = pageWidth / 2 + 10;
        let lineY = y + 30;

        // Branch Name
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('BRANCH NAME:', col1, lineY);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(storeInfo.branchName || storeInfo.storeName || 'N/A', col1, lineY + 6);

        // Branch Code
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('BRANCH CODE / ID:', col2, lineY);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.text(storeInfo.branchCode || storeInfo.storeCode || 'N/A', col2, lineY + 6);

        lineY += 20;

        // Location
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('LOCATION / AREA:', col1, lineY);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10.5);
        doc.text(storeInfo.location || 'N/A', col1, lineY + 6);

        // Floor / Area
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('FLOOR SPACE / AREA:', col2, lineY);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10.5);
        doc.text(storeInfo.floorArea || 'N/A', col2, lineY + 6);

        lineY += 20;

        // Prepared By (Technician)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('PREPARED BY (IT SPECIALIST):', col1, lineY);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10.5);
        const techPosition = storeInfo.position || storeInfo.technicianPosition || 'IT Infrastructure Operations';
        doc.text(`${storeInfo.preparedBy || 'IT Technician'} (${techPosition})`, col1, lineY + 6);

        // Assessment Date
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('ASSESSMENT DATE:', col2, lineY);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10.5);
        doc.text(storeInfo.assessmentDate || new Date().toISOString().split('T')[0], col2, lineY + 6);

        lineY += 20;

        // Acknowledged By (Branch Management) if available
        if (storeInfo.acknowledgedBy) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text('ACKNOWLEDGED BY (BRANCH):', col1, lineY);
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(9.5);
          const ackPos = storeInfo.acknowledgedPosition || 'Branch Manager';
          doc.text(`${storeInfo.acknowledgedBy} (${ackPos})`, col1, lineY + 5);
        }

        // Creation Timestamps (#167, #181)
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const dateCreated = storeInfo.dateCreated || new Date().toLocaleDateString();
        const timeCreated = storeInfo.timeCreated || new Date().toLocaleTimeString();
        doc.text(`Date Created: ${dateCreated} at ${timeCreated}`, col2, lineY + 5);
        if (storeInfo.lastModified) {
          doc.text(`Last Modified: ${storeInfo.lastModified}`, col2, lineY + 4);
        }

        // Remarks box if any
        if (storeInfo.remarks) {
          lineY += 14;
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text(`Remarks: ${storeInfo.remarks}`, col1, lineY, { maxWidth: pageWidth - 60 });
        }
      },
    });
  }

  // ----------------------------------------------------
  // PAGE 2: COMPLETE FLOOR PLAN (#173)
  // ----------------------------------------------------
  if (settings.includeFloorPlan) {
    pageJobs.push({
      render: () => {
        // Page Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text('WIFI HITMAP & NETWORK INFRASTRUCTURE FLOOR PLAN', 20, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Architectural layout with active Access Points, cabling routes, and signal strength overlays', 20, 24);

        // Compute aspect ratio fit
        const maxW = pageWidth - 40;
        const maxH = pageHeight - 45;

        const imgRatio = floorPlan.originalWidth / floorPlan.originalHeight;
        let drawW = maxW;
        let drawH = drawW / imgRatio;

        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH * imgRatio;
        }

        const posX = 20 + (maxW - drawW) / 2;
        const posY = 28 + (maxH - drawH) / 2;

        doc.setDrawColor(203, 213, 225);
        doc.rect(posX - 0.5, posY - 0.5, drawW + 1, drawH + 1, 'S');

        doc.addImage(floorPlanDataUrl, 'PNG', posX, posY, drawW, drawH, undefined, 'FAST');
      },
    });
  }

  // ----------------------------------------------------
  // PAGE 3: LEGEND & NETWORK SUMMARY (#174)
  // ----------------------------------------------------
  if (settings.includeLegendAndInfrastructure) {
    pageJobs.push({
      render: () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('SIGNAL STRENGTH LEGEND & NETWORK INFRASTRUCTURE', 20, 20);

        // Section A: Signal Strength Legend (#174)
        doc.setFontSize(11);
        doc.text('SIGNAL STRENGTH LEGEND', 20, 32);

        const cardWidth = (pageWidth - 50) / 3;
        const cardY = 37;
        const cardH = 32;

        // 81-100: Excellent / Strong
        doc.setFillColor(240, 253, 244); // emerald-50
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(20, cardY, cardWidth, cardH, 2, 2, 'FD');
        doc.setTextColor(22, 101, 52); // emerald-800
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('81 – 100', 25, cardY + 12);
        doc.setFontSize(10);
        doc.text('Excellent / Strong', 25, cardY + 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Full speed & zero packet loss', 25, cardY + 26);

        // 40-80: Good / Moderate
        const c2X = 20 + cardWidth + 5;
        doc.setFillColor(254, 252, 232); // yellow-50
        doc.setDrawColor(254, 240, 138);
        doc.roundedRect(c2X, cardY, cardWidth, cardH, 2, 2, 'FD');
        doc.setTextColor(133, 77, 14); // yellow-800
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('40 – 80', c2X + 5, cardY + 12);
        doc.setFontSize(10);
        doc.text('Good / Moderate', c2X + 5, cardY + 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Acceptable store coverage', c2X + 5, cardY + 26);

        // 0-39: Weak
        const c3X = c2X + cardWidth + 5;
        doc.setFillColor(254, 242, 242); // rose-50
        doc.setDrawColor(254, 205, 205);
        doc.roundedRect(c3X, cardY, cardWidth, cardH, 2, 2, 'FD');
        doc.setTextColor(153, 27, 27); // rose-800
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('0 – 39', c3X + 5, cardY + 12);
        doc.setFontSize(10);
        doc.text('Weak Signal', c3X + 5, cardY + 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Requires inspection or adjustment', c3X + 5, cardY + 26);

        // Section B: Network Infrastructure (#161, #174)
        const netY = 82;
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('NETWORK INFRASTRUCTURE INVENTORY', 20, netY);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(20, netY + 5, pageWidth - 40, 85, 2, 2, 'FD');

        const rowH = 14;
        let rowY = netY + 18;
        const leftX = 30;
        const rightX = pageWidth - 40;

        const infraItems = [
          { name: 'MDF / Main Server Cabinet', count: `${insights.networkSummary.mdfCount} unit(s)` },
          { name: 'IDF / Switch Hub for Selling Area', count: `${insights.networkSummary.idfCount} unit(s)` },
          { name: 'Wireless Access Points (APs)', count: `${insights.networkSummary.apCount} unit(s)` },
          { name: 'LAN Cable Route Connections', count: `${insights.networkSummary.cableCount} run(s)` },
          {
            name: 'Total Recorded LAN Cable Length',
            count: insights.networkSummary.hasIncompleteCableLengths
              ? `${insights.networkSummary.totalRecordedCableLength} meters (Some incomplete)`
              : `${insights.networkSummary.totalRecordedCableLength} meters`,
          },
        ];

        infraItems.forEach((item, index) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          doc.text(item.name, leftX, rowY);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(item.count, rightX, rowY, { align: 'right' });

          if (index < infraItems.length - 1) {
            doc.setDrawColor(241, 245, 249);
            doc.line(leftX, rowY + 4, rightX, rowY + 4);
          }
          rowY += rowH;
        });
      },
    });
  }

  // ----------------------------------------------------
  // PAGE 4: INSIGHTS AND RECOMMENDATIONS (#175)
  // ----------------------------------------------------
  if (settings.includeInsightsAndRecommendations) {
    pageJobs.push({
      render: () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('WIFI HITMAP INSIGHTS & RECOMMENDATIONS', 20, 20);

        // Overall Assessment Banner (#164)
        const bannerY = 27;
        const status = insights.signalAnalysis.overallStatus;
        if (status === 'EXCELLENT') {
          doc.setFillColor(240, 253, 244);
          doc.setDrawColor(187, 247, 208);
          doc.setTextColor(22, 101, 52);
        } else if (status === 'GOOD') {
          doc.setFillColor(239, 246, 255);
          doc.setDrawColor(191, 219, 254);
          doc.setTextColor(30, 64, 175);
        } else if (status === 'NEEDS ATTENTION') {
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(254, 205, 205);
          doc.setTextColor(153, 27, 27);
        } else {
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.setTextColor(71, 85, 105);
        }

        doc.roundedRect(20, bannerY, pageWidth - 40, 22, 2, 2, 'FD');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`OVERALL WIFI COVERAGE: ${status}`, 26, bannerY + 9);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(insights.signalAnalysis.statusDescription, 26, bannerY + 16, { maxWidth: pageWidth - 60 });

        // Metric breakdown row (#175)
        let curY = 56;
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(
          `Measured Areas: Strong: ${insights.signalAnalysis.strongCount} | Moderate: ${insights.signalAnalysis.moderateCount} | Weak: ${insights.signalAnalysis.weakCount} | Access Points: ${insights.networkSummary.apCount}`,
          20,
          curY
        );

        // Section A: KEY FINDINGS (#175)
        curY += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('KEY FINDINGS (OBSERVATIONS)', 20, curY);

        curY += 4;
        insights.keyFindings.forEach((kf) => {
          curY += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          if (kf.type === 'success') {
            doc.setTextColor(22, 101, 52);
            doc.text(`[✓]  ${kf.text}`, 24, curY);
          } else if (kf.type === 'warning') {
            doc.setTextColor(180, 83, 9);
            doc.text(`[!]  ${kf.text}`, 24, curY);
          } else {
            doc.setTextColor(71, 85, 105);
            doc.text(`[•]  ${kf.text}`, 24, curY);
          }
        });

        // Section B: RECOMMENDATIONS (#175)
        curY += 12;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('RECOMMENDED ENGINEERING ACTIONS', 20, curY);

        curY += 4;
        insights.recommendations.forEach((rec, idx) => {
          curY += 6;
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          const lines = doc.splitTextToSize(`${idx + 1}.  ${rec}`, pageWidth - 45);
          doc.text(lines, 24, curY);
          curY += (lines.length - 1) * 4.5;
        });

        // Honesty disclaimer (#183)
        curY += 12;
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text(
          '* All observations and recommendations are calculated directly from physical survey points and placed network infrastructure.',
          20,
          curY
        );
      },
    });
  }

  // ----------------------------------------------------
  // PAGE 5: LAN CABLE SUMMARY (#176)
  // ----------------------------------------------------
  if (settings.includeLanCableSummary) {
    pageJobs.push({
      render: () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('LAN CABLE INFRASTRUCTURE SCHEDULE', 20, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Run details, terminating patch points, verified lengths, and media types', 20, 25);

        // Table Header (#176: Cable ID | From | To | Length | Type)
        let tableY = 32;
        doc.setFillColor(15, 23, 42);
        doc.rect(20, tableY, pageWidth - 40, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);

        const colWidths = {
          id: 28,
          from: (pageWidth - 40 - 28 - 25 - 28) / 2,
          to: (pageWidth - 40 - 28 - 25 - 28) / 2,
          len: 25,
          type: 28,
        };

        let curX = 22;
        doc.text('Cable ID', curX, tableY + 5.5);
        curX += colWidths.id;
        doc.text('From Device', curX, tableY + 5.5);
        curX += colWidths.from;
        doc.text('To Device', curX, tableY + 5.5);
        curX += colWidths.to;
        doc.text('Length', curX, tableY + 5.5);
        curX += colWidths.len;
        doc.text('Type', curX, tableY + 5.5);

        tableY += 8;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        if (lanCables.length === 0) {
          doc.setTextColor(100, 116, 139);
          doc.text('No LAN cables recorded in this project yet.', 24, tableY + 8);
          tableY += 12;
        } else {
          lanCables.forEach((cable, idx) => {
            const rowBg = idx % 2 === 0 ? 255 : 248;
            doc.setFillColor(rowBg, rowBg, rowBg);
            doc.rect(20, tableY, pageWidth - 40, 7.5, 'F');

            doc.setTextColor(15, 23, 42);
            let rowX = 22;

            doc.setFont('helvetica', 'bold');
            doc.text(cable.id, rowX, tableY + 5);
            rowX += colWidths.id;

            doc.setFont('helvetica', 'normal');
            doc.text(cable.fromName.slice(0, 32), rowX, tableY + 5);
            rowX += colWidths.from;

            doc.text(cable.toName.slice(0, 32), rowX, tableY + 5);
            rowX += colWidths.to;

            const lenText = cable.length ? `${cable.length} m` : 'Unrecorded';
            doc.text(lenText, rowX, tableY + 5);
            rowX += colWidths.len;

            doc.text(cable.cableType || 'CAT6', rowX, tableY + 5);

            tableY += 7.5;
          });
        }

        // Table Bottom Summary Box (#176)
        tableY += 6;
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(20, tableY, pageWidth - 40, 18, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `TOTAL RECORDED LAN CABLE LENGTH: ${insights.networkSummary.totalRecordedCableLength} METERS`,
          26,
          tableY + 8
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        if (insights.networkSummary.hasIncompleteCableLengths) {
          doc.text(
            `⚠ Notice: ${insights.networkSummary.incompleteCableCount} cable run(s) have unrecorded lengths. Total excludes unmeasured segments.`,
            26,
            tableY + 14
          );
        } else {
          doc.text(`All ${lanCables.length} cable connections have complete length measurements.`, 26, tableY + 14);
        }
      },
    });
  }

  // Render all pages and apply Footers (#182)
  onProgress?.('Finalizing Report Document...');
  const totalPages = pageJobs.length;

  pageJobs.forEach((job, index) => {
    if (index > 0) {
      doc.addPage(format, orientation);
    }

    // Render page body
    job.render();

    // Standardized Professional Footer (#182)
    // Example: STORE WIFI HITMAP | ABC STORE | Created by: Juan Dela Cruz — IT Technician | Page 2 of 5
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, footerY - 4, pageWidth - 20, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400

    const branchTitle = storeInfo.branchName || storeInfo.storeName || 'Branch WiFi Survey';
    const techName = storeInfo.preparedBy || 'IT Technician';
    const position = storeInfo.position || storeInfo.technicianPosition || 'IT Infrastructure Operations';

    doc.text(`DECStudioAiCreation • WIFI HITMAP  |  ${branchTitle}  |  Prepared by: ${techName} — ${position}`, 20, footerY);
    doc.text(`Page ${index + 1} of ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
  });

  const filename = generateExportFilename(storeInfo, 'pdf');
  doc.save(filename);
  return filename;
}
