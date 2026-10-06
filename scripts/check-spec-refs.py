#!/usr/bin/env python3
"""Prüft, ob jeder Datei-Verweis in den Feature-Specs wirklich existiert.

Eine Spec darf keine Datei nennen, die es nicht gibt — sonst schickt sie den
nächsten Leser (Mensch oder KI) ins Leere. Läuft über alle features/*.md.

Aufruf:  python3 scripts/check-spec-refs.py [features/<ID>-*.md ...]
Ohne Argumente: alle features/*.md.
Versteht  [txt](../pfad)  und  [txt](<../pfad mit klammern>)  sowie  `pfad`-Backticks
mit bekannten Präfixen (app/, components/, lib/, hooks/, supabase/, docs/, __tests__/).
"""
import itertools
import os
import re
import sys
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFIXES = ("app/", "components/", "lib/", "hooks/", "supabase/", "docs/", "__tests__/", "features/")

LINK_ANGLE = re.compile(r"\]\(<([^>]+)>\)")
BACKTICK = re.compile(r"`([^`\n]+)`")
# Vorlagen-Muster wie docs/qa/<ID>-qa-YYYY-MM-DD.md sind keine echten Verweise.
# Das ID-Kuerzel ist projektabhaengig (CLAUDE.md), deshalb generisch: jedes
# GROSSBUCHSTABEN-X-Muster zaehlt als Platzhalter, nicht nur eines.
PLACEHOLDER = re.compile(r"[A-Z]{2,}-X|projX|YYYY|…|<|\*")


def plain_links(text):
    """[txt](ziel) mit ausgewogenen Klammern im Ziel.

    Ein naives `[^)]+` bricht bei `../app/(tabs)/index.tsx` nach `../app/(tabs`
    ab und meldet einen toten Verweis, den es nicht gibt. Markdown erlaubt
    Klammerpaare im Ziel, also wird hier mitgezaehlt statt abgeschnitten.
    """
    for m in re.finditer(r"\]\(", text):
        i = m.end()
        depth = 1
        while i < len(text):
            c = text[i]
            if c in "<> \n":
                break
            if c == "(":
                depth += 1
            elif c == ")":
                depth -= 1
                if depth == 0:
                    yield text[m.end():i]
                    break
            i += 1


def targets(path, text):
    base = os.path.dirname(os.path.join(ROOT, path))
    for ref in itertools.chain(
        (m.group(1) for m in LINK_ANGLE.finditer(text)), plain_links(text)
    ):
        if ref.startswith(("http", "#", "mailto:")) or PLACEHOLDER.search(ref):
            continue
        yield ref, os.path.normpath(os.path.join(base, ref.split("#")[0]))
    for m in BACKTICK.finditer(text):
        ref = m.group(1)
        if ref.startswith(PREFIXES) and " " not in ref and not PLACEHOLDER.search(ref):
            yield ref, os.path.normpath(os.path.join(ROOT, ref))


def main():
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, "features/*.md")))
    bad = 0
    for f in files:
        rel = os.path.relpath(f, ROOT)
        text = open(os.path.join(ROOT, rel)).read()
        misses = []
        seen = set()
        for ref, target in targets(rel, text):
            if ref in seen:
                continue
            seen.add(ref)
            if not os.path.exists(target.split(":")[0]):
                misses.append(ref)
        if misses:
            bad += len(misses)
            print(f"{rel}:")
            for m in misses:
                print(f"   FEHLT  {m}")
        else:
            print(f"{rel}: {len(seen)} Verweise OK")
    print(f"\n{'FEHLER: ' + str(bad) + ' tote Verweise' if bad else 'Alle Verweise gültig.'}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
