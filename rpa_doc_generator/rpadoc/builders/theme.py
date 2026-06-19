"""Shared visual theme for both decks."""

from pptx.dml.color import RGBColor

# Brand palette
PRIMARY = RGBColor(0x1F, 0x38, 0x64)      # deep navy
SECONDARY = RGBColor(0x2E, 0x75, 0xB6)    # mid blue
LIGHT = RGBColor(0xD9, 0xE2, 0xF3)        # pale blue (row banding / fills)
LIGHTER = RGBColor(0xEE, 0xF3, 0xFB)      # very pale blue
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK_TEXT = RGBColor(0x26, 0x2A, 0x33)
GREY_TEXT = RGBColor(0x5A, 0x5F, 0x6B)
LINE = RGBColor(0xB6, 0xC2, 0xD9)

# Flowchart node colours, keyed by node type.
NODE_COLORS = {
    "start":      RGBColor(0x70, 0xAD, 0x47),   # green
    "end":        RGBColor(0xC0, 0x3A, 0x2B),   # red
    "process":    RGBColor(0x2E, 0x75, 0xB6),   # blue
    "decision":   RGBColor(0xED, 0x7D, 0x31),   # orange
    "io":         RGBColor(0xFF, 0xC0, 0x00),   # gold
    "subprocess": RGBColor(0x70, 0x30, 0xA0),   # purple
}

NODE_LABELS = {
    "start": "Start / End (terminator)",
    "process": "Process step",
    "decision": "Decision",
    "io": "Data input / output",
    "subprocess": "Reusable sub-process",
}

FONT = "Calibri"
FONT_LIGHT = "Calibri Light"
