import { Resend } from "resend";
import type { OrderEmailData, MonthlyReportData } from "@/types";

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

const getFromEmail = () => process.env.EMAIL_FROM || "orders@geegocasting.com";
const getOrderInbox = () => process.env.ORDER_INBOX_EMAIL || "geegoco@gmail.com";
const getReportTo = () => process.env.REPORT_TO_EMAIL || "vtramontana@aol.com";

export async function sendCastingTeamEmail(order: OrderEmailData): Promise<void> {
  const resend = getResend();
  const quoteData = safeParseJSON(order.quoteData);
  const fileMetadata = safeParseJSON(order.fileMetadata) as Array<{ fileName: string; url: string; expiresAt: string }> | null;
  const totals = quoteData?.totals as Record<string, number> | undefined;
  const perPart = quoteData?.perPart as Array<Record<string, unknown>> | undefined;
  const totalQty = perPart?.reduce((s: number, p: Record<string, unknown>) => s + (Number(p.quantity) || 0), 0) ?? 0;

  const partsRows = perPart?.map((p: Record<string, unknown>) =>
    `<tr>
      <td style="padding:4px 8px;border:1px solid #ddd">${p.fileName}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${p.quantity}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${Number(p.volumeCm3).toFixed(2)} cm³</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${Number(p.effectiveMassG).toFixed(2)} g</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">$${Number(p.adjustedPricePerG).toFixed(2)}/g</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">$${Number(p.partCostUsd).toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">$${Number(p.lineTotalUsd).toFixed(2)}</td>
    </tr>`
  ).join("") ?? "";

  const fileLinks = Array.isArray(fileMetadata) ? fileMetadata.map(f =>
    `<li><a href="${f.url}">${f.fileName}</a> (expires ${new Date(f.expiresAt).toLocaleDateString()})</li>`
  ).join("") : "<li>No file links available</li>";

  const spotInfo = quoteData ? `Spot: $${Number(quoteData.spotPricePerOz).toFixed(2)}/oz | Demo: ${quoteData.demoMode ? "Yes" : "No"}` : "";

  const html = `
<div style="font-family:Arial,sans-serif;max-width:800px">
  <h2 style="color:#C9A84C">Geego Casting — PAID Order #${order.id.slice(0, 8)}</h2>
  <table style="border-collapse:collapse;margin-bottom:16px">
    <tr><td style="padding:4px 12px;font-weight:bold">Order ID</td><td>${order.id}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Metal</td><td>${order.selectedMetal}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Unit</td><td>${order.unit}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Total</td><td>$${order.totalUsd.toFixed(2)}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Status</td><td style="color:green;font-weight:bold">${order.paymentStatus}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Customer</td><td>${order.customerEmail}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Ship To</td><td>${order.shippingName}<br>${order.shippingAddress1}${order.shippingAddress2 ? "<br>" + order.shippingAddress2 : ""}<br>${order.shippingCity}, ${order.shippingState} ${order.shippingZip}<br>${order.shippingCountry}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Notes</td><td>${order.productionNotes || "None"}</td></tr>
  </table>
  <p style="font-size:12px;color:#666">${spotInfo}</p>
  <h3>Parts</h3>
  <table style="border-collapse:collapse;width:100%">
    <thead><tr style="background:#f5f5f5">
      <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">File</th>
      <th style="padding:4px 8px;border:1px solid #ddd">Qty</th>
      <th style="padding:4px 8px;border:1px solid #ddd">Volume</th>
      <th style="padding:4px 8px;border:1px solid #ddd">Eff. Mass</th>
      <th style="padding:4px 8px;border:1px solid #ddd">$/g</th>
      <th style="padding:4px 8px;border:1px solid #ddd">Part Cost</th>
      <th style="padding:4px 8px;border:1px solid #ddd">Line Total</th>
    </tr></thead>
    <tbody>${partsRows}</tbody>
  </table>
  <h3>Totals</h3>
  <table style="border-collapse:collapse">
    <tr><td style="padding:2px 12px">Material Subtotal</td><td>$${totals?.materialSubtotal?.toFixed(2) ?? "—"}</td></tr>
    ${totals?.minApplied ? `<tr><td style="padding:2px 12px;color:#d97706">Min Charge (+$${totals.minDelta?.toFixed(2)})</td><td>$${totals.materialAfterMin?.toFixed(2)}</td></tr>` : ""}
    <tr><td style="padding:2px 12px">3D Print Fee</td><td>$${totals?.printFeeTotal?.toFixed(2) ?? "0.00"}</td></tr>
    <tr><td style="padding:2px 12px">Shipping</td><td>$${totals?.shippingFeeTotal?.toFixed(2) ?? "0.00"}</td></tr>
    ${(totals?.rushFeeAmount ?? 0) > 0 ? `<tr><td style="padding:2px 12px;color:#dc2626;font-weight:bold">Rush Fee</td><td style="color:#dc2626">$${totals?.rushFeeAmount?.toFixed(2)}</td></tr>` : ""}
    <tr style="font-weight:bold;border-top:2px solid #333"><td style="padding:6px 12px">Final Total</td><td>$${totals?.finalTotal?.toFixed(2) ?? order.totalUsd.toFixed(2)}</td></tr>
  </table>
  <h3>STL Files (expire in 7 days)</h3>
  <ul>${fileLinks}</ul>
</div>`;

  await resend.emails.send({
    from: getFromEmail(),
    to: getOrderInbox(),
    subject: `Geego Casting PAID Order #${order.id.slice(0, 8)} - ${order.selectedMetal} - ${totalQty} item(s)`,
    html,
  });
}

