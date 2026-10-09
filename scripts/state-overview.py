#!/usr/bin/env python3
"""Ist-Zustand auf einen Blick — Eingabe für /architecture.

Erzeugt aus dem Code (nicht aus Specs), was ein neues Feature vorfindet:
- Schema: Migrationen (Modus supabase: Dateinamen + CREATE/ALTER aus
  `supabase/migrations/`; Modus lokal: Einträge und SQL der Migrationsliste)
- Verträge: exportierte Funktionen, Typen und Konstanten aus `lib/` (ohne Tests),
  jeweils mit Signaturzeile
- Komponenten: Ordner unter `components/` mit ihren Dateien

Aufruf: python3 scripts/state-overview.py
Die Ausgabe ist flüchtig — nie als Datei einchecken, sie veraltet sofort.
"""
import glob
import os
import re

SQL_RE = re.compile(
    r"\b(CREATE\s+TABLE[^(]*\(.*?\)\s*(?:;|`|\"|$)"
    r"|CREATE\s+(?:UNIQUE\s+)?(?:INDEX|VIEW|TRIGGER)[^;(]*"
    r"|ALTER\s+TABLE\s+\S+\s+\w+(?:\s+COLUMN)?\s+\S+(?:\s+\w+)?)",
    re.IGNORECASE | re.DOTALL,
)
EXPORT_RE = re.compile(
    r"^export\s+(?:default\s+)?(?:async\s+)?(function|const|type|interface|class|enum|\{)"
)


def clean(s):
    return re.sub(r"\s+", " ", s).strip().rstrip(';`"').strip()


def schema():
    print("## Schema")
    found = False
    for path in sorted(glob.glob("supabase/migrations/*.sql")):
        found = True
        print(f"- {os.path.basename(path)}")
        for m in SQL_RE.findall(open(path, encoding="utf-8").read()):
            print(f"    {clean(m)}")
    for path in sorted(set(glob.glob("lib/**/migrations.ts", recursive=True) + glob.glob("db/**/migrations.ts", recursive=True))):
        found = True
        text = open(path, encoding="utf-8").read()
        names = re.findall(r"name:\s*[\"'`]([^\"'`]+)", text)
        print(f"- {path}: {len(names)} Migration(en)")
        for n in names:
            print(f"    {n}")
        for m in SQL_RE.findall(text):
            print(f"    {clean(m)}")
    if not found:
        print("- keine Migrationen")
    print()


def contracts():
    print("## Verträge (`lib/`)")
    files = [
        f for f in sorted(glob.glob("lib/**/*.ts", recursive=True) + glob.glob("lib/**/*.tsx", recursive=True))
        if not re.search(r"\.test\.tsx?$", f) and not f.endswith(".d.ts")
    ]
    for path in files:
        lines = open(path, encoding="utf-8").read().splitlines()
        exports = []
        for i, line in enumerate(lines):
            if EXPORT_RE.match(line):
                sig = line.rstrip(" {")
                if sig.endswith("(") or sig.count("(") > sig.count(")"):
                    j = i + 1
                    while j < len(lines) and sig.count("(") > sig.count(")"):
                        sig += " " + lines[j].strip()
                        j += 1
                exports.append(clean(sig.replace("export ", "", 1))[:160])
        if exports:
            print(f"- {path}")
            for e in exports:
                print(f"    {e}")
    if not files:
        print("- keine")
    print()


def components():
    print("## Komponenten (`components/`)")
    dirs = sorted(d for d in glob.glob("components/*/") if os.path.isdir(d))
    for d in dirs:
        names = sorted(os.path.splitext(f)[0] for f in os.listdir(d) if f.endswith((".tsx", ".ts")))
        print(f"- {d.rstrip('/')}: {', '.join(names) or '—'}")
    if not dirs:
        print("- keine")


if __name__ == "__main__":
    schema()
    contracts()
    components()
