#!/usr/bin/env python3
"""Prüfauftrag für die unabhängige Abnahme: gibt nur die WAS-Abschnitte einer Spec aus.

Der Prüfer soll gegen die Vereinbarung prüfen, nicht gegen die Sicht des Builders.
Darum fehlen hier Verlauf, Decision Log und Tests — dort steht, was gebaut wurde und
was angeblich belegt ist, nicht, was gelten soll.

Aufruf: python3 scripts/spec-brief.py features/<ID>-*.md
"""
import re
import sys

KEEP = {
    "Was es tut",
    "Dependencies",
    "Screens & Komponenten",
    "Daten & Server",
    "Regeln",
    "Acceptance Criteria",
    "Grenzen",
    "Umgebung",
}


def brief(text: str) -> str:
    lines = text.splitlines()
    out = [lines[0]] if lines and lines[0].startswith("# ") else []
    keep = False
    for line in lines[1:]:
        heading = re.match(r"^## (.+?)\s*$", line)
        if heading:
            keep = heading.group(1) in KEEP
        if keep:
            out.append(line)
    # HTML-Kommentare der Vorlage sind Schreibhilfen, kein Inhalt
    return re.sub(r"<!--.*?-->\n?", "", "\n".join(out), flags=re.S).strip() + "\n"


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Aufruf: python3 scripts/spec-brief.py features/<ID>-*.md")
    with open(sys.argv[1], encoding="utf-8") as f:
        sys.stdout.write(brief(f.read()))
