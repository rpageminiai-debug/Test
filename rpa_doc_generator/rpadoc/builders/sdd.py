"""Assemble the Solution Design Document (SDD) deck.

The SDD is the detailed technical blueprint for the automation: it goes deep on
the step-by-step solution, applications, data, exception handling, NFRs and
infrastructure — everything a developer needs to build the bot.
"""

from __future__ import annotations

from . import flowchart
from .deck import Deck

SECTIONS = [
    "Document Control",
    "Executive Summary & Objectives",
    "Scope",
    "As-Is Process",
    "To-Be (Automated) Process",
    "Applications & Systems",
    "Detailed Solution Design Steps",
    "Process Flow Diagram",
    "Inputs & Outputs",
    "Business Rules",
    "Exception Handling",
    "Non-Functional Requirements",
    "Infrastructure & Deployment",
    "Schedule & Volumetrics",
    "Assumptions, Dependencies & Reusable Components",
    "Expected Benefits",
    "Risks & Mitigations",
]


def build(model: dict, out_path: str) -> str:
    deck = Deck("SDD", model)
    p = model["project"]

    deck.title_slide("Solution Design Document")
    deck.toc_slide(SECTIONS)

    # 1. Document control ---------------------------------------------------- #
    deck.section_divider("Document Control")
    deck.table_slide(
        "Document Control",
        ["Attribute", "Detail"],
        [
            ["Document Type", "Solution Design Document (SDD)"],
            ["Process Name", p["process_name"]],
            ["Client", p["client"] or "—"],
            ["Department", p["department"] or "—"],
            ["Document Owner", p["document_owner"] or p["author"] or "—"],
            ["Process Owner", p["process_owner"] or "—"],
            ["Author", p["author"] or "—"],
            ["Version", p["version"]],
            ["Date", p["date"]],
            ["Status", "Draft for review"],
        ],
        col_widths=[1, 2.4], font_size=12, rows_per_slide=12,
    )
    deck.table_slide(
        "Version History",
        ["Version", "Date", "Author", "Description of Change"],
        [[p["version"], p["date"], p["author"] or "—", "Initial draft generated from requirement transcript."]],
        col_widths=[0.8, 1, 1, 2.6], font_size=11,
    )

    # 2. Executive summary --------------------------------------------------- #
    deck.section_divider("Executive Summary & Objectives")
    deck.narrative_slide(
        "Executive Summary",
        [("Overview", p["summary"] or model["as_is_summary"] or
          "This document describes the automated solution for the process named above.")],
    )
    deck.bullets_slide("Business Objectives", model["objectives"],
                       intro="The automation is expected to deliver against the following objectives.",
                       empty_msg="Objectives to be confirmed with the process owner.")

    # 3. Scope --------------------------------------------------------------- #
    deck.section_divider("Scope")
    deck.bullets_slide("In Scope", model["in_scope"], numbered=True,
                       empty_msg="In-scope activities to be confirmed.")
    deck.bullets_slide("Out of Scope", model["out_of_scope"], numbered=True,
                       empty_msg="No explicit exclusions captured — confirm with the business.")

    # 4 & 5. As-is / To-be --------------------------------------------------- #
    deck.section_divider("As-Is & To-Be Process")
    deck.narrative_slide("As-Is Process (Manual)",
                         [("How the process runs today", model["as_is_summary"]
                           or "Current manual process to be documented with the SME.")])
    deck.narrative_slide("To-Be Process (Automated)",
                         [("Target automated process", model["to_be_summary"]
                           or "The robot performs the steps end-to-end with exception-only manual handling.")])

    # 6. Applications -------------------------------------------------------- #
    deck.section_divider("Applications & Systems")
    deck.table_slide(
        "Applications & Systems",
        ["Application", "Version", "Type", "Access", "Environment", "Notes"],
        [[a["name"], a["version"], a["type"], a["access"], a["environment"], a["notes"]]
         for a in model["applications"]],
        col_widths=[1.4, 0.8, 1.0, 1.1, 1.0, 1.7], font_size=10,
        empty_msg="Applications to be confirmed.",
    )

    # 7. Detailed solution steps (the heart of the SDD) ---------------------- #
    deck.section_divider("Detailed Solution Design Steps")
    deck.table_slide(
        "Detailed Solution Design Steps",
        ["#", "Action", "Application", "UI Action", "Input", "Output", "Business Rule", "Exception Handling"],
        [[s["step"], s["action"], s["application"], s["ui_action"], s["input"],
          s["output"], s["business_rule"], s["exception"]] for s in model["process_steps"]],
        col_widths=[0.3, 2.2, 1.1, 1.0, 1.0, 1.0, 1.4, 1.6], font_size=8.5,
        rows_per_slide=8,
        subtitle="Keystroke / transaction-level steps for the development team.",
    )

    # 8. Flow diagram -------------------------------------------------------- #
    deck.section_divider("Process Flow Diagram")
    fc = model["flowchart"]
    flowchart.add_flowchart(deck, fc["nodes"], fc["edges"],
                            title="Solution Process Flow")

    # 9. Inputs & outputs ---------------------------------------------------- #
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

    # 10. Business rules ----------------------------------------------------- #
    deck.section_divider("Business Rules")
    deck.bullets_slide("Business Rules", model["business_rules"], numbered=True,
                       empty_msg="Business rules to be elaborated with the SME.")

    # 11. Exception handling ------------------------------------------------- #
    deck.section_divider("Exception Handling")
    deck.table_slide(
        "Exception Handling",
        ["Type", "Scenario", "Handling Strategy"],
        [[e["type"], e["scenario"], e["handling"]] for e in model["exceptions"]],
        col_widths=[0.8, 2.2, 3.0], font_size=10,
        empty_msg="Exception scenarios to be defined (business & system exceptions).",
    )

    # 12. NFRs --------------------------------------------------------------- #
    deck.section_divider("Non-Functional Requirements")
    nfr = model["nfr"]
    deck.table_slide(
        "Non-Functional Requirements",
        ["Area", "Requirement"],
        [["Security", nfr["security"]], ["Credentials", nfr["credentials"]],
         ["Performance", nfr["performance"]], ["Scalability", nfr["scalability"]],
         ["Availability", nfr["availability"]], ["Audit & Logging", nfr["audit"]]],
        col_widths=[1, 3.2], font_size=11, rows_per_slide=8,
        empty_msg="NFRs to be confirmed.",
    )

    # 13. Infrastructure ----------------------------------------------------- #
    deck.section_divider("Infrastructure & Deployment")
    inf = model["infrastructure"]
    deck.table_slide(
        "Infrastructure & Deployment",
        ["Attribute", "Detail"],
        [["Bot Type", inf["bot_type"]], ["Orchestration", inf["orchestration"]],
         ["Machines / VMs", inf["machines"]], ["Licensing", inf["license"]]],
        col_widths=[1, 3], font_size=11, rows_per_slide=8,
        empty_msg="Infrastructure to be confirmed.",
    )

    # 14. Schedule ----------------------------------------------------------- #
    deck.section_divider("Schedule & Volumetrics")
    sch = model["schedule"]
    deck.table_slide(
        "Schedule & Volumetrics",
        ["Attribute", "Detail"],
        [["Trigger", sch["trigger"]], ["Frequency", sch["frequency"]],
         ["SLA", sch["sla"]], ["Volumetrics", sch["volumetrics"]],
         ["Peak Period", sch["peak"]]],
        col_widths=[1, 3], font_size=11, rows_per_slide=8,
        empty_msg="Schedule & volumetrics to be confirmed.",
    )

    # 15. Assumptions / dependencies / reusable ------------------------------ #
    deck.section_divider("Assumptions, Dependencies & Reusable Components")
    deck.bullets_slide("Assumptions", model["assumptions"], numbered=True,
                       empty_msg="Assumptions to be confirmed.")
    deck.bullets_slide("Dependencies", model["dependencies"], numbered=True,
                       empty_msg="Dependencies to be confirmed.")
    deck.bullets_slide("Reusable Components", model["reusable_components"],
                       empty_msg="Candidate reusable components to be identified during design.")

    # 16. Benefits ----------------------------------------------------------- #
    deck.section_divider("Expected Benefits")
    deck.table_slide(
        "Expected Benefits",
        ["Metric", "As-Is", "To-Be", "Benefit"],
        [[b["metric"], b["as_is"], b["to_be"], b["benefit"]] for b in model["benefits"]],
        col_widths=[1.4, 1, 1, 2.4], font_size=10,
        empty_msg="Benefit metrics to be quantified with the business.",
    )

    # 17. Risks -------------------------------------------------------------- #
    deck.section_divider("Risks & Mitigations")
    deck.table_slide(
        "Risks & Mitigations",
        ["Risk", "Impact", "Mitigation"],
        [[r["risk"], r["impact"], r["mitigation"]] for r in model["risks"]],
        col_widths=[2.2, 1, 2.4], font_size=10,
        empty_msg="Delivery & operational risks to be assessed.",
    )

    deck.save(out_path)
    return out_path
