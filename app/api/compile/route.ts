import { compilePolicy } from "@cashew/lib/llm/compilePolicy";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const policy = String(body.policy ?? "").trim();
    if (!policy) {
      return NextResponse.json(
        { error: "policy is required" },
        { status: 400 },
      );
    }

    const ruleSet = await compilePolicy(policy);
    return NextResponse.json({ ruleSet });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to compile policy",
      },
      { status: 400 },
    );
  }
}
