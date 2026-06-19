"""Command-line entry point.

    python -m rpadoc.cli transcript.txt --out ./output \
        --process-name "Invoice Processing" --client "Acme" --author "Jane Doe"
"""

from __future__ import annotations

import argparse
import json
import os
import sys

from . import generate_documents


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog="rpadoc",
        description="Generate RPA SDD & PDD PowerPoint decks from a requirement transcript.",
    )
    parser.add_argument("transcript", help="Path to the transcript .txt file")
    parser.add_argument("--out", default="output", help="Output directory (default: ./output)")
    parser.add_argument("--which", choices=["both", "sdd", "pdd"], default="both")
    parser.add_argument("--process-name", dest="process_name")
    parser.add_argument("--client")
    parser.add_argument("--department")
    parser.add_argument("--author")
    parser.add_argument("--version", dest="version")
    parser.add_argument("--save-model", help="Optional path to dump the extracted JSON model")
    args = parser.parse_args(argv)

    if not os.path.isfile(args.transcript):
        parser.error(f"transcript file not found: {args.transcript}")

    overrides = {k: v for k, v in {
        "process_name": args.process_name,
        "client": args.client,
        "department": args.department,
        "author": args.author,
        "version": args.version,
    }.items() if v}

    using_ai = "Claude" if os.environ.get("ANTHROPIC_API_KEY") else "heuristic (no ANTHROPIC_API_KEY set)"
    print(f"Analysing transcript via {using_ai} …")

    result = generate_documents(args.transcript, out_dir=args.out,
                                overrides=overrides, which=args.which)

    if args.save_model:
        with open(args.save_model, "w", encoding="utf-8") as fh:
            json.dump(result["model"], fh, indent=2, ensure_ascii=False)
        print(f"  model  -> {args.save_model}")

    for key in ("sdd", "pdd"):
        if key in result:
            print(f"  {key.upper()}    -> {result[key]}")
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
