# Input Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Input Data page (`src/app/input/page.tsx`) so its sections have clear visual separation, show a locked "Stok Awal" (carried over from the last saved entry) inside a proper table, correctly fold that Stok Awal into the Stok Akhir formula, and let the operator share a saved entry as a JPG receipt.

**Architecture:** Two new presentational/logic components are extracted from the page so each has one responsibility: `StokTable` (the Data Stok table, including the locked Stok Awal row) and `ReceiptDialog` (the post-save receipt card and JPG share/download flow). `src/app/input/page.tsx` keeps owning form state, persistence (`@/lib/store`), and wires the two new components together. Image export uses the new `html-to-image` dependency; sharing prefers the Web Share API (`navigator.share` with a `File`) and falls back to a direct download when unsupported.

**Tech Stack:** Next.js 16 / React 19 / TypeScript (strict), Tailwind v4 tokens from `globals.css`, `@base-ui/react` primitives via the existing `src/components/ui/*` wrappers, `html-to-image` (new dependency), `sonner` for toasts.

## Global Constraints

- Do not modify `src/app/globals.css` or any theme token (`--background`, `--card`, `--border`, etc.) — contrast fixes are local class overrides on the Input page only.
- Do not add an `awal` field to `IngotEntry` or change the localStorage schema in `src/lib/store.ts` / `src/types/index.ts` — Stok Awal for the receipt lives in component state only, never persisted.
- Do not modify `src/app/riwayat/page.tsx` or `src/app/dashboard/page.tsx`.
- Formula fix: `Stok Akhir = Stok Awal + Masuk − Pakai − Buang` (previously the code computed `prevAkhir` but never added it — this bug is fixed as part of this plan).
- Keep the existing dark/gold theme (`--primary: #FFC000` on `--background: #000000`); all new UI must read correctly on a black canvas.
- No automated test framework exists in this repo (no Jest/Vitest configured, no existing test files anywhere in `src/`). Verification steps use `npx tsc --noEmit` for type safety and manual browser checks via `npm run dev` — this matches the spec's own "Testing / Verification" section (manual-only) and the codebase's existing convention.
- Working directory for all commands below: `C:\Users\El\Documents\ingot-data\ingot-app`.

---

### Task 1: Add the `html-to-image` dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (auto-updated by npm)

**Interfaces:**
- Produces: the `html-to-image` package, importable as `import { toJpeg } from "html-to-image"` — consumed by Task 3 (`ReceiptDialog`).

- [ ] **Step 1: Install the package**

Run: `npm install html-to-image`

