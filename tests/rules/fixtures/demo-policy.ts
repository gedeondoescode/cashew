/**
 * Raw fixtures typed as unknown so Zod validation is part of the test path.
 */

export const rawRuleSet: unknown = {
  version: 1,
  name: "Demo spend policy",
  currency: "USD",
  rules: [
    {
      id: "meals-receipt-75",
      name: "Meals require receipt over $75",
      severity: "flag",
      when: {
        all: [
          { field: "category", op: "eq", value: "meals" },
          { field: "amount", op: "gt", value: 75 },
        ],
      },
      assert: { field: "hasReceipt", op: "eq", value: true },
      message: "Meal over $75 missing receipt",
    },
    {
      id: "no-alcohol",
      name: "No alcohol",
      severity: "block",
      when: { field: "category", op: "eq", value: "alcohol" },
      assert: { field: "amount", op: "eq", value: 0 },
      message: "Alcohol purchases are not reimbursable",
    },
    {
      id: "software-approval-500",
      name: "Software over $500 needs approval",
      severity: "flag",
      when: {
        all: [
          { field: "category", op: "eq", value: "software" },
          { field: "amount", op: "gt", value: 500 },
        ],
      },
      assert: { field: "approvedBy", op: "exists" },
      message: "Software over $500 requires manager approval",
    },
  ],
};

export const rawRows: unknown = [
  {
    id: "r1",
    date: "2026-01-10",
    amount: 80,
    merchant: "Cafe Nero",
    category: "meals",
    // hasReceipt omitted → Zod default false → violate meals-receipt-75
  },
  {
    id: "r2",
    date: "2026-01-11",
    amount: 75,
    merchant: "Deli Co",
    category: "meals",
    hasReceipt: false,
    // boundary: gt 75 does not match → pass
  },
  {
    id: "r3",
    date: "2026-01-12",
    amount: 40,
    merchant: "Wine Shop",
    category: "alcohol",
    // violate no-alcohol
  },
  {
    id: "r4",
    date: "2026-01-13",
    amount: 600,
    merchant: "Cloud Tools Inc",
    category: "software",
    approvedBy: null,
    // violate software-approval-500
  },
  {
    id: "r5",
    date: "2026-01-14",
    amount: 600,
    merchant: "Cloud Tools Inc",
    category: "software",
    approvedBy: "manager@acme.com",
    // pass
  },
  {
    id: "r6",
    date: "2026-01-15",
    amount: 100,
    merchant: "Bistro",
    category: "meals",
    hasReceipt: true,
    // pass
  },
  {
    id: "r7",
    date: "2026-01-16",
    amount: 200,
    merchant: "Airline",
    category: "travel",
    // no rules apply → pass
  },
  {
    id: "r8",
    date: "2026-01-17",
    amount: 12,
    merchant: "Office Supplies",
    category: "supplies",
    // sparse optionals → still valid → pass
  },
];

/** Expected violation keys after evaluate (sorted in tests by rowId, ruleId). */
export const expectedViolations = [
  { rowId: "r1", ruleId: "meals-receipt-75", severity: "flag" as const },
  { rowId: "r3", ruleId: "no-alcohol", severity: "block" as const },
  { rowId: "r4", ruleId: "software-approval-500", severity: "flag" as const },
];

/** Invalid RuleSet: category `in` with a string instead of string[]. */
export const rawInvalidRuleSetCategoryIn: unknown = {
  version: 1,
  name: "Bad policy",
  rules: [
    {
      id: "bad-in",
      name: "Bad in",
      severity: "flag",
      when: { field: "category", op: "in", value: "meals" },
      assert: { field: "hasReceipt", op: "eq", value: true },
      message: "should fail zod",
    },
  ],
};

/** Invalid SpendRow: negative amount. */
export const rawInvalidSpendRow: unknown = {
  id: "bad",
  date: "2026-01-01",
  amount: -1,
  merchant: "X",
  category: "meals",
};
