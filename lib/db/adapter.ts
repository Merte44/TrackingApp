import type { Db, DbExecutor, SqlParams } from "./types";

/**
 * Baut aus den rohen Primitiven eines Treibers eine `Db` mit serialisiertem
 * Zugriff und Transaktionen auf **derselben** Verbindung (die Pragmas wie
 * `foreign_keys` gelten pro Verbindung — deshalb kein Zweit-Connection-Ansatz).
 *
 * Alle Aufrufe laufen über eine Warteschlange; eine Transaktion hält sie, bis
 * COMMIT/ROLLBACK durch ist. So können sich andere async Zugriffe nicht
 * zwischen BEGIN und COMMIT schieben.
 */
export function createDb(raw: DbExecutor, closeRaw: () => Promise<void>): Db {
  let tail: Promise<unknown> = Promise.resolve();

  function serialize<T>(fn: () => Promise<T>): Promise<T> {
    const result = tail.then(fn, fn);
    tail = result.catch(() => undefined);
    return result;
  }

  return {
    run: (sql, params) => serialize(() => raw.run(sql, params)),
    exec: (sql) => serialize(() => raw.exec(sql)),
    getFirst: <T>(sql: string, params?: SqlParams) =>
      serialize(() => raw.getFirst<T>(sql, params)),
    getAll: <T>(sql: string, params?: SqlParams) =>
      serialize(() => raw.getAll<T>(sql, params)),
    close: () => serialize(closeRaw),
    transaction: <T>(task: (tx: DbExecutor) => Promise<T>) =>
      serialize(async () => {
        let active = true;
        // Laufende tx-Aufrufe (auch nicht awaitete) und deren Fehler.
        const inflight = new Set<Promise<unknown>>();
        const failures: unknown[] = [];

        const guard = <R>(fn: () => Promise<R>): Promise<R> => {
          if (!active) {
            return Promise.reject(new Error("Transaktion ist bereits beendet"));
          }
          const p = fn();
          inflight.add(p);
          // Markiert p zugleich als behandelt (kein unhandled rejection).
          p.then(
            () => inflight.delete(p),
            (error: unknown) => {
              inflight.delete(p);
              failures.push(error);
            },
          );
          return p;
        };

        const settle = async () => {
          while (inflight.size > 0) {
            await Promise.allSettled([...inflight]);
          }
        };

        const rollback = async () => {
          try {
            await raw.exec("ROLLBACK");
          } catch {
            // Keine offene Transaktion mehr (z. B. von SQLite selbst beendet) — Originalfehler zählt.
          }
        };

        const tx: DbExecutor = {
          run: (sql, params) => guard(() => raw.run(sql, params)),
          exec: (sql) => guard(() => raw.exec(sql)),
          getFirst: <R>(sql: string, params?: SqlParams) =>
            guard(() => raw.getFirst<R>(sql, params)),
          getAll: <R>(sql: string, params?: SqlParams) =>
            guard(() => raw.getAll<R>(sql, params)),
        };

        await raw.exec("BEGIN IMMEDIATE");
        let value: T;
        try {
          value = await task(tx);
        } catch (error) {
          active = false;
          await settle();
          await rollback();
          throw error;
        }
        active = false;
        await settle();
        if (failures.length > 0) {
          await rollback();
          throw failures[0];
        }
        try {
          await raw.exec("COMMIT");
        } catch (error) {
          await rollback();
          throw error;
        }
        return value;
      }),
  };
}
