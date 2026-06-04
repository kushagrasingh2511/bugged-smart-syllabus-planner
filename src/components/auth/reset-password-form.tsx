"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";
import {
  getPasswordStrength,
  type PasswordStrength,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Password strength bar (reused from auth-form) ──────────────

const STRENGTH_CONFIG: Record<
  PasswordStrength,
  { label: string; color: string; width: string }
> = {
  weak: { label: "Weak", color: "bg-red-500", width: "w-1/4" },
  fair: { label: "Fair", color: "bg-orange-500", width: "w-2/4" },
  good: { label: "Good", color: "bg-yellow-500", width: "w-3/4" },
  strong: { label: "Strong", color: "bg-green-500", width: "w-full" },
};

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const { strength, checks } = getPasswordStrength(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              config.color,
              config.width,
            )}
          />
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            strength === "weak" && "text-red-500",
            strength === "fair" && "text-orange-500",
            strength === "good" && "text-yellow-500",
            strength === "strong" && "text-green-500",
          )}
        >
          {config.label}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        {[
          { key: "minLength", label: "8+ characters" },
          { key: "hasUppercase", label: "Uppercase letter" },
          { key: "hasLowercase", label: "Lowercase letter" },
          { key: "hasNumber", label: "Number" },
        ].map(({ key, label }) => {
          const passed = checks[key as keyof typeof checks];
          return (
            <li
              key={key}
              className={cn(
                "flex items-center gap-1 transition-colors",
                passed ? "text-green-500" : "text-muted-foreground",
              )}
            >
              {passed ? <Check className="size-3" /> : <X className="size-3" />}
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Form inner component (needs searchParams) ──────────────────

function ResetPasswordFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = useCallback(
    (field: string) => setTouched((prev) => ({ ...prev, [field]: true })),
    [],
  );

  // Validation
  const pwErrors = {
    minLength: password.length < 8,
    noUpper: !/[A-Z]/.test(password),
    noLower: !/[a-z]/.test(password),
    noNumber: !/[0-9]/.test(password),
  };
  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
  const confirmValid = confirmPassword === password && confirmPassword.length > 0;
  const formValid = passwordValid && confirmValid && token.length > 0;

  useEffect(() => {
    setError(null);
  }, [password, confirmPassword]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    if (!formValid) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Reset failed");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── No token ───────────────────────────────────────────────────

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/15">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invalid link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  // ─── Success state ──────────────────────────────────────────────

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-green-500/15">
            <CheckCircle2 className="size-6 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Password reset!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been updated successfully.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
          <Link href={ROUTES.login}>
            <Button className="h-11 w-full gap-2 text-sm font-semibold">
              Sign in with your new password
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Form ───────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              New password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min 8 chars, uppercase, lowercase & number"
                autoComplete="new-password"
                className={cn(
                  "h-11 pl-10",
                  touched.password &&
                    !passwordValid &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                autoFocus
              />
            </div>
            <PasswordStrengthIndicator password={password} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={cn(
                  "h-11 pl-10",
                  touched.confirmPassword &&
                    !confirmValid &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => markTouched("confirmPassword")}
              />
            </div>
            {touched.confirmPassword && confirmPassword && !confirmValid && (
              <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3 shrink-0" />
                Passwords do not match
              </p>
            )}
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
            className="mt-2 h-11 w-full gap-2 text-sm font-semibold"
            disabled={loading || !formValid}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Resetting…
              </>
            ) : (
              <>
                Reset password <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
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

// ─── Wrapped with Suspense (required for useSearchParams) ───────

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
