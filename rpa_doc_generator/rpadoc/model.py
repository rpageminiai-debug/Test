"""Canonical RPA process model.

This is the single data structure that flows through the whole app:

    transcript  ->  extractor  ->  ProcessModel (plain dict)  ->  SDD / PDD decks

Keeping it as a plain, JSON-serialisable dict (rather than nested dataclasses)
means the Claude extractor can emit it directly as JSON and the heuristic
fallback can build the same shape by hand.  ``normalize()`` guarantees every
key the builders rely on exists, so the deck builders never have to defend
against missing fields.
"""

from __future__ import annotations

import copy
import datetime as _dt
from typing import Any, Dict, List

# Valid flowchart node shapes.  These map 1:1 to PowerPoint flowchart
# auto-shapes in ``builders/flowchart.py``.
NODE_TYPES = {"start", "end", "process", "decision", "io", "subprocess"}


def _today() -> str:
    return _dt.date.today().strftime("%d %b %Y")


def blank_model() -> Dict[str, Any]:
    """An empty, fully-formed model with every section present."""
    return {
        "project": {
            "process_name": "Untitled Automation Process",
            "client": "",
            "department": "",
            "author": "",
            "date": _today(),
            "version": "1.0",
            "document_owner": "",
            "process_owner": "",
            "summary": "",
        },
        "objectives": [],
        "in_scope": [],
        "out_of_scope": [],
        "as_is_summary": "",
        "to_be_summary": "",
        "applications": [],          # {name, version, type, access, environment, notes}
        "inputs": [],                # {name, type, source, format, description}
        "outputs": [],               # {name, type, destination, format, description}
        "process_steps": [],         # {step, action, application, ui_action, input, output, business_rule, exception}
        "business_rules": [],        # str
        "exceptions": [],            # {type, scenario, handling}
        "assumptions": [],           # str
        "dependencies": [],          # str
        "reusable_components": [],   # str
        "schedule": {                # how/when the bot runs
            "trigger": "",
            "frequency": "",
            "sla": "",
            "volumetrics": "",
            "peak": "",
        },
        "nfr": {                     # non-functional requirements
            "security": "",
            "performance": "",
            "scalability": "",
            "availability": "",
            "audit": "",
            "credentials": "",
        },
        "infrastructure": {
            "bot_type": "",
            "orchestration": "",
            "machines": "",
            "license": "",
        },
        "benefits": [],              # {metric, as_is, to_be, benefit}
        "risks": [],                 # {risk, impact, mitigation}
        "flowchart": {
            "nodes": [],             # {id, type, label}
            "edges": [],             # {from, to, label}
        },
    }


def _as_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _as_str_list(value: Any) -> List[str]:
    out: List[str] = []
    for item in _as_list(value):
        if isinstance(item, dict):
            # Tolerate the model returning [{"objective": "..."}]
            item = " ".join(str(v) for v in item.values() if v)
        text = str(item).strip()
        if text:
            out.append(text)
    return out


def _merge_dict(base: Dict[str, Any], incoming: Any) -> Dict[str, Any]:
    out = dict(base)
    if isinstance(incoming, dict):
        for key in base:
            if incoming.get(key) is not None:
                out[key] = str(incoming[key]).strip()
    return out


