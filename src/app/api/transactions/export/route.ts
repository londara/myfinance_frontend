import { BASE_URL } from "@/lib/api/client";
import { getToken } from "@/lib/api/session";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Download proxy for the ledger export.
 *
 * <p>Same reason the SSE route exists: a plain browser navigation (or an `<a download>`) cannot set
 * an `Authorization` header, and the token is in an httpOnly cookie the page cannot read anyway. So
 * the browser navigates to this same-origin route, and the server attaches the credential.
 *
 * <p><b>This serves a real `.xlsx`, not NDJSON.</b> The backend still exposes the streamed
 * newline-delimited JSON at `/api/transactions/export` — it is the clearest example of a genuinely
 * incremental `Flux` and is kept for API clients — but a `.jsonl` file is not something you can open,
 * and the button in the UI is used by people who want a spreadsheet.
 *
 * <p><b>The body is still piped, never buffered.</b> The upstream response is handed straight
 * through. Reading it with `await response.arrayBuffer()` to "check" it would put the entire
 * workbook in the Next process's heap — on a small instance that is the difference between a working
 * export and an OOM. The backend already bounds its own memory with POI's streaming workbook, and
 * piping is what keeps that end to end.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = await getToken();

  if (!token) {
    return new Response("Not authenticated", { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/api/transactions/export.xlsx?pageSize=500`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: XLSX_MIME,
      },
      // If the user cancels the download, stop the upstream work rather than letting the
      // backend finish building a workbook nobody will read.
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
      "Content-Type": XLSX_MIME,
      // Turns the navigation into a save-as instead of the browser trying to render the bytes.
      "Content-Disposition": `attachment; filename="myfinance-transactions-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
      // Tells any nginx-style proxy in front not to buffer the whole response before forwarding.
      "X-Accel-Buffering": "no",
    },
  });
}
