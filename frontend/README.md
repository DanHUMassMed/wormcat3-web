# WormCat 3 Web - Frontend ⚛️🎨

[![React](https://img.shields.io/badge/React-19.1+-61DAFB.svg)](https://react.dev/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245.svg)](https://reactrouter.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12+-0055FF.svg)](https://www.framer.com/motion/)

> The user interface for **WormCat 3 Web**. Built with React 19, Tailwind CSS, and Framer Motion, providing an intuitive, interactive experience for submitting genomic analysis jobs and viewing high-resolution SVG enrichment plots and statistics.

---

## 🚀 Key Features & UI Workflows

- **Enrichment Submission (RGS)**: Input gene lists, choose custom annotations, select p-value adjustment algorithms (`bonferroni`, `fdr_bh`), and set significance thresholds.
- **Batch Processing**: Drag-and-drop batch submission interface for multi-sample datasets.
- **Ranked GSEA**: Upload ranked gene metric files for continuous Gene Set Enrichment Analysis.
- **Interactive Report Viewer**: Real-time polling for job status with interactive plot tabs, zoomable SVG charts, and tabular download links (CSV, Excel).
- **Responsive Design**: Mobile and desktop friendly layouts with smooth animations powered by Framer Motion and Lucide icons.

---

## 🗺️ Application Routing

The application uses **React Router v7** for declarative client-side routing:

| Route Path | Component | Purpose |
| :--- | :--- | :--- |
| `/` | `WormCatEnrichmentForm` | Single Gene Set Enrichment Analysis submission |
| `/batch` | `WormCatBatchForm` | High-throughput batch enrichment job submission |
| `/gsea` | `WormCatGSEAForm` | Ranked Gene Set Enrichment Analysis submission |
| `/report/:run_id` | `WormCatEnrichmentReport` | Interactive report viewer for RGS and Batch runs |
| `/gsea_report/:run_id` | `WormCatGSEAReport` | Interactive report viewer for GSEA runs |

---

## 📂 Frontend Architecture & Component Structure

```text
frontend/
├── public/
│   ├── static/download/      # Reference genome annotation CSVs
│   └── index.html             # HTML entry template
├── src/
│   ├── api/                   # REST API clients communicating with FastAPI
│   │   ├── enrichmentAPI.js   # RGS API calls & payload mapping
│   │   ├── batchAPI.js        # Batch processing API integration
│   │   └── gseaAPI.js         # GSEA API endpoints
│   ├── components/            # UI Components
│   │   ├── WormCatEnrichmentForm.js   # RGS submission form
│   │   ├── WormCatBatchForm.js        # Batch submission form
│   │   ├── WormCatGSEAForm.js         # GSEA submission form
│   │   ├── WormCatEnrichmentReport.js # RGS interactive plot & table viewer
│   │   ├── WormCatGSEAReport.js        # GSEA plot & metric report viewer
│   │   ├── Header.js                  # Main navigation bar
│   │   ├── Footer.js                  # Footer with version & links
│   │   └── Layout.js                  # Shared application shell layout
│   ├── hooks/                 # Custom React hooks (e.g., usePageTracking)
│   ├── test/                  # Frontend API integration tests (AVA)
│   ├── App.js                 # Router setup & main component
│   └── index.js               # React DOM render entrypoint
├── run_react.sh               # Runner script (dev server or Express server)
├── server.js                  # Express static server for production builds
├── sys_react.sh               # System control script integration
└── package.json               # Dependencies & build scripts
```

---

## ⚙️ Environment Configuration

Configuration files are maintained for different environments:

- `.env` / `env.dev`: Local development configuration
- `env.prod`: Production deployment settings

### Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | Base URL for FastAPI backend endpoints | `http://localhost:8000` |
| `REACT_APP_PORT` | Port for Express production static server | `9000` |

---

## 🛠️ Scripts & Commands

From the `frontend/` directory:

### Development Mode

```bash
npm start
```
Starts the Webpack development server at `http://localhost:3000` with hot-reloading.

### Production Build & Local Serve

```bash
npm run build
node server.js
```
Bundles optimized static assets into `build/` and starts the Express production server (`server.js`) on port `9000`.

### Orchestrated Control (`run_react.sh`)

```bash
./run_react.sh dev   # Starts npm dev server
./run_react.sh prod  # Builds React app & launches Express server.js
```

---

## 🧪 Testing

Run API integration tests:

```bash
npx ava src/test/api/enrichmentAPI.test.mjs
```

Run unit tests via React Scripts:

```bash
npm test
```
