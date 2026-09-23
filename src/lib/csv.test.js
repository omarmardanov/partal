import { describe, it, expect } from "vitest";
import { inferCols, normalizeRows, normalizeHeader } from "./csv.js";

describe("normalizeHeader", () => {
  it("folds Azerbaijani dotted İ to plain i", () => {
    expect(normalizeHeader("İldən")).toBe("ildən");
  });
});

describe("inferCols", () => {
  it("maps known headers and ignores unknown ones", () => {
    const cols = inferCols(["Hissə adı", "Цена", "Whatever"]);
    expect(cols.map(c => c.inferred)).toEqual(["partName", "price", "ignore"]);
    expect(cols.map(c => c.confidence)).toEqual(["ok", "ok", "warn"]);
  });
});

describe("normalizeRows", () => {
  const headers = ["Hissə adı", "Avtomobil markaları", "Avtomobil modelləri", "İldən", "İlə qədər", "Qiymət", "Mövcudluq"];
  const m = inferCols(headers);
  const row = (name, make, model, from, to, price, avail) =>
    Object.fromEntries(headers.map((h, i) => [h, [name, make, model, from, to, price, avail][i]]));

  it("groups rows with the same name and price into one product", () => {
    const out = normalizeRows([
      row("Ön tormoz bəndləri", "Toyota", "Camry", "2015", "2022", "55 ₼", "var"),
      row("Ön tormoz bəndləri", "Toyota", "Corolla", "2014", "2021", "55 ₼", "var"),
    ], m);
    expect(out).toHaveLength(1);
    expect(out[0].price).toBe("55");
    expect(out[0].availability).toBe("in_stock");
    expect(out[0].compatibility).toEqual([
      { make: "Toyota", model: "Camry", yearFrom: 2015, yearTo: 2022 },
      { make: "Toyota", model: "Corolla", yearFrom: 2014, yearTo: 2021 },
    ]);
    expect(out[0]._status).toBe("ok");
  });

  it("warns when price is missing", () => {
    const [p] = normalizeRows([row("Radiator", "Peugeot", "308", "", "", "", "yox")], m);
    expect(p._status).toBe("warn");
    expect(p.availability).toBe("on_order");
  });

  it("skips rows without a name", () => {
    expect(normalizeRows([row("", "Peugeot", "308", "", "", "10", "var")], m)).toHaveLength(0);
  });
});
