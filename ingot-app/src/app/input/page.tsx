"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAllEntries, saveEntry, savePrefs, getPrefs, todayISO } from "@/lib/store";
import { IngotEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, RotateCcw, Sun, Moon, Calculator } from "lucide-react";
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
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
      {children}
    </p>
  );
}

export default function InputPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load saved prefs on mount
  useEffect(() => {
    const prefs = getPrefs();
    setForm((prev) => ({
      ...prev,
      operator: prefs.operator ?? "",
      shift: prefs.shift ?? "",
    }));
  }, []);

  const akhir =
    (parseFloat(form.masuk) || 0) -
    (parseFloat(form.pakai) || 0) -
    (parseFloat(form.buang) || 0);

  const isNegative = akhir < 0;

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

    // Compute last stock to carry over
    const allEntries = getAllEntries();
    const sorted = [...allEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const prevAkhir = sorted.length > 0 ? sorted[0].akhir : 0;

    const masuk = parseFloat(form.masuk) || 0;
    const pakai = parseFloat(form.pakai) || 0;
    const buang = parseFloat(form.buang) || 0;
    const newAkhir = masuk - pakai - buang;

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

    toast.success("Data berhasil disimpan!", {
      description: `Stok Akhir: ${newAkhir.toLocaleString("id-ID")} pcs`,
    });

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

      <form onSubmit={handleSubmit} noValidate>
        <Card className="border shadow-sm overflow-hidden">
          {/* ---- Section: Operator Info ---- */}
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

          <Separator />

          {/* ---- Section: Waktu ---- */}
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

          <Separator />

          {/* ---- Section: Data Stok ---- */}
          <CardContent className="p-6 space-y-4">
            <SectionTitle>Data Stok</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { id: "masuk", label: "Total Ingot Masuk", key: "masuk" },
                { id: "pakai", label: "Pakai Produksi", key: "pakai" },
                { id: "buang", label: "Buang / Reject", key: "buang" },
              ].map(({ id, label, key }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id} className="font-semibold text-sm">
                    {label}
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form[key as keyof FormState]}
                      onChange={(e) => set(key as keyof FormState, e.target.value)}
                      className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-muted-foreground pointer-events-none">
                      pcs
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-calc result */}
            <div
              className={cn(
                "mt-2 rounded-xl border-2 p-5 flex items-center gap-4 flex-wrap transition-colors",
                isNegative
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-primary/30 bg-primary/5"
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
                isNegative ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}>
                <Calculator className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[10px] font-bold uppercase tracking-widest",
                  isNegative ? "text-destructive/70" : "text-primary/70"
                )}>
                  Stok Akhir (Otomatis)
                </p>
                <p className={cn("text-[11px] mt-0.5",
                  isNegative ? "text-destructive/60" : "text-primary/60"
                )}>
                  = Masuk − Pakai − Buang
                </p>
              </div>
              <p className={cn("text-3xl font-extrabold tabular-nums tracking-tight",
                isNegative ? "text-destructive" : "text-primary"
              )}>
                {akhir.toLocaleString("id-ID")}
              </p>
            </div>
          </CardContent>

          <Separator />

          {/* ---- Actions ---- */}
          <div className="flex items-center justify-end gap-3 bg-muted/30 px-6 py-4">
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
        </Card>
      </form>
    </div>
  );
}
