/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MDFDevice,
  IDFDevice,
  AccessPoint,
  SignalReading,
  LanCable,
  HitmapInsights,
  OverallHitmapStatus,
  SignalAnalysisData,
  NetworkSummaryData,
} from '../types';

/**
 * Minimum number of physical measurements needed before drawing valid coverage conclusions.
 * Adheres to rule #164 and #165: Never invent data or make misleading generalizations.
 */
export const MIN_READINGS_FOR_ANALYSIS = 3;

/**
 * Analyzes recorded WiFi hitmap data and network infrastructure to generate
 * factual observations, honest signal analyses, and smart engineering recommendations.
 */
export function analyzeHitmapData(
  mdfDevices: MDFDevice[],
  idfDevices: IDFDevice[],
  accessPoints: AccessPoint[],
  signalReadings: SignalReading[],
  lanCables: LanCable[]
): HitmapInsights {
  const totalReadings = signalReadings.length;
  const hasSufficientData = totalReadings >= MIN_READINGS_FOR_ANALYSIS;

  // 1. Signal Strength Classification according to #158
  // 81–100 = Excellent / Strong
  // 40–80 = Good / Moderate
  // 0–39 = Weak
  let strongCount = 0;
  let moderateCount = 0;
  let weakCount = 0;
  let signalSum = 0;

  signalReadings.forEach((r) => {
    const val = r.signal;
    signalSum += val;
    if (val >= 81) {
      strongCount++;
    } else if (val >= 40) {
      moderateCount++;
    } else {
      weakCount++;
    }
  });

  const averageSignal = totalReadings > 0 ? Math.round(signalSum / totalReadings) : 0;
  const strongPercent = totalReadings > 0 ? Math.round((strongCount / totalReadings) * 100) : 0;
  const moderatePercent = totalReadings > 0 ? Math.round((moderateCount / totalReadings) * 100) : 0;
  const weakPercent = totalReadings > 0 ? Math.round((weakCount / totalReadings) * 100) : 0;

  // 2. Determine Overall Status (#164, #165)
  let overallStatus: OverallHitmapStatus = 'INSUFFICIENT DATA';
  let statusDescription = '';

  if (!hasSufficientData) {
    overallStatus = 'INSUFFICIENT DATA';
    statusDescription =
      'There are currently not enough recorded signal readings to generate a reliable WiFi coverage summary. Add more measurements across different areas of the floor plan.';
  } else if (weakCount === 0 && strongCount >= moderateCount) {
    overallStatus = 'EXCELLENT';
    statusDescription =
      'Most measured areas have strong WiFi coverage with zero recorded weak signal zones.';
  } else if (weakCount <= 1 || weakPercent <= 15) {
    overallStatus = 'GOOD';
    statusDescription =
      'The recorded WiFi signal readings indicate generally good coverage across the measured areas.';
  } else {
    overallStatus = 'NEEDS ATTENTION';
    statusDescription =
      'Weak signal readings are present in a significant portion of recorded measurements requiring physical inspection.';
  }

  const signalAnalysis: SignalAnalysisData = {
    totalReadings,
    strongCount,
    moderateCount,
    weakCount,
    strongPercent,
    moderatePercent,
    weakPercent,
    averageSignal,
    overallStatus,
    statusDescription,
  };

  // 3. Network Infrastructure & Cable Summary (#161, #162)
  let recordedCableLength = 0;
  let incompleteCableCount = 0;
  const cableTypesBreakdown: Record<string, number> = {};

  lanCables.forEach((cable) => {
    const type = cable.cableType || 'Other';
    cableTypesBreakdown[type] = (cableTypesBreakdown[type] || 0) + 1;

    if (cable.length && cable.length > 0) {
      recordedCableLength += cable.length;
    } else {
      incompleteCableCount++;
    }
  });

  const hasIncompleteCableLengths = incompleteCableCount > 0;

  const networkSummary: NetworkSummaryData = {
    mdfCount: mdfDevices.length,
    idfCount: idfDevices.length,
    apCount: accessPoints.length,
    cableCount: lanCables.length,
    totalRecordedCableLength: Math.round(recordedCableLength * 10) / 10,
    hasIncompleteCableLengths,
    incompleteCableCount,
    cableTypesBreakdown,
  };

  // 4. Observations vs Recommendations (#160: Distinguish observations from recommendations)
  const observations: string[] = [];
  const recommendations: string[] = [];
  const keyFindings: { type: 'success' | 'warning' | 'info'; text: string }[] = [];

  if (!hasSufficientData) {
    observations.push(
      `Only ${totalReadings} signal measurement${totalReadings === 1 ? '' : 's'} currently recorded on this floor plan.`
    );
    observations.push(
      'A minimum of 3 distributed readings is required to establish statistical coverage validity.'
    );
    keyFindings.push({
      type: 'warning',
      text: 'Insufficient measurement data for automated coverage assessment.',
    });
    recommendations.push(
      'Perform on-site signal measurements across all customer and staff areas before finalizing survey documentation.'
    );
  } else {
    // Factual Observations
    observations.push(
      `Total of ${totalReadings} WiFi signal locations measured across the survey area (Average signal: ${averageSignal}/100).`
    );
    if (strongCount > 0) {
      observations.push(
        `${strongCount} recorded measurement${strongCount > 1 ? 's' : ''} (${strongPercent}%) within the strong signal range (81–100).`
      );
    }
    if (moderateCount > 0) {
      observations.push(
        `${moderateCount} recorded measurement${moderateCount > 1 ? 's' : ''} (${moderatePercent}%) within the moderate signal range (40–80).`
      );
    }
    if (weakCount > 0) {
      observations.push(
        `${weakCount} recorded measurement${weakCount > 1 ? 's' : ''} (${weakPercent}%) within the weak signal range (0–39).`
      );
    } else {
      observations.push('Zero weak signal points detected in the currently recorded survey areas.');
    }

    // Key Findings (#158, #163)
    if (strongPercent >= 60) {
      keyFindings.push({
        type: 'success',
        text: 'Most measured areas have strong WiFi coverage.',
      });
    }
    if (moderateCount > 0) {
      keyFindings.push({
        type: 'warning',
        text: 'Some areas have moderate signal strength.',
      });
    }
    if (weakCount > 0) {
      keyFindings.push({
        type: 'warning',
        text: 'Weak signal areas require further inspection.',
      });
    }

    // Smart Recommendations (#159)
    if (weakCount > 0) {
      recommendations.push(
        'Consider checking the weak coverage area for: Access Point distance, physical obstructions (concrete pillars/metal racks), building materials, AP placement, and 2.4/5GHz network interference.'
      );
      recommendations.push(
        'Consider performing additional site measurements before changing the physical network layout.'
      );
    }

    if (moderateCount > 0) {
      recommendations.push(
        'Some areas show moderate signal strength. Review nearby Access Point placement and collect additional readings around these zones.'
      );
    }

    if (strongPercent >= 70 && weakCount === 0) {
      recommendations.push(
        'The measured areas currently show generally strong WiFi coverage. Continue monitoring coverage and perform additional measurements when the store layout changes.'
      );
    }
  }

  // Network & Cabling Observations & Recommendations (#161, #162)
  if (accessPoints.length === 0) {
    keyFindings.push({
      type: 'warning',
      text: 'No Wireless Access Points placed on the floor plan.',
    });
    recommendations.push(
      'Document and place installed Access Points (APs) to correlate physical transmitter locations with signal readings.'
    );
  } else {
    observations.push(
      `Infrastructure contains ${accessPoints.length} Wireless Access Point${accessPoints.length > 1 ? 's' : ''}, ${mdfDevices.length} MDF cabinet, and ${idfDevices.length} IDF switch hub.`
    );
  }

  if (lanCables.length > 0) {
    if (hasIncompleteCableLengths) {
      keyFindings.push({
        type: 'warning',
        text: `${incompleteCableCount} LAN cable${incompleteCableCount > 1 ? 's do' : ' does'} not have recorded run lengths.`,
      });
      recommendations.push(
        'Consider completing the cable length information for more accurate infrastructure documentation.'
      );
    } else {
      observations.push(
        `All ${lanCables.length} LAN cable runs have documented route lengths totaling ${networkSummary.totalRecordedCableLength} meters.`
      );
    }
  }

  // Final Hitmap Summary text (#163)
  let finalAssessmentText = '';
  if (!hasSufficientData) {
    finalAssessmentText =
      'Coverage assessment is pending additional survey readings. The current data points are insufficient to conclude store-wide Wi-Fi performance reliably.';
  } else if (overallStatus === 'EXCELLENT') {
    finalAssessmentText =
      'The recorded WiFi signal readings indicate excellent coverage across the measured areas with no identified dead zones.';
  } else if (overallStatus === 'GOOD') {
    finalAssessmentText =
      'The recorded WiFi signal readings indicate generally good coverage across the measured areas with acceptable propagation.';
  } else {
    finalAssessmentText =
      'The recorded WiFi signal readings show multiple weak signal zones that warrant immediate on-site hardware inspection or re-positioning.';
  }

  return {
    hasSufficientData,
    signalAnalysis,
    networkSummary,
    observations,
    recommendations,
    keyFindings,
    finalAssessmentText,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}
