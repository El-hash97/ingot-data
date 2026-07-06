// ============================================================
// localStorage utilities — Ingot Monitor
// ============================================================

import { IngotEntry, UserPrefs } from "@/types";

const DATA_KEY  = "ingot_data";
const PREFS_KEY = "ingot_prefs";

// ---- Data --------------------------------------------------
export function getAllEntries(): IngotEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) ?? "[]") as IngotEntry[];
  } catch {
    return [];
  }
}

export function saveEntry(entry: IngotEntry): void {
  const entries = getAllEntries();
  entries.push(entry);
  localStorage.setItem(DATA_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: number): void {
  const entries = getAllEntries().filter((e) => e.id !== id);
  localStorage.setItem(DATA_KEY, JSON.stringify(entries));
}

export function clearAllEntries(): void {
  localStorage.removeItem(DATA_KEY);
}

// ---- Prefs --------------------------------------------------
export function getPrefs(): Partial<UserPrefs> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as Partial<UserPrefs>;
  } catch {
    return {};
  }
}

export function savePrefs(prefs: UserPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ---- Helpers ------------------------------------------------
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("id-ID");
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}
