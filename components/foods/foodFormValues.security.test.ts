/**
 * @jest-environment node
 *
 * Security-Tests PROJ-2: Route-Parameter von `food-form` (Deep-Link, untrusted) → Startzustand.
 */
import { initialFoodForm } from "./foodFormValues";

jest.mock("@/lib/db/expo", () => ({ openExpoDatabase: jest.fn() }));

describe("Deep-Link-Parameter id", () => {
  it.each(["1 OR 1=1", "-1", "1.5", "0x10", "1e3", " 1", "../1", "%31", "", "１"])(
    "id=%p → nie eine gültige fremde id",
    (id) => {
      const result = initialFoodForm({ id });
      expect(result.mode).toBe("edit");
      if (result.mode === "edit") {
        // Entweder NaN (→ getFood: not_found) oder exakt die getippte Dezimalzahl.
        expect(Number.isNaN(result.id)).toBe(true);
      }
    },
  );

  it("übergroße id wird keine sichere Ganzzahl (getFood lehnt ab)", () => {
    const result = initialFoodForm({ id: "9".repeat(400) });
    expect(result.mode === "edit" && Number.isSafeInteger(result.id)).toBe(false);
  });
});

describe("Deep-Link-Parameter name", () => {
  it("name füllt nur das Formular vor — kein Speichern ohne Nutzeraktion", () => {
    const name = "'); DROP TABLE foods;--";
    const result = initialFoodForm({ name });
    expect(result).toEqual({
      mode: "create",
      values: { name, kcal: "", carbs: "", fat: "", protein: "", pieceGrams: "", barcode: null },
    });
  });

  it("Barcode lässt sich per Deep-Link nicht vorbelegen", () => {
    const result = initialFoodForm({ name: "x", barcode: "12345678" } as { name: string });
    expect(result.mode === "create" && result.values.barcode).toBeNull();
  });
});
