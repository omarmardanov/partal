import { describe, it, expect } from "vitest";
import { parseQuery, scoreProduct } from "./search.js";

describe("parseQuery", () => {
  it("extracts brand, model, year, engine and part type", () => {
    expect(parseQuery("Radiator Peugeot 308 2016 1.6")).toEqual({
      brand: "Peugeot", model: "308", year: 2016, engine: "1.6", partType: "Radiator",
    });
  });

  it("understands Russian part aliases", () => {
    expect(parseQuery("колодки Toyota Camry").partType).toBe("Tormoz bəndi");
  });

  it("returns nulls for free text", () => {
    expect(parseQuery("salam")).toEqual({ brand: null, model: null, year: null, engine: null, partType: null });
  });
});

describe("scoreProduct", () => {
  const radiator308 = {
    name: "Radiator OEM", partType: "Radiator",
    compatibility: [{ make: "Peugeot", model: "308", yearFrom: 2014, yearTo: 2019 }],
  };

  it("scores a full match", () => {
    const q = "Radiator Peugeot 308 2016";
    expect(scoreProduct(radiator308, parseQuery(q), q)).toBe(9);
  });

  it("rejects a different brand", () => {
    const q = "Radiator Hyundai Accent";
    expect(scoreProduct(radiator308, parseQuery(q), q)).toBe(0);
  });

  it("rejects a different part type", () => {
    const q = "Alternator Peugeot 308";
    expect(scoreProduct(radiator308, parseQuery(q), q)).toBe(0);
  });

  it("supports legacy flat brand/model fields", () => {
    const legacy = { name: "Radiator", partType: "Radiator", brand: "Peugeot", model: "308", yearFrom: 2014, yearTo: 2019 };
    const q = "Radiator Peugeot 308";
    expect(scoreProduct(legacy, parseQuery(q), q)).toBeGreaterThan(0);
  });

  it("falls back to name search for unstructured queries", () => {
    const p = { name: "Qapı güzgüsü", compatibility: [] };
    expect(scoreProduct(p, parseQuery("güzgüsü"), "güzgüsü")).toBe(1);
    expect(scoreProduct(p, parseQuery("fənər"), "fənər")).toBe(0);
  });
});
