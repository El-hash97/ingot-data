import { Badge } from "@/components/ui/badge";

export function ShiftBadge({ shift }: { shift: string }) {
  return (
    <Badge
      variant="outline"
      className={
        shift === "Red"
          ? "border-destructive/40 bg-destructive/10 text-destructive font-semibold text-[11px]"
          : "border-border bg-muted text-foreground font-semibold text-[11px]"
      }
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          shift === "Red" ? "bg-destructive" : "bg-foreground/60"
        }`}
      />
      {shift}
    </Badge>
  );
}

export function TimeBadge({ time }: { time: string }) {
  return (
    <Badge
      variant="outline"
      className={
        time === "Day"
          ? "border-primary/40 bg-primary/10 text-primary text-[11px]"
          : "border-(--chart-2)/40 bg-(--chart-2)/10 text-(--chart-2) text-[11px]"
      }
    >
      {time === "Day" ? "☀ Day" : "🌙 Night"}
    </Badge>
  );
}
