import { useEffect, useMemo, useState } from "react";
import {
  completeUpload,
  downloadUrl,
  getJob,
  startJob,
  startUpload,
  uploadChunk,
} from "./api.js";

const BYTES_IN_MB = 1024 * 1024;

function formatBytes(value) {
  if (!value && value !== 0) return "-";
  if (value < BYTES_IN_MB) return `${value} B`;
  if (value < BYTES_IN_MB * 1024) return `${(value / BYTES_IN_MB).toFixed(1)} MB`;
  return `${(value / (BYTES_IN_MB * 1024)).toFixed(2)} GB`;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState("Ready to upload a PDF.");

  const canStart = useMemo(() => {
    return file && status !== "uploading" && status !== "processing";
  }, [file, status]);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "error") return;
    const interval = setInterval(async () => {
      try {
        const updated = await getJob(job.job_id);
        setJob(updated);
        setStatus(updated.status === "queued" ? "processing" : updated.status);
        if (updated.message) {
          setLog(updated.message);
        }
      } catch (err) {
        setError(err.message);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [job]);

  const handleFileChange = (event) => {
    setError("");
    setUploadProgress(0);
    setJob(null);
    setStatus("idle");
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
      setLog("File selected. Ready to upload.");
    }
  };

  const handleStart = async () => {
    if (!file) return;
    setError("");
    setStatus("uploading");
    setLog("Starting upload session...");

    try {
      const upload = await startUpload(file);
      const chunkSize = upload.chunk_size;
      const totalChunks = Math.ceil(file.size / chunkSize);

      for (let index = 0; index < totalChunks; index += 1) {
        const start = index * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const blob = file.slice(start, end);
        await uploadChunk(upload.upload_id, index, blob);
        const progress = Math.round(((index + 1) / totalChunks) * 100);
        setUploadProgress(progress);
        setLog(`Uploading chunk ${index + 1} of ${totalChunks}`);
      }

      await completeUpload(upload.upload_id);
      setStatus("processing");
      setLog("Upload complete. Starting OCR...");

      const newJob = await startJob(upload.upload_id);
      setJob(newJob);
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const downloadLink = job && job.status === "done" ? downloadUrl(job.job_id) : null;

  return (
    <div className="app">
      <div className="panel">
        <header className="header">
          <div>
            <p className="eyebrow">Local OCR Pipeline</p>
            <h1>OCR PDF Studio</h1>
            <p className="subtitle">
              Convert scanned PDFs into searchable text layers with chunked uploads
              and background processing.
            </p>
          </div>
          <div className="badge">Ready for big files</div>
        </header>

        <section className="grid">
          <div className="card">
            <h2>Input</h2>
            <p>Select a PDF file (up to 1 GB). Uploads stream in chunks.</p>
            <div className="dropzone">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              <div>
                <span className="file-name">{file ? file.name : "Choose PDF"}</span>
                <span className="file-size">{file ? formatBytes(file.size) : ""}</span>
              </div>
            </div>
            <button className="primary" onClick={handleStart} disabled={!canStart}>
              Start OCR
            </button>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
              <span>{uploadProgress}% uploaded</span>
            </div>
          </div>

          <div className="card">
            <h2>Status</h2>
            <div className="status-row">
              <span className={`status ${status}`}>{status}</span>
              {job && <span className="status">job {job.job_id.slice(0, 8)}</span>}
            </div>
            <p className="log">{log}</p>
            {job && (
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: `${job.progress || 0}%` }}
                />
                <span>{job.progress || 0}% processed</span>
              </div>
            )}
            {downloadLink && (
              <a className="primary link" href={downloadLink}>
                Download searchable PDF
              </a>
            )}
            {error && <p className="error">{error}</p>}
          </div>
        </section>

        <section className="notes">
          <div>
            <h3>Local OCR tips</h3>
            <p>
              Large PDFs are uploaded in chunks; OCR runs locally using OCRmyPDF.
              You can tune the upload chunk size in the backend settings.
            </p>
          </div>
          <div>
            <h3>Privacy</h3>
            <p>
              Files are stored locally while processing. Output PDFs remain on
              your machine.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
