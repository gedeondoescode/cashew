import { describe, expect, it } from "vitest";
import { evaluate, type Violation } from "@/lib/rules/evaluate";
import { RuleSet, SpendRow, type Rule, type SpendRow as SpendRowT } from "@/lib/rules/schema";
import {
  expectedViolations,
  rawInvalidRuleSetCategoryIn,
  rawInvalidSpendRow,
  rawRows,
  rawRuleSet,
} from "./fixtures/demo-policy";

function sortViolations<T extends { rowId: string; ruleId: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const byRow = a.rowId.localeCompare(b.rowId);
    return byRow !== 0 ? byRow : a.ruleId.localeCompare(b.ruleId);
  });
}

function violationKeys(violations: Violation[]) {
  return sortViolations(violations).map((v) => ({
    rowId: v.rowId,
    ruleId: v.ruleId,
    severity: v.severity,
  }));
}

function ruleSetOf(...rules: Rule[]) {
  return RuleSet.parse({
    version: 1,
    name: "edge",
    currency: "USD",
    rules,
  });
}

function row(partial: Partial<SpendRowT> & Pick<SpendRowT, "id">): SpendRowT {
  return SpendRow.parse({
    date: "2026-01-01",
    amount: 100,
    merchant: "Acme",
    category: "other",
    ...partial,
  });
}

describe("rules fixtures", () => {
  it("parses a valid RuleSet", () => {
    const ruleSet = RuleSet.parse(rawRuleSet);
    expect(ruleSet.version).toBe(1);
    expect(ruleSet.rules).toHaveLength(3);
  });

  it("parses SpendRows and defaults hasReceipt to false when omitted", () => {
    const rows = SpendRow.array().parse(rawRows);
    expect(rows).toHaveLength(8);
    const r1 = rows.find((r) => r.id === "r1");
    expect(r1?.hasReceipt).toBe(false);
  });

  it("rejects RuleSet with category in + string value", () => {
    const result = RuleSet.safeParse(rawInvalidRuleSetCategoryIn);
    expect(result.success).toBe(false);
  });

  it("rejects SpendRow with negative amount", () => {
    const result = SpendRow.safeParse(rawInvalidSpendRow);
    expect(result.success).toBe(false);
  });

  it("evaluate returns the expected violations", () => {
    const ruleSet = RuleSet.parse(rawRuleSet);
    const rows = SpendRow.array().parse(rawRows);
    const violations = evaluate(ruleSet, rows);

    expect(violationKeys(violations)).toEqual(
      sortViolations(expectedViolations),
    );
  });

  it("evaluate is deterministic across repeated runs", () => {
    const ruleSet = RuleSet.parse(rawRuleSet);
    const rows = SpendRow.array().parse(rawRows);

    const first = evaluate(ruleSet, rows);
    const second = evaluate(ruleSet, rows);

    expect(first).toEqual(second);
    expect(violationKeys(first)).toEqual(violationKeys(second));
  });
});

