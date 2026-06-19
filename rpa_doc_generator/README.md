# RPA Doc Generator

Generate **Solution Design Documents (SDD)** and **Process Design Documents (PDD)**
— built to RPA delivery standards — directly from a **requirement video recording
transcript** (a plain `.txt` file).

Both documents are produced as **editable PowerPoint (`.pptx`)** with:

- Native, **editable flowcharts** (real PowerPoint flowchart shapes + connectors you
  can drag and re-label — not images)
- Editable tables, bullet lists and section dividers
- A full RPA document structure (document control, scope, as-is/to-be, applications,
  **detailed keystroke-level steps**, business rules, exception handling, NFRs,
  infrastructure, schedule & volumetrics, benefits, risks)

## How it works

```
transcript.txt ──▶ extractor ──▶ structured RPA model ──▶ SDD.pptx
                       │                                └─▶ PDD.pptx
                       ▼
        Claude (claude-opus-4-8) if ANTHROPIC_API_KEY is set,
        otherwise a built-in heuristic parser (always works offline)
```

The extractor reconstructs the end-to-end process — applications, step-by-step
actions, inputs/outputs, business rules, exceptions and a control-flow graph — and
the builders render that model into the two decks.

## Install

```bash
cd rpa_doc_generator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

For AI-grade analysis, set your Anthropic key (optional — the app runs without it
using the heuristic parser):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Use it — Web UI

```bash
python app.py
# open http://127.0.0.1:5000
```

Paste the transcript (or upload a `.txt`), add optional project details, and download
the SDD and PDD.

## Use it — CLI

```bash
python -m rpadoc.cli samples/invoice_processing_transcript.txt \
    --out output \
    --process-name "AP Invoice Processing" \
    --client "Acme Corp" --author "Daniel BA" \
    --save-model output/model.json
```

Outputs `output/AP_Invoice_Processing_SDD.pptx` and `..._PDD.pptx`.

## Use it — Python

```python
from rpadoc import generate_documents

result = generate_documents(
    "samples/invoice_processing_transcript.txt",
    out_dir="output",
    overrides={"client": "Acme Corp", "author": "Daniel BA"},
)
print(result["sdd"], result["pdd"])
```

## Deploy (get a public URL)

The Flask dev server is for local use only. To get a real shareable `https://` URL,
deploy with the included production config (gunicorn).

**Run the production server locally:**

```bash
pip install -r requirements.txt        # includes gunicorn
gunicorn --bind 0.0.0.0:8080 --workers 2 --threads 4 --timeout 180 app:app
```

**Docker:**

```bash
docker build -t rpa-doc-generator .
docker run -p 8080:8080 -e ANTHROPIC_API_KEY=sk-ant-... rpa-doc-generator
# → http://localhost:8080
```

**Render / Railway / Fly (free tiers give a public URL):**

- **Render** — `render.yaml` is included (Blueprint deploy). New → Blueprint → select
  this repo. If deploying from this subfolder, copy `render.yaml` to the repo root or
  set the service root directory to `rpa_doc_generator`.
- **Railway / Heroku-style** — the `Procfile` is included; point the platform at this
  directory.
- Set `ANTHROPIC_API_KEY` in the platform's environment variables to enable Claude
  analysis (optional — heuristic mode works without it).

> The Flask dev server (`python app.py`) only binds to `127.0.0.1` and is not reachable
> from other machines — use one of the options above for a shareable URL.

## Project layout

```
rpa_doc_generator/
├── app.py                     # Flask web UI
├── requirements.txt
├── samples/                   # example transcript
├── templates/ static/         # web UI assets
└── rpadoc/
    ├── __init__.py            # generate_documents() high-level API
    ├── cli.py                 # command-line entry point
    ├── extractor.py           # transcript → model (Claude + heuristic fallback)
    ├── model.py               # canonical model + normalisation
    └── builders/
        ├── deck.py            # reusable pptx slide builder (header/footer/tables/bullets)
        ├── flowchart.py       # editable flowchart renderer
        ├── theme.py           # colours & fonts
        ├── sdd.py             # Solution Design Document assembly
        └── pdd.py             # Process Design Document assembly
```

## Notes

- Without `ANTHROPIC_API_KEY`, the heuristic parser still produces a complete,
  correctly-structured pair of documents — accuracy improves substantially with the
  AI extractor enabled.
- The flowchart shapes are standard PowerPoint auto-shapes, so you can fine-tune the
  layout, wording and styling after generation.
