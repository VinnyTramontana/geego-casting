// ─── Metal Types ────────────────────────────────────────────────

export interface MetalOption {
  label: string;
  spotSymbol: "XAU" | "XAG" | "XPT";
  purity: number;
  density: number; // g/cm3
}

// ─── STL Parser Types ───────────────────────────────────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vec3;
  max: Vec3;
}

export interface STLParseResult {
  triangleCount: number;
  boundingBox: BoundingBox;
  volume: number;
  isWatertight: boolean;
  orientationInverted: boolean;
  warnings: string[];
}

// ─── Pricing Types ──────────────────────────────────────────────

export type UnitType = "mm" | "cm" | "inches";

export interface PricingSettings {
  allowanceEnabled: boolean;
  allowancePercent: number; // 0-30, default 12
  densityOverride: number | null;
  printFeeEnabled: boolean;
  printFeePerModel: number; // default 20
  shippingEnabled: boolean;
  shippingFlat: number; // default 25
  castingFeeFlat: number; // default 0
  finishingFeeFlat: number; // default 0
  optionalPercentFee: number; // 0-30, default 0
  rushEnabled: boolean;
  rushPercent: number; // default 15
  minimumCharge: number; // default 75
}

export interface PartInput {
  fileName: string;
  volumeCm3: number;
  quantity: number;
  warnings: string[];
}

export interface PricingInput {
  parts: PartInput[];
  metal: MetalOption;
  spotPricePerOz: number;
  unit: UnitType;
  settings: PricingSettings;
}

export interface PartResult {
  fileName: string;
  quantity: number;
  volumeCm3: number;
  effectiveMassG: number;
  adjustedPricePerG: number;
  partCostUsd: number;
  lineTotalUsd: number;
  warnings: string[];
}

export interface PricingTotals {
  materialSubtotal: number;
  minApplied: boolean;
  minDelta: number;
  materialAfterMin: number;
  printFeeTotal: number;
  shippingFeeTotal: number;
  castingFeeFlat: number;
  finishingFeeFlat: number;
  subtotalBeforePercent: number;
  optionalPercentFeeAmount: number;
  rushFeeAmount: number;
  finalTotal: number;
}

export interface PricingResult {
  perPart: PartResult[];
  totals: PricingTotals;
  spotPricePerOz: number;
  spotPricePerG: number;
  adjustedPricePerG: number;
  density: number;
}

// ─── Storage Types ──────────────────────────────────────────────

export interface StoredFile {
  key: string;
  url: string;
  expiresAt: string; // ISO date string
}

export interface StorageManifest {
  files: Record<
    string,
    {
      originalName: string;
      storedPath: string;
      expiresAt: string;
      createdAt: string;
    }
  >;
}

// ─── Rate Limit Types ───────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

// ─── Email Types ────────────────────────────────────────────────

export interface OrderEmailData {
  id: string;
  createdAt: Date | string;
  selectedMetal: string;
  unit: string;
  productionNotes: string;
  customerEmail: string;
  shippingName: string;
  shippingAddress1: string;
  shippingAddress2: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  totalUsd: number;
  paymentStatus: string;
  stripeSessionId: string;
  fileMetadata: string;
  quoteData: string;
}

export interface QuoteDataForEmail {
  perPart: PartResult[];
  totals: PricingTotals;
  spotPricePerOz: number;
  spotPricePerG: number;
  adjustedPricePerG: number;
  density: number;
}

export interface MonthlyReportData {
  monthKey: string;
  orderCount: number;
  totalRevenue: number;
  orders: Array<{
    id: string;
    createdAt: string;
    selectedMetal: string;
    totalUsd: number;
    paymentStatus: string;
    customerEmail: string;
  }>;
}

// ─── API Request/Response Types ─────────────────────────────────

export interface QuoteRequest {
  files: Array<{
    fileName: string;
    volumeCm3: number;
    quantity: number;
    warnings: string[];
  }>;
  metalLabel: string;
  unit: UnitType;
  settings: PricingSettings;
  demoMode?: boolean;
}

export interface CreateSessionRequest extends QuoteRequest {
  productionNotes: string;
}

export interface AdminLoginRequest {
  password: string;
}

export interface ExportQuery {
  month: string; // YYYY-MM
}