export async function sendCustomerConfirmationEmail(order: OrderEmailData): Promise<void> {
  if (!order.customerEmail) return;
  const resend = getResend();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px">
  <h2 style="color:#C9A84C">Thank you for your order!</h2>
  <p>Your order has been confirmed and payment received.</p>
  <table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px;font-weight:bold">Order ID</td><td>${order.id}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Metal</td><td>${order.selectedMetal}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Total</td><td>$${order.totalUsd.toFixed(2)}</td></tr>
  </table>
  <p>Track your order: <a href="${baseUrl}/order/${order.id}">${baseUrl}/order/${order.id}</a></p>
  <p>Questions? <a href="mailto:geegoco@gmail.com">geegoco@gmail.com</a></p>
  <p style="color:#888;font-size:12px">— Geego Casting Team</p>
</div>`;
  await resend.emails.send({
    from: getFromEmail(),
    to: order.customerEmail,
    subject: `Order Confirmation - Geego Casting #${order.id.slice(0, 8)}`,
    html,
  });
}

export async function sendMonthlyReportEmail(data: MonthlyReportData & {
  totalModels: number; totalQuantity: number; gramsByMetal: Record<string, number>;
  materialTotal: number; finalTotal: number; paidRevenue: number; pendingRevenue: number; demoModeCount: number;
}): Promise<void> {
  const resend = getResend();
  const metalRows = Object.entries(data.gramsByMetal)
    .map(([metal, grams]) => `<tr><td style="padding:4px 12px;border:1px solid #ddd">${metal}</td><td style="padding:4px 12px;border:1px solid #ddd;text-align:right">${grams.toFixed(2)} g</td></tr>`)
    .join("");
  const html = `
<div style="font-family:Arial,sans-serif;max-width:700px">
  <h2 style="color:#C9A84C">Monthly Report: ${data.monthKey}</h2>
  <table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px;font-weight:bold">Total Models</td><td>${data.totalModels}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Total Quantity</td><td>${data.totalQuantity}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold">Orders</td><td>${data.orderCount}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold;color:green">Paid Revenue</td><td style="color:green">$${data.paidRevenue.toFixed(2)}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:bold;color:orange">Pending</td><td style="color:orange">$${data.pendingRevenue.toFixed(2)}</td></tr>
  </table>
  <h3>Grams by Metal</h3>
  <table style="border-collapse:collapse"><thead><tr style="background:#f5f5f5"><th style="padding:4px 12px;border:1px solid #ddd;text-align:left">Metal</th><th style="padding:4px 12px;border:1px solid #ddd">Grams</th></tr></thead><tbody>${metalRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody></table>
</div>`;
  await resend.emails.send({
    from: getFromEmail(),
    to: getReportTo(),
    subject: `[Geego Casting] Monthly Report - ${data.monthKey}`,
    html,
  });
}

function safeParseJSON(str: string): Record<string, unknown> | null {
  try { return JSON.parse(str); } catch { return null; }
}
