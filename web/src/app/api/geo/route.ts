import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cfCountry = request.headers.get("cf-ipcountry") || request.headers.get("x-country-code") || "";
  
  return NextResponse.json({
    country: cfCountry || "UNKNOWN",
    isIran: cfCountry.toUpperCase() === "IR",
  });
}
