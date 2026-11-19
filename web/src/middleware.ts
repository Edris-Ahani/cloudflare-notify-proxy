import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Read Cloudflare country header (defaults to unknown if running locally)
  const cfCountry = request.headers.get("cf-ipcountry") || request.headers.get("x-country-code") || "";
  
  const response = NextResponse.next();

  if (cfCountry) {
    // Set cookie if not already set or changed
    response.cookies.set("cf_country", cfCountry, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
