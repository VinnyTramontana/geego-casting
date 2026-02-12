"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { calculateQuote, defaultSettings } from "@/lib/pricing";
import { METAL_OPTIONS } from "@/lib/metals";
import { parseSTLBrowser } from "@/lib/stl-parser-browser";
import type {
  PricingSettings,
  PricingResult,
  UnitType,
  MetalOption,
} from "@/types";
import QuoteResults from "@/components/QuoteResults";

// ─── Local Types ─────────────────────────────────────────────────

interface ProcessedFile {
  file: File;
  fileName: string;
  triangleCount: number;
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  volume: number; // raw volume in file units^3
  isWatertight: boolean;
  orientationInverted: boolean;
  warnings: string[];
  quantity: number;
}

// ─── Helpers ─────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmt(n: number): string {
  return n.toFixed(2);
}

// ─── Constants ───────────────────────────────────────────────────

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const UNIT_OPTIONS: { value: UnitType; label: string }[] = [
  { value: "mm", label: "Millimeters (mm)" },
  { value: "cm", label: "Centimeters (cm)" },
  { value: "inches", label: "Inches (in)" },
];

// ─── Component ───────────────────────────────────────────────────

export default function QuoteBuilder() {
  // ── State ──
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [unit, setUnit] = useState<UnitType>("mm");
  const [selectedMetal, setSelectedMetal] = useState<string>("Gold 18K Yellow");
  const [prices, setPrices] = useState<{
    XAU: number;
    XAG: number;
    XPT: number;
  } | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [settings, setSettings] = useState<PricingSettings>(defaultSettings());
  const [quoteResult, setQuoteResult] = useState<PricingResult | null>(null);
  const [productionNotes, setProductionNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // UI state
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [parseProgress, setParseProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch spot prices on mount and every 60s ──
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) throw new Error("Failed to fetch prices");
      const data = await res.json();
      setPrices({ XAU: data.XAU, XAG: data.XAG, XPT: data.XPT });
      setDemoMode(!!data.demo);
      setPriceError(null);
    } catch {
      setPriceError("Unable to fetch live metal prices. Retrying...");
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // ── Auto-recalculate quote ──
  useEffect(() => {
    if (!files.length || !prices) {
      setQuoteResult(null);
      return;
    }
    const metal = METAL_OPTIONS.find((m) => m.label === selectedMetal);
    if (!metal) return;
    const spotPricePerOz = prices[metal.spotSymbol];
    const parts = files.map((f) => ({
      fileName: f.fileName,
      volumeCm3: f.volume, // raw volume in file units - pricing engine handles conversion
      quantity: f.quantity,
      warnings: f.warnings,
    }));
    const result = calculateQuote({
      parts,
      metal,
      spotPricePerOz,
      unit,
      settings,
    });
    setQuoteResult(result);
  }, [files, unit, selectedMetal, settings, prices]);

  // ── File parsing ──
  async function processFiles(incoming: File[]) {
    // Filter valid
    const valid: File[] = [];
    for (const file of incoming) {
      if (!file.name.toLowerCase().endsWith(".stl")) {
        alert(`"${file.name}" is not an STL file. Skipped.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(
          `"${file.name}" exceeds 50MB limit (${formatFileSize(file.size)}). Skipped.`
        );
        continue;
      }
      valid.push(file);
    }

    const slotsLeft = MAX_FILES - files.length;
    if (valid.length > slotsLeft) {
      alert(`Maximum ${MAX_FILES} files. Only the first ${slotsLeft} will be added.`);
      valid.splice(slotsLeft);
    }

    if (valid.length === 0) return;

    setParseProgress({ current: 0, total: valid.length });

    const newFiles: ProcessedFile[] = [];
    for (let i = 0; i < valid.length; i++) {
      setParseProgress({ current: i + 1, total: valid.length });
      try {
        const buffer = await valid[i].arrayBuffer();
        const result = parseSTLBrowser(buffer);
        newFiles.push({
          file: valid[i],
          fileName: valid[i].name,
          triangleCount: result.triangleCount,
          boundingBox: result.boundingBox,
          volume: result.volume,
          isWatertight: result.isWatertight,
          orientationInverted: result.orientationInverted,
          warnings: result.warnings,
          quantity: 1,
        });
      } catch (err) {
        alert(
          `Failed to parse "${valid[i].name}": ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setParseProgress(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, qty: number) {
    const clamped = Math.max(1, Math.min(100, Math.floor(qty) || 1));
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, quantity: clamped } : f))
    );
  }

  // ── Drag & Drop handlers ──
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }

  // ── Settings updaters ──
  function updateSetting<K extends keyof PricingSettings>(
    key: K,
    value: PricingSettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  // ── PDF download ──
  async function handleDownloadPDF() {
    const { generateQuotePDF } = await import("@/components/PDFQuote");
    if (quoteResult && prices) {
      generateQuotePDF(
        quoteResult,
        selectedMetal,
        unit,
        demoMode,
        productionNotes,
        prices
      );
    }
  }

  // ── Payment handler ──
  async function handlePayment() {
    setIsSubmitting(true);
    try {
      const fileData = await Promise.all(
        files.map(async (f) => {
          const buffer = await f.file.arrayBuffer();
          const base64 = arrayBufferToBase64(buffer);
          return { fileName: f.fileName, base64 };
        })
      );

      const body = {
        files: files.map((f) => ({
          fileName: f.fileName,
          volumeCm3: f.volume,
          quantity: f.quantity,
          warnings: f.warnings,
        })),
        metalLabel: selectedMetal,
        unit,
        settings,
        productionNotes,
        fileData,
      };

      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create session");
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("Payment error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Get current metal for density display ──
  const currentMetal = METAL_OPTIONS.find((m) => m.label === selectedMetal);
  const currentDensity =
    settings.densityOverride ?? currentMetal?.density ?? 0;

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 px-4 pb-16">
      {/* ── Price status bar ── */}
      {priceError && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
          {priceError}
        </div>
      )}
      {demoMode && prices && (
        <div className="bg-amber-900/30 border border-amber-700/50 text-amber-200 rounded-lg px-4 py-3 text-sm">
          Demo mode: Using cached/fallback spot prices. Live prices unavailable.
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          1. UPLOAD SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Upload STL Files
        </h2>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200
            flex flex-col items-center justify-center py-12 px-6 text-center
            ${
              isDragOver
                ? "border-[#C9A84C] bg-[#C9A84C]/10 scale-[1.01]"
                : "border-[#3a3a55] bg-[#12121f] hover:border-[#C9A84C]/50 hover:bg-[#1a1a2e]"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Upload icon */}
          <svg
            className={`w-12 h-12 mb-4 transition-colors ${isDragOver ? "text-[#C9A84C]" : "text-[#555]"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-white font-medium text-lg mb-1">
            {isDragOver
              ? "Drop STL files here"
              : "Drag & drop STL files here"}
          </p>
          <p className="text-gray-400 text-sm">
            or click to browse
          </p>
          <p className="text-gray-500 text-xs mt-2">
            .stl only &middot; max {MAX_FILES} files &middot; max 50MB each
          </p>
        </div>

        {/* Parse progress */}
        {parseProgress && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-[#12121f] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#C9A84C] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(parseProgress.current / parseProgress.total) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm text-gray-400 whitespace-nowrap">
              Parsing {parseProgress.current} / {parseProgress.total}
            </span>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Uploaded Files ({files.length}/{MAX_FILES})
            </h3>
            {files.map((f, idx) => {
              const bx = f.boundingBox;
              const dx = (bx.max.x - bx.min.x).toFixed(1);
              const dy = (bx.max.y - bx.min.y).toFixed(1);
              const dz = (bx.max.z - bx.min.z).toFixed(1);

              return (
                <div
                  key={`${f.fileName}-${idx}`}
                  className="bg-[#12121f] border border-[#2a2a40] rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* STL icon */}
                      <svg
                        className="w-5 h-5 text-[#C9A84C] shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <span className="text-white font-medium truncate">
                        {f.fileName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                      <span>
                        Triangles:{" "}
                        <span className="text-gray-300">
                          {f.triangleCount.toLocaleString()}
                        </span>
                      </span>
                      <span>
                        Bounding Box:{" "}
                        <span className="text-gray-300">
                          {dx} x {dy} x {dz}
                        </span>
                      </span>
                      <span>
                        Raw Volume:{" "}
                        <span className="text-gray-300">
                          {f.volume.toFixed(2)} {unit}&sup3;
                        </span>
                      </span>
                    </div>

                    {/* Warnings */}
                    {f.warnings.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {f.warnings.map((w, wi) => (
                          <p
                            key={wi}
                            className="text-xs text-amber-400 flex items-start gap-1"
                          >
                            <svg
                              className="w-3.5 h-3.5 mt-0.5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            {w}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity & remove */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Qty:</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={f.quantity}
                        onChange={(e) =>
                          updateQuantity(idx, parseInt(e.target.value, 10))
                        }
                        className="w-16 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                          focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Remove file"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. CONFIGURATION ROW
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Configuration
        </h2>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side: Unit + Metal */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Unit dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Unit System
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full bg-[#12121f] border border-[#2a2a40] rounded-lg px-3 py-2.5 text-white text-sm
                  appearance-none cursor-pointer
                  focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
              >
                {UNIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                STL files are unitless -- select the unit your model was designed in
              </p>
            </div>

            {/* Metal dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Metal
              </label>
              <select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                className="w-full bg-[#12121f] border border-[#2a2a40] rounded-lg px-3 py-2.5 text-white text-sm
                  appearance-none cursor-pointer
                  focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
              >
                {METAL_OPTIONS.map((m) => (
                  <option key={m.label} value={m.label}>
                    {m.label}
                  </option>
                ))}
              </select>
              {currentMetal && (
                <p className="text-xs text-gray-500 mt-1">
                  Density: {currentMetal.density} g/cm&sup3; &middot; Purity:{" "}
                  {(currentMetal.purity * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          {/* Right side: Collapsible Options */}
          <div className="flex-1">
            <button
              onClick={() => setOptionsOpen(!optionsOpen)}
              className="flex items-center gap-2 text-sm font-medium text-[#C9A84C] hover:text-[#dabb66] transition-colors mb-3"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${optionsOpen ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Advanced Options
            </button>

            {optionsOpen && (
              <div className="space-y-4 bg-[#12121f] border border-[#2a2a40] rounded-xl p-4 animate-in fade-in duration-200">
                {/* Process Allowance */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() =>
                        updateSetting(
                          "allowanceEnabled",
                          !settings.allowanceEnabled
                        )
                      }
                      className={`
                        relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
                        ${settings.allowanceEnabled ? "bg-[#C9A84C]" : "bg-[#3a3a55]"}
                      `}
                    >
                      <span
                        className={`
                          absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200
                          ${settings.allowanceEnabled ? "translate-x-5" : "translate-x-0"}
                        `}
                      />
                    </button>
                    <span className="text-sm text-gray-300">
                      Process Allowance
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={settings.allowancePercent}
                      onChange={(e) =>
                        updateSetting(
                          "allowancePercent",
                          Math.max(0, Math.min(30, parseFloat(e.target.value) || 0))
                        )
                      }
                      disabled={!settings.allowanceEnabled}
                      className="w-16 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>

                {/* Advanced Density Override */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() =>
                        updateSetting(
                          "densityOverride",
                          settings.densityOverride === null
                            ? currentMetal?.density ?? 0
                            : null
                        )
                      }
                      className={`
                        relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
                        ${settings.densityOverride !== null ? "bg-[#C9A84C]" : "bg-[#3a3a55]"}
                      `}
                    >
                      <span
                        className={`
                          absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200
                          ${settings.densityOverride !== null ? "translate-x-5" : "translate-x-0"}
                        `}
                      />
                    </button>
                    <span className="text-sm text-gray-300">
                      Advanced Density Override
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={
                        settings.densityOverride !== null
                          ? settings.densityOverride
                          : currentMetal?.density ?? 0
                      }
                      onChange={(e) =>
                        updateSetting(
                          "densityOverride",
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      disabled={settings.densityOverride === null}
                      className="w-20 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-gray-500">g/cm&sup3;</span>
                  </div>
                </div>

                {/* 3D Print Fee */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() =>
                        updateSetting(
                          "printFeeEnabled",
                          !settings.printFeeEnabled
                        )
                      }
                      className={`
                        relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
                        ${settings.printFeeEnabled ? "bg-[#C9A84C]" : "bg-[#3a3a55]"}
                      `}
                    >
                      <span
                        className={`
                          absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200
                          ${settings.printFeeEnabled ? "translate-x-5" : "translate-x-0"}
                        `}
                      />
                    </button>
                    <span className="text-sm text-gray-300">3D Print Fee</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={settings.printFeePerModel}
                      onChange={(e) =>
                        updateSetting(
                          "printFeePerModel",
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      disabled={!settings.printFeeEnabled}
                      className="w-20 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-gray-500">/model</span>
                  </div>
                </div>

                {/* Shipping Fee */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() =>
                        updateSetting(
                          "shippingEnabled",
                          !settings.shippingEnabled
                        )
                      }
                      className={`
                        relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
                        ${settings.shippingEnabled ? "bg-[#C9A84C]" : "bg-[#3a3a55]"}
                      `}
                    >
                      <span
                        className={`
                          absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200
                          ${settings.shippingEnabled ? "translate-x-5" : "translate-x-0"}
                        `}
                      />
                    </button>
                    <span className="text-sm text-gray-300">Shipping Fee</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={settings.shippingFlat}
                      onChange={(e) =>
                        updateSetting(
                          "shippingFlat",
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      disabled={!settings.shippingEnabled}
                      className="w-20 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 -mt-2 ml-[52px]">
                  Flat-rate USA shipping
                </p>

                {/* Casting Fee */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-300 ml-[52px]">
                    Casting Fee
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={settings.castingFeeFlat}
                      onChange={(e) =>
                        updateSetting(
                          "castingFeeFlat",
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      className="w-20 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Finishing Fee */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-300 ml-[52px]">
                    Finishing Fee
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={settings.finishingFeeFlat}
                      onChange={(e) =>
                        updateSetting(
                          "finishingFeeFlat",
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      className="w-20 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Optional % Fee */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-300 ml-[52px]">
                    Optional % Fee
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={settings.optionalPercentFee}
                      onChange={(e) =>
                        updateSetting(
                          "optionalPercentFee",
                          Math.max(0, Math.min(30, parseFloat(e.target.value) || 0))
                        )
                      }
                      className="w-16 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>

                {/* Rush */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() =>
                        updateSetting("rushEnabled", !settings.rushEnabled)
                      }
                      className={`
                        relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
                        ${settings.rushEnabled ? "bg-[#C9A84C]" : "bg-[#3a3a55]"}
                      `}
                    >
                      <span
                        className={`
                          absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200
                          ${settings.rushEnabled ? "translate-x-5" : "translate-x-0"}
                        `}
                      />
                    </button>
                    <span className="text-sm text-gray-300">Rush Order</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={settings.rushPercent}
                      onChange={(e) =>
                        updateSetting(
                          "rushPercent",
                          Math.max(0, Math.min(50, parseFloat(e.target.value) || 0))
                        )
                      }
                      disabled={!settings.rushEnabled}
                      className="w-16 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>

                {/* Minimum Charge */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-300 ml-[52px]">
                    Minimum Charge
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={settings.minimumCharge}
                      onChange={(e) =>
                        updateSetting(
                          "minimumCharge",
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      className="w-20 bg-[#1a1a2e] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-white text-sm text-center
                        focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. RESULTS TABLE
          ═══════════════════════════════════════════════════════════════ */}
      <QuoteResults
        result={quoteResult}
        demoMode={demoMode}
        metalLabel={selectedMetal}
        unit={unit}
      />

      {/* ═══════════════════════════════════════════════════════════════
          4. PRODUCTION NOTES
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Production Notes
        </h2>
        <textarea
          value={productionNotes}
          onChange={(e) => setProductionNotes(e.target.value.slice(0, 5000))}
          maxLength={5000}
          rows={4}
          placeholder="Production notes / special instructions..."
          className="w-full bg-[#12121f] border border-[#2a2a40] rounded-xl px-4 py-3 text-white text-sm
            placeholder:text-gray-600 resize-y min-h-[100px]
            focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {productionNotes.length} / 5,000
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. ACTION BUTTONS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col sm:flex-row gap-4">
        {/* Download Quote PDF */}
        <button
          onClick={handleDownloadPDF}
          disabled={!quoteResult}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200
            border border-[#C9A84C]/50 text-[#C9A84C]
            hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#C9A84C]/50"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Quote PDF
        </button>

        {/* Proceed to Payment */}
        <button
          onClick={handlePayment}
          disabled={!quoteResult || isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200
            bg-[#C9A84C] text-[#0a0a14] hover:bg-[#dabb66]
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#C9A84C]"
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              Proceed to Payment
            </>
          )}
        </button>
      </section>
    </div>
  );
}
