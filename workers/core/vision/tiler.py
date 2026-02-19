"""Rasterizes large-format blueprints into overlapping tiles."""
from __future__ import annotations

from pathlib import Path
from typing import Iterator, Dict, Any

import fitz


def _clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(value, maximum))


class PDFTiler:
    def __init__(
        self,
        pdf_path: Path | str,
        dpi: int = 300,
        tile_size: int = 1024,
        overlap: float = 0.15,
    ):
        self.pdf_path = Path(pdf_path)
        self.dpi = dpi
        self.tile_size = tile_size
        self.overlap = overlap
        self.scale = dpi / 72.0  # PDF points to pixels

    def tiles(self) -> Iterator[Dict[str, Any]]:
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {self.pdf_path}")

        with fitz.open(self.pdf_path) as doc:
            for page_number, page in enumerate(doc, start=1):
                matrix = fitz.Matrix(self.scale, self.scale)
                pix = page.get_pixmap(matrix=matrix, alpha=False)
                width, height = pix.width, pix.height

                tile_width = min(self.tile_size, width)
                tile_height = min(self.tile_size, height)
                stride_x = max(1, int(tile_width * (1 - self.overlap)))
                stride_y = max(1, int(tile_height * (1 - self.overlap)))

                for row in range(3):
                    for col in range(3):
                        start_x = _clamp(col * stride_x, 0, width - tile_width)
                        start_y = _clamp(row * stride_y, 0, height - tile_height)
                        rect = fitz.Rect(
                            float(start_x),
                            float(start_y),
                            float(start_x + tile_width),
                            float(start_y + tile_height),
                        )
                        tile_pix = fitz.Pixmap(pix, rect)
                        try:
                            tile_bytes = tile_pix.tobytes(output='png')
                        finally:
                            tile_pix = None

                        metadata = {
                            "page_number": page_number,
                            "tile_row": row,
                            "tile_col": col,
                            "global_x": start_x,
                            "global_y": start_y,
                            "canvas_width": width,
                            "canvas_height": height,
                            "tile_width": tile_width,
                            "tile_height": tile_height,
                            "dpi": self.dpi,
                        }

                        yield {
                            "image_bytes": tile_bytes,
                            "metadata": metadata,
                        }

                pix = None
