"use client";

import { useState } from "react";
import type { RuleSet } from "@/lib/rules/schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEMO_POLICY =
  "Lodging over $250 needs VP approval. Rideshares over $40 are not reimbursable. Conference fees over $1000 require a receipt. Hardware over $750 needs manager approval. Employee gifts are never reimbursable. Parking over $30 needs a receipt.";

type Props = {
  onCompiled: (ruleSet: RuleSet) => void;
};

export function PolicyCompile({ onCompiled }: Props) {
  const [policy, setPolicy] = useState(DEMO_POLICY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCompile() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Compile failed (${res.status})`);
      }

      toast.success("Policy compiled");
      console.log("ruleSet", data.ruleSet);
      onCompiled(data.ruleSet);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Compile failed";
      setError(message);
      toast.error(message);
      console.error("compile failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <label className="flex flex-col gap-2">
        <span>Spend policy</span>
        <textarea
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3 disabled:opacity-50"
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          disabled={loading}
        />
      </label>
      <Button
        type="button"
        onClick={onCompile}
        disabled={loading || !policy.trim()}
        className="w-fit"
      >
        {loading ? "Compiling…" : "Compile policy"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
