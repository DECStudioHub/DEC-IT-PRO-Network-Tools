/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FloorPlanDocument,
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  VisibilitySettings,
  StoreInfo,
  AppearanceSettings,
  ItemAppearance,
  clampIconSize,
  clampTextSize,
} from '../types';
import { renderHeatmapToCanvas } from './heatmapRenderer';
import { hexToRgba } from './deviceIcons';

/**
 * Draws an authentic 3-arc WiFi signal icon + center dot directly on canvas.
 * Perfectly mirrors WifiSignalIcon with crisp scalable arcs.
 */
function drawWifiSignalOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  bars: 1 | 2 | 3
) {
  const activeColor = bars === 3 ? '#16a34a' : bars === 2 ? '#ca8a04' : '#dc2626';
  const inactiveColor = '#cbd5e1';
  const strokeW = Math.max(1.8, Math.round(size * 0.12));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Base center dot
  const dotR = Math.max(1.8, size * 0.08);
  const baseY = cy + size * 0.36;
  ctx.fillStyle = activeColor;
  ctx.beginPath();
  ctx.arc(cx, baseY, dotR, 0, Math.PI * 2);
  ctx.fill();

  // Arcs angles
  const startAngle = Math.PI * 1.25; // 225 deg
  const endAngle = Math.PI * 1.75;   // 315 deg

  ctx.lineWidth = strokeW;

  // Inner Arc (1st bar - always active)
  ctx.strokeStyle = activeColor;
  ctx.beginPath();
  ctx.arc(cx, baseY, size * 0.32, startAngle, endAngle);
  ctx.stroke();

  // Middle Arc (2nd bar - active for 2 and 3)
  ctx.strokeStyle = bars >= 2 ? activeColor : inactiveColor;
  ctx.beginPath();
  ctx.arc(cx, baseY, size * 0.58, startAngle, endAngle);
  ctx.stroke();

  // Outer Arc (3rd bar - active only for 3)
  ctx.strokeStyle = bars >= 3 ? activeColor : inactiveColor;
  ctx.beginPath();
  ctx.arc(cx, baseY, size * 0.84, startAngle, endAngle);
  ctx.stroke();

  ctx.restore();
}

/**
 * Generates a high-resolution composite canvas/PNG of the floor plan with all active overlays.
 * Respects v1.0.2 ItemAppearance settings (borders, backgrounds, custom sizes, colors).
 */
