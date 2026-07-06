"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllEntries, formatNumber, formatDate, todayISO } from "@/lib/store";
import { IngotEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StokChart, StokChartPoint } from "@/components/dashboard/StokChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownToLine,
  Factory,
  Trash2,
  BarChart3,
  PlusSquare,
  CalendarDays,
  User,
  Clock,
} from "lucide-react";

interface DashStats {
  latestAkhir: number | null;
  totalMasuk: number;
  totalPakai: number;
  totalBuang: number;
  latest: IngotEntry | null;
  todayEntries: IngotEntry[];
  chartData: StokChartPoint[];
}

function ShiftBadge({ shift }: { shift: string }) {
  return (
    <Badge
      variant="outline"
      className={
        shift === "Red"
          ? "border-destructive/40 bg-destructive/10 text-destructive font-semibold"
          : "border-border bg-muted text-foreground font-semibold"
      }
    >
      <span
        className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
          shift === "Red" ? "bg-destructive" : "bg-foreground/60"
        }`}
      />
      {shift}
    </Badge>
  );
}

function TimeBadge({ time }: { time: string }) {
  return (
    <Badge
      variant="outline"
      className={
        time === "Day"
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-(--chart-2)/40 bg-(--chart-2)/10 text-(--chart-2)"
      }
    >
      {time === "Day" ? "☀ Day" : "🌙 Night"}
    </Badge>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats>({
    latestAkhir: null,
    totalMasuk: 0,
    totalPakai: 0,
    totalBuang: 0,
    latest: null,
    todayEntries: [],
    chartData: [],
  });

  useEffect(() => {
    const entries = getAllEntries();
    if (entries.length === 0) return;

    const sorted = [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latest = sorted[0];

    const chronological = [...entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    setStats({
      latestAkhir: latest.masuk - latest.pakai - latest.buang,
      totalMasuk: entries.reduce((s, e) => s + e.masuk, 0),
      totalPakai: entries.reduce((s, e) => s + e.pakai, 0),
      totalBuang: entries.reduce((s, e) => s + e.buang, 0),
      latest,
      todayEntries: sorted.filter((e) => e.date === todayISO()),
      chartData: chronological.map((e) => ({
        label: formatDate(e.date),
        akhir: e.akhir,
      })),
    });
  }, []);

  const statCards = [
    {
      label: "Stok Akhir Terakhir",
      value: stats.latestAkhir !== null ? formatNumber(stats.latestAkhir) : "—",
      icon: BarChart3,
      colorClass: "text-primary bg-primary/10",
      valueClass:
        stats.latestAkhir !== null && stats.latestAkhir < 0
          ? "text-destructive"
          : "text-primary",
    },
    {
      label: "Total Masuk (All Time)",
      value: stats.totalMasuk > 0 ? formatNumber(stats.totalMasuk) : "—",
      icon: ArrowDownToLine,
      colorClass: "text-(--chart-2) bg-(--chart-2)/10",
      valueClass: "text-(--chart-2)",
    },
    {
      label: "Total Pakai Produksi",
      value: stats.totalPakai > 0 ? formatNumber(stats.totalPakai) : "—",
      icon: Factory,
      colorClass: "text-foreground bg-muted",
      valueClass: "text-foreground",
    },
    {
      label: "Total Buang / Scrap",
      value: stats.totalBuang > 0 ? formatNumber(stats.totalBuang) : "—",
      icon: Trash2,
      colorClass: "text-destructive/80 bg-destructive/10",
      valueClass: "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard Stok Ingot
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan kondisi stok terkini
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, colorClass, valueClass }) => (
          <Card key={label} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg flex-shrink-0 ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
                  {label}
                </p>
                <p className={`text-2xl font-bold tabular-nums leading-tight mt-0.5 ${valueClass}`}>
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latest Entry */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <CardTitle className="text-base font-semibold">Data Terbaru</CardTitle>
          {stats.latest ? (
            <ShiftBadge shift={stats.latest.shift} />
          ) : (
            <Badge variant="outline" className="text-muted-foreground">—</Badge>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {!stats.latest ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <BarChart3 className="h-10 w-10 opacity-30" />
              <p className="text-sm">Belum ada data yang tersimpan.</p>
              <Button render={<Link href="/input" />} size="sm">
                <PlusSquare className="h-4 w-4 mr-2" />
                Input Data Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "Operator", value: stats.latest.operator, icon: User },
                { label: "Tanggal", value: formatDate(stats.latest.date), icon: CalendarDays },
                { label: "Waktu", value: stats.latest.time, icon: Clock },
                { label: "Masuk", value: formatNumber(stats.latest.masuk), icon: null },
                { label: "Pakai", value: formatNumber(stats.latest.pakai), icon: null },
                { label: "Buang", value: formatNumber(stats.latest.buang), icon: null },
                {
                  label: "Stok Akhir",
                  value: formatNumber(stats.latest.akhir),
                  icon: null,
                  highlight: true,
                },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className={`rounded-lg p-3 border ${
                    highlight
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/50 border-border"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {label}
                  </p>
                  <p
                    className={`text-base font-bold tabular-nums ${
                      highlight ? "text-primary text-lg" : "text-foreground"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Activity */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <CardTitle className="text-base font-semibold">Aktivitas Hari Ini</CardTitle>
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </CardHeader>
        <CardContent className="pt-4">
          {stats.todayEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <p className="text-sm">Tidak ada input hari ini.</p>
              <Button render={<Link href="/input" />} variant="outline" size="sm">
                <PlusSquare className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs uppercase tracking-wide font-semibold">Waktu</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide font-semibold">Shift</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide font-semibold">Operator</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide font-semibold text-right">Masuk</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide font-semibold text-right">Pakai</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide font-semibold text-right">Buang</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide font-semibold text-right">Stok Akhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.todayEntries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell><TimeBadge time={e.time} /></TableCell>
                      <TableCell><ShiftBadge shift={e.shift} /></TableCell>
                      <TableCell className="font-medium">{e.operator}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(e.masuk)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(e.pakai)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(e.buang)}</TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-semibold ${
                          e.akhir < 0 ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {formatNumber(e.akhir)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stok Akhir Trend */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <CardTitle className="text-base font-semibold">Tren Stok Akhir</CardTitle>
          <span className="text-xs text-muted-foreground">
            {stats.chartData.length} entri
          </span>
        </CardHeader>
        <CardContent className="pt-4">
          <StokChart data={stats.chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
