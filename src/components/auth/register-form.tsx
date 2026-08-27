"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { SocialAuth } from "@/components/auth/social-auth";
import { Field, FieldRow } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register, type FormState } from "@/lib/actions/auth";

const initialState: FormState = {};

/**
 * The currency list is a fixed set of ISO codes, so it stays a constant. It is not fetched: the
 * backend has no currencies endpoint, and SCHEMA.md is explicit that three hardcoded options do
 * not justify a table.
 */
const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
];

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  // Local only, to drive the strength meter as the user types. The password itself is submitted
  // as form data and validated by the backend.
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-body-md text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <FieldRow>
        <Field
          label="First Name"
          htmlFor="register-first"
          error={state.fieldErrors?.firstName}
        >
          <Input
            id="register-first"
            name="firstName"
            autoComplete="given-name"
            placeholder="Jane"
            required
            aria-invalid={Boolean(state.fieldErrors?.firstName)}
          />
        </Field>
        <Field
          label="Last Name"
          htmlFor="register-last"
          error={state.fieldErrors?.lastName}
        >
          <Input
            id="register-last"
            name="lastName"
            autoComplete="family-name"
            placeholder="Doe"
            required
            aria-invalid={Boolean(state.fieldErrors?.lastName)}
          />
        </Field>
      </FieldRow>

      <Field
        label="Email Address"
        htmlFor="register-email"
        error={state.fieldErrors?.email}
      >
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
      </Field>

      <Field label="Base Currency" htmlFor="register-currency">
        {/*
          A native select rather than the shadcn Select here: Radix's Select renders a button and
          a portalled listbox, which do not participate in a plain form submission. Inside a Server
          Action form the native element is the right tool.
        */}
        <select
          id="register-currency"
          name="baseCurrency"
          defaultValue="USD"
          className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Password"
        htmlFor="register-password"
        error={state.fieldErrors?.password}
      >
        <PasswordInput
          id="register-password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <PasswordStrength value={password} />
      </Field>

      <Field
        label="Confirm Password"
        htmlFor="register-confirm"
        error={state.fieldErrors?.confirmPassword}
      >
        <PasswordInput
          id="register-confirm"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          required
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <Checkbox id="register-terms" name="terms" className="mt-0.5" />
          <Label
            htmlFor="register-terms"
            className="block text-body-md leading-5 font-normal text-on-surface-variant"
          >
            I agree to the{" "}
            <Link
              href="/register"
              className="font-medium text-brand-container underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/register"
              className="font-medium text-brand-container underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            {"."}
          </Label>
        </div>
        {state.fieldErrors?.terms ? (
          <p className="text-label-md font-medium text-danger">
            {state.fieldErrors.terms}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" data-icon="inline-start" />
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <SocialAuth label="Sign up with Google" />
    </form>
  );
}
