"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ApiError, api } from "@/lib/api/client";
import { endSession, getToken, startSession } from "@/lib/api/session";
import type { SessionResponse } from "@/lib/api/types";

/**
 * Auth as Server Actions.
 *
 * <p>Why actions rather than a client `fetch`: the response contains the bearer token, and it has
 * to go into an httpOnly cookie. Only the server can set one. If the browser did the login call it
 * would be holding the token in JavaScript, which is the thing `session.ts` exists to avoid.
 */

/**
 * The shape every form action returns.
 *
 * <p>`fieldErrors` is populated straight from the backend's Bean Validation response, so the server
 * stays the single source of truth for what is valid. The client-side checks in the forms are a
 * fast path for the user, not the rule.
 */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";

  try {
    const session = await api.post<SessionResponse>(
      "/api/auth/login",
      { email, password, rememberMe },
      { anonymous: true },
    );
    await startSession(session);
  } catch (error) {
    return toFormState(error, "Could not sign in.");
  }

  // redirect() throws internally, so it must sit outside the try/catch or the catch swallows it
  // and the user stays on the login page with no error. This is the single most common bug in
  // Next.js Server Actions.
  redirect("/");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  // Checked here as well as in the browser: the confirm field is a UI concern the API has no
  // opinion about, and an action can be invoked without the form.
  if (password !== confirm) {
    return { fieldErrors: { confirmPassword: "Passwords do not match." } };
  }

  if (formData.get("terms") !== "on") {
    return { fieldErrors: { terms: "Please accept the terms to continue." } };
  }

  try {
    const session = await api.post<SessionResponse>(
      "/api/auth/register",
      {
        email: String(formData.get("email") ?? "").trim(),
        password,
        firstName: String(formData.get("firstName") ?? "").trim(),
        lastName: String(formData.get("lastName") ?? "").trim(),
        baseCurrency: String(formData.get("baseCurrency") ?? "USD"),
      },
      { anonymous: true },
    );
    await startSession(session);
  } catch (error) {
    return toFormState(error, "Could not create your account.");
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  const token = await getToken();

  if (token) {
    try {
      // Tell the backend to revoke the session row. Best-effort: if this fails the local cookie
      // still has to go, or the user is stuck signed in to a session they asked to end.
      await api.post("/api/auth/logout");
    } catch {
      // Deliberately swallowed — see above.
    }
  }

  await endSession();
  revalidatePath("/", "layout");
  redirect("/login");
}

/** Maps an ApiError onto the form state, keeping field messages attached to their fields. */
function toFormState(error: unknown, fallback: string): FormState {
  if (error instanceof ApiError) {
    return {
      error: Object.keys(error.fieldErrors).length > 0 ? undefined : error.message,
      fieldErrors: Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : undefined,
    };
  }
  return { error: fallback };
}
