import type {
  MetalOption,
  UnitType,
  PricingInput,
  PricingResult,
  PartResult,
  PricingTotals,
  PricingSettings,
} from "@/types";

export type {
  MetalOption,
  UnitType,
  PricingInput,
  PricingResult,
  PartResult,
  PricingTotals,
  PricingSettings,
};

/** 1 troy ounce = 31.1034768 grams */
export const TROY_OZ_GRAMS = 31.1034768;

/**
 * Default pricing settings.
 */
export function defaultSettings(): PricingSettings {
  return {
    allowanceEnabled: false,
    allowancePercent: 12,
    densityOverride: null,
    printFeeEnabled: true,
    printFeePerModel: 20,
    shippingEnabled: true,
    shippingFlat: 25,
    castingFeeFlat: 0,
    finishingFeeFlat: 0,
    optionalPercentFee: 0,
    rushEnabled: false,
    rushPercent: 15,
    minimumCharge: 75,
  };
}

/** Round a number to the specified number of decimal places. */
function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Convert a volume from the given unit system to cubic centimeters.
 *
 * - mm:     1 cm = 10 mm  =>  1 cm^3 = 1000 mm^3  =>  divide by 1000
 * - cm:     already cm^3
 * - inches: 1 in = 2.54 cm =>  1 in^3 = 16.387064 cm^3  =>  multiply by 16.387064
 */
export function volumeToUnitCm3(
  volume: number,
  unit: UnitType
): number {
  switch (unit) {
    case "mm":
      return volume / 1000;
    case "cm":
      return volume;
    case "inches":
      return volume * 16.387064;
    default: {
      const _exhaustive: never = unit;
      throw new Error(`Unknown unit: ${_exhaustive}`);
    }
  }
}

/**
 * Calculate a full quote given parts, metal selection, spot price, unit, and settings.
 *
 * All monetary values are rounded to 2 decimal places.
 * All mass values are rounded to 2 decimal places (0.01 g precision).
 */
export function calculateQuote(input: PricingInput): PricingResult {
  const { parts, metal, spotPricePerOz, unit, settings } = input;

  // ── Base price calculations ──
  const spotPricePerG = spotPricePerOz / TROY_OZ_GRAMS;
  const adjustedPricePerG = spotPricePerG * 1.10 * metal.purity;
  const density = settings.densityOverride ?? metal.density;

  // ── Per-part calculations ──
  const perPart: PartResult[] = parts.map((part) => {
    const volumeCm3 = volumeToUnitCm3(part.volumeCm3, unit);
    const massG = volumeCm3 * density;
    const effectiveMassG = settings.allowanceEnabled
      ? massG * (1 + settings.allowancePercent / 100)
      : massG;

    const partCostUsd = round(adjustedPricePerG * effectiveMassG, 2);
    const lineTotalUsd = round(partCostUsd * part.quantity, 2);

    return {
      fileName: part.fileName,
      quantity: part.quantity,
      volumeCm3: round(volumeCm3, 2),
      effectiveMassG: round(effectiveMassG, 2),
      adjustedPricePerG: round(adjustedPricePerG, 2),
      partCostUsd,
      lineTotalUsd,
      warnings: [...part.warnings],
    };
  });

  // ── Totals ──
  const materialSubtotal = round(
    perPart.reduce((sum, p) => sum + p.lineTotalUsd, 0),
    2
  );

  const minApplied = materialSubtotal < settings.minimumCharge;
  const minDelta = minApplied
    ? round(settings.minimumCharge - materialSubtotal, 2)
    : 0;
  const materialAfterMin = minApplied
    ? settings.minimumCharge
    : materialSubtotal;

  const totalQuantity = parts.reduce((sum, p) => sum + p.quantity, 0);
  const printFeeTotal = settings.printFeeEnabled
    ? round(totalQuantity * settings.printFeePerModel, 2)
    : 0;

  const shippingFeeTotal = settings.shippingEnabled ? settings.shippingFlat : 0;

  const subtotalBeforePercent = round(
    materialAfterMin +
      printFeeTotal +
      shippingFeeTotal +
      settings.castingFeeFlat +
      settings.finishingFeeFlat,
    2
  );

  const optionalPercentFeeAmount = round(
    subtotalBeforePercent * (settings.optionalPercentFee / 100),
    2
  );

  const subtotalAfterOptional = round(
    subtotalBeforePercent + optionalPercentFeeAmount,
    2
  );

  const rushFeeAmount = settings.rushEnabled
    ? round(subtotalAfterOptional * (settings.rushPercent / 100), 2)
    : 0;

  const finalTotal = round(subtotalAfterOptional + rushFeeAmount, 2);

  const totals: PricingTotals = {
    materialSubtotal,
    minApplied,
    minDelta,
    materialAfterMin,
    printFeeTotal,
    shippingFeeTotal,
    castingFeeFlat: settings.castingFeeFlat,
    finishingFeeFlat: settings.finishingFeeFlat,
    subtotalBeforePercent,
    optionalPercentFeeAmount,
    rushFeeAmount,
    finalTotal,
  };

  return {
    perPart,
    totals,
    spotPricePerOz: round(spotPricePerOz, 2),
    spotPricePerG: round(spotPricePerG, 2),
    adjustedPricePerG: round(adjustedPricePerG, 2),
    density,
  };
}
