import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifySessionToken } from "@/lib/auth";
import { ROUTES, SESSION_COOKIE } from "@/lib/constants";

const protectedPaths = [
  ROUTES.dashboard,
  ROUTES.syllabus,
  ROUTES.planner,
  ROUTES.progress,
  ROUTES.revisions,
  ROUTES.assistant,
];

const authPaths = [ROUTES.login, ROUTES.register];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isAuthPage = authPaths.includes(
    pathname as (typeof authPaths)[number],
  );

  if (isProtected && !session) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/syllabus/:path*",
    "/planner/:path*",
    "/progress/:path*",
    "/revisions/:path*",
    "/assistant/:path*",
    "/login",
    "/register",
  ],
};
