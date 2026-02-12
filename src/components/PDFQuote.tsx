import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { PricingResult } from "@/types";

const gold = "#C9A84C";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#222" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: gold },
  subtitle: { fontSize: 10, color: "#666", marginTop: 2 },
  timestamp: { fontSize: 8, color: "#999", textAlign: "right" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6, color: "#333" },
  table: { width: "100%", marginBottom: 10 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f5f0", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingVertical: 4, paddingHorizontal: 2 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e0e0e0", paddingVertical: 3, paddingHorizontal: 2 },
  cellFile: { flex: 2.5, paddingRight: 4 },
  cellSmall: { flex: 1, textAlign: "right", paddingHorizontal: 2 },
  cellCenter: { flex: 0.6, textAlign: "center", paddingHorizontal: 2 },
  headerText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#555", textTransform: "uppercase" as const },
  totalsBlock: { backgroundColor: "#fafaf5", borderWidth: 1, borderColor: "#e0e0d0", borderRadius: 4, padding: 12, marginTop: 8 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsLabel: { color: "#555" },
  totalsValue: { fontFamily: "Helvetica-Bold", color: "#222" },
  finalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8, marginTop: 6, borderTopWidth: 2, borderTopColor: gold },
  finalLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#222" },
  finalValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: gold },
  warningText: { fontSize: 7, color: "#b45309" },
  rushLabel: { color: "#dc2626", fontFamily: "Helvetica-Bold" },
  rushValue: { color: "#dc2626", fontFamily: "Helvetica-Bold" },
  amberLabel: { color: "#d97706" },
  metaInfo: { marginTop: 14, fontSize: 7, color: "#888" },
  disclaimer: { marginTop: 20, fontSize: 7, color: "#999", fontStyle: "italic", borderTopWidth: 0.5, borderTopColor: "#ddd", paddingTop: 8 },
  notes: { marginTop: 10, fontSize: 8, color: "#444" },
  notesLabel: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#333", marginBottom: 3 },
});

function fmt(n: number): string {
  return n.toFixed(2);
}

interface QuotePDFProps {
  result: PricingResult;
  metalLabel: string;
  unit: string;
  demoMode: boolean;
  productionNotes: string;
  spotPrices: { XAU: number; XAG: number; XPT: number };
}

