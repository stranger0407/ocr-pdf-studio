<div align="center">

# OCR PDF Studio

**Convert scanned PDFs into searchable documents — fast, private, and local.**

A full-featured OCR application available as both a **web app** and a **Windows desktop installer**.
All processing runs 100% locally on your machine. Your files never leave your computer.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Electron](https://img.shields.io/badge/Electron-29-47848F?style=flat-square&logo=electron&logoColor=white)](https://electronjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **3 Quality Presets** | Fast (200 DPI), Standard (300 DPI), Maximum (400 DPI) — choose speed vs. quality |
| **Text-Only Overlay** | Standard/Maximum modes preserve original image quality perfectly |
| **Parallel OCR** | Utilizes all CPU cores for maximum processing speed |
| **Chunked Uploads** | Handles large PDFs (up to 1 GB) via 8 MB streaming chunks |
| **Dark / Light Theme** | Toggle between themes; preference persists across sessions |
| **In-App Documentation** | Built-in user manual with getting started guide and troubleshooting |
| **Report Error** | One-click bug report pre-fills an email with error context |
| **Desktop Installer** | One-click Windows `.exe` installer — no terminal needed |
| **100% Private** | All files stay on your machine; zero external data transfer |

---

## 🖥️ Two Ways to Use

### Option 1: Web App (Developer Setup)

Run the frontend and backend locally in your browser. Best for development or if you want full control.

### Option 2: Desktop App (Windows Installer)

A standalone `.exe` installer that bundles everything — Electron shell, Python backend, and Tesseract. Double-click to install, launch from Start Menu.

> Download the latest installer from [Releases](https://github.com/stranger0407/ocr-pdf-studio/releases).

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Electron Shell (Desktop)                   │
│  ┌──────────────┐       HTTP API       ┌────────────────────┐ │
│  │   React UI   │  ◄─────────────────► │  FastAPI Backend   │ │
│  │  (Vite:5173) │                      │  (Uvicorn:8000)    │ │
│  └──────────────┘                      └────────┬───────────┘ │
│                                                  │             │
│                                        ┌─────────▼──────────┐ │
│                                        │   OCR Pipeline      │ │
│                                        │  PyMuPDF → render   │ │
│                                        │  Tesseract → OCR    │ │
│                                        │  pikepdf → merge    │ │
│                                        └────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React 18 + Vite | Upload UI, quality selector, theme, progress tracking |
| Backend | FastAPI + Uvicorn | REST API, chunked uploads, job queue |
| OCR Engine | Tesseract 5.x | Text recognition from rendered page images |
| PDF Rendering | PyMuPDF (fitz) | High-DPI page rendering + text overlay composition |
| PDF Assembly | pikepdf | Merging, repair, and linearization |
| Desktop Shell | Electron 29 | Native Windows wrapper with auto backend lifecycle |

---

## 🚀 Quick Start (Web App)

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Python** | 3.10+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Tesseract OCR** | 5.x | `winget install UB-Mannheim.TesseractOCR` |

### 1. Clone & Setup Backend

```bash
git clone https://github.com/stranger0407/ocr-pdf-studio.git
cd ocr-pdf-studio/backend

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux
```

### 2. Start the Backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Start the Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

### 4. Use It

Open **http://localhost:5173** → Select PDF → Choose quality → Start OCR → Download.

---

## 🖥️ Desktop Build (Windows Installer)

Build a standalone `.exe` installer that bundles everything:

### Prerequisites (build machine only)

- Node.js 18+, Python 3.10+, Tesseract 5.x

### Optional: Bundle Tesseract for Offline Use

Place Tesseract binaries here so the installer is fully self-contained:

```
desktop/vendor/tesseract/tesseract.exe
desktop/vendor/tesseract/tessdata/eng.traineddata
```

### Build the Installer

```powershell
cd desktop
npm run build
```

This runs three steps automatically:
1. **Frontend** → `npm run build` (Vite production bundle)
2. **Backend** → PyInstaller (frozen `ocr-backend.exe`)
3. **Installer** → electron-builder (NSIS `.exe` installer)

Output: `dist-desktop/OCR-PDF-Studio-1.2.0-setup.exe`

---

## ⚡ Quality Presets

| Preset | DPI | Speed | OCR Accuracy | Best For |
|--------|-----|-------|--------------|----------|
| **Fast** | 200 | ~1x (baseline) | ~85% | Quick previews, drafts |
| **Standard** ⭐ | 300 | ~1.5-2x | ~95% | Daily use, sharing |
| **Maximum** | 400 | ~3-4x | ~97% | Archival, print-ready |

> **Standard** and **Maximum** use a text-overlay technique: Tesseract generates an invisible text layer that is composited over the original high-resolution page images. This preserves pixel-perfect image quality while making the document fully searchable.

---

## ⚙️ Configuration

Edit `backend/.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `TESSERACT_CMD` | Auto-detected | Path to `tesseract.exe` |
| `OCR_DPI` | `300` | Render resolution for OCR |
| `OCR_LANG` | `eng` | Tesseract language pack (e.g., `eng+hin`) |
| `OCR_QUALITY` | `standard` | Default quality preset |
| `UPLOAD_CHUNK_SIZE_BYTES` | `8388608` | Chunk size (8 MB) |

---

## 📁 Project Structure

```
ocr-pdf-studio/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI routes & middleware
│   │   ├── config.py            # Settings, quality presets, env vars
│   │   ├── ocr_local.py         # Core OCR pipeline (render → OCR → overlay → merge)
│   │   ├── storage.py           # Chunked upload manager
│   │   ├── jobs.py              # Background job queue
│   │   └── logging_utils.py     # Structured logging & system info
│   ├── launcher.py              # PyInstaller entry point
│   ├── ocr_backend.spec         # PyInstaller build spec
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app (theme, docs, about, upload)
│   │   ├── icons.jsx            # SVG icon components
│   │   ├── api.js               # Backend API client
│   │   └── styles.css           # Design system (light + dark themes)
│   └── index.html
├── desktop/
│   ├── main.js                  # Electron main process
│   ├── preload.js               # Context bridge
│   ├── scripts/
│   │   ├── build.ps1            # Full build pipeline
│   │   └── dev.ps1              # Dev mode launcher
│   └── package.json             # electron-builder config
├── .gitignore
└── README.md
```

---

## 🔧 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/uploads/start` | Start chunked upload session |
| `PUT` | `/api/uploads/{id}/chunk?index=N` | Upload a single chunk |
| `POST` | `/api/uploads/{id}/complete` | Finalize upload |
| `POST` | `/api/jobs` | Start OCR job (accepts `quality` param) |
| `GET` | `/api/jobs/{id}` | Job status & progress |
| `GET` | `/api/jobs/{id}/download` | Download processed PDF |
| `GET` | `/api/logs` | Application logs & system info |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tesseract not found | Ensure it's installed and on PATH, or set `TESSERACT_CMD` in `.env` |
| OCR is slow | Use Fast preset, or close CPU-heavy apps. More cores = faster |
| Text not searchable after OCR | Verify correct language pack is installed for Tesseract |
| Large file upload fails | Ensure enough disk space (~3x PDF size needed during processing) |
| Desktop app won't start | Check logs at `%APPDATA%/ocr-pdf-studio-desktop/logs/backend.log` |

---

## 👤 Author

**Raja** — [@stranger0407](https://github.com/stranger0407)

- 📧 Email: [rgjha2001@gmail.com](mailto:rgjha2001@gmail.com)
- 🐙 GitHub: [github.com/stranger0407](https://github.com/stranger0407)
- 🐛 Found a bug? [Open an issue](https://github.com/stranger0407/ocr-pdf-studio/issues) or [email me](mailto:rgjha2001@gmail.com?subject=OCR%20PDF%20Studio%20—%20Bug%20Report)

---

## 📜 License

MIT — free for personal and commercial use.

---

## 🙏 Acknowledgements

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) — text recognition engine
- [PyMuPDF](https://github.com/pymupdf/PyMuPDF) — PDF rendering & composition
- [pikepdf](https://github.com/pikepdf/pikepdf) — PDF repair, merge & linearization
- [FastAPI](https://fastapi.tiangolo.com/) — backend framework
- [Electron](https://electronjs.org/) — desktop shell
- [Vite](https://vitejs.dev/) + [React](https://react.dev/) — frontend
