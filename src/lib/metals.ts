import type { MetalOption } from "@/types";

export type { MetalOption };

export const METAL_OPTIONS: MetalOption[] = [
  // ── Gold 18K ──
  {
    label: "Gold 18K Yellow",
    spotSymbol: "XAU",
    purity: 0.75,
    density: 15.6,
  },
  {
    label: "Gold 18K White",
    spotSymbol: "XAU",
    purity: 0.75,
    density: 15.6,
  },
  {
    label: "Gold 18K Pink",
    spotSymbol: "XAU",
    purity: 0.75,
    density: 15.6,
  },

  // ── Gold 14K ──
  {
    label: "Gold 14K Yellow",
    spotSymbol: "XAU",
    purity: 0.585,
    density: 13.1,
  },
  {
    label: "Gold 14K White",
    spotSymbol: "XAU",
    purity: 0.585,
    density: 13.1,
  },
  {
    label: "Gold 14K Pink",
    spotSymbol: "XAU",
    purity: 0.585,
    density: 13.1,
  },

  // ── Platinum ──
  {
    label: "Platinum 950",
    spotSymbol: "XPT",
    purity: 0.95,
    density: 20.9,
  },

  // ── Silver ──
  {
    label: "Silver 985",
    spotSymbol: "XAG",
    purity: 0.985,
    density: 10.4,
  },
];

/**
 * Find a metal option by its label (case-insensitive match).
 * Returns undefined if not found.
 */
export function findMetal(label: string): MetalOption | undefined {
  return METAL_OPTIONS.find(
    (m) => m.label.toLowerCase() === label.toLowerCase()
  );
}

/**
 * Get all unique spot symbols used across metals.
 */
export function getUniqueSpotSymbols(): Array<MetalOption["spotSymbol"]> {
  return [...new Set(METAL_OPTIONS.map((m) => m.spotSymbol))];
}
