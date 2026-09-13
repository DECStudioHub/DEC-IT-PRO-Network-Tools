# DEC IT PRO Network Tools
### Store WiFi Hitmap & Network Infrastructure Planner

[![Deploy DEC IT PRO Network Tool to GitHub Pages](https://github.com/DECStudioHub/DEC-IT-PRO-Network-Tools/actions/workflows/deploy.yml/badge.svg)](https://github.com/DECStudioHub/DEC-IT-PRO-Network-Tools/actions/workflows/deploy.yml)

A client-side web application designed for IT infrastructure teams, store network engineers, and site surveyors. The application allows users to upload architectural floor plans (PNG, JPG, or multi-page vector PDF), calibrate real-world scale, place MDF/IDF network distribution cabinets and wireless access points, draw point-to-point and multi-segment LAN cable routes with real-world distance calculation, perform WiFi signal level site surveys, and export multi-page engineering PDF reports and high-resolution composite hitmap diagrams.

---

## Key Capabilities

1. **Floor Plan Ingestion & Calibration**
   * High-resolution rendering of raster images (PNG, JPG, JPEG) and vector architectural documents (PDF) via PDF.js.
   * Multi-page PDF viewer with visual page selector and resolution-scaling rasterizer.
   * Two-point interactive scale calibration with user-defined real-world meter reference and dynamic meter-per-pixel calculations.

2. **Network Infrastructure Asset Management**
   * **MDF (Main Distribution Facility):** Server cabinets and core network distribution nodes with rack size and equipment descriptors.
   * **IDF (Intermediate Distribution Facility):** Switch hubs, patch panels, and sub-distribution wallmount cabinets with dedicated area tags.
   * **Access Points (APs):** AP layout with configurable SSID, mounting height, and channel metadata.
   * Visual icon custom styling (shape, color, size, WiFi broadcast wave style).

3. **LAN Structured Cabling Engine**
   * Interactive multi-waypoint cable routing tool with auto-snapping to hardware device ports.
   * Real-world cable length estimation calculated directly from the calibrated floor plan scale.
   * Cable categories: Cat5e, Cat6, Cat6A, Cat7, and Fiber Optic with distinct standard-compliant styling.
   * Interactive draggable cable length badges with collision-free placement.

4. **WiFi Hitmap & Signal Survey Analysis**
   * Physical signal measurement recording (dBm and percentage).
   * Inverse-Distance-Weighted (IDW) smooth radial heatmap gradient rendering.
   * Real-time analytical evaluation categorizing signal coverage:
     * **Strong (81–100%)**: High-speed operations, POS terminals, handheld mobile scanners.
     * **Moderate (40–80%)**: Standard browsing, general retail, customer connectivity.
     * **Weak (0–39%)**: Coverage dead zones requiring additional AP drops.
   * **Honest Data Integrity:** Enforces explicit disclosure when fewer than 3 physical measurements exist to prevent premature extrapolation or synthetic generalizations.

5. **Local Persistence & Safe Project Management**
   * Fully client-side browser persistence via `localStorage`.
   * **Atomic Undo/Redo Engine:** 60-state history stack tracking node additions, deletions, repositioning, and scale adjustments with keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y` / `Ctrl+Shift+Z`).
   * **Save & Save As:** Download complete project state as portable, validated `.project` / `.json` files.
   * **Project Sanitization & Security:** Deep validation schema preventing corrupt coordinates, missing routes, or malicious payloads on load.
   * **Unsaved Changes Protection:** Prevents accidental navigation, tab closing, or project overwrites with a confirmation dialog.

6. **Professional Engineering Export**
   * **Multi-Page Engineering PDF Report:** Generated entirely client-side using `jspdf`, formatted in A4 Landscape/Portrait or US Letter with title pages, architectural floor plan, hardware schedules, cable runs, and signal insights.
   * **Composite PNG Export:** High-resolution floor plan with all active layers, customizable overlay toggles, title banner, and metadata stamp.

---

## Production Deployment to GitHub

This repository is configured for automated build and deployment to **GitHub Pages** at:

`https://DECStudioHub.github.io/DEC-IT-PRO-Network-Tools/`

### Automated Deployment (GitHub Actions)

1. Ensure the repository has GitHub Pages enabled under **Settings > Pages**:
   * **Source:** *GitHub Actions*
2. Pushing code to `main` or `master` automatically triggers `.github/workflows/deploy.yml`:
   * Installs production dependencies.
   * Runs TypeScript validation (`tsc --noEmit`).
   * Builds production assets to `dist/` with the repository subpath base.
   * Deploys the static bundle to GitHub Pages.

---

## Local Development & Build Instructions

### Prerequisites
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/DECStudioHub/DEC-IT-PRO-Network-Tools.git
cd DEC-IT-PRO-Network-Tools
npm install
```

### 2. Run Development Server
Start the local Vite development server:
```bash
npm run dev
```
The application will be accessible at:
```
http://localhost:3000
```

### 3. Type Checking & Code Validation
Run the TypeScript compiler in check-only mode:
```bash
npm run lint
```

### 4. Build for Production
To generate an optimized, production-ready static bundle in the `dist/` directory:
```bash
npm run build
```

To test the production build locally:
```bash
npm run preview
```

To build specifically for GitHub Pages under the `DEC-IT-PRO-Network-Tool` subpath:
```bash
npm run build:gh-pages
```

---

## Project Structure

```
DEC-IT-PRO-Network-Tool/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated GitHub Actions Pages deployment
├── public/                       # Static public assets
├── src/
│   ├── components/               # Modular UI Components
│   │   ├── Canvas/               # Interactive Canvas & Hitmap Renderer
│   │   ├── Modals/               # Dialogs (Save, Save As, Export, Equipment)
│   │   ├── Sidebar/              # Left/Right Panels & Asset Schedules
│   │   └── Toolbar.tsx           # Primary tool ribbon & quick actions
│   ├── utils/                    # Core Engineering Logic & Utilities
│   │   ├── exportComposite.ts    # High-resolution composite PNG rendering
│   │   ├── historyManager.ts     # 60-state atomic Undo/Redo stack
│   │   ├── insightsAnalyzer.ts   # WiFi signal and coverage analytics
│   │   ├── pdfLoader.ts          # PDF.js document loader and renderer
│   │   ├── pdfReportGenerator.ts # Multi-page engineering PDF generation
│   │   ├── projectValidation.ts  # Input sanitization and schema verification
│   │   └── sampleFloorPlan.ts    # Default demo architecture and survey
│   ├── App.tsx                   # Main application orchestration component
│   ├── index.css                 # Global Tailwind CSS entry
│   ├── main.tsx                  # React DOM root entry
│   └── types.ts                  # Shared TypeScript interfaces & types
├── .env.example                  # Environment configuration documentation
├── .gitignore                    # Git ignore configuration
├── metadata.json                 # AI Studio application metadata
├── package.json                  # Dependencies and build scripts
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite build and base path configuration
```

---

## Data Integrity & Security Policy

* **Zero External Telemetry:** All floor plan files, project definitions, and WiFi surveys remain strictly within the client's local browser sandbox.
* **Untrusted File Input Hardening:** All loaded `.project` / `.json` files undergo schema validation and boundary checks via `projectValidation.ts` to neutralize malformed data or injection risks.
* **Factual Analytics:** The insights analyzer enforces clear visual indicators when survey points are sparse (<3 readings) and strictly avoids fabricating signal interpolations.

---

## License

This project is licensed under the **Apache License 2.0**.
