import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);

  if (path === "/admin" || path.startsWith("/admin/")) {
    requestHeaders.set("x-nfs-admin", "1");
    requestHeaders.set("x-nfs-admin-path", path);
  }

  if (process.env.CMS_MAINTENANCE === "1") {
    const allowed =
      path.startsWith("/admin") ||
      path.startsWith("/api/v1/admin") ||
      path.startsWith("/_next") ||
      path === "/maintenance";
    if (!allowed) {
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/((?!_next/static|_next/image|favicon.ico|images/|api/v1/public/).*)"],
};
