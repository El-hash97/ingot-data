"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getAllEntries, deleteEntry, clearAllEntries, formatNumber, formatDate } from "@/lib/store";
import { IngotEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShiftBadge, TimeBadge } from "@/components/riwayat/badges";
import { RiwayatCard } from "@/components/riwayat/RiwayatCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const PAGE_SIZE = 10;

type SortOrder = "newest" | "oldest";

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  action: (() => void) | null;
}

function pageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | "…")[] = [1];
  if (current > 3) range.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
    range.push(i);
  if (current < total - 2) range.push("…");
  range.push(total);
  return range;
}

export default function RiwayatPage() {
  const [entries, setEntries] = useState<IngotEntry[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    action: null,
  });

  const load = useCallback(() => {
    setEntries(getAllEntries());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let result = entries.filter((e) => {
      if (!q) return true;
      return (
        e.operator.toLowerCase().includes(q) ||
        e.shift.toLowerCase().includes(q) ||
        e.date.includes(q) ||
        (e.time ?? "").toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      const diff =
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sort === "newest" ? -diff : diff;
    });

    return result;
  }, [entries, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function openConfirm(title: string, description: string, action: () => void) {
    setConfirm({ open: true, title, description, action });
  }

  function closeConfirm() {
    setConfirm((prev) => ({ ...prev, open: false, action: null }));
  }

  function handleDelete(id: number) {
    openConfirm(
      "Hapus Data",
      "Data ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
      () => {
        deleteEntry(id);
        load();
        toast.success("Data berhasil dihapus.");
      }
    );
  }

  function handleClearAll() {
    openConfirm(
      "Hapus Semua Data",
      `Seluruh ${entries.length} entri akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
      () => {
        clearAllEntries();
        load();
        toast.success("Semua data telah dihapus.");
      }
    );
  }

  function exportCSV() {
    if (entries.length === 0) {
      toast.error("Tidak ada data untuk diexport.");
      return;
    }
    const sorted = [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const header = ["No", "Tanggal", "Waktu", "Shift", "Operator", "Masuk", "Pakai", "Buang", "Stok Akhir"];
    const rows = sorted.map((d, i) => [
      i + 1,
      d.date,
      d.time ?? "",
      d.shift,
      `"${d.operator}"`,
      d.masuk,
      d.pakai,
      d.buang,
      d.akhir,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ingot-data-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV berhasil!");
  }

  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePage * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Riwayat Data
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seluruh catatan pergerakan stok ingot
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari operator, shift..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-9 w-56"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => { setSort(v as SortOrder); setPage(1); }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru Dulu</SelectItem>
              <SelectItem value="oldest">Terlama Dulu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {filtered.length} entri
          </span>
          {entries.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Empty state (shared across table & card layouts) */}
      {pageData.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="text-center py-16 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {entries.length === 0
                ? "Belum ada data tersimpan."
                : "Tidak ada data yang cocok dengan pencarian."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table (desktop, md and up) */}
      {pageData.length > 0 && (
        <Card className="hidden md:block border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {["No", "Tanggal", "Waktu", "Shift", "Operator", "Masuk", "Pakai", "Buang", "Stok Akhir", "Aksi"].map(
                    (h) => (
                      <TableHead
                        key={h}
                        className={`text-[11px] uppercase tracking-wide font-bold whitespace-nowrap ${
                          ["Masuk", "Pakai", "Buang", "Stok Akhir"].includes(h) ? "text-right" : ""
                        } ${h === "Aksi" ? "text-center" : ""}`}
                      >
                        {h}
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((e, i) => (
                  <TableRow key={e.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground text-sm">
                      {startItem + i}
                    </TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {formatDate(e.date)}
                    </TableCell>
                    <TableCell>
                      <TimeBadge time={e.time} />
                    </TableCell>
                    <TableCell>
                      <ShiftBadge shift={e.shift} />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{e.operator}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatNumber(e.masuk)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatNumber(e.pakai)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatNumber(e.buang)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums text-sm font-semibold ${
                        e.akhir < 0 ? "text-destructive" : "text-primary"
                      }`}
                    >
                      {formatNumber(e.akhir)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(e.id)}
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Cards (mobile, below md) */}
      {pageData.length > 0 && (
        <div className="space-y-3 md:hidden">
          {pageData.map((e) => (
            <RiwayatCard key={e.id} entry={e} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Menampilkan {startItem}–{endItem} dari {filtered.length} entri
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageRange(safePage, totalPages).map((p, idx) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 text-center text-muted-foreground text-sm"
                >
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === safePage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-sm"
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog
        open={confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle>{confirm.title}</DialogTitle>
            <DialogDescription>{confirm.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeConfirm}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirm.action?.();
                closeConfirm();
              }}
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
