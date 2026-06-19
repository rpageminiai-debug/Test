"""Flask web UI for the RPA Doc Generator.

Upload a requirement-video transcript (.txt), optionally fill in project metadata,
and download editable SDD + PDD PowerPoint decks.

    pip install -r requirements.txt
    python app.py            # -> http://127.0.0.1:5000
"""

from __future__ import annotations

import os
import tempfile
import uuid

from flask import (Flask, abort, flash, redirect, render_template, request,
                   send_file, url_for)

from rpadoc import generate_documents

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "rpa-doc-generator-dev-key")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB transcripts max

# Generated decks live here for the session; keyed by a random job id.
WORK_DIR = os.path.join(tempfile.gettempdir(), "rpadoc_jobs")
os.makedirs(WORK_DIR, exist_ok=True)


@app.route("/", methods=["GET"])
def index():
    ai_enabled = bool(os.environ.get("ANTHROPIC_API_KEY"))
    return render_template("index.html", ai_enabled=ai_enabled, result=None)


@app.route("/generate", methods=["POST"])
def generate():
    transcript_text = (request.form.get("transcript_text") or "").strip()
    uploaded = request.files.get("transcript_file")
    if uploaded and uploaded.filename:
        transcript_text = uploaded.read().decode("utf-8", errors="replace").strip()

    if not transcript_text:
        flash("Please paste a transcript or upload a .txt file.")
        return redirect(url_for("index"))

    overrides = {k: (request.form.get(k) or "").strip()
                 for k in ("process_name", "client", "department", "author", "version")}
    which = request.form.get("which", "both")

    job_id = uuid.uuid4().hex[:12]
    out_dir = os.path.join(WORK_DIR, job_id)

    try:
        result = generate_documents(transcript_text, out_dir=out_dir,
                                    overrides=overrides, which=which)
    except Exception as exc:  # pragma: no cover
        app.logger.exception("generation failed")
        flash(f"Generation failed: {exc}")
        return redirect(url_for("index"))

    model = result["model"]
    files = []
    for kind in ("sdd", "pdd"):
        if kind in result:
            files.append({
                "kind": kind.upper(),
                "name": os.path.basename(result[kind]),
                "url": url_for("download", job_id=job_id, name=os.path.basename(result[kind])),
            })

    summary = {
        "process_name": model["project"]["process_name"],
        "steps": len(model["process_steps"]),
        "applications": len(model["applications"]),
        "nodes": len(model["flowchart"]["nodes"]),
        "ai": bool(os.environ.get("ANTHROPIC_API_KEY")),
    }
    return render_template("index.html", ai_enabled=summary["ai"],
                           result={"files": files, "summary": summary})


@app.route("/download/<job_id>/<name>", methods=["GET"])
def download(job_id: str, name: str):
    # Guard against path traversal — both components must be simple names.
    if "/" in job_id or "/" in name or ".." in job_id or ".." in name:
        abort(400)
    path = os.path.join(WORK_DIR, job_id, name)
    if not os.path.isfile(path):
        abort(404)
    return send_file(path, as_attachment=True, download_name=name)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 5000)), debug=True)
