"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import { PasswordInput } from "@/components/auth/password-input";
import { SocialAuth } from "@/components/auth/social-auth";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type FormState } from "@/lib/actions/auth";

const initialState: FormState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("reason") === "expired";

  /**
   * `useActionState` posts the form to the `login` Server Action and gives back whatever it
   * returns, plus a pending flag. The browser never sees the bearer token: the action sets an
   * httpOnly cookie and redirects, so there is nothing to hold on to on this side.
   */
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {expired ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-body-md text-warning"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Your session expired. Please sign in again.
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-body-md text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <Field
        label="Email Address"
        htmlFor="login-email"
        error={state.fieldErrors?.email}
      >
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue="jane.doe@example.com"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="login-password"
        error={state.fieldErrors?.password}
        action={
          <Link
            href="/login"
            className="text-label-md font-medium text-brand-container underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        }
      >
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          defaultValue="password123"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
      </Field>

      <div className="flex items-center gap-2.5">
        {/* name + value is what puts this in the FormData the action reads. */}
        <Checkbox id="login-remember" name="rememberMe" defaultChecked />
        <Label
          htmlFor="login-remember"
          className="block text-body-md font-normal text-on-surface-variant"
        >
          Keep me signed in for 30 days
        </Label>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" data-icon="inline-start" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <SocialAuth label="Continue with Google" />
    </form>
  );
}
