// ============================================================
// Types for Ingot Monitor
// ============================================================

export interface IngotEntry {
  id: number;
  timestamp: string; // ISO string
  date: string;      // YYYY-MM-DD
  time: "Day" | "Night";
  shift: "Red" | "White";
  operator: string;
  masuk: number;
  pakai: number;
  buang: number;
  akhir: number;
}

export interface UserPrefs {
  operator: string;
  shift: "Red" | "White";
}
