import { LayoutDashboard, PlusSquare, History, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/input", label: "Input Data", icon: PlusSquare },
  { href: "/riwayat", label: "Riwayat", icon: History },
];
