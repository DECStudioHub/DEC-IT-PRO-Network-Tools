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
} from '../types';
import { renderHeatmapToCanvas } from './heatmapRenderer';

/**
 * Generates a high-resolution composite canvas/PNG of the floor plan with all active overlays.
 */
export async function generateCompositePng(
  floorPlan: FloorPlanDocument,
  mdfDevices: MDFDevice[],
  idfDevices: IDFDevice[],
  accessPoints: AccessPoint[],
  signalReadings: SignalReading[],
  lanCables: LanCable[],
  visibility: VisibilitySettings,
  storeInfo: StoreInfo
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
  ctx.fillText('WiFi Signal Strength & Access Point Coverage Analysis', 30, 68);

  // Right side header info
  ctx.fillStyle = '#f8fafc';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Store: ${storeInfo.storeName || 'Store Location'} | Code: ${storeInfo.storeCode || 'N/A'}`, totalW - 30, 36);
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

      const strokeColor =
        cable.cableType === 'CAT6'
          ? '#2563eb'
          : cable.cableType === 'CAT6A'
          ? '#7c3aed'
          : cable.cableType === 'Fiber'
          ? '#d97706'
          : '#475569';

      // White outline casing
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
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
      ctx.lineWidth = 3.5;
      if (cable.cableType === 'Fiber') ctx.setLineDash([8, 5]);
      else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label badge if enabled
      if (visibility.showLanLengths) {
        const midIdx = Math.floor((cable.route.length - 1) / 2);
        const p1 = cable.route[midIdx];
        const p2 = cable.route[midIdx + 1] || p1;
        const mx = ((p1.x + p2.x) / 2) * planW;
        const my = headerH + ((p1.y + p2.y) / 2) * planH;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        const bw = 90;
        const bh = 28;
        ctx.beginPath();
        ctx.roundRect(mx - bw / 2, my - bh / 2, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cable.id, mx, my - 2);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`${cable.length}m • ${cable.cableType}`, mx, my + 9);
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

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(cx - 20, cy - 20, 40, 40, 8);
      ctx.fill();
      ctx.stroke();

      // MDF Server icon representation
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(cx - 12, cy - 12, 24, 6);
      ctx.fillRect(cx - 12, cy - 3, 24, 6);
      ctx.fillRect(cx - 12, cy + 6, 24, 6);

      // Label below
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 36, cy + 24, 72, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(mdf.id, cx, cy + 35);
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 7.5px sans-serif';
      ctx.fillText('SERVER CABINET', cx, cy + 44);
      ctx.textAlign = 'left';
    });
  }

  // 7. Draw IDF Devices (if enabled)
  if (visibility.showIdf) {
    idfDevices.forEach((idf) => {
      if (!idf?.position || typeof idf.position.x !== 'number') return;
      const cx = idf.position.x * planW;
      const cy = headerH + idf.position.y * planH;

      ctx.fillStyle = '#042f2e';
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(cx - 18, cy - 18, 36, 36, 8);
      ctx.fill();
      ctx.stroke();

      // IDF Switch representation
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(cx - 11, cy - 8, 22, 16);

      // Label below
      ctx.fillStyle = '#042f2e';
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 36, cy + 22, 72, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(idf.id, cx, cy + 33);
      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 7.5px sans-serif';
      ctx.fillText('SWITCH HUB', cx, cy + 42);
      ctx.textAlign = 'left';
    });
  }

  // 8. Draw AP Markers (if enabled)
  if (visibility.showAps) {
    accessPoints.forEach((ap) => {
      if (!ap?.position || typeof ap.position.x !== 'number') return;
      const cx = ap.position.x * planW;
      const cy = headerH + ap.position.y * planH;

      // Green circle with white border
      ctx.fillStyle = '#16a34a';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // White inner dot/wifi mark
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      // AP label
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx + 18, cy - 10, 48, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ap.id, cx + 42, cy + 4);
      ctx.textAlign = 'left';
    });
  }

  // 9. Draw Signal Readings (if enabled)
  if (visibility.showSignalValues || visibility.showWifiBars) {
    signalReadings.forEach((sig) => {
      if (!sig?.position || typeof sig.position.x !== 'number') return;
      const cx = sig.position.x * planW;
      const cy = headerH + sig.position.y * planH;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      const rw = 48;
      const rh = 22;
      ctx.beginPath();
      ctx.roundRect(cx - rw / 2, cy - rh / 2, rw, rh, 4);
      ctx.fill();
      ctx.stroke();

      // Original Black Signal Number
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(String(sig.signal), cx - 18, cy + 4);

      // Bar color indicator
      const barColor = sig.bars === 3 ? '#16a34a' : sig.bars === 2 ? '#d97706' : '#dc2626';
      ctx.fillStyle = barColor;
      for (let b = 1; b <= 3; b++) {
        if (b <= sig.bars) {
          ctx.fillRect(cx + 4 + (b - 1) * 5, cy + 4 - b * 3, 3.5, b * 3);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(cx + 4 + (b - 1) * 5, cy + 4 - b * 3, 3.5, b * 3);
          ctx.fillStyle = barColor;
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