export async function generateCompositePng(
  floorPlan: FloorPlanDocument,
  mdfDevices: MDFDevice[],
  idfDevices: IDFDevice[],
  accessPoints: AccessPoint[],
  signalReadings: SignalReading[],
  lanCables: LanCable[],
  visibility: VisibilitySettings,
  storeInfo: StoreInfo,
  appearanceSettings?: AppearanceSettings
): Promise<string> {
  const planW = floorPlan.originalWidth;
  const planH = floorPlan.originalHeight;

  // Header height for professional engineering banner
  const headerH = 100;
  const totalW = planW;
  const totalH = planH + headerH;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // 1. Background fill
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  // 2. Professional Header Banner
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillRect(0, 0, totalW, headerH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('STORE WIFI HITMAP & NETWORK INFRASTRUCTURE PLAN', 30, 42);

  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#38bdf8'; // sky-400
  ctx.fillText('WiFi Signal Strength & Access Point Coverage Analysis • DECStudioAiCreation v1.0.2', 30, 68);

  // Right side header info
  ctx.fillStyle = '#f8fafc';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Branch: ${storeInfo.branchName || storeInfo.storeName || 'Branch Location'} | Code: ${storeInfo.branchCode || storeInfo.storeCode || 'N/A'}`, totalW - 30, 36);
  ctx.fillText(`Date: ${storeInfo.assessmentDate || new Date().toLocaleDateString()} | Tech: ${storeInfo.preparedBy || 'IT Technician'}`, totalW - 30, 58);
  ctx.fillText(`${storeInfo.location || 'Retail Floor'} • ${storeInfo.floorArea || 'Level 1'}`, totalW - 30, 80);
  ctx.textAlign = 'left';

  // 3. Draw Floor Plan Image
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = floorPlan.backgroundDataUrl;
  });
  ctx.drawImage(img, 0, headerH, planW, planH);

  // 4. Draw Heatmap (if enabled)
  if (visibility.showHeatmap && signalReadings.length > 0) {
    const heatCanvas = document.createElement('canvas');
    renderHeatmapToCanvas(heatCanvas, signalReadings, planW, planH, 0.42);
    ctx.drawImage(heatCanvas, 0, headerH, planW, planH);
  }

  // 5. Draw LAN Cable Routes (if enabled)
  if (visibility.showLanCables) {
    lanCables.forEach((cable) => {
      if (!cable.route || cable.route.length < 2) return;

      const app = cable.appearance || appearanceSettings?.defaultCable || {};
      const strokeColor =
        app.lineColor ||
        (cable.cableType === 'CAT6'
          ? '#2563eb'
          : cable.cableType === 'CAT6A'
          ? '#7c3aed'
          : cable.cableType === 'Fiber'
          ? '#d97706'
          : '#475569');

      const thicknessVal =
        app.lineThickness === 'thick' ? 5 : app.lineThickness === 'thin' ? 2 : 3.5;

      // White outline casing for contrast
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = thicknessVal + 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      cable.route.forEach((pt, idx) => {
        const px = pt.x * planW;
        const py = headerH + pt.y * planH;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Main line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = thicknessVal;

      if (app.lineStyle === 'dashed' || cable.cableType === 'Fiber') {
        ctx.setLineDash([8, 5]);
      } else if (app.lineStyle === 'dotted') {
        ctx.setLineDash([3, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Label badge if enabled
      if (visibility.showLanLengths) {
        const midIdx = Math.floor((cable.route.length - 1) / 2);
        const p1 = cable.route[midIdx];
        const p2 = cable.route[midIdx + 1] || p1;
        const mx = ((p1.x + p2.x) / 2) * planW;
        const my = headerH + ((p1.y + p2.y) / 2) * planH;

        const textSize = clampTextSize(app.textSize, 10);
        ctx.font = `bold ${textSize}px monospace`;
        const textMetrics = ctx.measureText(cable.id);
        const bw = Math.max(90, textMetrics.width + 30);
        const bh = textSize + 18;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(mx - bw / 2, my - bh / 2, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(cable.id, mx, my - 2);

        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${Math.max(8, textSize - 2)}px sans-serif`;
        ctx.fillText(`${cable.length}m • ${cable.cableType}`, mx, my + 10);
        ctx.textAlign = 'left';
      }
    });
  }

  // 6. Draw MDF Devices (if enabled)
  if (visibility.showMdf) {
    mdfDevices.forEach((mdf) => {
      if (!mdf?.position || typeof mdf.position.x !== 'number') return;
      const cx = mdf.position.x * planW;
      const cy = headerH + mdf.position.y * planH;

      const app = mdf.appearance || appearanceSettings?.defaultMdf || {};
      const boxSize = clampIconSize(app.iconSize, 40);
      const halfBox = boxSize / 2;
      const accentColor = app.iconColor || '#60a5fa';
      const outlineColor = app.borderColor || '#60a5fa';
      const borderWidth = app.enableBorder !== false ? (app.borderWidth || 2.5) : 0;

      // Draw Background
      ctx.fillStyle = hexToRgba(app.bgColor || '#0f172a', app.bgOpacity ?? 95);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.roundRect(cx - halfBox, cy - halfBox, boxSize, boxSize, Math.min(10, boxSize / 4));
      ctx.fill();
      if (borderWidth > 0) ctx.stroke();

      // MDF Server Icon Representation inside box
      const rackW = Math.round(boxSize * 0.6);
      const rackH = Math.max(3, Math.round(boxSize * 0.12));
      const rackGap = Math.max(2, Math.round(boxSize * 0.08));
      ctx.fillStyle = accentColor;
      ctx.fillRect(cx - rackW / 2, cy - rackH * 1.5 - rackGap, rackW, rackH);
      ctx.fillRect(cx - rackW / 2, cy - rackH * 0.5, rackW, rackH);
      ctx.fillRect(cx - rackW / 2, cy + rackH * 0.5 + rackGap, rackW, rackH);

      // Label below
      const labelTextSize = clampTextSize(app.textSize, 11);
      ctx.font = `${app.fontWeight === 'bold' || app.fontWeight === 'black' ? 'bold ' : ''}${labelTextSize}px monospace`;
      const idWidth = ctx.measureText(mdf.id).width;
      const lblW = Math.max(72, idWidth + 20);
      const lblH = labelTextSize + 14;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - lblW / 2, cy + halfBox + 4, lblW, lblH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = app.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(mdf.id, cx, cy + halfBox + 4 + labelTextSize);

      ctx.fillStyle = accentColor;
      ctx.font = `bold ${Math.max(7, labelTextSize - 3)}px sans-serif`;
      ctx.fillText('SERVER CABINET', cx, cy + halfBox + 4 + labelTextSize + 9);
      ctx.textAlign = 'left';
    });
  }

  // 7. Draw IDF Devices (if enabled)
  if (visibility.showIdf) {
    idfDevices.forEach((idf) => {
      if (!idf?.position || typeof idf.position.x !== 'number') return;
      const cx = idf.position.x * planW;
      const cy = headerH + idf.position.y * planH;

      const app = idf.appearance || appearanceSettings?.defaultIdf || {};
      const boxSize = clampIconSize(app.iconSize, 36);
      const halfBox = boxSize / 2;
      const accentColor = app.iconColor || '#2dd4bf';
      const outlineColor = app.borderColor || '#2dd4bf';
      const borderWidth = app.enableBorder !== false ? (app.borderWidth || 2.5) : 0;

      ctx.fillStyle = hexToRgba(app.bgColor || '#042f2e', app.bgOpacity ?? 95);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.roundRect(cx - halfBox, cy - halfBox, boxSize, boxSize, Math.min(8, boxSize / 4));
      ctx.fill();
      if (borderWidth > 0) ctx.stroke();

      // IDF Switch representation
      const swW = Math.round(boxSize * 0.6);
      const swH = Math.round(boxSize * 0.4);
      ctx.fillStyle = accentColor;
      ctx.fillRect(cx - swW / 2, cy - swH / 2, swW, swH);

      // Label below
      const labelTextSize = clampTextSize(app.textSize, 11);
      ctx.font = `${app.fontWeight === 'bold' || app.fontWeight === 'black' ? 'bold ' : ''}${labelTextSize}px monospace`;
      const idWidth = ctx.measureText(idf.id).width;
      const lblW = Math.max(72, idWidth + 20);
      const lblH = labelTextSize + 14;

      ctx.fillStyle = hexToRgba('#042f2e', app.bgOpacity ?? 95);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - lblW / 2, cy + halfBox + 4, lblW, lblH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = app.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(idf.id, cx, cy + halfBox + 4 + labelTextSize);

      ctx.fillStyle = accentColor;
      ctx.font = `bold ${Math.max(7, labelTextSize - 3)}px sans-serif`;
      ctx.fillText('SWITCH HUB', cx, cy + halfBox + 4 + labelTextSize + 9);
      ctx.textAlign = 'left';
    });
  }

  // 8. Draw AP Markers (if enabled)
  if (visibility.showAps) {
    accessPoints.forEach((ap) => {
      if (!ap?.position || typeof ap.position.x !== 'number') return;
      const cx = ap.position.x * planW;
      const cy = headerH + ap.position.y * planH;

      const app = ap.appearance || appearanceSettings?.defaultAp || {};
      const boxSize = clampIconSize(app.iconSize, 32);
      const radius = boxSize / 2;
      const accentColor = app.iconColor || '#10b981';
      const outlineColor = app.borderColor || '#ffffff';
      const borderWidth = app.enableBorder !== false ? (app.borderWidth || 2) : 0;

      // Outer circle / badge
      ctx.fillStyle = hexToRgba(app.bgColor || accentColor, app.bgOpacity ?? 95);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      if (borderWidth > 0) ctx.stroke();

      // White inner dot/wifi mark
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, radius * 0.25), 0, Math.PI * 2);
      ctx.fill();

      // AP label
      const labelTextSize = clampTextSize(app.textSize, 11);
      ctx.font = `${app.fontWeight === 'bold' || app.fontWeight === 'black' ? 'bold ' : ''}${labelTextSize}px monospace`;
      const idWidth = ctx.measureText(ap.id).width;
      const lblW = idWidth + 14;
      const lblH = labelTextSize + 8;

      ctx.fillStyle = hexToRgba('#0f172a', app.bgOpacity ?? 95);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx + radius + 4, cy - lblH / 2, lblW, lblH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = app.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(ap.id, cx + radius + 4 + lblW / 2, cy + labelTextSize / 3);
      ctx.textAlign = 'left';
    });
  }

  // 9. Draw Signal Readings (if enabled)
  if (visibility.showSignalValues || visibility.showWifiBars) {
    signalReadings.forEach((sig) => {
      if (!sig?.position || typeof sig.position.x !== 'number') return;
      const cx = sig.position.x * planW;
      const cy = headerH + sig.position.y * planH;

      const app = sig.appearance || appearanceSettings?.defaultSignal || {};
      const textSize = clampTextSize(app.textSize, 12);
      const iconSize = clampIconSize(app.iconSize, 18);
      const hasBorder = app.enableBorder !== false;
      const borderWidth = hasBorder ? (app.borderWidth || 1) : 0;
      const borderColor = app.borderColor || '#cbd5e1';
      const bgColor = hexToRgba(app.bgColor || '#ffffff', app.bgOpacity ?? 95);
      const textColor = app.textColor || '#000000';

      const hasDbm = typeof sig.dbm === 'number';
      const hasSpeed = typeof sig.speedMbps === 'number';
      const hasTechData = hasDbm || hasSpeed;

      // Font calculations
      const fontPrefix = app.fontWeight === 'bold' || app.fontWeight === 'black' ? 'bold ' : '';
      ctx.font = `${fontPrefix}${textSize}px monospace`;
      const numText = `${sig.signal}%`;
      const numWidth = visibility.showSignalValues ? ctx.measureText(numText).width : 0;

      // Tech data font & measurements
      const techTextSize = Math.max(9, Math.round(textSize * 0.72));
      let techWidth = 0;
      if (hasTechData) {
        ctx.font = `bold ${techTextSize}px monospace`;
        const dbmStr = hasDbm ? `${sig.dbm}dBm` : '';
        const speedStr = hasSpeed ? `${sig.speedMbps}M` : '';
        techWidth = Math.max(
          hasDbm ? ctx.measureText(dbmStr).width : 0,
          hasSpeed ? ctx.measureText(speedStr).width : 0
        ) + 6;
      }

      // Calculate total badge dimensions
      const paddingX = 7;
      const gap = 5;
      let contentW = 0;
      if (visibility.showSignalValues) contentW += numWidth;
      if (visibility.showSignalValues && visibility.showWifiBars) contentW += gap;
      if (visibility.showWifiBars) contentW += iconSize;
      if (hasTechData) contentW += gap + techWidth;

      const rw = Math.max(34, contentW + paddingX * 2);
      const rh = Math.max(22, Math.max(textSize, iconSize) + 8);

      // Draw Badge Background & Border
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.roundRect(cx - rw / 2, cy - rh / 2, rw, rh, 5);
      ctx.fill();
      if (borderWidth > 0) ctx.stroke();

      // Render items from left to right inside badge
      let curX = cx - rw / 2 + paddingX;

      // 1. Signal Number
      if (visibility.showSignalValues) {
        ctx.fillStyle = textColor;
        ctx.font = `${fontPrefix}${textSize}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(numText, curX, cy + textSize * 0.34);
        curX += numWidth + gap;
      }

      // 2. Authentic WiFi Arc Icon (concentric curved arcs + dot)
      if (visibility.showWifiBars) {
        const iconCx = curX + iconSize / 2;
        const iconCy = cy;
        drawWifiSignalOnCanvas(ctx, iconCx, iconCy, iconSize, sig.bars);
        curX += iconSize + gap;
      }

      // 3. Technical Data (dBm and Mbps)
      if (hasTechData) {
        // Divider line
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(curX - 2, cy - rh * 0.35);
        ctx.lineTo(curX - 2, cy + rh * 0.35);
        ctx.stroke();

        ctx.font = `bold ${techTextSize}px monospace`;
        ctx.textAlign = 'left';
        if (hasDbm && hasSpeed) {
          ctx.fillStyle = '#64748b';
          ctx.fillText(`${sig.dbm}dBm`, curX + 2, cy - 1);
          ctx.fillStyle = '#2563eb';
          ctx.fillText(`${sig.speedMbps}M`, curX + 2, cy + techTextSize - 1);
        } else if (hasDbm) {
          ctx.fillStyle = '#64748b';
          ctx.fillText(`${sig.dbm}dBm`, curX + 2, cy + techTextSize * 0.35);
        } else if (hasSpeed) {
          ctx.fillStyle = '#2563eb';
          ctx.fillText(`${sig.speedMbps}M`, curX + 2, cy + techTextSize * 0.35);
        }
      }
    });
  }

  // 10. Draw Legend (if enabled)
  if (visibility.showLegend) {
    const legX = totalW - 270;
    const legY = totalH - 210;
    const legW = 250;
    const legH = 190;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(legX, legY, legW, legH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('WIFI HITMAP & NETWORK LEGEND', legX + 14, legY + 22);

    ctx.font = '10px sans-serif';
    // Signals
    ctx.fillStyle = '#22c55e';
    ctx.fillText('● 81–100 : 3 Bars (Excellent)', legX + 14, legY + 44);
    ctx.fillStyle = '#eab308';
    ctx.fillText('● 40–80  : 2 Bars (Good)', legX + 14, legY + 62);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('● 0–39   : 1 Bar (Weak)', legX + 14, legY + 80);

    // Devices
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('■ MDF : Server Cabinet', legX + 14, legY + 104);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillText('■ IDF : Switch Hub (Selling Area)', legX + 14, legY + 122);
    ctx.fillStyle = '#34d399';
    ctx.fillText('● AP  : Wireless Access Point', legX + 14, legY + 140);
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText('━ LAN : Cable Route with Meters', legX + 14, legY + 158);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.fillText('Black Numbers = WiFi Signal Strength', legX + 14, legY + 176);
  }

  return canvas.toDataURL('image/png', 0.95);
}