Expected: command exits 0, `node_modules/html-to-image` is created, and `package.json` gains a new line under `"dependencies"` similar to:
```json
"html-to-image": "^1.11.11",
```
(exact version may differ — that's fine).

- [ ] **Step 2: Verify the dependency was recorded**

Run: `node -e "console.log(require('./package.json').dependencies['html-to-image'])"`

Expected: prints a version string (e.g. `^1.11.11`), not `undefined`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add html-to-image dependency for receipt JPG export"
```

---

### Task 2: Create the `StokTable` component

**Files:**
- Create: `src/components/input/StokTable.tsx`

**Interfaces:**
- Consumes: `Table, TableBody, TableRow, TableCell` from `@/components/ui/table`; `Input` from `@/components/ui/input`; `cn` from `@/lib/utils`; `Lock`, `Calculator` icons from `lucide-react`.
- Produces: named export `StokTable`, with props type:
  ```ts
  export interface StokTableProps {
    stokAwal: number;
    masuk: string;
    pakai: string;
    buang: string;
    onChange: (key: "masuk" | "pakai" | "buang", value: string) => void;
    akhir: number;
  }
  ```
  Consumed by Task 4 (`src/app/input/page.tsx`).

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Lock, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StokTableProps {
  stokAwal: number;
  masuk: string;
  pakai: string;
  buang: string;
  onChange: (key: "masuk" | "pakai" | "buang", value: string) => void;
  akhir: number;
}

const ROWS: { key: "masuk" | "pakai" | "buang"; label: string }[] = [
  { key: "masuk", label: "Total Ingot Masuk" },
  { key: "pakai", label: "Pakai Produksi" },
  { key: "buang", label: "Buang / Reject" },
];

export function StokTable({
  stokAwal,
  masuk,
  pakai,
  buang,
  onChange,
  akhir,
}: StokTableProps) {
  const isNegative = akhir < 0;
  const values: Record<"masuk" | "pakai" | "buang", string> = {
    masuk,
    pakai,
    buang,
  };

  return (
    <Table>
      <TableBody>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableCell className="w-1/2 py-3 align-top">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Stok Awal
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Otomatis dari stok akhir sebelumnya
            </p>
          </TableCell>
          <TableCell className="py-3 text-right align-top">
            <Input
              value={stokAwal.toLocaleString("id-ID")}
              disabled
              readOnly
              className="ml-auto max-w-[160px] text-right font-semibold tabular-nums"
            />
          </TableCell>
        </TableRow>

        {ROWS.map(({ key, label }) => (
          <TableRow key={key} className="border-white/10 hover:bg-transparent">
            <TableCell className="w-1/2 py-3">
              <label htmlFor={key} className="text-sm font-semibold">
                {label}
              </label>
            </TableCell>
            <TableCell className="py-3">
              <div className="relative flex items-center justify-end">
                <Input
                  id={key}
                  type="number"
                  min={0}
                  placeholder="0"
                  value={values[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="max-w-[160px] pr-10 text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 text-xs font-semibold text-muted-foreground pointer-events-none">
                  pcs
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}

        <TableRow
          className={cn(
            "hover:bg-transparent",
            isNegative
              ? "bg-destructive/10 border-destructive/20"
              : "bg-primary/10 border-primary/20"
          )}
        >
          <TableCell className="py-4">
            <div className="flex items-center gap-2">
              <Calculator
                className={cn(
                  "h-4 w-4",
                  isNegative ? "text-destructive" : "text-primary"
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isNegative ? "text-destructive/70" : "text-primary/70"
                  )}
                >
                  Stok Akhir (Otomatis)
                </p>
                <p
                  className={cn(
                    "text-[11px]",
                    isNegative ? "text-destructive/60" : "text-primary/60"
                  )}
                >
                  = Stok Awal + Masuk − Pakai − Buang
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell className="py-4 text-right">
            <p
              className={cn(
                "text-2xl font-extrabold tabular-nums tracking-tight",
                isNegative ? "text-destructive" : "text-primary"
              )}
            >
              {akhir.toLocaleString("id-ID")}
            </p>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: exits 0, no errors mentioning `StokTable.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/input/StokTable.tsx
git commit -m "Add StokTable component with locked Stok Awal row"
```

---

### Task 3: Create the `ReceiptDialog` component

**Files:**
- Create: `src/components/input/ReceiptDialog.tsx`

**Interfaces:**
- Consumes: `Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle` from `@/components/ui/dialog`; `Button` from `@/components/ui/button`; `Badge` from `@/components/ui/badge`; `formatNumber, formatDate` from `@/lib/store`; `toast` from `sonner`; `toJpeg` from `html-to-image` (Task 1); `Loader2, Share2` icons from `lucide-react`; `cn` from `@/lib/utils`.
- Produces: named export `ReceiptDialog` and named type export `ReceiptData`:
  ```ts
  export interface ReceiptData {
    operator: string;
    shift: "Red" | "White";
    time: "Day" | "Night";
    date: string;
    stokAwal: number;
    masuk: number;
    pakai: number;
    buang: number;
    akhir: number;
    savedAt: string;
  }
  ```
  Component props: `{ receipt: ReceiptData | null; onClose: () => void }`. Consumed by Task 4 (`src/app/input/page.tsx`).

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/store";
import { toast } from "sonner";
import { Loader2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReceiptData {
  operator: string;
  shift: "Red" | "White";
  time: "Day" | "Night";
  date: string;
  stokAwal: number;
  masuk: number;
  pakai: number;
  buang: number;
  akhir: number;
  savedAt: string;
}

interface ReceiptDialogProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

const ROWS: {
  label: string;
  render: (r: ReceiptData) => React.ReactNode;
}[] = [
  { label: "Operator", render: (r) => r.operator },
  {
    label: "Shift",
    render: (r) => (
      <Badge
        variant="outline"
        className={
          r.shift === "Red"
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-border bg-muted text-foreground"
        }
      >
        {r.shift}
      </Badge>
    ),
  },
  { label: "Waktu", render: (r) => (r.time === "Day" ? "Day" : "Night") },
  { label: "Tanggal", render: (r) => formatDate(r.date) },
  { label: "Stok Awal", render: (r) => `${formatNumber(r.stokAwal)} pcs` },
  { label: "Masuk", render: (r) => `${formatNumber(r.masuk)} pcs` },
  { label: "Pakai", render: (r) => `${formatNumber(r.pakai)} pcs` },
  { label: "Buang", render: (r) => `${formatNumber(r.buang)} pcs` },
];

export function ReceiptDialog({ receipt, onClose }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (!receiptRef.current || !receipt) return;
    setSharing(true);
    try {
      const dataUrl = await toJpeg(receiptRef.current, {
        quality: 0.95,
        backgroundColor: "#000000",
        pixelRatio: 2,
      });
      const filename = `ingot-${receipt.date}-${receipt.shift.toLowerCase()}.jpg`;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/jpeg" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Ingot Monitor",
          text: `Stok Akhir: ${formatNumber(receipt.akhir)} pcs`,
        });
        toast.success("Berhasil dibagikan!");
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        link.click();
        toast.success("Gambar JPG berhasil diunduh!");
      }
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        toast.error("Gagal membuat gambar. Coba lagi.");
      }
    } finally {
      setSharing(false);
    }
  }

  const isNegative = (receipt?.akhir ?? 0) < 0;

  return (
    <Dialog open={receipt !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Data Tersimpan</DialogTitle>
        </DialogHeader>

        {receipt && (
          <div
            ref={receiptRef}
            className="rounded-xl border border-white/10 bg-black p-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Ingot Monitor
              </p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(receipt.savedAt).toLocaleString("id-ID")}
              </p>
            </div>

            <div className="space-y-2.5">
              {ROWS.map(({ label, render }) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">
                    {render(receipt)}
                  </span>
                </div>
              ))}
            </div>

            <div
              className={cn(
                "mt-4 rounded-lg border-2 p-4 flex items-center justify-between",
                isNegative
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-primary/30 bg-primary/5"
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  isNegative ? "text-destructive/70" : "text-primary/70"
                )}
              >
                Stok Akhir
              </p>
              <p
                className={cn(
                  "text-2xl font-extrabold tabular-nums",
                  isNegative ? "text-destructive" : "text-primary"
                )}
              >
                {formatNumber(receipt.akhir)} pcs
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button onClick={handleShare} disabled={sharing}>
            {sharing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            {sharing ? "Memproses..." : "Share sebagai JPG"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: exits 0, no errors mentioning `ReceiptDialog.tsx`. (Confirms `navigator.share`/`navigator.canShare` typings resolve under `lib: ["dom", ...]` in `tsconfig.json`, and that the `html-to-image` import from Task 1 resolves.)

- [ ] **Step 3: Commit**

```bash
git add src/components/input/ReceiptDialog.tsx
git commit -m "Add ReceiptDialog component with JPG share/download flow"
```

---

### Task 4: Rewire `src/app/input/page.tsx`

**Files:**
- Modify: `src/app/input/page.tsx` (full replacement of file content below)

**Interfaces:**
- Consumes: `StokTable` + `StokTableProps` (Task 2), `ReceiptDialog` + `ReceiptData` (Task 3).
- No new exports — this is the page's default export, unchanged signature (`export default function InputPage()`).

- [ ] **Step 1: Replace the file content**

Replace the entire contents of `src/app/input/page.tsx` with:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAllEntries, saveEntry, savePrefs, getPrefs, todayISO } from "@/lib/store";
import { IngotEntry } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StokTable } from "@/components/input/StokTable";
import { ReceiptDialog, ReceiptData } from "@/components/input/ReceiptDialog";
import { toast } from "sonner";
import { Save, RotateCcw, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormState {
  operator: string;
  shift: "Red" | "White" | "";
  date: string;
  time: "Day" | "Night" | "";
  masuk: string;
  pakai: string;
  buang: string;
}

const INITIAL_FORM: FormState = {
  operator: "",
  shift: "",
  date: todayISO(),
  time: "",
  masuk: "",
  pakai: "",
  buang: "",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
      <span className="h-3 w-0.5 rounded-full bg-primary" />
      {children}
    </p>
  );
}

export default function InputPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [stokAwal, setStokAwal] = useState(0);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Load saved prefs + carry-over stok awal on mount
  useEffect(() => {
    const prefs = getPrefs();
    setForm((prev) => ({
      ...prev,
      operator: prefs.operator ?? "",
      shift: prefs.shift ?? "",
    }));

    const sorted = [...getAllEntries()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setStokAwal(sorted.length > 0 ? sorted[0].akhir : 0);
  }, []);

  const akhir =
    stokAwal +
    (parseFloat(form.masuk) || 0) -
    (parseFloat(form.pakai) || 0) -
    (parseFloat(form.buang) || 0);

  const set = useCallback((key: keyof FormState, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.operator.trim()) newErrors.operator = "Nama operator wajib diisi.";
    if (!form.shift) newErrors.shift = "Pilih shift.";
    if (!form.date) newErrors.date = "Tanggal wajib diisi.";
    if (!form.time) newErrors.time = "Pilih waktu.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleReset() {
    const prefs = getPrefs();
    setForm({
      ...INITIAL_FORM,
      operator: prefs.operator ?? "",
      shift: prefs.shift ?? "",
    });
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return;
    }

    setSubmitting(true);

    const masuk = parseFloat(form.masuk) || 0;
    const pakai = parseFloat(form.pakai) || 0;
    const buang = parseFloat(form.buang) || 0;
    const newAkhir = stokAwal + masuk - pakai - buang;

    const entry: IngotEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      date: form.date,
      time: form.time as "Day" | "Night",
      shift: form.shift as "Red" | "White",
      operator: form.operator.trim(),
      masuk,
      pakai,
      buang,
      akhir: newAkhir,
    };

    saveEntry(entry);
    savePrefs({
      operator: entry.operator,
      shift: entry.shift,
    });

    setReceipt({
      operator: entry.operator,
      shift: entry.shift,
      time: entry.time,
      date: entry.date,
      stokAwal,
      masuk,
      pakai,
      buang,
      akhir: newAkhir,
      savedAt: entry.timestamp,
    });

    setStokAwal(newAkhir);

    // Reset numeric fields but keep prefs
    setForm({
      ...INITIAL_FORM,
      operator: entry.operator,
      shift: entry.shift,
    });
    setSubmitting(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Input Data Ingot
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catat pergerakan stok ingot untuk shift ini
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ---- Section: Operator Info ---- */}
        <Card className="ring-1 ring-white/15 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <SectionTitle>Informasi Operator</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Operator Name */}
              <div className="space-y-2">
                <Label htmlFor="operator" className="font-semibold text-sm">
                  Nama Operator <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="operator"
                  placeholder="Masukkan nama operator"
                  value={form.operator}
                  onChange={(e) => set("operator", e.target.value)}
                  className={cn(errors.operator && "border-destructive ring-1 ring-destructive")}
                  autoComplete="off"
                />
                {errors.operator ? (
                  <p className="text-xs text-destructive">{errors.operator}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Terisi otomatis dari sesi terakhir
                  </p>
                )}
              </div>

              {/* Shift */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">
                  Shift <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.shift}
                  onValueChange={(v) => set("shift", v)}
                  className="flex gap-3"
                >
                  {(["Red", "White"] as const).map((s) => (
                    <Label
                      key={s}
                      htmlFor={`shift-${s}`}
                      className={cn(
                        "flex flex-1 items-center gap-2.5 rounded-lg border-2 px-4 py-3 cursor-pointer text-sm font-semibold transition-all",
                        form.shift === s
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <RadioGroupItem value={s} id={`shift-${s}`} className="hidden" />
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full flex-shrink-0",
                          s === "Red" ? "bg-destructive" : "bg-foreground/60 border border-border"
                        )}
                      />
                      {s}
                    </Label>
                  ))}
                </RadioGroup>
                {errors.shift && (
                  <p className="text-xs text-destructive">{errors.shift}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---- Section: Waktu ---- */}
        <Card className="ring-1 ring-white/15 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <SectionTitle>Waktu</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="font-semibold text-sm">
                  Tanggal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={cn(errors.date && "border-destructive ring-1 ring-destructive")}
                />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date}</p>
                )}
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">
                  Waktu <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.time}
                  onValueChange={(v) => set("time", v)}
                  className="flex gap-3"
                >
                  {([
                    { val: "Day", icon: Sun, label: "Day" },
                    { val: "Night", icon: Moon, label: "Night" },
                  ] as const).map(({ val, icon: Icon, label }) => (
                    <Label
                      key={val}
                      htmlFor={`time-${val}`}
                      className={cn(
                        "flex flex-1 items-center gap-2.5 rounded-lg border-2 px-4 py-3 cursor-pointer text-sm font-semibold transition-all",
                        form.time === val
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <RadioGroupItem value={val} id={`time-${val}`} className="hidden" />
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                    </Label>
                  ))}
                </RadioGroup>
                {errors.time && (
                  <p className="text-xs text-destructive">{errors.time}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---- Section: Data Stok ---- */}
        <Card className="ring-1 ring-white/15 shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <SectionTitle>Data Stok</SectionTitle>
            <StokTable
              stokAwal={stokAwal}
              masuk={form.masuk}
              pakai={form.pakai}
              buang={form.buang}
              onChange={(key, value) => set(key, value)}
              akhir={akhir}
            />
          </CardContent>
        </Card>

        {/* ---- Actions ---- */}
        <div className="flex items-center justify-end gap-3 rounded-xl ring-1 ring-white/15 bg-muted/30 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={submitting}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button type="submit" disabled={submitting}>
            <Save className="h-4 w-4 mr-2" />
            {submitting ? "Menyimpan..." : "Simpan Data"}
          </Button>
        </div>
      </form>

      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: exits 0, no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`

Expected: exits 0. If it flags unused imports/vars unrelated to this file, do not fix them (out of scope) — only fix lint errors inside `src/app/input/page.tsx`, `src/components/input/StokTable.tsx`, or `src/components/input/ReceiptDialog.tsx`.

- [ ] **Step 4: Manual verification in the browser**

Run: `npm run dev`

Then in a browser, visit `http://localhost:3000/input` and verify:
1. The three sections (Informasi Operator, Waktu, Data Stok) render as visually separate cards with clearly visible borders/gaps against the black background.
2. The Data Stok section is a table. The first row, "Stok Awal", shows a locked/disabled input (0 pcs if this is the first-ever entry) with a lock icon — it cannot be typed into.
3. Typing values into Masuk / Pakai / Buang updates the "Stok Akhir (Otomatis)" row live, and the value equals `stokAwal + masuk - pakai - buang`.
4. Fill in Nama Operator, Shift, Tanggal, Waktu, and some Masuk/Pakai/Buang values, then click "Simpan Data".
5. A "Data Tersimpan" dialog opens showing a receipt card with Operator, Shift, Waktu, Tanggal, Stok Awal, Masuk, Pakai, Buang, and a highlighted Stok Akhir — all matching what was entered.
6. Click "Share sebagai JPG". On a desktop browser (no file-sharing support), a file named `ingot-<date>-<shift>.jpg` downloads automatically and a success toast appears; open the downloaded file and confirm it is a legible image of the receipt card.
7. Click "Tutup" to close the dialog.
8. Reload the page — the "Stok Awal" row in Data Stok should now show the `akhir` value from the entry just saved (i.e., it carried over correctly).

Stop the dev server (Ctrl+C) once verified.

- [ ] **Step 5: Commit**

```bash
git add src/app/input/page.tsx
git commit -m "Wire StokTable and ReceiptDialog into the input page, fix stok akhir formula"
```

---

## Self-Review Notes

- **Spec coverage:** Stok Awal locked/read-only row → Task 2/4. Table layout for Data Stok → Task 2. Formula fix (`akhir = stokAwal + masuk - pakai - buang`) → Task 4. Clearer section contrast without touching global theme tokens → Task 4 (`ring-white/15` overrides + `space-y-5` gaps + per-row `border-white/10` in Task 2). Share-as-JPG receipt dialog with Web Share API + download fallback → Task 3/4. `html-to-image` dependency → Task 1. All spec sections are covered.
- **Placeholder scan:** No TBD/TODO markers; every step has complete, runnable code or an exact command with expected output.
- **Type consistency:** `StokTableProps.onChange` signature `(key: "masuk" | "pakai" | "buang", value: string) => void` matches the call site in Task 4 (`onChange={(key, value) => set(key, value)}`, where `set: (key: keyof FormState, val: string) => void`). `ReceiptData` fields match exactly what Task 4's `handleSubmit` passes into `setReceipt(...)`. `ReceiptDialogProps` (`receipt`, `onClose`) match the `<ReceiptDialog receipt={receipt} onClose={...} />` usage in Task 4.
