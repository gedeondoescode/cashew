import { RuleSet, type RuleSet as RuleSetT } from "@cashew/lib/rules/schema";
import { GoogleGenAI } from "@google/genai";
import * as z from "zod";
import { SYSTEM } from "./prompt";

export async function compilePolicy(policy: string): Promise<RuleSetT> {
  const apiKey = process.env.GEMINI_API_KEY!;

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Policy:\n${policy}`,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty model response");

  const result = RuleSet.safeParse(JSON.parse(text));
  if (result.success) return result.data;

  const repair = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Fix this RuleSet JSON.

              Known bugs to fix if present:
              - Replace hasReceipt value 0/1 with true/false booleans
              - Replace empty "all": [] / "any": [] with real predicates from the policy
              - Ensure every rule has non-empty message
              - Emit one rule per policy requirement

              Broken JSON:
              ${text}

              Original policy:
              ${policy}`,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
    },
  });

  console.log("raw compile", text);
  console.log("repair", repair.text);

  return RuleSet.parse(JSON.parse(repair.text ?? "{}"));
}
