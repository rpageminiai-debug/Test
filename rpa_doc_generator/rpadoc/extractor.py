"""Turn a requirement-video transcript into a structured RPA process model.

Primary path: Claude (``claude-opus-4-8``) reads the transcript and returns the
canonical model as JSON.  Fallback path (no ANTHROPIC_API_KEY, or any failure):
a deterministic heuristic parser so the app always produces a usable deck.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, Optional

from . import model as model_mod

MODEL_ID = "claude-opus-4-8"

# Kept in sync with rpadoc/model.py.  Shown to Claude so it returns exactly the
# shape the builders consume.
JSON_SHAPE = """{
  "project": {"process_name": "", "client": "", "department": "", "author": "",
              "version": "1.0", "document_owner": "", "process_owner": "", "summary": ""},
  "objectives": ["..."],
  "in_scope": ["..."],
  "out_of_scope": ["..."],
  "as_is_summary": "Narrative of how the process is performed manually today.",
  "to_be_summary": "Narrative of the automated to-be process.",
  "applications": [{"name": "", "version": "", "type": "Web/Desktop/Mainframe/API",
                    "access": "credentials/SSO", "environment": "Prod/UAT", "notes": ""}],
  "inputs": [{"name": "", "type": "", "source": "", "format": "", "description": ""}],
  "outputs": [{"name": "", "type": "", "destination": "", "format": "", "description": ""}],
  "process_steps": [{"step": "1", "action": "What the bot does",
                     "application": "App used", "ui_action": "Click/Type/Read keystroke level",
                     "input": "Data consumed", "output": "Data produced",
                     "business_rule": "Rule applied", "exception": "What can go wrong + handling"}],
  "business_rules": ["..."],
  "exceptions": [{"type": "Business/System", "scenario": "", "handling": ""}],
  "assumptions": ["..."],
  "dependencies": ["..."],
  "reusable_components": ["..."],
  "schedule": {"trigger": "Time/Event/Manual", "frequency": "", "sla": "",
               "volumetrics": "transactions/day", "peak": ""},
  "nfr": {"security": "", "performance": "", "scalability": "", "availability": "",
          "audit": "", "credentials": "credential vault details"},
  "infrastructure": {"bot_type": "Attended/Unattended", "orchestration": "",
                     "machines": "", "license": ""},
  "benefits": [{"metric": "", "as_is": "", "to_be": "", "benefit": ""}],
  "risks": [{"risk": "", "impact": "", "mitigation": ""}],
  "flowchart": {
    "nodes": [{"id": "start", "type": "start", "label": "Start"},
              {"id": "n1", "type": "process", "label": "..."},
              {"id": "d1", "type": "decision", "label": "Valid?"},
              {"id": "end", "type": "end", "label": "End"}],
    "edges": [{"from": "start", "to": "n1", "label": ""},
              {"from": "n1", "to": "d1", "label": ""},
              {"from": "d1", "to": "end", "label": "Yes"}]
  }
}"""

SYSTEM_PROMPT = (
    "You are a senior RPA (Robotic Process Automation) Solution Architect and "
    "Business Analyst. You convert raw requirement-gathering call transcripts into "
    "the formal artefacts used on RPA delivery engagements: the Solution Design "
    "Document (SDD) and Process Design Document (PDD), following UiPath / Automation "
    "Anywhere / Blue Prism industry standards.\n\n"
    "From the transcript you must reconstruct the end-to-end business process even "
    "where the speakers are informal or incomplete. Where the transcript implies a "
    "detail that any experienced RPA architect would infer (e.g. login steps, "
    "exception handling, credential vaulting, audit logging, reconciliation), make a "
    "reasonable, clearly professional assumption and capture it. Never leave the core "
    "process steps empty.\n\n"
    "Write the SDD process steps at a DETAILED, keystroke/transaction level: each step "
    "states the action, the application/screen, the UI interaction, the data in and "
    "out, the business rule applied, and the exception path. Aim for 8-20 granular "
    "steps for a typical process.\n\n"
    "The flowchart must be a faithful control-flow graph of the process: a single "
    "'start' node, 'process' nodes for actions, 'decision' nodes (diamonds) for "
    "branches with Yes/No edge labels, 'io' nodes for read/write of data, "
    "'subprocess' nodes for reusable components, and an 'end' node. Edges must only "
    "reference node ids you define.\n\n"
    "Respond with ONE JSON object and nothing else — no markdown, no code fences, no "
    "commentary. Use exactly this structure (fill every relevant field; use [] or \"\" "
    "when genuinely not applicable):\n\n" + JSON_SHAPE
)


def extract_model(transcript: str, overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Return a normalized canonical model for ``transcript``."""
    transcript = (transcript or "").strip()
    raw: Optional[Dict[str, Any]] = None

    if os.environ.get("ANTHROPIC_API_KEY") and transcript:
        try:
            raw = _extract_with_claude(transcript)
        except Exception as exc:  # pragma: no cover - network/credentials dependent
            print(f"[extractor] Claude extraction failed ({exc!r}); using heuristic fallback.")

    if raw is None:
        raw = _extract_heuristic(transcript)

    normalized = model_mod.normalize(raw)
    return model_mod.apply_overrides(normalized, overrides or {})


