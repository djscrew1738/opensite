from __future__ import annotations

import time
from pathlib import Path
from uuid import uuid4


def safe_filename(filename: str | None, default: str = "upload.bin") -> str:
    raw = (filename or "").replace("\\", "/")
    name = Path(raw).name
    if not name or name in {".", ".."}:
        return default
    return name


async def read_upload_bytes_async(upload_file, max_bytes: int) -> bytes:
    content = await upload_file.read()
    if len(content) > max_bytes:
        raise ValueError(f"Upload exceeds {max_bytes} bytes")
    return content


def build_visualization_filename(original_name: str | None, token: str | None = None) -> str:
    safe_name = safe_filename(original_name, default="upload")
    stem = Path(safe_name).stem or "upload"
    token = token or uuid4().hex
    return f"visualization_{stem}_{token}.jpg"


def cleanup_old_files(directory: Path, max_age_seconds: int) -> int:
    if not directory.exists():
        return 0

    now = time.time()
    removed = 0

    for path in directory.iterdir():
        if not path.is_file():
            continue
        try:
            if now - path.stat().st_mtime > max_age_seconds:
                path.unlink()
                removed += 1
        except OSError:
            continue

    return removed
