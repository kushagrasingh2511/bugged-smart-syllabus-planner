"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidEmail) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Success state ──────────────────────────────────────────────

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-green-500/15">
            <CheckCircle2 className="size-6 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>,
            we&apos;ve sent a password reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              The link will expire in 30 minutes. Check your spam folder if you
              don&apos;t see the email.
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { setSent(false); setEmail(""); }}
            >
              <Mail className="size-4" />
              Try a different email
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // ─── Form state ─────────────────────────────────────────────────

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@university.edu"
                autoComplete="email"
                className="h-11 pl-10"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full gap-2 text-sm font-semibold"
            disabled={loading || !isValidEmail}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                Send reset link <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href={ROUTES.login}
          className={cn(
            "inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline",
          )}
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
