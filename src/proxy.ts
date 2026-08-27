import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guarding before anything renders.
 *
 * <p>In Next.js 16 this file is `proxy.ts`, not `middleware.ts` — the convention was renamed and
 * `middleware.ts` is deprecated. The exported function name changed with it.
 *
 * <p>Without this, an unauthenticated visit to `/budgets` would render the shell, call the API,
 * get a 401 and only then redirect: a flash of empty chrome plus a wasted round trip.
 *
 * <p><b>This is a routing convenience, not the security boundary.</b> It only checks that a cookie
 * is *present* — it cannot tell whether the token is still valid. Real authorisation happens in the
 * Spring backend, which verifies the token against the `sessions` table on every request. A forged
 * cookie sails past here and straight into a 401, which `lib/api/client.ts` turns into a redirect.
 * Treating this file as the gate is a common and serious mistake.
 */

/*
 * The cookie name is duplicated from `lib/api/session.ts` on purpose.
 *
 * The Next docs are explicit that proxy "is meant to be invoked separately of your render code"
 * and that you "should not attempt relying on shared modules or globals" — it can be deployed to a
 * CDN edge, separate from the app runtime. Importing session.ts here would also drag in
 * `next/headers`, which does not belong in this context. One duplicated string literal is the
 * cheaper mistake.
 */
const TOKEN_COOKIE = "myfinance_token";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(TOKEN_COOKIE);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!hasSession && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Remember where they were headed so signing in can return them there.
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Already signed in and asking for the login page: send them to the dashboard rather than
  // showing a form that cannot do anything useful.
  if (hasSession && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Everything except Next's internals, static assets, and the route handlers under /api.
   *
   * The SSE proxy at /api/notifications/stream is excluded deliberately: it does its own token
   * check and must answer with a 401, not an HTML redirect. An EventSource cannot follow a redirect
   * to a login page — it would surface an opaque connection error with nothing to diagnose.
   */
  matcher: [
    "/((?!_next/static|_next/image|api/|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
