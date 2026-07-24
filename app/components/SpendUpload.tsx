"use client";

import { parseCsvFile } from "@/lib/parseCsv";
import type { RuleSet, SpendRow } from "@/lib/rules/schema";
import type { Violation } from "@/lib/rules/evaluate";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { toast } from "sonner";

type Props = {
  ruleSet: RuleSet | null;
  onEvaluated: (payload: { rows: SpendRow[]; violations: Violation[] }) => void;
};

export function SpendUpload({ ruleSet, onEvaluated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !ruleSet) return;

    try {
      const rows = await parseCsvFile(file);
      console.log("parsed rows", rows);

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, ruleSet }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? `Evaluate failed (${res.status})`);
        console.error("evaluate error", data);
        return;
      }

      console.log("violations", data.violations);
      toast.success(`${data.violations.length} flags found`);
      onEvaluated({ rows, violations: data.violations });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      console.error("upload failed", err);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <label className="flex flex-col gap-2 text-sm">
      <span>Upload spend CSV</span>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onChange}
        disabled={!ruleSet}
      />
      <Button
        type="button"
        disabled={!ruleSet}
        onClick={() => inputRef.current?.click()}
        className="w-fit"
      >
        Choose CSV
      </Button>
      <span className="text-muted-foreground">
        {ruleSet
          ? "Results appear below (also logged to the console)."
          : "Compile a policy first, then upload a CSV."}
      </span>
    </label>
  );
}
