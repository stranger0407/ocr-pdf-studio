from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Optional

from .config import get_settings


_MAX_LOG_LINES = 2000  # Keep the file from growing unbounded


def _log_dir() -> Path:
    """Resolve the log directory — sits alongside the data directory."""
    settings = get_settings()
    log_dir = settings.data_dir.parent / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def _app_log_path() -> Path:
    return _log_dir() / "app.log"


def _now() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())


def append_log(
    level: str,
    source: str,
    message: str,
    job_id: Optional[str] = None,
) -> None:
    """Append a structured log line to the application log file."""
    entry = {
        "ts": _now(),
        "level": level,
        "source": source,
        "message": message,
    }
    if job_id:
        entry["job_id"] = job_id
    line = json.dumps(entry, ensure_ascii=False)

    try:
        log_path = _app_log_path()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass  # Never crash the app because of logging


def read_logs(tail: int = 200) -> list[dict]:
    """Read the last `tail` log entries. Returns list of dicts."""
    log_path = _app_log_path()
    if not log_path.exists():
        return []

    try:
        lines = log_path.read_text(encoding="utf-8").strip().splitlines()
        lines = lines[-tail:]  # Keep only the last N
        result = []
        for line in lines:
            try:
                result.append(json.loads(line))
            except json.JSONDecodeError:
                result.append({"ts": "", "level": "RAW", "source": "log", "message": line})
        return result
    except Exception:
        return []


def get_system_info() -> dict:
    """Return basic system info for debugging."""
    settings = get_settings()
    return {
        "cpu_count": os.cpu_count(),
        "tesseract_cmd": settings.tesseract_cmd,
        "tesseract_exists": Path(settings.tesseract_cmd).exists(),
        "data_dir": str(settings.data_dir),
        "ocr_lang": settings.ocr_lang,
        "ocr_dpi": settings.ocr_dpi,
        "ocr_quality": settings.ocr_quality,
    }
