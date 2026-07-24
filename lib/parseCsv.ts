import Papa from "papaparse";
import { SpendRow, type SpendRow as SpendRowT } from "./rules/schema";

export function parseCsvFile(file: File): Promise<SpendRowT[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length) {
          reject(new Error(result.errors[0].message));
          return;
        }

        try {
          resolve(
            SpendRow.array().parse(
              result.data.map((r, i) => ({
                id: r.id || `row-${i + 1}`,
                date: r.date,
                amount: Number(r.amount),
                currency: r.currency || undefined,
                merchant: r.merchant,
                category: r.category,
                employee: r.employee || undefined,
                department: r.department || undefined,
                hasReceipt: r.hasReceipt === "true",
                approvedBy: r.approvedBy || null,
                description: r.description || undefined,
              })),
            ),
          );
        } catch (e) {
          reject(e);
        }
      },
      error: reject,
    });
  });
}
