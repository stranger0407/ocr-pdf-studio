import { useEffect, useMemo, useState } from "react";
import { completeUpload, downloadUrl, getJob, getLogs, startJob, startUpload, uploadChunk } from "./api.js";
import { Sun, Moon, FileText, BookOpen, Terminal, User, Upload, Download, X, RefreshCw, Copy, Check, Github, Mail, AlertTriangle, Zap, Star, Gem, Package } from "./icons.jsx";

const MB = 1024 * 1024;
const VER = "1.2.0";
const fmt = (v) => !v && v !== 0 ? "-" : v < MB ? `${v} B` : v < MB * 1024 ? `${(v / MB).toFixed(1)} MB` : `${(v / (MB * 1024)).toFixed(2)} GB`;

/* ---- Theme ---- */
function useTheme() {
  const [t, setT] = useState(() => { try { return localStorage.getItem("ocr-theme") || "light"; } catch { return "light"; } });
  useEffect(() => { document.documentElement.setAttribute("data-theme", t); try { localStorage.setItem("ocr-theme", t); } catch {} }, [t]);
  return [t, () => setT(p => p === "dark" ? "light" : "dark")];
}

/* ================================================================
   Log Viewer
   ================================================================ */
function LogViewer({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [sys, setSys] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetch_ = async () => { setLoading(true); try { const d = await getLogs(300); setEntries(d.entries || []); setSys(d.system || null); } catch { setEntries([{ ts: "", level: "ERROR", source: "ui", message: "Failed to fetch" }]); } setLoading(false); };
  useEffect(() => { fetch_(); }, []);

  const txt = useMemo(() => {
    const s = sys ? [`=== System ===`, `CPU: ${sys.cpu_count}`, `Tesseract: ${sys.tesseract_cmd} (${sys.tesseract_exists})`, `DPI: ${sys.ocr_dpi}`, `Lang: ${sys.ocr_lang}`, "", `=== Logs ===`] : [];
    return [...s, ...entries.map(e => `[${e.ts}] [${e.level}] [${e.source}]${e.job_id ? ` [${e.job_id.slice(0, 8)}]` : ""} ${e.message}`)].join("\n");
  }, [entries, sys]);

  const cp = async () => { try { await navigator.clipboard.writeText(txt); } catch { const a = document.createElement("textarea"); a.value = txt; document.body.appendChild(a); a.select(); document.execCommand("copy"); document.body.removeChild(a); } setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-header">
          <h2><Terminal size={18} /> Application Logs</h2>
          <div className="modal-actions">
            <button className="modal-btn" onClick={fetch_}><RefreshCw size={13} /> Refresh</button>
            <button className="modal-btn" onClick={cp}>{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button>
            <button className="modal-btn modal-close" onClick={onClose}><X size={13} /></button>
          </div>
        </div>
        {sys && <div className="sys-info-bar"><span>CPU: <strong>{sys.cpu_count} cores</strong></span><span>Tesseract: <strong>{sys.tesseract_exists ? "Yes" : "No"}</strong></span><span>DPI: <strong>{sys.ocr_dpi}</strong></span><span>Lang: <strong>{sys.ocr_lang}</strong></span></div>}
        <div className="modal-body">
          {loading ? <p className="log-empty">Loading...</p> : entries.length === 0 ? <p className="log-empty">No log entries yet. Run an OCR job to generate logs.</p> : (
            <div className="log-list">{entries.map((e, i) => (
              <div key={i} className={`log-row ${e.level === "ERROR" ? "is-error" : ""}`}>
                <span className="log-ts">{e.ts}</span>
                <span className={`log-lv ${e.level.toLowerCase()}`}>{e.level}</span>
                <span className="log-src">{e.source}</span>
                {e.job_id && <span className="log-jid">{e.job_id.slice(0, 8)}</span>}
                <span className="log-message">{e.message}</span>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Documentation
   ================================================================ */
function DocsPanel({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-header">
          <h2><BookOpen size={18} /> User Manual</h2>
          <div className="modal-actions"><button className="modal-btn modal-close" onClick={onClose}><X size={13} /></button></div>
        </div>
        <div className="modal-body docs">
          <h3><Zap size={16} /> Quick Start</h3>
          <p>OCR PDF Studio converts scanned PDF documents into searchable, selectable-text PDFs using Tesseract OCR engine. Everything runs locally — your files never leave your computer.</p>
          <ol>
            <li><span className="doc-step-num">1</span><strong>Select a PDF</strong> — Click the upload area or drag a scanned PDF file (up to 1 GB supported)</li>
            <li><span className="doc-step-num">2</span><strong>Choose Quality</strong> — Select a quality preset based on your speed vs. quality needs</li>
            <li><span className="doc-step-num">3</span><strong>Start OCR</strong> — Files upload in chunks, then OCR processing begins automatically</li>
            <li><span className="doc-step-num">4</span><strong>Download</strong> — Once complete, download your new searchable PDF</li>
          </ol>

          <h3><Star size={16} /> Quality Presets</h3>
          <table><thead><tr><th>Preset</th><th>DPI</th><th>Speed</th><th>Best For</th></tr></thead><tbody>
            <tr><td><strong>Fast</strong></td><td>200</td><td>Fastest</td><td>Quick previews, drafts</td></tr>
            <tr><td><strong>Standard</strong></td><td>300</td><td>~1.5-2x</td><td>Daily use, sharing (recommended)</td></tr>
            <tr><td><strong>Maximum</strong></td><td>400</td><td>~3-4x</td><td>Archival, print-ready documents</td></tr>
          </tbody></table>
          <div className="doc-callout"><strong>Pro Tip:</strong> Standard and Maximum modes use a text-overlay technique that preserves original image quality perfectly while adding an invisible searchable text layer.</div>

          <h3><Package size={16} /> How It Works</h3>
          <ul>
            <li><strong>Chunked Upload</strong> — Large files are split into 8 MB chunks for reliable transfer</li>
            <li><strong>Page Rendering</strong> — Each PDF page is rendered to a high-DPI image using PyMuPDF</li>
            <li><strong>Parallel OCR</strong> — Multiple Tesseract processes run simultaneously across all CPU cores</li>
            <li><strong>Text Overlay</strong> — In Standard/Maximum mode, an invisible text layer is composited over original images for pixel-perfect quality</li>
            <li><strong>PDF Assembly</strong> — All pages are merged into a single optimized, linearized PDF</li>
          </ul>

          <h3><Terminal size={16} /> System Requirements</h3>
          <ul>
            <li><strong>Tesseract OCR</strong> — Must be installed. Default path: <code>C:\Program Files\Tesseract-OCR\tesseract.exe</code></li>
            <li><strong>Python 3.10+</strong> — Backend runs FastAPI with PyMuPDF and pikepdf</li>
            <li><strong>CPU Cores</strong> — More cores = faster processing (fully parallel OCR)</li>
          </ul>

          <h3><FileText size={16} /> Configuration</h3>
          <table><thead><tr><th>Variable</th><th>Default</th><th>Description</th></tr></thead><tbody>
            <tr><td><code>TESSERACT_CMD</code></td><td>Auto-detected</td><td>Path to tesseract executable</td></tr>
            <tr><td><code>OCR_DPI</code></td><td>300</td><td>Render resolution</td></tr>
            <tr><td><code>OCR_LANG</code></td><td>eng</td><td>Tesseract language pack</td></tr>
            <tr><td><code>OCR_QUALITY</code></td><td>standard</td><td>Default quality preset</td></tr>
          </tbody></table>

          <h3><AlertTriangle size={16} /> Troubleshooting</h3>
          <ul>
            <li><strong>OCR is slow</strong> — Use Fast preset, or close CPU-heavy applications</li>
            <li><strong>Text not searchable</strong> — Verify the correct Tesseract language pack is installed</li>
            <li><strong>Tesseract not found</strong> — Check Logs panel for system info; verify installation path</li>
            <li><strong>Upload fails</strong> — For very large files, ensure stable connection; chunked upload handles up to 1 GB</li>
            <li><strong>Found a bug?</strong> — Use the Report Error button or email <code>rgjha2001@gmail.com</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   About
   ================================================================ */
function AboutPanel({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2><User size={18} /> About</h2>
          <div className="modal-actions"><button className="modal-btn modal-close" onClick={onClose}><X size={13} /></button></div>
        </div>
        <div className="modal-body about">
          <div className="about-icon"><User size={28} /></div>
          <p className="about-name">Raja</p>
          <p className="about-handle">@stranger0407</p>
          <p className="about-bio">Full-stack developer building tools that make document processing accessible, efficient, and private. OCR PDF Studio was created to solve the real-world problem of making scanned documents searchable — fast, local, and free.</p>
          <div className="about-links">
            <a className="about-link" href="https://github.com/stranger0407" target="_blank" rel="noopener noreferrer"><Github size={15} /> GitHub</a>
            <a className="about-link" href="https://github.com/stranger0407/ocr-pdf-studio" target="_blank" rel="noopener noreferrer"><Package size={15} /> Source Code</a>
            <a className="about-link" href="mailto:rgjha2001@gmail.com"><Mail size={15} /> rgjha2001@gmail.com</a>
          </div>
          <hr className="about-divider" />
          <p className="about-tagline">If you have any query, shoot on it!</p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Main App
   ================================================================ */
export default function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState("Ready to upload a PDF.");
  const [quality, setQuality] = useState("standard");
  const [showLogs, setShowLogs] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [theme, toggleTheme] = useTheme();

  const canStart = useMemo(() => file && status !== "uploading" && status !== "processing", [file, status]);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "error") return;
    const id = job.job_id; let off = false;
    const iv = setInterval(async () => {
      if (off) return;
      try { const u = await getJob(id); if (off) return; setJob(u); setStatus(u.status === "queued" ? "processing" : u.status); if (u.message) setLog(u.message); }
      catch (e) { if (!off && !(e.message || "").toLowerCase().includes("not found")) setError(e.message); }
    }, 3000);
    return () => { off = true; clearInterval(iv); };
  }, [job?.job_id, job?.status]);

  const onFile = (e) => { setError(""); setUploadPct(0); setJob(null); setStatus("idle"); const f = e.target.files?.[0]; if (f) { setFile(f); setLog("File selected. Ready to upload."); } };

  const onStart = async () => {
    if (!file) return; setError(""); setStatus("uploading"); setLog("Starting upload...");
    try {
      const up = await startUpload(file); const cs = up.chunk_size; const tc = Math.ceil(file.size / cs);
      for (let i = 0; i < tc; i++) { await uploadChunk(up.upload_id, i, file.slice(i * cs, Math.min((i + 1) * cs, file.size))); setUploadPct(Math.round((i + 1) / tc * 100)); setLog(`Uploading chunk ${i + 1} of ${tc}`); }
      await completeUpload(up.upload_id); setStatus("processing"); setLog("Upload complete. Starting OCR...");
      setJob(await startJob(up.upload_id, quality));
    } catch (e) { setError(e.message); setStatus("idle"); }
  };

  const dl = job?.status === "done" ? downloadUrl(job.job_id) : null;
  const reportUrl = `mailto:rgjha2001@gmail.com?subject=${encodeURIComponent("OCR PDF Studio — Bug Report")}&body=${encodeURIComponent(`Hi Raja,\n\nI encountered an issue with OCR PDF Studio v${VER}.\n\nError: ${error || "(describe the issue)"}\nFile: ${file?.name || "N/A"}\nQuality: ${quality}\nStatus: ${status}\n\nSteps to reproduce:\n1. \n2. \n3. \n\nThanks!`)}`;

  return (
    <div className="app">
      <div className="panel">
        {/* ---- Header ---- */}
        <header className="header">
          <div className="header-info">
            <h1>OCR PDF Studio</h1>
            <p className="subtitle">Convert scanned PDFs into searchable documents — fast, private, and local.</p>
          </div>
          <div className="header-controls">
            <button className="ctrl-btn" onClick={toggleTheme}>{theme === "dark" ? <><Sun size={14} /> Light</> : <><Moon size={14} /> Dark</>}</button>
            <button className="ctrl-btn" onClick={() => setShowDocs(true)}><BookOpen size={14} /> Docs</button>
            <button className="ctrl-btn" onClick={() => setShowLogs(true)}><Terminal size={14} /> Logs</button>
            <button className="ctrl-btn" onClick={() => setShowAbout(true)}><User size={14} /> About</button>
          </div>
        </header>

        {/* ---- Cards ---- */}
        <section className="grid">
          <div className="card">
            <div className="card-title">Input</div>

            <div className="dropzone" onClick={() => document.getElementById("pdf-input").click()}>
              <label className="dropzone-label" htmlFor="pdf-input">
                <div className="dropzone-icon"><Upload size={20} /></div>
                <div className="dropzone-text">
                  <span className="file-name">{file ? file.name : "Choose a PDF file"}</span>
                  <span className="file-hint">{file ? fmt(file.size) : "Up to 1 GB supported"}</span>
                </div>
              </label>
              <input id="pdf-input" type="file" accept="application/pdf" onChange={onFile} />
            </div>

            <div>
              <div className="quality-label">Quality Preset</div>
              <div className="quality-options">
                {[["fast", "Fast", "200 DPI"], ["standard", "Standard", "300 DPI"], ["maximum", "Maximum", "400 DPI"]].map(([v, n, d]) => (
                  <label className="quality-option" key={v}>
                    <input type="radio" name="quality" value={v} checked={quality === v} onChange={() => setQuality(v)} />
                    <div className="quality-card">
                      <span className="q-name">{n}</span>
                      <span className="q-detail">{d}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={onStart} disabled={!canStart}><Upload size={16} /> Start OCR</button>

            <div className="progress-wrap">
              <div className="progress-fill" style={{ width: `${uploadPct}%` }} />
              <span className="progress-text">{uploadPct}% uploaded</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Status</div>
            <div className="status-row">
              <span className={`status-badge ${status}`}>{status}</span>
              {job && <span className="status-badge">job {job.job_id.slice(0, 8)}</span>}
            </div>
            <p className="status-msg">{log}</p>
            {job && <div className="progress-wrap"><div className="progress-fill" style={{ width: `${job.progress || 0}%` }} /><span className="progress-text">{job.progress || 0}% processed</span></div>}
            {dl && <a className="btn-link" href={dl}><Download size={16} /> Download Searchable PDF</a>}
            {error && (
              <div>
                <p className="error-text">{error}</p>
                <a className="ctrl-btn" href={reportUrl} style={{ marginTop: 8, display: "inline-flex", textDecoration: "none", color: "var(--error)" }}>
                  <AlertTriangle size={14} /> Report Error
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ---- Footer ---- */}
        <footer className="footer">
          <p>Built by <strong>Raja</strong></p>
          <div className="footer-links">
            <a href="https://github.com/stranger0407" target="_blank" rel="noopener noreferrer"><Github size={13} /> GitHub</a>
            <a href="https://github.com/stranger0407/ocr-pdf-studio" target="_blank" rel="noopener noreferrer"><Package size={13} /> Source</a>
            <a href="mailto:rgjha2001@gmail.com"><Mail size={13} /> Contact</a>
            <a href={reportUrl}><AlertTriangle size={13} /> Report Bug</a>
          </div>
          <span className="version">v{VER}</span>
        </footer>
      </div>

      {showLogs && <LogViewer onClose={() => setShowLogs(false)} />}
      {showDocs && <DocsPanel onClose={() => setShowDocs(false)} />}
      {showAbout && <AboutPanel onClose={() => setShowAbout(false)} />}
    </div>
  );
}
