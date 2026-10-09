#!/usr/bin/env python3
"""Schützt ausgelieferte Migrationen: was im letzten Release steckt, bleibt unverändert.

Ausgeliefert = Stand des neuesten Release-Tags (`v*-build*`, gesetzt von /deploy).
Geprüft wird der Stand, der committet würde (Index, bei abweichender Arbeitskopie diese) — so läuft es als Commit-Gate.

- Modus supabase: jede Datei unter `supabase/migrations/`, die im Tag existiert,
  muss byte-gleich vorhanden sein.
- Modus lokal: die Migrationsliste (`lib/**/migrations.ts`, `db/**/migrations.ts`)
  darf nur hinten wachsen — ihr Stand im Tag bis vor die schließende `]` muss
  unverändert am Anfang der neuen Datei stehen.

Ohne Release-Tag ist nichts ausgeliefert → grün.

Aufruf: python3 scripts/check-migrations.py          (Exit 1 bei Verstoß)
        python3 scripts/check-migrations.py --hook   (PreToolUse-Hook: liest JSON von
                                                      stdin, prüft nur bei `git commit`,
                                                      Exit 2 blockiert)
"""
import fnmatch
import json
import subprocess
import sys

LOCAL_PATTERNS = ["lib/*migrations.ts", "lib/**/migrations.ts", "db/**/migrations.ts"]


def git(*args):
    r = subprocess.run(["git", *args], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def latest_release_tag():
    out = git("tag", "--list", "v*-build*", "--sort=-creatordate")
    tags = out.split() if out else []
    return tags[0] if tags else None


def files_at(ref):
    out = git("ls-tree", "-r", "--name-only", ref)
    return out.splitlines() if out else []


def current(path):
    """Gestagter Stand; weicht die Arbeitskopie ab (z. B. `git commit -a`), zählt die."""
    staged = git("show", f":{path}")
    try:
        with open(path, encoding="utf-8") as f:
            work = f.read()
    except OSError:
        work = None
    return work if work is not None and work != staged else staged


def check(tag):
    problems = []
    for path in files_at(tag):
        shipped = git("show", f"{tag}:{path}")
        if path.startswith("supabase/migrations/"):
            staged = current(path)
            if staged is None:
                problems.append(f"{path}: ausgeliefert in {tag}, aber gelöscht")
            elif staged != shipped:
                problems.append(f"{path}: ausgeliefert in {tag}, aber geändert")
        elif any(fnmatch.fnmatch(path, p) for p in LOCAL_PATTERNS):
            staged = current(path)
            head = shipped[: shipped.rfind("]")] if "]" in shipped else shipped
            if staged is None:
                problems.append(f"{path}: Migrationsliste aus {tag} gelöscht")
            elif not staged.startswith(head):
                problems.append(
                    f"{path}: ausgelieferte Einträge aus {tag} geändert — nur hinten anhängen"
                )
    return problems


def main():
    hook = "--hook" in sys.argv
    if hook:
        try:
            cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
        except ValueError:
            return 0
        if "git commit" not in cmd:
            return 0
    tag = latest_release_tag()
    if not tag:
        if not hook:
            print("Kein Release-Tag — nichts ausgeliefert.")
        return 0
    problems = check(tag)
    if not problems:
        if not hook:
            print(f"Migrationen seit {tag} nur angehängt.")
        return 0
    out = sys.stderr if hook else sys.stdout
    print("Ausgelieferte Migration verändert (.claude/rules/local-db.md bzw. backend.md):", file=out)
    for p in problems:
        print("   " + p, file=out)
    print("Änderung zurücknehmen und als neue Migration anhängen.", file=out)
    return 2 if hook else 1


if __name__ == "__main__":
    sys.exit(main())
