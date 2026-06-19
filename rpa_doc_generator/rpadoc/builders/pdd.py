"""Assemble the Process Design Document (PDD) deck.

The PDD is the business-facing artefact: it captures *what* the process is and
*how the business performs it today*, in enough detail to confirm understanding
with the SME and to hand to the RPA team. It is lighter on infrastructure/NFRs
than the SDD and heavier on the as-is process and the keystroke-level walk-through.
"""

from __future__ import annotations

from . import flowchart
from .deck import Deck

SECTIONS = [
    "Document Control",
    "Process Overview",
    "Objectives & Benefits",
    "Scope",
    "Applications Used",
    "As-Is Process — Detailed Steps",
    "As-Is Process Flow",
    "Inputs & Outputs",
    "Business Rules",
    "Exceptions",
    "Assumptions & Dependencies",
]


def build(model: dict, out_path: str) -> str:
    deck = Deck("PDD", model)
    p = model["project"]

    deck.title_slide("Process Design Document")
    deck.toc_slide(SECTIONS)

    # 1. Document control ---------------------------------------------------- #
    deck.section_divider("Document Control")
    deck.table_slide(
        "Document Control",
        ["Attribute", "Detail"],
        [
            ["Document Type", "Process Design Document (PDD)"],
            ["Process Name", p["process_name"]],
            ["Client", p["client"] or "—"],
            ["Department", p["department"] or "—"],
            ["Process Owner", p["process_owner"] or "—"],
            ["Author", p["author"] or "—"],
            ["Version", p["version"]],
            ["Date", p["date"]],
            ["Status", "Draft for SME sign-off"],
        ],
        col_widths=[1, 2.4], font_size=12, rows_per_slide=12,
    )

    # 2. Process overview ---------------------------------------------------- #
    deck.section_divider("Process Overview")
    deck.narrative_slide(
        "Process Overview",
        [("What this process does", p["summary"] or model["as_is_summary"]
          or "Summary of the business process to be automated."),
         ("How it is performed today", model["as_is_summary"])],
    )

    # 3. Objectives & benefits ---------------------------------------------- #
    deck.section_divider("Objectives & Benefits")
    deck.bullets_slide("Objectives", model["objectives"],
                       empty_msg="Objectives to be confirmed with the process owner.")
    deck.table_slide(
        "Expected Benefits",
        ["Metric", "As-Is", "To-Be", "Benefit"],
        [[b["metric"], b["as_is"], b["to_be"], b["benefit"]] for b in model["benefits"]],
        col_widths=[1.4, 1, 1, 2.4], font_size=10,
        empty_msg="Benefit metrics to be quantified with the business.",
    )

    # 4. Scope --------------------------------------------------------------- #
    deck.section_divider("Scope")
    deck.bullets_slide("In Scope", model["in_scope"], numbered=True,
                       empty_msg="In-scope activities to be confirmed.")
    deck.bullets_slide("Out of Scope", model["out_of_scope"], numbered=True,
                       empty_msg="Exclusions to be confirmed with the business.")

    # 5. Applications -------------------------------------------------------- #
    deck.section_divider("Applications Used")
    deck.table_slide(
        "Applications Used",
        ["Application", "Type", "Access", "Environment", "Notes"],
        [[a["name"], a["type"], a["access"], a["environment"], a["notes"]]
         for a in model["applications"]],
        col_widths=[1.4, 1.0, 1.1, 1.0, 2.0], font_size=10,
        empty_msg="Applications to be confirmed.",
    )

    # 6. As-is detailed steps ------------------------------------------------ #
    deck.section_divider("As-Is Process — Detailed Steps")
    deck.table_slide(
        "As-Is Process — Detailed Steps",
        ["#", "Activity", "Application", "Action", "Input", "Output"],
        [[s["step"], s["action"], s["application"], s["ui_action"], s["input"], s["output"]]
         for s in model["process_steps"]],
        col_widths=[0.3, 2.6, 1.1, 1.2, 1.2, 1.2], font_size=9,
        rows_per_slide=9,
        subtitle="Step-by-step walk-through as performed by the business user today.",
    )

    # 7. As-is flow ---------------------------------------------------------- #
    deck.section_divider("As-Is Process Flow")
    fc = model["flowchart"]
    flowchart.add_flowchart(deck, fc["nodes"], fc["edges"], title="As-Is Process Flow")

    # 8. Inputs & outputs ---------------------------------------------------- #
    deck.section_divider("Inputs & Outputs")
    deck.table_slide(
        "Inputs", ["Name", "Type", "Source", "Format", "Description"],
        [[i["name"], i["type"], i["source"], i["format"], i["description"]]
         for i in model["inputs"]],
        col_widths=[1.2, 0.9, 1.1, 0.9, 2.4], font_size=10,
        empty_msg="Inputs to be confirmed.",
    )
    deck.table_slide(
        "Outputs", ["Name", "Type", "Destination", "Format", "Description"],
        [[o["name"], o["type"], o["destination"], o["format"], o["description"]]
         for o in model["outputs"]],
        col_widths=[1.2, 0.9, 1.1, 0.9, 2.4], font_size=10,
        empty_msg="Outputs to be confirmed.",
    )

    # 9. Business rules ------------------------------------------------------ #
    deck.section_divider("Business Rules")
    deck.bullets_slide("Business Rules", model["business_rules"], numbered=True,
                       empty_msg="Business rules to be elaborated with the SME.")

    # 10. Exceptions --------------------------------------------------------- #
    deck.section_divider("Exceptions")
    deck.table_slide(
        "Exceptions",
        ["Type", "Scenario", "Handling Today"],
        [[e["type"], e["scenario"], e["handling"]] for e in model["exceptions"]],
        col_widths=[0.8, 2.2, 3.0], font_size=10,
        empty_msg="Exception scenarios to be captured with the SME.",
    )

    # 11. Assumptions & dependencies ----------------------------------------- #
    deck.section_divider("Assumptions & Dependencies")
    deck.bullets_slide("Assumptions", model["assumptions"], numbered=True,
                       empty_msg="Assumptions to be confirmed.")
    deck.bullets_slide("Dependencies", model["dependencies"], numbered=True,
                       empty_msg="Dependencies to be confirmed.")

    deck.save(out_path)
    return out_path
