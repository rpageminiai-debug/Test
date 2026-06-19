"""rpadoc — generate RPA Solution & Process Design Documents from a transcript.

Public API:

    from rpadoc import generate_documents
    paths = generate_documents("transcript.txt-or-text", out_dir="out",
                               overrides={"author": "Jane"})
    # -> {"model": {...}, "sdd": "out/..._SDD.pptx", "pdd": "out/..._PDD.pptx"}
"""

from __future__ import annotations

import os
import re
from typing import Any, Dict, Optional

from . import extractor
from .builders import pdd as pdd_builder
from .builders import sdd as sdd_builder

__all__ = ["generate_documents", "build_from_model"]


def _slugify(name: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "_", name).strip("_")
    return slug or "RPA_Process"


def _read_transcript(transcript: str) -> str:
    """Accept either a path to a .txt file or raw transcript text."""
    if len(transcript) < 400 and os.path.isfile(transcript):
        with open(transcript, "r", encoding="utf-8", errors="replace") as fh:
            return fh.read()
    return transcript


def generate_documents(
    transcript: str,
    out_dir: str = ".",
    overrides: Optional[Dict[str, Any]] = None,
    which: str = "both",
) -> Dict[str, Any]:
    """Extract a model from ``transcript`` and build the requested decks.

    ``which`` is one of "both", "sdd", "pdd".
    """
    text = _read_transcript(transcript)
    model = extractor.extract_model(text, overrides=overrides)
    result = build_from_model(model, out_dir, which=which)
    result["model"] = model
    return result


def build_from_model(model: Dict[str, Any], out_dir: str = ".",
                     which: str = "both") -> Dict[str, Any]:
    os.makedirs(out_dir, exist_ok=True)
    slug = _slugify(model["project"]["process_name"])
    result: Dict[str, Any] = {}
    if which in ("both", "sdd"):
        path = os.path.join(out_dir, f"{slug}_SDD.pptx")
        result["sdd"] = sdd_builder.build(model, path)
    if which in ("both", "pdd"):
        path = os.path.join(out_dir, f"{slug}_PDD.pptx")
        result["pdd"] = pdd_builder.build(model, path)
    return result
