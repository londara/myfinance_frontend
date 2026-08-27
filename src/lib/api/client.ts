import { redirect } from "next/navigation";

import { getToken } from "./session";
import type { ApiErrorBody } from "./types";

/**
 * The one place this app talks to the Spring backend.
 *
 * <p>Server-only. Every caller is a Server Component, Server Action or Route Handler, because the
 * bearer token lives in an httpOnly cookie the browser cannot read (see `session.ts`). Calling this
 * from a `"use client"` component fails at build time, which is the intended guardrail.
 *
 * <p>Because these are server-to-server calls, **CORS never applies** and the token never reaches
 * the browser.
 */
const BASE_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/** Thrown for any non-2xx. Carries the backend's structured error body when there is one. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field-level messages from Bean Validation, for rendering next to inputs. */
  get fieldErrors(): Record<string, string> {
    return this.fields ?? {};
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Set for public endpoints (login, register) so a missing cookie is not an error. */
  anonymous?: boolean;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, anonymous = false, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };

  if (!anonymous) {
    const token = await getToken();
    if (!token) {
      // No cookie at all. Sending the request anyway would just come back 401, so short-circuit
      // to the login page — middleware normally catches this, but a cookie can expire mid-session.
      redirect("/login");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      /*
       * ALWAYS no-store, and this is a deliberate architectural decision rather than caution.
       *
       * Next's Data Cache is keyed by the request URL and options. Every user hits the same URL
       * — GET /api/dashboard — so caching here risks one user being served another user's
       * balances. That is not a performance regression, it is a data leak, and no amount of tag
       * discipline fixes a key that does not include the tenant.
       *
       * Caching still happens, in the right place: the Spring backend caches its expensive
       * aggregates in Redis, keyed per user and invalidated by a per-user version stamp. One
       * cache, at the layer that knows who is asking.
       */
      cache: "no-store",
    });
  } catch {
    // fetch only rejects on a transport failure — the backend being down, DNS, an aborted signal.
    // An HTTP error status resolves normally and is handled below.
    throw new ApiError(
      503,
      `Cannot reach the API at ${BASE_URL}. Is the backend running? (mvn spring-boot:run)`,
    );
  }

  if (response.status === 401) {
    // The token was rejected: expired, revoked, or the backend's database was reset. Either way
    // the cookie is worthless, so send the user to sign in again rather than showing empty screens.
    redirect("/login?reason=expired");
  }

  if (!response.ok) {
    const problem = await readErrorBody(response);
    throw new ApiError(response.status, problem.message, problem.fields);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorBody(
  response: Response,
): Promise<{ message: string; fields?: Record<string, string> }> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return { message: body.message ?? response.statusText, fields: body.fields };
  } catch {
    // Not every failure is JSON — a proxy 502 is usually HTML.
    return { message: `${response.status} ${response.statusText}` };
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export { BASE_URL };

/**
 * The routes each kind of write affects, used with `revalidatePath` in the Server Actions.
 *
 * <p>Note what this invalidates: the client-side Router Cache and the rendered RSC payload, not a
 * data cache — there is no data cache here (see above). Without it, navigating back to a screen
 * after a mutation would show the previously rendered HTML.
 */
export const routes = {
  dashboard: "/",
  transactions: "/transactions",
  budgets: "/budgets",
  goals: "/goals",
  reminders: "/reminders",
  reports: "/reports",
  settings: "/settings",
} as const;
