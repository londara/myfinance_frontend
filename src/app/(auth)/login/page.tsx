import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your MyFinance account.",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to MyFinance"
      description="Pick up where you left off — your balances are already reconciled."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-container underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {/*
        The form reads `?reason=expired` with useSearchParams, which forces it out of the static
        prerender. Without this boundary the build fails outright: Next cannot prerender a component
        that needs the request's query string. The Suspense boundary lets the page shell prerender
        while the form resolves on the client.
      */}
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

/** Matches the form's height so the layout does not jump when it swaps in. */
function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="h-[68px] animate-pulse rounded-lg bg-surface-high" />
      <div className="h-[68px] animate-pulse rounded-lg bg-surface-high" />
      <div className="h-5 w-48 animate-pulse rounded bg-surface-high" />
      <div className="h-11 animate-pulse rounded-lg bg-surface-high" />
    </div>
  );
}
