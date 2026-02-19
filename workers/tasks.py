"""Arq worker for plumbing blueprint extraction."""
from __future__ import annotations

import base64
import logging
import os
from pathlib import Path
from typing import List

import fitz
from arq.jobs import Job

from workers.core.llm.client import OllamaInstructorClient
from workers.core.llm.schemas import PlumbingExtraction
from workers.core.vision.tiler import PDFTiler
from workers.core.vision.transform import local_to_global

logger = logging.getLogger(__name__)
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/data/uploads"))
VISION_MODEL = os.getenv("VISION_MODEL", "llava:13b")
REFLECTION_MODEL = os.getenv("REFLECTION_MODEL", "llama3:8b")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")


def _tile_prompt_metadata(metadata: dict) -> str:
    return (
        f"Page {metadata['page_number']} (tile {metadata['tile_row'] + 1}/{metadata['tile_col'] + 1}) "
        f"of canvas {metadata['canvas_width']}x{metadata['canvas_height']} at {metadata['dpi']}dpi."
    )


async def validate_with_reflection(
    llm_client: OllamaInstructorClient,
    model: str,
    page_text: str,
    initial_data: PlumbingExtraction,
) -> PlumbingExtraction:
    messages: List[dict] = [
        {
            "role": "system",
            "content": "You are a plumbing code expert. Verify the extracted data against the plan notes."
        },
        {
            "role": "user",
            "content": (
                f"Plan notes:\n{page_text}\n\n"
                f"Extracted data:\n{initial_data.json(indent=2)}\n\n"
                "Correct discrepancies."
            )
        }
    ]
    return await llm_client.extract(model, messages, PlumbingExtraction)


async def _extract_full_text(pdf_path: Path) -> str:
    text_chunks: List[str] = []
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text_chunks.append(page.get_text("text"))
    return "\n".join(text_chunks)


def _summarize_tile(tile_message: str, metadata: dict) -> str:
    return f"{tile_message} (page {metadata['page_number']})"


async def process_pdf(ctx: Job, pdf_id: str) -> dict:
    logger.info("Starting plumbing extraction", extra={"pdf_id": pdf_id})
    pdf_path = UPLOAD_DIR / pdf_id
    if not pdf_path.exists():
        raise FileNotFoundError(f"Blueprint missing: {pdf_path}")

    tiler = PDFTiler(pdf_path)
    llm_client = OllamaInstructorClient(base_url=OLLAMA_HOST)

    aggregated = PlumbingExtraction()
    tiles_processed = 0

    for tile in tiler.tiles():
        image_bytes = tile["image_bytes"]
        metadata = tile["metadata"]
        tile_description = _tile_prompt_metadata(metadata)
        tile_base64 = base64.b64encode(image_bytes).decode("utf-8")

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert plumbing estimator. Inspect the provided blueprint tile and return"
                    " only JSON that matches the PlumbingExtraction schema."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Tile context: {tile_description}\n"
                    f"Image (base64 PNG): data:image/png;base64,{tile_base64}"
                )
            }
        ]

        try:
            tile_result = await llm_client.extract(VISION_MODEL, messages, PlumbingExtraction)
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Tile extraction failed",
                extra={"pdf_id": pdf_id, "metadata": metadata, "error": str(exc)}
            )
            continue

        if tile_result.fixtures:
            for fixture in tile_result.fixtures:
                if fixture.location_coords:
                    for coords in fixture.location_coords:
                        global_coord = local_to_global(coords.x, coords.y, metadata)
                        coords.x, coords.y = global_coord
            aggregated.fixtures.extend(tile_result.fixtures)

        if tile_result.materials:
            aggregated.materials.extend(tile_result.materials)

        if tile_result.notes:
            aggregated.notes = (
                f"{aggregated.notes or ''}\n{_summarize_tile(tile_description, metadata)}: {tile_result.notes}"
            ).strip()

        tiles_processed += 1

    page_text = await _extract_full_text(pdf_path)
    if not aggregated.notes:
        aggregated.notes = "Aggregated notes pending reflection."

    validated = await validate_with_reflection(llm_client, REFLECTION_MODEL, page_text, aggregated)

    logger.info(
        "Plumbing extraction complete",
        extra={"pdf_id": pdf_id, "tiles": tiles_processed, "refined_fixtures": len(validated.fixtures)}
    )

    return validated.dict()


if __name__ == "__main__":
    raise SystemExit("This module is meant to be run as an Arq worker.")
