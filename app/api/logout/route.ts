import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  (await cookies()).delete(AUTH_COOKIE);
  return NextResponse.redirect(new URL("/login", req.url));
}
