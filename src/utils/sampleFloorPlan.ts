/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FloorPlanDocument, MDFDevice, IDFDevice, AccessPoint, SignalReading, LanCable } from '../types';

/**
 * Generates an architectural retail store floor plan rendered as high-res PNG data URL
 */
export function generateSampleFloorPlan(): {
  document: FloorPlanDocument;
  sampleMdf: MDFDevice[];
  sampleIdf: IDFDevice[];
  sampleAps: AccessPoint[];
  sampleSignals: SignalReading[];
  sampleCables: LanCable[];
} {
  const width = 1400;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Background architectural blueprint paper style (clean crisp white with subtle architectural grid)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Subtle 20px grid
  ctx.strokeStyle = '#f1f5f9'; // slate-100
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Outer boundary walls (thick architectural lines)
  const pad = 60;
  const planW = width - pad * 2;
  const planH = height - pad * 2;

  ctx.strokeStyle = '#1e293b'; // slate-800
  ctx.lineWidth = 8;
  ctx.strokeRect(pad, pad, planW, planH);

  // Internal room dividing walls
  ctx.lineWidth = 5;

  // Server Room (MDF Room) at Top-Left: x=60 to x=320, y=60 to y=260
  ctx.strokeRect(pad, pad, 260, 200);

  // Storage / Warehouse at Top: x=320 to x=860, y=60 to y=260
  ctx.strokeRect(pad + 260, pad, 540, 200);

  // Staff Breakroom / Office: x=860 to x=1280 (right edge), y=60 to y=260
  ctx.strokeRect(pad + 800, pad, 480, 200);

  // Main Selling Area: y=260 to y=700 (large open space with retail shelf gondolas)
  // Checkout & Customer Service: y=700 to y=840 (bottom)
  ctx.beginPath();
  ctx.moveTo(pad, pad + 640);
  ctx.lineTo(pad + planW, pad + 640);
  ctx.stroke();

  // Entrance / Exit doors at bottom center
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(pad + 480, pad + planH - 4, 160, 8); // door gap
  ctx.strokeStyle = '#0284c7'; // sky-600 door swing arc
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pad + 480, pad + planH, 70, 0, -Math.PI / 2, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pad + 640, pad + planH, 70, Math.PI, -Math.PI / 2, false);
  ctx.stroke();

  // Checkout lanes (Cash registers 1 to 6)
  ctx.fillStyle = '#e2e8f0'; // slate-200
  for (let i = 0; i < 5; i++) {
    const rx = pad + 180 + i * 140;
    const ry = pad + 680;
    ctx.fillRect(rx, ry, 70, 70);
    ctx.strokeRect(rx, ry, 70, 70);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`POS 0${i + 1}`, rx + 14, ry + 40);
    ctx.fillStyle = '#e2e8f0';
  }

  // Selling Area Shelves / Gondolas
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  const aisleRows = [
    { x: pad + 100, y: pad + 290, w: 220, h: 55, label: 'AISLE 1 • GROCERY' },
    { x: pad + 100, y: pad + 380, w: 220, h: 55, label: 'AISLE 2 • BEVERAGES' },
    { x: pad + 100, y: pad + 470, w: 220, h: 55, label: 'AISLE 3 • FRESH' },
    { x: pad + 100, y: pad + 560, w: 220, h: 55, label: 'AISLE 4 • BAKERY' },

    { x: pad + 400, y: pad + 290, w: 240, h: 55, label: 'AISLE 5 • APPAREL' },
    { x: pad + 400, y: pad + 380, w: 240, h: 55, label: 'AISLE 6 • FOOTWEAR' },
    { x: pad + 400, y: pad + 470, w: 240, h: 55, label: 'AISLE 7 • HOME GOODS' },
    { x: pad + 400, y: pad + 560, w: 240, h: 55, label: 'AISLE 8 • BEAUTY' },

    { x: pad + 740, y: pad + 290, w: 260, h: 55, label: 'AISLE 9 • ELECTRONICS' },
    { x: pad + 740, y: pad + 380, w: 260, h: 55, label: 'AISLE 10 • MOBILE / TECH' },
    { x: pad + 740, y: pad + 470, w: 260, h: 55, label: 'AISLE 11 • APPLIANCES' },
    { x: pad + 740, y: pad + 560, w: 260, h: 55, label: 'AISLE 12 • OUTDOOR' },

    { x: pad + 1080, y: pad + 290, w: 140, h: 140, label: 'CUSTOMER SERVICE' },
    { x: pad + 1080, y: pad + 480, w: 140, h: 140, label: 'CLICK & COLLECT' },
  ];

  aisleRows.forEach((aisle) => {
    ctx.fillRect(aisle.x, aisle.y, aisle.w, aisle.h);
    ctx.strokeRect(aisle.x, aisle.y, aisle.w, aisle.h);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(aisle.label, aisle.x + 10, aisle.y + 32);
    ctx.fillStyle = '#f8fafc';
  });

  // Room Title Banners on Floor Plan
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';

  // Server Room label
  ctx.fillText('SERVER ROOM / MDF', pad + 35, pad + 45);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Climate Controlled • 18°C', pad + 35, pad + 65);

  // Warehouse label
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('STORAGE & BACKROOM WAREHOUSE', pad + 380, pad + 45);

  // Staff room label
  ctx.fillText('STAFF OFFICES & BREAKROOM', pad + 940, pad + 45);

  // Selling Area label
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('STORE SELLING AREA & DISPLAY FLOORS', pad + 420, pad + 245);

  // Checkout label
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('CHECKOUT LANES & REGISTER TERMINALS', pad + 320, pad + 665);

  // Entrance label
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('◄ MAIN STORE ENTRANCE / EXIT ►', pad + 440, pad + planH - 20);

  // Architectural Dimensions markings
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Top dimension: 45.0 Meters
  ctx.beginPath();
  ctx.moveTo(pad, pad - 25);
  ctx.lineTo(pad + planW, pad - 25);
  ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.font = '12px monospace';
  ctx.fillText('◄ ──── 45.0 METERS ──── ►', pad + planW / 2 - 80, pad - 30);

  // Left dimension: 28.0 Meters
  ctx.beginPath();
  ctx.moveTo(pad - 25, pad);
  ctx.lineTo(pad - 25, pad + planH);
  ctx.stroke();
  ctx.save();
  ctx.translate(pad - 30, pad + planH / 2 + 50);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('◄ ──── 28.0 METERS ──── ►', 0, 0);
  ctx.restore();

  ctx.setLineDash([]); // reset dash

  const dataUrl = canvas.toDataURL('image/png', 0.95);

  const floorPlanDocument: FloorPlanDocument = {
    type: 'image',
    backgroundDataUrl: dataUrl,
    originalWidth: width,
    originalHeight: height,
    sourceName: 'Retail-Store-Floorplan-Level1.png',
  };

  // Prepopulate realistic network infrastructure & signal survey
  const sampleMdf: MDFDevice[] = [
    {
      id: 'MDF-01',
      type: 'Server Cabinet',
      location: 'Server Room',
      description: 'Main Server Cabinet (42U Rack)',
      position: { x: 0.14, y: 0.17 },
      notes: 'Contains Core Switch, Router, Firewall & Fiber Patch Panel',
    },
  ];

  const sampleIdf: IDFDevice[] = [
    {
      id: 'IDF-01',
      type: 'Switch Hub',
      area: 'Selling Area',
      location: 'Selling Area / Column B3',
      description: 'Switch Hub for Selling Area (24U Wallmount)',
      position: { x: 0.52, y: 0.38 },
      notes: 'Serves retail floor APs and POS registers 1-4',
    },
    {
      id: 'IDF-02',
      type: 'Switch Hub',
      area: 'Selling Area',
      location: 'Electronics / Customer Service Hub',
      description: 'Switch Hub for Electronics & POS',
      position: { x: 0.82, y: 0.58 },
      notes: 'Serves tech aisles, demo units & Click/Collect',
    },
  ];

  const sampleAps: AccessPoint[] = [
    {
      id: 'AP-01',
      name: 'AP-Grocery-Front',
      location: 'Grocery & Fresh Aisles',
      ssid: 'STORE-WIFI',
      position: { x: 0.22, y: 0.45 },
      notes: 'Ceiling mount 4.5m height',
    },
    {
      id: 'AP-02',
      name: 'AP-Center-Sales',
      location: 'Center Selling Area',
      ssid: 'STORE-WIFI',
      position: { x: 0.48, y: 0.62 },
      notes: 'Covers main promenade and POS 1-3',
    },
    {
      id: 'AP-03',
      name: 'AP-Electronics-Aisle',
      location: 'Electronics & Tech Dept',
      ssid: 'STORE-WIFI',
      position: { x: 0.74, y: 0.42 },
      notes: 'High client density zone',
    },
    {
      id: 'AP-04',
      name: 'AP-Backroom-Warehouse',
      location: 'Storage & Warehouse',
      ssid: 'STORE-WIFI-STAFF',
      position: { x: 0.55, y: 0.18 },
      notes: 'Covers inventory barcode scanners',
    },
  ];

  const sampleSignals: SignalReading[] = [
    // Strong signals near AP-01 (81-100 = 3 bars)
    { id: 'SIG-01', signal: 94, bars: 3, classification: 'Excellent / Strong', position: { x: 0.22, y: 0.48 }, location: 'Aisle 2 - Beverages' },
    { id: 'SIG-02', signal: 88, bars: 3, classification: 'Excellent / Strong', position: { x: 0.17, y: 0.38 }, location: 'Aisle 1 - Grocery' },
    { id: 'SIG-03', signal: 82, bars: 3, classification: 'Excellent / Strong', position: { x: 0.28, y: 0.55 }, location: 'Aisle 3 - Fresh' },

    // Good signals around center (40-80 = 2 bars)
    { id: 'SIG-04', signal: 91, bars: 3, classification: 'Excellent / Strong', position: { x: 0.48, y: 0.64 }, location: 'Center Promenade' },
    { id: 'SIG-05', signal: 76, bars: 2, classification: 'Good / Moderate', position: { x: 0.38, y: 0.74 }, location: 'POS 02 Terminal' },
    { id: 'SIG-06', signal: 68, bars: 2, classification: 'Good / Moderate', position: { x: 0.58, y: 0.74 }, location: 'POS 04 Terminal' },

    // Strong near AP-03
    { id: 'SIG-07', signal: 95, bars: 3, classification: 'Excellent / Strong', position: { x: 0.74, y: 0.44 }, location: 'Electronics Display' },
    { id: 'SIG-08', signal: 85, bars: 3, classification: 'Excellent / Strong', position: { x: 0.82, y: 0.36 }, location: 'Mobile & Tech' },
    { id: 'SIG-09', signal: 72, bars: 2, classification: 'Good / Moderate', position: { x: 0.88, y: 0.48 }, location: 'Customer Service' },

    // Warehouse & Staff
    { id: 'SIG-10', signal: 89, bars: 3, classification: 'Excellent / Strong', position: { x: 0.55, y: 0.20 }, location: 'Warehouse Bay 2' },
    { id: 'SIG-11', signal: 64, bars: 2, classification: 'Good / Moderate', position: { x: 0.75, y: 0.18 }, location: 'Warehouse Bay 4' },

    // Weak coverage edge spots (0-39 = 1 bar) for realistic site survey!
    { id: 'SIG-12', signal: 32, bars: 1, classification: 'Weak', position: { x: 0.11, y: 0.78 }, location: 'Far West Corner / Storage' },
    { id: 'SIG-13', signal: 28, bars: 1, classification: 'Weak', position: { x: 0.92, y: 0.82 }, location: 'Far East Click & Collect' },
    { id: 'SIG-14', signal: 36, bars: 1, classification: 'Weak', position: { x: 0.94, y: 0.16 }, location: 'Staff Restroom corridor' },
  ];

  // Pre-linked LAN cables as defined in requirements #50-#55, #61, #73
  const sampleCables: LanCable[] = [
    {
      id: 'LAN-01',
      fromId: 'MDF-01',
      fromName: 'MDF-01 (Server Cabinet)',
      toId: 'IDF-01',
      toName: 'IDF-01 (Selling Area)',
      length: 35,
      unit: 'meters',
      cableType: 'CAT6',
      route: [
        { x: 0.14, y: 0.17 },
        { x: 0.28, y: 0.17 },
        { x: 0.28, y: 0.38 },
        { x: 0.52, y: 0.38 },
      ],
      notes: 'Main network uplink through ceiling cable tray',
    },
    {
      id: 'LAN-02',
      fromId: 'MDF-01',
      fromName: 'MDF-01 (Server Cabinet)',
      toId: 'IDF-02',
      toName: 'IDF-02 (Electronics Hub)',
      length: 52,
      unit: 'meters',
      cableType: 'Fiber',
      route: [
        { x: 0.14, y: 0.17 },
        { x: 0.65, y: 0.12 },
        { x: 0.82, y: 0.12 },
        { x: 0.82, y: 0.58 },
      ],
      notes: '10G OM4 Fiber Backbone uplink to secondary IDF',
    },
    {
      id: 'LAN-03',
      fromId: 'IDF-01',
      fromName: 'IDF-01 (Selling Area)',
      toId: 'AP-01',
      toName: 'AP-01 (Grocery & Fresh)',
      length: 18,
      unit: 'meters',
      cableType: 'CAT6',
      route: [
        { x: 0.52, y: 0.38 },
        { x: 0.34, y: 0.38 },
        { x: 0.22, y: 0.45 },
      ],
      notes: 'PoE+ drop to ceiling AP-01',
    },
    {
      id: 'LAN-04',
      fromId: 'IDF-01',
      fromName: 'IDF-01 (Selling Area)',
      toId: 'AP-02',
      toName: 'AP-02 (Center Sales)',
      length: 24,
      unit: 'meters',
      cableType: 'CAT6',
      route: [
        { x: 0.52, y: 0.38 },
        { x: 0.52, y: 0.52 },
        { x: 0.48, y: 0.62 },
      ],
      notes: 'PoE+ drop to center AP-02',
    },
    {
      id: 'LAN-05',
      fromId: 'IDF-02',
      fromName: 'IDF-02 (Electronics Hub)',
      toId: 'AP-03',
      toName: 'AP-03 (Electronics)',
      length: 19,
      unit: 'meters',
      cableType: 'CAT6A',
      route: [
        { x: 0.82, y: 0.58 },
        { x: 0.74, y: 0.58 },
        { x: 0.74, y: 0.42 },
      ],
      notes: 'CAT6A shielded run for high interference zone',
    },
    {
      id: 'LAN-06',
      fromId: 'MDF-01',
      fromName: 'MDF-01 (Server Cabinet)',
      toId: 'AP-04',
      toName: 'AP-04 (Warehouse)',
      length: 26,
      unit: 'meters',
      cableType: 'CAT6',
      route: [
        { x: 0.14, y: 0.17 },
        { x: 0.40, y: 0.17 },
        { x: 0.55, y: 0.18 },
      ],
      notes: 'Direct warehouse ceiling run',
    },
  ];

  return {
    document: floorPlanDocument,
    sampleMdf,
    sampleIdf,
    sampleAps,
    sampleSignals,
    sampleCables,
  };
}
