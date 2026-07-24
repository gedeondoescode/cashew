import * as z from "zod";

// SpendRow designed to normalize CSV data
export const SpendRow = z.object({
  id: z.string().min(1),
  date: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().default("USD"),
  merchant: z.string(),
  category: z.string(),
  employee: z.string().optional(),
  department: z.string().optional(),
  hasReceipt: z.boolean().default(false),
  approvedBy: z.string().nullable().optional(),
  description: z.string().optional(),
});

export type SpendRow = z.infer<typeof SpendRow>;

export const Predicate = z.union([
  z.object({
    field: z.literal("amount"),
    op: z.enum(["lte", "gte", "lt", "gt", "eq"]),
    value: z.number(),
  }),

  // category ops
  z.object({
    field: z.literal("category"),
    op: z.literal("eq"),
    value: z.string(),
  }),
  z.object({
    field: z.literal("category"),
    op: z.literal("in"),
    value: z.array(z.string()),
  }),
  z.object({
    field: z.literal("category"),
    op: z.literal("not_in"),
    value: z.array(z.string()),
  }),

  // merchant ops
  z.object({
    field: z.literal("merchant"),
    op: z.literal("contains"),
    value: z.string(),
  }),
  z.object({
    field: z.literal("merchant"),
    op: z.literal("in"),
    value: z.array(z.string()),
  }),
  z.object({
    field: z.literal("merchant"),
    op: z.literal("not_in"),
    value: z.array(z.string()),
  }),

  // department ops
  z.object({
    field: z.literal("department"),
    op: z.literal("eq"),
    value: z.string(),
  }),
  z.object({
    field: z.literal("department"),
    op: z.literal("in"),
    value: z.array(z.string()),
  }),

  z.object({
    field: z.literal("hasReceipt"),
    op: z.literal("eq"),
    value: z.boolean(),
  }),
  z.object({
    field: z.literal("approvedBy"),
    op: z.enum(["exists", "not_exists"]),
  }),
  z.object({
    field: z.literal("description"),
    op: z.literal("contains"),
    value: z.string(),
  }),
]);

export const Condition = z.union([
  Predicate,
  z.object({
    get all() {
      return z.array(Condition);
    },
  }),
  z.object({
    get any() {
      return z.array(Condition);
    },
  }),
]);

export type Condition = z.infer<typeof Condition>;

export const Rule = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  severity: z.enum(["block", "flag", "warn"]),
  when: Condition,
  assert: Condition,
  message: z.string().min(1),
});

export type Rule = z.infer<typeof Rule>;

export const RuleSet = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  currency: z.string().default("USD"),
  rules: z.array(Rule).min(1),
});

export type RuleSet = z.infer<typeof RuleSet>;
