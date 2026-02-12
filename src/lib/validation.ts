import { z } from "zod";

export const UnitSchema = z.enum(["mm", "cm", "inches"]);

export const PricingSettingsSchema = z.object({
  allowanceEnabled: z.boolean(),
  allowancePercent: z.number().min(0).max(30),
  densityOverride: z.number().positive().nullable(),
  printFeeEnabled: z.boolean(),
  printFeePerModel: z.number().min(0).max(1000),
  shippingEnabled: z.boolean(),
  shippingFlat: z.number().min(0).max(1000),
  castingFeeFlat: z.number().min(0).max(10000),
  finishingFeeFlat: z.number().min(0).max(10000),
  optionalPercentFee: z.number().min(0).max(30),
  rushEnabled: z.boolean(),
  rushPercent: z.number().min(0).max(50),
  minimumCharge: z.number().min(0).max(10000),
});

export const PartInputSchema = z.object({
  fileName: z.string().min(1).max(255),
  volumeCm3: z.number().positive(),
  quantity: z.number().int().min(1).max(100),
  warnings: z.array(z.string()),
});

export const QuoteRequestSchema = z.object({
  files: z.array(PartInputSchema).min(1).max(10),
  metalLabel: z.string().min(1),
  unit: UnitSchema,
  settings: PricingSettingsSchema,
  demoMode: z.boolean().optional(),
});

export const CreateSessionSchema = z.object({
  files: z.array(PartInputSchema).min(1).max(10),
  metalLabel: z.string().min(1),
  unit: UnitSchema,
  settings: PricingSettingsSchema,
  productionNotes: z.string().max(5000).default(""),
  demoMode: z.boolean().optional(),
  fileData: z.array(z.object({
    fileName: z.string(),
    base64: z.string(),
  })).min(1).max(10),
});

export const AdminLoginSchema = z.object({
  password: z.string().min(1),
});

export const ExportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM format"),
});

export const MetricsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM format"),
});
