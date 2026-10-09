#!/usr/bin/env python3
"""Floor-Guard — findet im Diff, was das Prüfnetz schwächt statt den Code zu reparieren.

Ein Agent, der ohne Aufsicht baut, kann einen roten Test auf zwei Wegen grün machen:
Code reparieren — oder den Test abschalten, die Prüfzeile löschen, den Fehler
unterdrücken. Dieses Script meldet den zweiten Weg. Es versteht nichts, es findet Muster.

Gemeldet wird (nur in hinzugefügten bzw. entfernten Zeilen des Diffs):
- Unterdrückung: @ts-ignore, @ts-nocheck, @ts-expect-error, eslint-disable
- Tests aus: .skip, .only (setzt alle anderen aus), xit/xdescribe/xtest, .todo
- Prüfung entfernt: eine Testdatei, die weiter existiert, hat unterm Strich weniger `expect(`-Zeilen; Testdatei gelöscht
- Fehler geschluckt: leeres catch
- Testlauf verengt: Änderung an *PathIgnorePatterns / testMatch / testRegex
- Stub übrig: `TODO(<ID>): backend` irgendwo in app/, lib/, components/, hooks/ (ganzer Stand, nicht nur Diff)

Bewusste Ausnahme: in derselben Zeile `floor-guard: ok — <Grund>`; der Grund gehört
zusätzlich ins Decision Log der Spec.

Aufruf: python3 scripts/floor-guard.py <basis>     (Diff <basis>..Arbeitskopie inkl. untracked)
Exit: 0 sauber · 1 Funde · 2 konnte nicht prüfen (zählt NIE als sauber)
"""
import re
import subprocess
import sys

CODE = re.compile(r"\.(ts|tsx|js|jsx|mjs|cjs)$")
TEST = re.compile(r"(\.test\.|\.spec\.|__tests__/)")
CONFIG = re.compile(r"(^|/)(package\.json|jest\.config\.[a-z]+)$")
ALLOW = "floor-guard: ok"

ADDED = [
    (re.compile(r"@ts-(ignore|nocheck|expect-error)"), "Typfehler unterdrückt"),
    (re.compile(r"eslint-disable"), "Lint unterdrückt"),
    (re.compile(r"\b(it|test|describe)\.(skip|only|todo)\b"), "Test abgeschaltet/verengt"),
    (re.compile(r"\b(xit|xtest|xdescribe|fit|fdescribe)\s*\("), "Test abgeschaltet/verengt"),
    (re.compile(r"catch\s*(\([^)]*\))?\s*\{\s*\}"), "Fehler geschluckt (leeres catch)"),
]
CONFIG_KEYS = re.compile(r"(PathIgnorePatterns|testMatch|testRegex|passWithNoTests)")
STUB = re.compile(r"TODO\([^)]*\):\s*backend")


def git(*args):
    r = subprocess.run(["git", *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}: {r.stderr.strip()}")
    return r.stdout


def diff_lines(basis):
    """(datei, '+'/'-', zeile) für tracked Änderungen basis..Arbeitskopie und untracked Dateien."""
    out = []
    path = None
    for line in git("diff", "-U0", "--no-color", basis, "--").splitlines():
        if line.startswith("+++ "):
            path = None if line[4:] == "/dev/null" else line[6:]
        elif line.startswith("--- "):
            old = None if line[4:] == "/dev/null" else line[6:]
            path = old
        elif path and line[:1] in "+-" and not line.startswith(("+++", "---")):
            out.append((path, line[0], line[1:]))
    for f in git("ls-files", "--others", "--exclude-standard").splitlines():
        try:
            for l in open(f, encoding="utf-8", errors="ignore"):
                out.append((f, "+", l.rstrip("\n")))
        except OSError:
            pass
    return out


def main():
    if len(sys.argv) != 2:
        print("Aufruf: floor-guard.py <basis>", file=sys.stderr)
        return 2
    basis = sys.argv[1]
    try:
        git("rev-parse", "--verify", basis + "^{commit}")
        lines = diff_lines(basis)
        deleted = git("diff", "--name-only", "--diff-filter=D", basis, "--").splitlines()
        tracked = git("ls-files", "app", "lib", "components", "hooks").splitlines()
    except (RuntimeError, OSError) as e:
        print(f"FLOOR-GUARD KONNTE NICHT PRÜFEN: {e}")
        return 2

    finds = []
    expects, removed = {}, {}
    for path, sign, text in lines:
        if ALLOW in text:
            continue
        if sign == "+" and CODE.search(path):
            for rx, what in ADDED:
                if rx.search(text):
                    finds.append(f"{path}: {what}: {text.strip()[:100]}")
        if TEST.search(path) and "expect(" in text and path not in deleted:
            expects[path] = expects.get(path, 0) + (1 if sign == "+" else -1)
            if sign == "-":
                removed.setdefault(path, []).append(text.strip()[:100])
        if CONFIG.search(path) and CONFIG_KEYS.search(text):
            finds.append(f"{path}: Testlauf-Konfiguration geändert: {sign}{text.strip()[:100]}")
    for path, delta in expects.items():
        if delta < 0:
            finds.append(f"{path}: {-delta} Prüfung(en) weniger, z. B. {removed[path][0]}")
    for path in deleted:
        if TEST.search(path):
            finds.append(f"{path}: Testdatei gelöscht")
    for path in tracked:
        try:
            for n, l in enumerate(open(path, encoding="utf-8", errors="ignore"), 1):
                if STUB.search(l) and ALLOW not in l:
                    finds.append(f"{path}:{n}: Stub nicht ersetzt: {l.strip()[:100]}")
        except OSError:
            pass

    if not finds:
        print(f"Floor-Guard: sauber ({basis}..Arbeitskopie).")
        return 0
    print(f"Floor-Guard: {len(finds)} Fund(e) — jeder ist ein Bug, außer bewusst markiert ({ALLOW} — <Grund>):")
    for f in dict.fromkeys(finds):
        print("   " + f)
    return 1


if __name__ == "__main__":
    sys.exit(main())
