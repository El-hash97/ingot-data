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