# --------------------------------------------------------------------------- #
# Claude path
# --------------------------------------------------------------------------- #
def _extract_with_claude(transcript: str) -> Dict[str, Any]:
    import anthropic

    client = anthropic.Anthropic()
    user_prompt = (
        "Here is the requirement video recording transcript. Produce the SDD/PDD "
        "JSON model described in the system prompt.\n\n"
        "<transcript>\n" + transcript + "\n</transcript>"
    )

    # Stream because the JSON can be large; get_final_message() reassembles it and
    # avoids HTTP read-timeouts on long generations.
    with client.messages.stream(
        model=MODEL_ID,
        max_tokens=32000,
        thinking={"type": "adaptive"},
        output_config={"effort": "high"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        message = stream.get_final_message()

    text = "".join(b.text for b in message.content if b.type == "text")
    return _loads_lenient(text)


def _loads_lenient(text: str) -> Dict[str, Any]:
    """Parse JSON, tolerating stray prose or code fences around the object."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Strip ```json fences if present, then grab the outermost {...}.
    fenced = re.search(r"```(?:json)?\s*(.+?)```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1).strip())
        except json.JSONDecodeError:
            pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start:end + 1])
    raise ValueError("Claude response did not contain parseable JSON.")


# --------------------------------------------------------------------------- #
# Heuristic fallback (no API key)
# --------------------------------------------------------------------------- #
# Verbs that typically begin an actionable process step in a requirements call.
_ACTION_VERBS = (
    "login", "log in", "log into", "open", "launch", "navigate", "go to", "click",
    "select", "enter", "type", "input", "search", "look up", "fetch", "retrieve",
    "read", "extract", "download", "upload", "copy", "paste", "validate", "verify",
    "check", "compare", "calculate", "compute", "update", "create", "generate",
    "send", "email", "submit", "approve", "reject", "save", "export", "import",
    "reconcile", "post", "raise", "log", "record", "attach", "fill", "process",
)
_APP_HINT = re.compile(
    r"\b(SAP|Oracle|Salesforce|Workday|ServiceNow|Outlook|Excel|Word|PDF|"
    r"SharePoint|Citrix|Mainframe|portal|website|web ?site|application|system|"
    r"database|CRM|ERP|API|email|inbox)\b",
    re.IGNORECASE,
)
_DECISION_HINT = re.compile(r"\b(if|whether|when|check if|in case|otherwise|else|valid|"
                            r"match|error|fail|exists|missing)\b", re.IGNORECASE)


# Openers that signal the interviewer/analyst prompting rather than the SME
# describing the process — these never become process steps.
_INTERVIEWER_CUES = (
    "can you", "could you", "would you", "walk me", "tell me", "talk me",
    "how many", "how do", "how does", "what happens", "what about", "what are",
    "and the", "and how", "thanks", "thank you", "perfect", "last thing",
    "any systems", "are there", "is there", "do you", "let me", "okay", "ok ",
)


def _is_interviewer(low: str) -> bool:
    return low.endswith("?") or "?" in low or low.startswith(_INTERVIEWER_CUES)


def _sentences(text: str):
    # Split transcript into utterance-ish sentences, dropping speaker labels and
    # metadata lines (Date:, Attendees:, etc.).
    text = re.sub(r"^\s*(date|attendees|present|time|venue|location)\b.*$", "",
                  text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r"^\s*[A-Z][a-zA-Z .]{0,30}:\s*", "", text, flags=re.MULTILINE)
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [p.strip() for p in parts if p.strip()]


def _clean_action(sentence: str) -> str:
    # Drop conversational fillers at the start and any trailing question fragment.
    s = sentence.strip()
    s = re.sub(r"^(so|right|well|yes|yeah|sure|okay|ok|and|then|now|um|uh)[,\s—-]+",
               "", s, flags=re.IGNORECASE)
    s = s.split("?")[0].strip()
    if not s:
        return ""
    return s[0].upper() + s[1:]


def _guess_process_name(text: str) -> str:
    # 1) A title-case multi-word phrase ending in Processing/Process/Reconciliation…
    m = re.search(r"\b((?:[A-Z][A-Za-z]+\s+){1,4}"
                  r"(?:Processing|Process|Reconciliation|Onboarding|Management))\b", text)
    if m:
        name = m.group(1).strip()
        return name if re.search(r"(Processing|Automation)$", name) else name + " Automation"
    # 2) "automate the <X> process"
    m = re.search(r"automat\w*\s+(?:the\s+)?([a-z][a-z \-/]{3,50}?)(?:\s+process)\b",
                  text, re.IGNORECASE)
    if m:
        return m.group(1).strip().title() + " Process Automation"
    # 3) "process called/named/for <X>"
    m = re.search(r"\bprocess\s+(?:called|named|is|for)\s+([a-z][a-z \-/]{3,50})",
                  text, re.IGNORECASE)
    if m:
        return m.group(1).strip().title() + " Process Automation"
    # 4) "<X> process/invoices/orders" mentioned by the business user
    m = re.search(r"\b(invoice|order|payment|claim|onboarding|reconciliation|"
                  r"ticket|expense|payroll)s?\b", text, re.IGNORECASE)
    if m:
        return m.group(1).title() + " Processing Automation"
    return "Business Process Automation"


def _extract_heuristic(transcript: str) -> Dict[str, Any]:
    sentences = _sentences(transcript)
    lowered_full = transcript.lower()

    apps: Dict[str, Dict[str, str]] = {}
    for m in _APP_HINT.finditer(transcript):
        name = m.group(0)
        key = name.lower()
        if key in ("application", "system", "website", "web site", "portal"):
            continue
        if key not in apps:
            apps[key] = {"name": name, "type": "Application", "access": "credentials"}

    steps = []
    flow_nodes = [{"id": "start", "type": "start", "label": "Start"}]
    flow_edges = []
    prev = "start"
    step_no = 0
    seen_actions = set()

    for sentence in sentences:
        low = sentence.lower()
        if _is_interviewer(low):                       # skip analyst questions/prompts
            continue
        if not any(low.startswith(v) or f" {v} " in f" {low} " for v in _ACTION_VERBS):
            continue
        if len(sentence) < 12:
            continue
        action = _clean_action(sentence).rstrip(".")
        if len(action) < 10:
            continue
        # de-duplicate near-identical actions
        key = re.sub(r"[^a-z0-9 ]", "", action.lower())[:60]
        if key in seen_actions:
            continue
        seen_actions.add(key)
        step_no += 1
        app_match = _APP_HINT.search(sentence)
        app = app_match.group(0) if app_match else ""
        is_decision = bool(_DECISION_HINT.search(sentence)) and step_no > 1

        steps.append({
            "step": str(step_no),
            "action": action[:200],
            "application": app,
            "ui_action": "",
            "input": "",
            "output": "",
            "business_rule": "",
            "exception": "Capture screenshot, log error and route to exception queue.",
        })

        nid = f"n{step_no}"
        ntype = "decision" if is_decision else "process"
        label = action[:60] + ("…" if len(action) > 60 else "")
        if is_decision and not label.rstrip().endswith("?"):
            label = label.rstrip("…") + "?"
        flow_nodes.append({"id": nid, "type": ntype, "label": label})
        flow_edges.append({"from": prev, "to": nid, "label": ""})
        prev = nid
        if step_no >= 18:
            break

    flow_nodes.append({"id": "end", "type": "end", "label": "End"})
    flow_edges.append({"from": prev, "to": "end", "label": ""})

    if not steps:
        # Transcript had no recognisable actions — emit a meaningful placeholder.
        steps = [{
            "step": "1",
            "action": "Detailed process steps to be confirmed with the business SME.",
            "application": "", "ui_action": "", "input": "", "output": "",
            "business_rule": "", "exception": "",
        }]

    objectives = [s[0].upper() + s[1:] for s in sentences
                  if re.search(r"\b(reduce|save|improve|eliminate|increase|automat|"
                               r"faster|accuracy|cost|efficien)\w*", s, re.IGNORECASE)][:6]

    return {
        "project": {
            "process_name": _guess_process_name(transcript),
            "summary": (sentences[0] if sentences else "")[:400],
        },
        "objectives": objectives,
        "in_scope": [s["action"] for s in steps[:6]],
        "out_of_scope": [],
        "as_is_summary": " ".join(sentences[:4])[:800],
        "to_be_summary": ("The process described above is performed by an unattended "
                          "software robot, with manual intervention only for flagged "
                          "exceptions."),
        "applications": list(apps.values()),
        "process_steps": steps,
        "business_rules": [s for s in sentences if _DECISION_HINT.search(s)][:8],
        "exceptions": [{
            "type": "System",
            "scenario": "Target application unavailable or unresponsive.",
            "handling": "Retry per policy, then route the item to the exception queue and alert support.",
        }],
        "assumptions": [
            "Application UIs and access credentials remain stable for the duration of the engagement.",
            "Required system access and licences are provisioned for the robot account.",
        ],
        "schedule": {
            "trigger": "Scheduled" if "schedul" in lowered_full else "Manual/Event",
            "frequency": "Daily" if "daily" in lowered_full else "",
        },
        "nfr": {
            "security": "Credentials stored in a secure credential vault; least-privilege robot account.",
            "audit": "All actions logged with timestamps for audit and reconciliation.",
        },
        "infrastructure": {
            "bot_type": "Unattended",
        },
        "flowchart": {"nodes": flow_nodes, "edges": flow_edges},
    }
