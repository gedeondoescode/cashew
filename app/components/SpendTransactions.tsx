"use client";

import {
  Hotel,
  Car,
  Bus,
  Ticket,
  Cpu,
  Wifi,
  GraduationCap,
  Gift,
  CircleParking,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import type { SpendRow } from "@/lib/rules/schema";
import type { Violation } from "@/lib/rules/evaluate";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
  rows: SpendRow[];
  violations: Violation[];
};

function categoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "lodging":
      return Hotel;
    case "rideshare":
      return Car;
    case "ground_transport":
      return Bus;
    case "conference":
      return Ticket;
    case "hardware":
      return Cpu;
    case "telecom":
      return Wifi;
    case "training":
      return GraduationCap;
    case "gifts":
      return Gift;
    case "parking":
      return CircleParking;
    default:
      return ShoppingBag;
  }
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function SpendTransactions({ rows, violations }: Props) {
  const byRow = new Map<string, Violation[]>();
  for (const v of violations) {
    const list = byRow.get(v.rowId) ?? [];
    list.push(v);
    byRow.set(v.rowId, list);
  }

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Transactions</h2>
        <p className="text-sm text-muted-foreground">
          {violations.length > 0
            ? `${violations.length} flag${violations.length === 1 ? "" : "s"} across ${rows.length} rows`
            : `${rows.length} rows · no flags`}
        </p>
      </header>

      <ul>
        {rows.map((row, i) => {
          const Icon = categoryIcon(row.category);
          const flags = byRow.get(row.id) ?? [];
          const flagged = flags.length > 0;

          return (
            <li key={row.id}>
              {i > 0 && <Separator />}
              <div className="flex items-center gap-3 py-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.merchant}</p>
                  <p className="truncate text-sm text-muted-foreground capitalize">
                    {row.category}
                    {flagged && (
                      <span className="ml-2 inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="size-3" />
                        {flags[0].severity}
                      </span>
                    )}
                  </p>
                </div>

                <p className="hidden shrink-0 text-sm text-muted-foreground sm:block">
                  {formatDate(row.date)}
                </p>

                <p
                  className={cn(
                    "w-24 shrink-0 text-right font-medium tabular-nums",
                    flagged && "text-destructive",
                  )}
                >
                  -{formatAmount(row.amount)}
                </p>
              </div>
              {flagged && (
                <p className="pb-3 pl-12 text-xs text-muted-foreground">
                  {flags.map((f) => f.message).join(" · ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
