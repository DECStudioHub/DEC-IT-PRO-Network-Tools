/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignalReading } from '../types';

/**
 * Renders an IDW (Inverse Distance Weighting) heatmap canvas overlay from signal readings.
 * Uses an efficient downsampled grid for smooth rendering, with soft Gaussian roll-off.
 */
export function renderHeatmapToCanvas(
  targetCanvas: HTMLCanvasElement,
  signals: SignalReading[],
  width: number,
  height: number,
  globalOpacity = 0.42,
) {
  if (!targetCanvas || signals.length === 0 || width <= 0 || height <= 0) {
    const ctx = targetCanvas?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    return;
  }

  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  // Use an offscreen buffer at 1/6th resolution for fast interpolation
  const downscale = 6;
  const bufferW = Math.max(1, Math.floor(width / downscale));
  const bufferH = Math.max(1, Math.floor(height / downscale));

  const offscreen = document.createElement('canvas');
  offscreen.width = bufferW;
  offscreen.height = bufferH;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  const imgData = offCtx.createImageData(bufferW, bufferH);
  const data = imgData.data;

  // Pre-calculate signal positions in buffer space
  const validSignals = (signals || []).filter(
    (s) => s && s.position && typeof s.position.x === 'number' && typeof s.position.y === 'number'
  );
  if (validSignals.length === 0) return;

  const signalPoints = validSignals.map((s) => ({
    x: s.position.x * bufferW,
    y: s.position.y * bufferH,
    signal: s.signal,
  }));

  // Max influence radius in buffer pixels (~15% of diagonal)
  const diag = Math.sqrt(bufferW * bufferW + bufferH * bufferH);
  const maxRadius = Math.max(18, diag * 0.28);
  const maxRadiusSq = maxRadius * maxRadius;

  for (let py = 0; py < bufferH; py++) {
    for (let px = 0; px < bufferW; px++) {
      let weightSum = 0;
      let valSum = 0;
      let minDistSq = Infinity;

      for (let i = 0; i < signalPoints.length; i++) {
        const pt = signalPoints[i];
        const dx = px - pt.x;
        const dy = py - pt.y;
        const dSq = dx * dx + dy * dy;

        if (dSq < minDistSq) {
          minDistSq = dSq;
        }

        if (dSq < maxRadiusSq) {
          // Inverse distance weighting with power 2 + epsilon to avoid division by zero
          const weight = 1 / (dSq + 4);
          weightSum += weight;
          valSum += pt.signal * weight;
        }
      }

      const pixelIdx = (py * bufferW + px) * 4;

      if (weightSum > 0) {
        const interpolatedSignal = valSum / weightSum;
        const distFromNearest = Math.sqrt(minDistSq);

        // Soft radial attenuation beyond radius
        let alphaFactor = 1.0;
        if (distFromNearest > maxRadius * 0.6) {
          alphaFactor = Math.max(0, 1 - (distFromNearest - maxRadius * 0.6) / (maxRadius * 0.4));
        }

        if (alphaFactor > 0.02) {
          const rgb = signalToRgb(interpolatedSignal);
          data[pixelIdx] = rgb.r;
          data[pixelIdx + 1] = rgb.g;
          data[pixelIdx + 2] = rgb.b;
          data[pixelIdx + 3] = Math.round(255 * globalOpacity * alphaFactor);
        } else {
          data[pixelIdx + 3] = 0;
        }
      } else {
        data[pixelIdx + 3] = 0;
      }
    }
  }

  offCtx.putImageData(imgData, 0, 0);

  // Draw offscreen buffer upscaled with smooth bilinear filtering onto targetCanvas
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(offscreen, 0, 0, width, height);
}

/**
 * Color mapping corresponding directly to prompt requirements:
 * 81-100: Green (Strong)
 * 40-80: Yellow/Amber (Moderate)
 * 0-39: Red/Orange (Weak)
 */
function signalToRgb(signal: number): { r: number; g: number; b: number } {
  if (signal >= 81) {
    // 81 to 100: deep green to vibrant emerald
    const t = Math.min(1, Math.max(0, (signal - 81) / 19));
    return {
      r: Math.round(34 - t * 12),
      g: Math.round(197 + t * 25),
      b: Math.round(94 - t * 20),
    };
  } else if (signal >= 40) {
    // 40 to 80: amber-yellow to lime-yellow
    const t = Math.min(1, Math.max(0, (signal - 40) / 40));
    return {
      r: Math.round(245 - t * 40),
      g: Math.round(158 + t * 45),
      b: Math.round(11 + t * 20),
    };
  } else {
    // 0 to 39: deep red to red-orange
    const t = Math.min(1, Math.max(0, signal / 39));
    return {
      r: Math.round(220 + t * 20),
      g: Math.round(38 + t * 40),
      b: Math.round(38 - t * 10),
    };
  }
}
