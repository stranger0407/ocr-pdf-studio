from __future__ import annotations

import io
import shutil
import tempfile
from pathlib import Path

import fitz                # PyMuPDF – renders PDF pages without Ghostscript
import pikepdf             # merge the OCR'd pages back
import pytesseract
from PIL import Image

from .config import get_settings


# ---------------------------------------------------------------------------
# Page-by-page render → OCR pipeline
# ---------------------------------------------------------------------------
# Instead of letting ocrmypdf/Ghostscript rasterize the PDF (which crashes
# on circular references, large files, etc.), we:
#   1. Open the PDF with PyMuPDF (MuPDF engine – no GS dependency)
#   2. Render each page to a high-DPI image
#   3. OCR the image with Tesseract → get a searchable PDF page
#   4. Merge all OCR'd pages with pikepdf
#
# This bypasses Ghostscript entirely and works reliably on any PDF.
# ---------------------------------------------------------------------------


def _ocr_page_to_pdf(page: fitz.Page, settings) -> bytes:
    """Render a single fitz Page to an image, OCR it, return PDF bytes."""
    mat = fitz.Matrix(settings.ocr_dpi / 72, settings.ocr_dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    pdf_bytes = pytesseract.image_to_pdf_or_hocr(
        img, lang=settings.ocr_lang, extension="pdf",
    )
    return pdf_bytes


def process_pdf_job_local(
    input_pdf: str,
    output_pdf: str,
    job_id: str,
    update_cb,
) -> None:
    settings = get_settings()

    # Configure Tesseract path
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

    tmp_dir = None

    try:
        # ------------------------------------------------------------------
        # Step 1 – Open source PDF
        # ------------------------------------------------------------------
        update_cb(message="Opening PDF…", progress=2)
        doc = fitz.open(input_pdf)
        total_pages = len(doc)
        update_cb(
            message=f"PDF has {total_pages} pages — starting OCR (~7 s/page)",
            progress=5,
        )

        # ------------------------------------------------------------------
        # Step 2 – Work directory for per-page OCR results
        # ------------------------------------------------------------------
        tmp_dir = Path(tempfile.mkdtemp(prefix="ocr_pages_"))
        page_pdf_paths: list[str] = []

        # ------------------------------------------------------------------
        # Step 3 – Render → OCR each page
        # ------------------------------------------------------------------
        for idx in range(total_pages):
            page_num = idx + 1
            pct = 5 + int(90 * idx / total_pages)  # 5 → 95 %
            update_cb(
                message=f"OCR page {page_num}/{total_pages}",
                progress=pct,
            )

            page_path = str(tmp_dir / f"page_{page_num:04d}.pdf")
            pdf_bytes = _ocr_page_to_pdf(doc[idx], settings)

            Path(page_path).write_bytes(pdf_bytes)
            page_pdf_paths.append(page_path)

        doc.close()

        # ------------------------------------------------------------------
        # Step 4 – Merge all OCR'd pages into the final output
        # ------------------------------------------------------------------
        update_cb(message="Merging pages into final PDF…", progress=96)
        merged = pikepdf.Pdf.new()
        for p in page_pdf_paths:
            with pikepdf.Pdf.open(p) as part:
                merged.pages.extend(part.pages)
        merged.save(output_pdf)
        merged.close()

        update_cb(message="Local OCR complete", progress=100)

    finally:
        # Clean up temp directory
        if tmp_dir and Path(tmp_dir).exists():
            shutil.rmtree(tmp_dir, ignore_errors=True)
