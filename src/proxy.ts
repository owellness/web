import { NextResponse } from "next/server";

import { auth } from "@/infrastructure/auth/authConfig";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return;
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) return;

  const session = req.auth;
  if (!session?.user) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
