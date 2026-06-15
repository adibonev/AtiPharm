import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const authed = req.cookies.get(AUTH_COOKIE)?.value === (await authToken());
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Protect everything except Next internals, /login, and static image assets
// (logo + product packshots live in /public and must load on the login page).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|.*\\.(?:png|jpg|jpeg|svg|ico|webp|pdf)$).*)",
  ],
};
