# 📄 OCR PDF Studio

A local web application that converts scanned/image-based PDFs into searchable PDFs with a selectable text layer — powered by **Tesseract OCR**, **Ghostscript**, and **OCRmyPDF**.

All processing happens **locally on your machine**. No data is sent to any external server.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## ✨ Features

- **Chunked uploads** — handles large PDFs (100 MB+) by streaming in 8 MB chunks
- **Background OCR processing** — jobs run asynchronously with real-time progress polling
- **Automatic PDF repair** — fixes corrupted PDFs with circular references before OCR
- **Searchable PDF output** — adds an invisible text layer; original images are preserved
- **Skip already-OCR'd pages** — won't re-process pages that already have a text layer
- **100% local & private** — files never leave your machine

---

## 🏗️ Architecture

```
┌──────────────┐        HTTP API        ┌──────────────────┐
│   React UI   │  ◄──────────────────►  │   FastAPI Server │
│  (Vite:5173) │                        │   (Uvicorn:8000) │
└──────────────┘                        └────────┬─────────┘
                                                 │
                                        ┌────────▼─────────┐
                                        │   OCR Pipeline    │
                                        │  pikepdf repair   │
                                        │  → OCRmyPDF       │
                                        │  → Tesseract      │
                                        │  → Ghostscript    │
                                        └──────────────────┘
```

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React 18 + Vite | Upload UI, progress tracking, download |
| Backend | FastAPI + Uvicorn | REST API, chunked upload, job management |
| OCR Engine | OCRmyPDF | Orchestrates Tesseract + Ghostscript |
| PDF Repair | pikepdf | Fixes broken PDF structures pre-OCR |

---

## 📋 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Python** | 3.10+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Tesseract OCR** | 5.x | `winget install UB-Mannheim.TesseractOCR` |
| **Ghostscript** | 10.x | [Download](https://ghostscript.com/releases/gsdnld.html) |

> **Important:** After installing Tesseract and Ghostscript, ensure both are on your system `PATH`.
>
> Default install locations on Windows:
> - Tesseract: `C:\Program Files\Tesseract-OCR`
> - Ghostscript: `C:\Program Files\gs\gs<version>\bin`

---

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/stranger0407/ocr-pdf-studio.git
cd ocr-pdf-studio
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

### 3. Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

### 5. Use it

Open **http://localhost:5173** in your browser:

1. Select a scanned PDF
2. Click **Start OCR**
3. Wait for processing to complete
4. Click **Download searchable PDF**

---

## ⚙️ Configuration

Edit `backend/.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `OCR_LANG` | `eng` | Tesseract language pack (e.g., `eng+hin` for English + Hindi) |
| `OCR_JOBS` | `2` | Parallel OCR threads (increase for faster processing) |
| `UPLOAD_CHUNK_SIZE_BYTES` | `8388608` | Upload chunk size in bytes (default 8 MB) |

---

## 📁 Project Structure

```
ocr-pdf-studio/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app & API routes
│   │   ├── config.py        # Settings & environment config
│   │   ├── storage.py       # Chunked upload management
│   │   ├── jobs.py          # Job creation & tracking
│   │   └── ocr_local.py     # PDF repair + OCR pipeline
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── api.js           # API client functions
│   │   ├── main.jsx         # Entry point
│   │   └── styles.css       # UI styles
│   ├── index.html
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/uploads/start` | Start a chunked upload session |
| `PUT` | `/api/uploads/{id}/chunk?index=N` | Upload a single chunk |
| `POST` | `/api/uploads/{id}/complete` | Finalize the upload |
| `POST` | `/api/jobs` | Start an OCR job |
| `GET` | `/api/jobs/{id}` | Get job status & progress |
| `GET` | `/api/jobs/{id}/download` | Download the processed PDF |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Ghostscript rasterizing failed` | Your PDF may have structural issues. The app auto-repairs, but ensure Ghostscript is on PATH |
| `tesseract is not recognized` | Add Tesseract install directory to system PATH |
| `gswin64c is not recognized` | Add Ghostscript `bin` directory to system PATH |
| OCR is very slow | Increase `OCR_JOBS` in `.env` (match your CPU core count) |
| Large file upload fails | Check available disk space (need ~3x the PDF size) |

---

## 📜 License

MIT

---

## 🙏 Acknowledgements

- [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) — the OCR engine
- [Tesseract](https://github.com/tesseract-ocr/tesseract) — text recognition
- [pikepdf](https://github.com/pikepdf/pikepdf) — PDF repair & manipulation
- [FastAPI](https://fastapi.tiangolo.com/) — backend framework
- [Vite](https://vitejs.dev/) + [React](https://react.dev/) — frontend
