/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VersionChangeCategory {
  category: 'NEW FEATURES' | 'ENHANCEMENTS' | 'FIXES' | 'KNOWN ISSUES' | 'CORE FEATURES' | 'NETWORK PLANNING' | 'REPORTING' | 'CUSTOMIZATION';
  emoji: string;
  items: string[];
}

export interface VersionRelease {
  version: string;
  isLatest?: boolean;
  releaseTitle: string;
  releaseDate?: string;
  categories: VersionChangeCategory[];
}

export const APP_CURRENT_VERSION = 'v1.0.1';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: 'v1.0.1',
    isLatest: true,
    releaseTitle: 'Fixes & Enhancements',
    releaseDate: 'September 13, 2026',
    categories: [
      {
        category: 'FIXES',
        emoji: '🐛',
        items: [
          'Welcome UI now appears consistently on every startup, browser reload, and page refresh',
          'Donation and Support dialog properly displays pre-configured GCash and PayPal information with single-click copy buttons',
          'LAN Cable save blank/white screen issue resolved with deep coordinate validation, device existence checks, and error boundaries',
          'New Project floor plan upload workflow fixed — file picker directly triggers without silent failures',
          'Application stability improved with safe collection defaults and non-crashing coordinate fallbacks',
        ],
      },
      {
        category: 'NEW FEATURES',
        emoji: '🆕',
        items: [
          'Mouse Scroll Zoom In / Zoom Out directly on the floor plan workspace',
          'Smart Mouse Zoom focusing around the cursor pointer position with bounds between 25% and 300%',
          'One-click "Reset All Items" with confirmation protection to safely clear all devices and cables while preserving floor plans',
          'Version History / What\'s New Overview dialog and changelog tracker',
        ],
      },
      {
        category: 'ENHANCEMENTS',
        emoji: '✨',
        items: [
          'Improved Floor Plan navigation and prevented unwanted parent window scrolling during zoom',
          'Comprehensive LAN Cable normalization preventing undefined coordinates from reaching the canvas',
          'Improved New Project workflow initializing pristine empty states',
          'Dual sign-off and branch verification headers in export reports',
        ],
      },
    ],
  },
  {
    version: 'v1.0.0',
    isLatest: false,
    releaseTitle: 'Initial Release',
    releaseDate: 'September 13, 2026',
    categories: [
      {
        category: 'CORE FEATURES',
        emoji: '⚡',
        items: [
          'Interactive WIFI HITMAP Workspace',
          'Floor Plan Upload (PNG, JPG, JPEG, PDF)',
          'Access Point Management & Signal Propagation',
          'MDF / Server Cabinet placement & attributes',
          'IDF / Switch Hub distribution points',
          'WiFi Signal Readings (dBm / percentage)',
          'Signal Strength Heatmap Visualization',
        ],
      },
      {
        category: 'NETWORK PLANNING',
        emoji: '🌐',
        items: [
          'LAN Cable Length metering and calculation',
          'Direct Device Connections',
          'Custom Multi-Point LAN Cable Routes',
          'Network Infrastructure & Topology Visualization',
        ],
      },
      {
        category: 'REPORTING',
        emoji: '📊',
        items: [
          'Automated Coverage & Infrastructure Insights',
          'Engineering Recommendations Engine',
          'Executive Final Summary',
          'Print Support with standard A4 landscape preview',
          'High-Resolution PNG Canvas Export',
          'Multi-Page PDF Technical Site Survey Export',
        ],
      },
      {
        category: 'CUSTOMIZATION',
        emoji: '🎨',
        items: [
          'Custom Color Themes & Styles',
          'Resizable Device Icons',
          'Resizable Canvas Text Labels',
          'Multiple Device Icon Variants (Ceiling, Wall, Router)',
          'LAN Cable Line Thickness and Dash Pattern Styling',
        ],
      },
    ],
  },
];