function QuotePDFDocument({ result, metalLabel, unit, demoMode, productionNotes, spotPrices }: QuotePDFProps) {
  const { perPart, totals } = result;
  const now = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>GEEGO CASTING</Text>
            <Text style={s.subtitle}>Precious Metal Casting Quote</Text>
          </View>
          <View>
            <Text style={s.timestamp}>{now}</Text>
            <Text style={s.timestamp}>{metalLabel} &bull; Unit: {unit}</Text>
            {demoMode && <Text style={{ ...s.timestamp, color: "#d97706" }}>DEMO MODE</Text>}
          </View>
        </View>

        {/* Spot Prices */}
        <Text style={{ fontSize: 8, color: "#666", marginBottom: 4 }}>
          Spot Prices — Gold: ${fmt(spotPrices.XAU)}/oz | Silver: ${fmt(spotPrices.XAG)}/oz | Platinum: ${fmt(spotPrices.XPT)}/oz
          {demoMode ? " (Demo)" : " (Live)"}
        </Text>

        {/* Parts Table */}
        <Text style={s.sectionTitle}>Parts</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={{ ...s.headerText, ...s.cellFile }}>File</Text>
            <Text style={{ ...s.headerText, ...s.cellCenter }}>Qty</Text>
            <Text style={{ ...s.headerText, ...s.cellSmall }}>Vol (cm³)</Text>
            <Text style={{ ...s.headerText, ...s.cellSmall }}>Eff. Mass (g)</Text>
            <Text style={{ ...s.headerText, ...s.cellSmall }}>$/g</Text>
            <Text style={{ ...s.headerText, ...s.cellSmall }}>Part Cost</Text>
            <Text style={{ ...s.headerText, ...s.cellSmall }}>Line Total</Text>
          </View>
          {perPart.map((p, i) => (
            <View key={i}>
              <View style={s.tableRow}>
                <Text style={s.cellFile}>{p.fileName}</Text>
                <Text style={s.cellCenter}>{p.quantity}</Text>
                <Text style={s.cellSmall}>{fmt(p.volumeCm3)}</Text>
                <Text style={s.cellSmall}>{fmt(p.effectiveMassG)}</Text>
                <Text style={s.cellSmall}>${fmt(p.adjustedPricePerG)}</Text>
                <Text style={s.cellSmall}>${fmt(p.partCostUsd)}</Text>
                <Text style={s.cellSmall}>${fmt(p.lineTotalUsd)}</Text>
              </View>
              {p.warnings.length > 0 && (
                <View style={{ paddingLeft: 4, paddingBottom: 2 }}>
                  {p.warnings.map((w, wi) => (
                    <Text key={wi} style={s.warningText}>⚠ {w}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Totals */}
        <Text style={s.sectionTitle}>Totals Breakdown</Text>
        <View style={s.totalsBlock}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Material Subtotal</Text>
            <Text style={s.totalsValue}>${fmt(totals.materialSubtotal)}</Text>
          </View>

          {totals.minApplied && (
            <View style={s.totalsRow}>
              <Text style={s.amberLabel}>Minimum Charge Applied (+${fmt(totals.minDelta)})</Text>
              <Text style={{ ...s.totalsValue, color: "#d97706" }}>${fmt(totals.materialAfterMin)}</Text>
            </View>
          )}

          {totals.printFeeTotal > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>3D Print Fee</Text>
              <Text style={s.totalsValue}>${fmt(totals.printFeeTotal)}</Text>
            </View>
          )}

          {totals.shippingFeeTotal > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Shipping Fee</Text>
              <Text style={s.totalsValue}>${fmt(totals.shippingFeeTotal)}</Text>
            </View>
          )}

          {totals.castingFeeFlat > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Casting Fee</Text>
              <Text style={s.totalsValue}>${fmt(totals.castingFeeFlat)}</Text>
            </View>
          )}

          {totals.finishingFeeFlat > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Finishing Fee</Text>
              <Text style={s.totalsValue}>${fmt(totals.finishingFeeFlat)}</Text>
            </View>
          )}

          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Subtotal</Text>
            <Text style={s.totalsValue}>${fmt(totals.subtotalBeforePercent)}</Text>
          </View>

          {totals.optionalPercentFeeAmount > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Optional % Fee</Text>
              <Text style={s.totalsValue}>${fmt(totals.optionalPercentFeeAmount)}</Text>
            </View>
          )}

          {totals.rushFeeAmount > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.rushLabel}>Rush Fee</Text>
              <Text style={s.rushValue}>${fmt(totals.rushFeeAmount)}</Text>
            </View>
          )}

          {/* Final Total */}
          <View style={s.finalRow}>
            <Text style={s.finalLabel}>FINAL TOTAL</Text>
            <Text style={s.finalValue}>${fmt(totals.finalTotal)}</Text>
          </View>
        </View>

        {/* Production Notes */}
        {productionNotes && (
          <View style={s.notes}>
            <Text style={s.notesLabel}>Production Notes</Text>
            <Text>{productionNotes}</Text>
          </View>
        )}

        {/* Meta */}
        <Text style={s.metaInfo}>
          Spot: ${fmt(result.spotPricePerOz)}/oz (${fmt(result.spotPricePerG)}/g) | Adjusted: ${fmt(result.adjustedPricePerG)}/g | Density: {result.density} g/cm³
        </Text>

        {/* Disclaimer */}
        <Text style={s.disclaimer}>
          This is an estimate only. Final pricing may vary based on actual casting conditions, metal market fluctuations, and production requirements.
          All castings are custom work. Prices based on current spot rates at time of quote generation.
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Generate and download a PDF quote.
 * This is designed to be called via dynamic import from QuoteBuilder.
 */
export async function generateQuotePDF(
  result: PricingResult,
  metalLabel: string,
  unit: string,
  demoMode: boolean,
  productionNotes: string,
  spotPrices: { XAU: number; XAG: number; XPT: number },
): Promise<void> {
  const doc = (
    <QuotePDFDocument
      result={result}
      metalLabel={metalLabel}
      unit={unit}
      demoMode={demoMode}
      productionNotes={productionNotes}
      spotPrices={spotPrices}
    />
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `geego-quote-${metalLabel.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
