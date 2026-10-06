# Eingang

> Loser Zettel für Einfälle, die noch **kein Zuhause** haben — aus einem Meeting, beim Benutzen der App, oder von Claude unterwegs gefunden.
> Zweck ist einzig, die Lücke zu überbrücken zwischen „fällt auf" und „jemand entscheidet, wo es hingehört".
> **Hier wohnt nichts.** Wenn diese Datei dauerhaft voll ist, fehlt Triage — nicht Platz.

## So läuft es

**Rein:** eine Zeile, Datum davor. Kein Format, keine Kategorie, keine Priorität. Beim Aufschreiben wird nicht entschieden — das ist der ganze Punkt.

**Raus:** über `/refine <ID>` (gehört zu einem bestehenden Feature) oder `/write-spec <Name>` (ist ein eigenes Ding — was ein Feature ist, steht unten in [`features/INDEX.md`](../features/INDEX.md)). `/refine` ohne Argument listet die Features auf, die ID musst du nicht im Kopf haben.

Jeder Eintrag verlässt den Eingang in genau eine von vier Richtungen — und wird dann **hier gelöscht**:

| Wohin | Wann |
|-------|------|
| **Grenzen** der zuständigen Spec | gehört zu einem Feature, ist aber bewusst (noch) nicht gebaut |
| Roadmap in [`docs/PRD.md`](PRD.md) | ein eigenes Vorhaben, noch ohne Spec |
| „Ungereleast" in [`docs/RELEASES.md`](RELEASES.md) | schon gebaut, wartet nur auf den nächsten Build |
| gelöscht | war bei Licht besehen doch egal — der häufigste Fall, und völlig in Ordnung |

Eine Notiz, die seit Wochen hier steht, ist eine Entscheidung, die niemand trifft. Dann gehört sie in eine der vier Spalten, egal in welche.

**Landet sie in den Grenzen einer Spec, bekommt sie dort `**Offen:**` vorangestellt** — mit der Maßnahme und einer Dringlichkeit. So bleibt sie auffindbar, ohne dass eine zweite Liste entsteht:

```bash
grep -rn "\*\*Offen:\*\*" features/*.md
```

## Offen

_Noch nichts._
