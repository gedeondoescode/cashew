import type { Condition, Rule, RuleSet, SpendRow } from "./schema";

export type Violation = {
  rowId: string;
  ruleId: string;
  ruleName: string;
  severity: Rule["severity"];
  message: string;
};

function matchPred(
  pred: Exclude<Condition, { all: Condition[] } | { any: Condition[] }>,
  row: SpendRow,
): boolean {
  switch (pred.field) {
    case "amount": {
      const v = row.amount;
      switch (pred.op) {
        case "lt":
          return v < pred.value;
        case "lte":
          return v <= pred.value;
        case "gte":
          return v >= pred.value;
        case "gt":
          return v > pred.value;
        case "eq":
          return v === pred.value;
        default:
          return false;
      }
    }
    case "category":
    case "department": {
      const v = pred.field === "category" ? row.category : row.department;
      if (v == null) return false;
      if (pred.op === "eq") return v === pred.value;
      if (pred.op === "in") return (pred.value as string[]).includes(v);
      if (pred.op === "not_in") return !(pred.value as string[]).includes(v);
      return false;
    }
    case "merchant": {
      const v = row.merchant.toLowerCase();
      if (pred.op === "contains")
        return v.includes(String(pred.value).toLowerCase());
      if (pred.op === "in")
        return (pred.value as string[]).some((m) => m.toLowerCase() === v);
      if (pred.op === "not_in")
        return !(pred.value as string[]).some((m) => m.toLowerCase() === v);
      return false;
    }
    case "hasReceipt":
      return row.hasReceipt === pred.value;
    case "approvedBy":
      return pred.op === "exists"
        ? row.approvedBy != null && row.approvedBy !== ""
        : row.approvedBy == null || row.approvedBy === "";
    case "description":
      return (row.description ?? "")
        .toLowerCase()
        .includes(pred.value.toLowerCase());
  }
}

export function match(condition: Condition, row: SpendRow): boolean {
  if ("all" in condition) return condition.all.every((c) => match(c, row));
  if ("any" in condition) return condition.any.some((c) => match(c, row));
  return matchPred(condition, row);
}

export function evaluate(ruleSet: RuleSet, rows: SpendRow[]): Violation[] {
  const violations: Violation[] = [];
  for (const row of rows) {
    for (const rule of ruleSet.rules) {
      if (match(rule.when, row) && !match(rule.assert, row)) {
        violations.push({
          rowId: row.id,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: rule.message,
        });
      }
    }
  }
  return violations;
}
