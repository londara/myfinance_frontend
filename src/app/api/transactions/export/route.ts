import { BASE_URL } from "@/lib/api/client";
import { getToken } from "@/lib/api/session";

/**
 * Download proxy for the ledger export.
 *
 * <p>Same reason the SSE route exists: a plain browser navigation (or an `<a download>`) cannot set
 * an `Authorization` header, and the token is in an httpOnly cookie the page cannot read anyway. So
 * the browser navigates to this same-origin route, and the server attaches the credential.
 *
 * <p><b>The body is piped, never buffered.</b> The backend streams newline-delimited JSON page by
 * page precisely so a large ledger never sits in memory. Reading it with `await response.text()`
 * here would undo all of that — the export would be fully materialised in the Next process before
 * a single byte reached the user. Passing `upstream.body` through keeps the whole chain incremental.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = await getToken();

  if (!token) {
    return new Response("Not authenticated", { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/api/transactions/export?pageSize=500`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/x-ndjson",
      },
      // If the user cancels the download, stop asking the backend for more pages.
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Export failed", { status: upstream.status || 502 });
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      // Turns the navigation into a save-as instead of rendering the stream in the tab.
      "Content-Disposition": `attachment; filename="myfinance-transactions-${stamp}.ndjson"`,
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
