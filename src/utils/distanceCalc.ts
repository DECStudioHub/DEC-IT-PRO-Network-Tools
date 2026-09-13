/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanCableRoutePoint, FloorScale } from '../types';

/**
 * Calculates Euclidean distance in normalized coordinates (0..1)
 */
export function calculateNormalizedDistance(
  p1: LanCableRoutePoint,
  p2: LanCableRoutePoint,
  aspectRatio = 1, // width / height
): number {
  const dx = (p2.x - p1.x) * aspectRatio;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Estimates cable route length in meters using the floor plan scale and dimensions
 */
export function estimateRouteLengthInMeters(
  route: LanCableRoutePoint[],
  planWidth: number,
  planHeight: number,
  scale: FloorScale,
): { estimatedMeters: number; isCalibrated: boolean } {
  if (route.length < 2) {
    return { estimatedMeters: 0, isCalibrated: scale.isCalibrated };
  }

  let totalPixelDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i];
    const p2 = route[i + 1];

    const px1 = p1.x * planWidth;
    const py1 = p1.y * planHeight;
    const px2 = p2.x * planWidth;
    const py2 = p2.y * planHeight;

    const dx = px2 - px1;
    const dy = py2 - py1;
    totalPixelDistance += Math.sqrt(dx * dx + dy * dy);
  }

  // If calibrated scale exists:
  if (scale.isCalibrated && scale.metersPerPixel > 0) {
    const meters = totalPixelDistance * scale.metersPerPixel;
    // Add standard 5% service slack for drops / ceiling riser
    const withSlack = Math.round(meters * 1.05 * 10) / 10;
    return {
      estimatedMeters: withSlack,
      isCalibrated: true,
    };
  }

  // Default baseline estimation: assume average store width 45m across planWidth
  const defaultMetersPerPixel = 45.0 / (planWidth || 1400);
  const baselineEstimate = Math.round(totalPixelDistance * defaultMetersPerPixel * 1.05 * 10) / 10;

  return {
    estimatedMeters: baselineEstimate,
    isCalibrated: false,
  };
}
