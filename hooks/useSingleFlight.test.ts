/**
 * @jest-environment node
 */
import { createSingleFlight } from "./useSingleFlight";

/** Promise, die der Test von außen auflöst. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("PROJ-2 Sperre gegen Doppel-Tipp (BUG-3, BUG-4)", () => {
  it("BUG-3: zweiter Aufruf vor dem Ende des ersten läuft nicht (Doppel-Tipp auf „Sichern“)", async () => {
    const flight = createSingleFlight();
    const pending = deferred();
    const task = jest.fn(() => pending.promise);

    const first = flight.run(task);
    const second = flight.run(task);
    expect(task).toHaveBeenCalledTimes(1);
    expect(await second).toBe(false);

    pending.resolve();
    expect(await first).toBe(true);
  });

  it("BUG-3: Sichern und Löschen sperren sich gegenseitig", async () => {
    const flight = createSingleFlight();
    const pending = deferred();
    const save = jest.fn(() => pending.promise);
    const remove = jest.fn(async () => {});

    void flight.run(save);
    await flight.run(remove);
    expect(remove).not.toHaveBeenCalled();
    pending.resolve();
  });

  it("BUG-4: isRunning meldet synchron, dass gerade gespeichert wird", async () => {
    const flight = createSingleFlight();
    const pending = deferred();
    expect(flight.isRunning()).toBe(false);
    const run = flight.run(() => pending.promise);
    expect(flight.isRunning()).toBe(true);
    pending.resolve();
    await run;
    expect(flight.isRunning()).toBe(false);
  });

  it("BUG-3: nach einem Fehler ist die Sperre wieder frei (erneut Sichern möglich)", async () => {
    const flight = createSingleFlight();
    await expect(flight.run(async () => Promise.reject(new Error("disk I/O error")))).rejects.toThrow("disk I/O error");
    const task = jest.fn(async () => {});
    expect(await flight.run(task)).toBe(true);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("BUG-3: close() hält die Sperre nach Erfolg dauerhaft (Sheet schließt gerade)", async () => {
    const flight = createSingleFlight();
    await flight.run(async () => {
      flight.close();
    });
    const task = jest.fn(async () => {});
    expect(await flight.run(task)).toBe(false);
    expect(task).not.toHaveBeenCalled();
    expect(flight.isRunning()).toBe(true);
  });
});
