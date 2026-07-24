"use client";

import { useEffect, useState } from "react";
import type { RuleSet, SpendRow } from "@/lib/rules/schema";
import type { Violation } from "@/lib/rules/evaluate";
import { loadRuleSet, saveRuleSet } from "@/lib/rules/storage";
import { PolicyCompile } from "@/app/components/PolicyCompile";
import { SpendUpload } from "@/app/components/SpendUpload";
import { SpendTransactions } from "@/app/components/SpendTransactions";

export function MainApp() {
  const [ruleSet, setRuleSet] = useState<RuleSet | null>(null);
  const [rows, setRows] = useState<SpendRow[] | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRuleSet(loadRuleSet());
    setHydrated(true);
  }, []);

  function onCompiled(next: RuleSet) {
    saveRuleSet(next);
    setRuleSet(next);
  }

  return (
    <div className="flex flex-col gap-8">
      <PolicyCompile onCompiled={onCompiled} />
      {hydrated && ruleSet && (
        <p className="text-sm text-muted-foreground">
          Compiled{" "}
          <span className="font-medium text-foreground">{ruleSet.name}</span> (
          {ruleSet.rules.length} rules). Upload a CSV next.
        </p>
      )}
      <SpendUpload
        ruleSet={ruleSet}
        onEvaluated={({ rows: nextRows, violations: nextViolations }) => {
          setRows(nextRows);
          setViolations(nextViolations);
        }}
      />
      {rows && rows.length > 0 && (
        <SpendTransactions rows={rows} violations={violations} />
      )}
    </div>
  );
}