describe("evaluate edge cases", () => {
  it("uses gte so exact threshold matches when", () => {
    const rules = ruleSetOf({
      id: "lodging-250",
      name: "Lodging at or over $250 needs approval",
      severity: "flag",
      when: {
        all: [
          { field: "category", op: "eq", value: "lodging" },
          { field: "amount", op: "gte", value: 250 },
        ],
      },
      assert: { field: "approvedBy", op: "exists" },
      message: "Lodging needs approval",
    });

    const exact = row({
      id: "exact",
      category: "lodging",
      amount: 250,
      approvedBy: null,
    });
    const under = row({
      id: "under",
      category: "lodging",
      amount: 249,
      approvedBy: null,
    });

    expect(violationKeys(evaluate(rules, [exact, under]))).toEqual([
      { rowId: "exact", ruleId: "lodging-250", severity: "flag" },
    ]);
  });

  it("treats approvedBy empty string like missing for exists/not_exists", () => {
    const needsApproval = ruleSetOf({
      id: "needs-approval",
      name: "Needs approval",
      severity: "flag",
      when: { field: "category", op: "eq", value: "hardware" },
      assert: { field: "approvedBy", op: "exists" },
      message: "Missing approver",
    });

    const empty = row({
      id: "empty",
      category: "hardware",
      approvedBy: "",
    });
    const missing = row({
      id: "missing",
      category: "hardware",
      approvedBy: null,
    });
    const present = row({
      id: "present",
      category: "hardware",
      approvedBy: "boss@acme.com",
    });

    expect(violationKeys(evaluate(needsApproval, [empty, missing, present]))).toEqual([
      { rowId: "empty", ruleId: "needs-approval", severity: "flag" },
      { rowId: "missing", ruleId: "needs-approval", severity: "flag" },
    ]);
  });

  it("does not match department rules when department is absent", () => {
    const rules = ruleSetOf({
      id: "eng-only",
      name: "Engineering dept cap",
      severity: "warn",
      when: { field: "department", op: "eq", value: "engineering" },
      assert: { field: "amount", op: "lte", value: 50 },
      message: "Eng over cap",
    });

    const noDept = row({ id: "no-dept", amount: 999 });
    const eng = row({
      id: "eng",
      amount: 999,
      department: "engineering",
    });

    expect(violationKeys(evaluate(rules, [noDept, eng]))).toEqual([
      { rowId: "eng", ruleId: "eng-only", severity: "warn" },
    ]);
  });

  it("matches merchant contains case-insensitively", () => {
    const rules = ruleSetOf({
      id: "no-uber",
      name: "No Uber",
      severity: "block",
      when: { field: "merchant", op: "contains", value: "uber" },
      assert: { field: "amount", op: "eq", value: 0 },
      message: "Uber not allowed",
    });

    const upper = row({ id: "u1", merchant: "UBER Trips", amount: 20 });
    const mixed = row({ id: "u2", merchant: "Uber XL", amount: 20 });
    const other = row({ id: "u3", merchant: "Lyft", amount: 20 });

    expect(violationKeys(evaluate(rules, [upper, mixed, other]))).toEqual([
      { rowId: "u1", ruleId: "no-uber", severity: "block" },
      { rowId: "u2", ruleId: "no-uber", severity: "block" },
    ]);
  });

  it("supports any composition in when", () => {
    const rules = ruleSetOf({
      id: "gift-or-entertainment",
      name: "Forbidden categories",
      severity: "block",
      when: {
        any: [
          { field: "category", op: "eq", value: "gifts" },
          { field: "category", op: "eq", value: "entertainment" },
        ],
      },
      assert: { field: "amount", op: "eq", value: 0 },
      message: "Not reimbursable",
    });

    const gift = row({ id: "g", category: "gifts", amount: 10 });
    const ent = row({ id: "e", category: "entertainment", amount: 10 });
    const ok = row({ id: "o", category: "supplies", amount: 10 });

    expect(violationKeys(evaluate(rules, [gift, ent, ok]))).toEqual([
      { rowId: "e", ruleId: "gift-or-entertainment", severity: "block" },
      { rowId: "g", ruleId: "gift-or-entertainment", severity: "block" },
    ]);
  });

  it("treats empty all as always matching when (JS every on [])", () => {
    const rules = ruleSetOf({
      id: "empty-when",
      name: "Empty when",
      severity: "flag",
      when: { all: [] },
      assert: { field: "hasReceipt", op: "eq", value: true },
      message: "Needs receipt",
    });

    const noReceipt = row({ id: "nr", hasReceipt: false });
    expect(violationKeys(evaluate(rules, [noReceipt]))).toEqual([
      { rowId: "nr", ruleId: "empty-when", severity: "flag" },
    ]);
  });

  it("can flag the same row under multiple rules", () => {
    const rules = ruleSetOf(
      {
        id: "high-amount",
        name: "High amount",
        severity: "warn",
        when: { field: "amount", op: "gt", value: 100 },
        assert: { field: "hasReceipt", op: "eq", value: true },
        message: "Need receipt over 100",
      },
      {
        id: "no-gifts",
        name: "No gifts",
        severity: "block",
        when: { field: "category", op: "eq", value: "gifts" },
        assert: { field: "amount", op: "eq", value: 0 },
        message: "Gifts blocked",
      },
    );

    const both = row({
      id: "both",
      amount: 150,
      category: "gifts",
      hasReceipt: false,
    });

    expect(violationKeys(evaluate(rules, [both]))).toEqual([
      { rowId: "both", ruleId: "high-amount", severity: "warn" },
      { rowId: "both", ruleId: "no-gifts", severity: "block" },
    ]);
  });
});

describe("schema edge cases", () => {
  it("rejects hasReceipt value as string true", () => {
    const result = RuleSet.safeParse({
      version: 1,
      name: "bad",
      rules: [
        {
          id: "r",
          name: "r",
          severity: "flag",
          when: { field: "category", op: "eq", value: "meals" },
          assert: { field: "hasReceipt", op: "eq", value: "true" },
          message: "x",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty rule message", () => {
    const result = RuleSet.safeParse({
      version: 1,
      name: "bad",
      rules: [
        {
          id: "r",
          name: "r",
          severity: "flag",
          when: { field: "category", op: "eq", value: "meals" },
          assert: { field: "hasReceipt", op: "eq", value: true },
          message: "",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects merchant in with a string value", () => {
    const result = RuleSet.safeParse({
      version: 1,
      name: "bad",
      rules: [
        {
          id: "r",
          name: "r",
          severity: "flag",
          when: { field: "merchant", op: "in", value: "Uber" },
          assert: { field: "amount", op: "eq", value: 0 },
          message: "x",
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
