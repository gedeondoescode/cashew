import { checkRateLimit } from "@vercel/firewall";
import { compilePolicy } from "@cashew/lib/llm/compilePolicy";
import { NextResponse } from "next/server";

/** Must match the Rate limit ID on the Vercel Firewall rule. */
const COMPILE_RATE_LIMIT_ID = "compile-policy";

export async function POST(request: Request) {
  const { rateLimited } = await checkRateLimit(COMPILE_RATE_LIMIT_ID, {
    request,
  });
  if (rateLimited) {
    return NextResponse.json(
      { error: "Too many compile requests. Try again in a minute." },
      { status: 429 },
    );
  }

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
