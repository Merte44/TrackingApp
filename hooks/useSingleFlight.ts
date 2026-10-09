import { useRef } from "react";

/**
 * Synchrone Sperre für Aktionen, die nur einmal gleichzeitig laufen dürfen
 * (Sichern, Löschen). React-State greift erst nach dem nächsten Render — ein
 * schneller Doppel-Tipp käme durch. Diese Sperre greift sofort.
 */
export interface SingleFlight {
  /** Führt `task` aus, wenn gerade nichts läuft. `false` = übersprungen. Fehler von `task` werden weitergereicht. */
  run(task: () => Promise<unknown>): Promise<boolean>;
  /** `true`, solange eine Aktion läuft oder die Sperre geschlossen ist. */
  isRunning(): boolean;
  /** Sperre dauerhaft halten (z. B. nach Erfolg, während das Sheet schließt). */
  close(): void;
}

export function createSingleFlight(): SingleFlight {
  let running = false;
  let closed = false;
  return {
    async run(task) {
      if (running || closed) return false;
      running = true;
      try {
        await task();
        return true;
      } finally {
        running = false;
      }
    },
    isRunning: () => running || closed,
    close() {
      closed = true;
    },
  };
}

/** Eine Sperre pro Komponente (stabil über Renders). */
export function useSingleFlight(): SingleFlight {
  const ref = useRef<SingleFlight | null>(null);
  if (ref.current === null) ref.current = createSingleFlight();
  return ref.current;
}
