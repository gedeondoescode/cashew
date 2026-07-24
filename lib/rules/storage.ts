import { RuleSet, type RuleSet as RuleSetT } from "./schema";

const STORAGE_KEY = "cashew:ruleSet";

export function loadRuleSet(): RuleSetT | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return RuleSet.parse(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveRuleSet(ruleSet: RuleSetT): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ruleSet));
}

export function clearRuleSet(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
