"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber, formatDate } from "@/lib/store";
import { IngotEntry } from "@/types";
import { ShiftBadge, TimeBadge } from "@/components/riwayat/badges";
import { Trash2 } from "lucide-react";

export interface RiwayatCardProps {
  entry: IngotEntry;
  onDelete: (id: number) => void;
}

export function RiwayatCard({ entry, onDelete }: RiwayatCardProps) {
  const stats: { label: string; value: string; valueClassName?: string }[] = [
    { label: "Masuk", value: formatNumber(entry.masuk) },
    { label: "Pakai", value: formatNumber(entry.pakai) },
    { label: "Buang", value: formatNumber(entry.buang) },
    {
      label: "Stok Akhir",
      value: formatNumber(entry.akhir),
      valueClassName: entry.akhir < 0 ? "text-destructive" : "text-primary",
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {formatDate(entry.date)}
            </span>
            <TimeBadge time={entry.time} />
          </div>
          <div className="flex items-center gap-1">
            <ShiftBadge shift={entry.shift} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(entry.id)}
              aria-label="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm font-medium text-foreground">{entry.operator}</p>

        <div className="grid grid-cols-2 gap-2">
          {stats.map(({ label, value, valueClassName }) => (
            <div
              key={label}
              className="rounded-md border border-border bg-muted/30 px-3 py-2"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                {label}
              </p>
              <p className={`text-sm font-bold tabular-nums ${valueClassName ?? "text-foreground"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
