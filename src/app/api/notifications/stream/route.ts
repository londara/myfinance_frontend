import { BASE_URL } from "@/lib/api/client";
import { getToken } from "@/lib/api/session";

/**
 * SSE proxy for the notification bell.
 *
 * <h2>Why this route exists</h2>
 *
 * The browser's `EventSource` **cannot set request headers** — that is a hard limitation of the
 * API, and the backend's own docs call it out. So the browser cannot send
 * `Authorization: Bearer …` to the Spring endpoint, and in this app it could not anyway: the token
 * is in an httpOnly cookie that JavaScript cannot read.
 *
 * The alternatives, and why they were rejected:
 * <ul>
 *   <li><b>Token in the query string</b> — it would then sit in browser history, in the Next access
 *       log and in any proxy log along the way. A 30-day credential in a URL is a bad trade for
 *       avoiding twelve lines of proxy.</li>
 *   <li><b>Token in a readable cookie</b> — throws away the whole reason it is httpOnly.</li>
 *   <li><b>A cookie the Spring backend reads</b> — would mean cross-origin cookies between :3000
 *       and :8080, so SameSite=None plus CORS credentials. More moving parts, weaker defaults.</li>
 * </ul>
 *
 * So: the browser opens a same-origin stream here with no credentials of its own, this route reads
 * the httpOnly cookie server-side, and pipes the backend's stream straight through.
 *
 * <p>The response body is a `ReadableStream` that is never buffered — piping it keeps the whole
 * chain incremental, so an event reaches the browser as soon as the backend emits it.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = await getToken();

  if (!token) {
    // A plain 401, not a redirect: EventSource cannot follow a redirect to a login page, and would
    // surface an HTML response as an opaque "error" event with nothing to diagnose.
    return new Response("Not authenticated", { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/api/notifications/stream`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      // Forward the client's abort signal, so closing the tab closes the backend stream instead of
      // leaving it open until the next heartbeat write fails.
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream refused the stream", { status: upstream.status || 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // Long-lived streams must not be cached or buffered anywhere in between.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Nginx buffers proxied responses by default, which would hold events back until the buffer
      // fills. Harmless locally, essential once this sits behind a reverse proxy.
      "X-Accel-Buffering": "no",
    },
  });
}
