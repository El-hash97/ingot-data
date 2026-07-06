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
