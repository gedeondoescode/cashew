import { NextResponse } from "next/server";
import { evaluate } from "@cashew/lib/rules/evaluate";
import { RuleSet, SpendRow } from "@cashew/lib/rules/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rows = SpendRow.array().parse(body.rows);
    const ruleSet = RuleSet.parse(body.ruleSet);
    return NextResponse.json({ violations: evaluate(ruleSet, rows) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}
