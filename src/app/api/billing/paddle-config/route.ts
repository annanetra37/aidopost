import { NextResponse } from "next/server";
import { activeProvider, paddleConfig } from "@/lib/billing/config";

/** Public Paddle.js settings. The client-side token is designed to be public (it can only open checkouts). */
export async function GET() {
  if (activeProvider() !== "paddle" || !paddleConfig.clientToken) return NextResponse.json({ enabled: false });
  return NextResponse.json({ enabled: true, clientToken: paddleConfig.clientToken, environment: paddleConfig.environment });
}
