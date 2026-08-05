import { describe, it, expect } from "vitest";
import { tokenize, scoreMatch, rankByRelevance, type Searchable } from "./search";

describe("tokenize", () => {
  it("lowercases and splits on whitespace", () => {
    expect(tokenize("Red Bull Energy")).toEqual(["red", "bull", "energy"]);
  });

  it("collapses repeated whitespace", () => {
    expect(tokenize("red    bull")).toEqual(["red", "bull"]);
  });

  it("trims leading/trailing whitespace", () => {
    expect(tokenize("  vape  ")).toEqual(["vape"]);
  });

  it("dedupes repeated words", () => {
    expect(tokenize("king box king")).toEqual(["king", "box"]);
  });

  it("returns an empty array for blank input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });
});

// Fixtures pulled directly from db/seed.ts so this reflects real catalog data.
const disposableVape: Searchable = {
  name: "MB Select Disposable Vape, 5000 Puff",
  brand: "MB Select",
  category: "Vapes",
  subcategory: "Disposables",
  description:
    "House-label 5000-puff disposable vape, assorted top-selling flavors. Counter display box included.",
};

const podKit: Searchable = {
  name: "MB Select Pod System Starter Kit",
  brand: "MB Select",
  category: "Vapes",
  subcategory: "Pod Systems",
  description: "Refillable pod system starter kit with USB-C charging.",
};

const marlboroReds: Searchable = {
  name: "Red King Box Cigarettes, Carton",
  brand: "Marlboro",
  category: "Tobacco & Cigarillos",
  subcategory: "Cigarettes",
  description: "Full-flavor king box cigarettes, 10 packs per carton. Adult-use, 21+.",
};

const copenhagenSnuff: Searchable = {
  name: "Long Cut Moist Snuff, 5-Can Roll",
  brand: "Copenhagen",
  category: "Tobacco & Cigarillos",
  subcategory: "Smokeless",
  description: "Original long cut moist snuff, 5-can roll. Adult-use, 21+.",
};

describe("scoreMatch", () => {
  it("scores 0 for an empty query", () => {
    expect(scoreMatch(disposableVape, "")).toBe(0);
  });

  it("scores 0 when nothing matches", () => {
    expect(scoreMatch(disposableVape, "energy drink")).toBe(0);
  });

  it("ranks an exact name match highest of all", () => {
    const exact = scoreMatch(disposableVape, "MB Select Disposable Vape, 5000 Puff");
    const partial = scoreMatch(disposableVape, "vape");
    expect(exact).toBeGreaterThan(partial);
  });

  it("scores a name-starts-with match higher than a mid-string contains match", () => {
    const startsWith = scoreMatch(marlboroReds, "Red King");
    const midString = scoreMatch(marlboroReds, "King Box");
    expect(startsWith).toBeGreaterThan(midString);
  });

  it("matches regardless of word order (the core bug this fixes)", () => {
    // The product name is "Long Cut Moist Snuff" — a naive single-substring
    // LIKE '%snuff moist%' would never match this at all.
    const reordered = scoreMatch(copenhagenSnuff, "snuff moist");
    expect(reordered).toBeGreaterThan(0);
  });

  it("brand match contributes even when the query isn't in the name", () => {
    expect(scoreMatch(podKit, "MB Select")).toBeGreaterThan(0);
  });

  it("partial word ('vap') still matches 'vape' / 'vapes' (typo/incompleteness tolerance)", () => {
    expect(scoreMatch(disposableVape, "vap")).toBeGreaterThan(0);
  });

  it("category-only matches score lower than a name match", () => {
    const categoryOnly = scoreMatch(podKit, "vapes");
    const nameMatch = scoreMatch(disposableVape, "disposable");
    expect(nameMatch).toBeGreaterThan(categoryOnly);
  });
});

describe("rankByRelevance", () => {
  const catalog = [disposableVape, podKit, marlboroReds, copenhagenSnuff];

  it("puts the best match first and drops non-matches", () => {
    const results = rankByRelevance(catalog, "disposable vape");
    expect(results[0].name).toBe(disposableVape.name);
    expect(results.every((r) => r._score > 0)).toBe(true);
  });

  it("returns an empty array when nothing matches", () => {
    expect(rankByRelevance(catalog, "energy drink")).toEqual([]);
  });

  it("finds a product by brand even without any name overlap", () => {
    const results = rankByRelevance(catalog, "copenhagen");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe(copenhagenSnuff.name);
  });

  it("multi-word query matches a product across name + category, out of order", () => {
    // "cigarettes tobacco" — "tobacco" is in the category, "cigarettes" is
    // in the name/subcategory; neither product literally contains the
    // substring "cigarettes tobacco".
    const results = rankByRelevance(catalog, "cigarettes tobacco");
    expect(results.map((r) => r.name)).toContain(marlboroReds.name);
  });
});