def _dict_rows(value: Any, fields: List[str]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for raw in _as_list(value):
        if not isinstance(raw, dict):
            # A bare string lands in the first field.
            raw = {fields[0]: raw}
        row = {f: str(raw.get(f, "") or "").strip() for f in fields}
        if any(row.values()):
            rows.append(row)
    return rows


def normalize(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Coerce an arbitrary (LLM- or human-produced) dict into the canonical shape."""
    model = blank_model()
    if not isinstance(raw, dict):
        return model

    model["project"] = _merge_dict(model["project"], raw.get("project"))
    if not model["project"]["date"]:
        model["project"]["date"] = _today()

    model["objectives"] = _as_str_list(raw.get("objectives"))
    model["in_scope"] = _as_str_list(raw.get("in_scope"))
    model["out_of_scope"] = _as_str_list(raw.get("out_of_scope"))
    model["business_rules"] = _as_str_list(raw.get("business_rules"))
    model["assumptions"] = _as_str_list(raw.get("assumptions"))
    model["dependencies"] = _as_str_list(raw.get("dependencies"))
    model["reusable_components"] = _as_str_list(raw.get("reusable_components"))

    model["as_is_summary"] = str(raw.get("as_is_summary", "") or "").strip()
    model["to_be_summary"] = str(raw.get("to_be_summary", "") or "").strip()

    model["applications"] = _dict_rows(
        raw.get("applications"),
        ["name", "version", "type", "access", "environment", "notes"],
    )
    model["inputs"] = _dict_rows(
        raw.get("inputs"), ["name", "type", "source", "format", "description"]
    )
    model["outputs"] = _dict_rows(
        raw.get("outputs"), ["name", "type", "destination", "format", "description"]
    )
    model["exceptions"] = _dict_rows(
        raw.get("exceptions"), ["type", "scenario", "handling"]
    )
    model["benefits"] = _dict_rows(
        raw.get("benefits"), ["metric", "as_is", "to_be", "benefit"]
    )
    model["risks"] = _dict_rows(raw.get("risks"), ["risk", "impact", "mitigation"])

    steps = _dict_rows(
        raw.get("process_steps"),
        ["step", "action", "application", "ui_action", "input", "output",
         "business_rule", "exception"],
    )
    # Re-number steps 1..N so the SDD is always sequential even if the model skipped one.
    for idx, step in enumerate(steps, start=1):
        if not step["step"]:
            step["step"] = str(idx)
    model["process_steps"] = steps

    model["schedule"] = _merge_dict(model["schedule"], raw.get("schedule"))
    model["nfr"] = _merge_dict(model["nfr"], raw.get("nfr"))
    model["infrastructure"] = _merge_dict(model["infrastructure"], raw.get("infrastructure"))

    model["flowchart"] = _normalize_flowchart(raw.get("flowchart"), steps)
    return model


def _normalize_flowchart(raw: Any, steps: List[Dict[str, str]]) -> Dict[str, Any]:
    nodes: List[Dict[str, str]] = []
    edges: List[Dict[str, str]] = []

    if isinstance(raw, dict):
        for raw_node in _as_list(raw.get("nodes")):
            if not isinstance(raw_node, dict):
                continue
            node_id = str(raw_node.get("id", "") or "").strip()
            label = str(raw_node.get("label", "") or "").strip()
            ntype = str(raw_node.get("type", "process") or "process").strip().lower()
            if ntype not in NODE_TYPES:
                ntype = "process"
            if not node_id or not label:
                continue
            nodes.append({"id": node_id, "type": ntype, "label": label})

        valid_ids = {n["id"] for n in nodes}
        for raw_edge in _as_list(raw.get("edges")):
            if not isinstance(raw_edge, dict):
                continue
            src = str(raw_edge.get("from", "") or "").strip()
            dst = str(raw_edge.get("to", "") or "").strip()
            if src in valid_ids and dst in valid_ids:
                edges.append({
                    "from": src,
                    "to": dst,
                    "label": str(raw_edge.get("label", "") or "").strip(),
                })

    # If the model gave us steps but no usable flowchart, derive a linear one.
    if len(nodes) < 2 and steps:
        nodes, edges = _flowchart_from_steps(steps)

    return {"nodes": nodes, "edges": edges}


def _flowchart_from_steps(steps: List[Dict[str, str]]) -> tuple:
    """Build a simple linear Start -> step -> ... -> End flow as a last resort."""
    nodes = [{"id": "start", "type": "start", "label": "Start"}]
    edges = []
    prev = "start"
    for idx, step in enumerate(steps, start=1):
        nid = f"s{idx}"
        label = step["action"] or f"Step {idx}"
        nodes.append({"id": nid, "type": "process", "label": label})
        edges.append({"from": prev, "to": nid, "label": ""})
        prev = nid
    nodes.append({"id": "end", "type": "end", "label": "End"})
    edges.append({"from": prev, "to": "end", "label": ""})
    return nodes, edges


def apply_overrides(model: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
    """Overlay user-supplied project metadata (process name, client, author...)."""
    model = copy.deepcopy(model)
    if overrides:
        for key, value in overrides.items():
            if value and key in model["project"]:
                model["project"][key] = str(value).strip()
    return model
