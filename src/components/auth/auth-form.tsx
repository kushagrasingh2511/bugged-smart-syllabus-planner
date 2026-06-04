"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
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

type AuthMode = "login" | "register";

// ─── Password strength bar ──────────────────────────────────────

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
      {/* Strength bar */}
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

      {/* Checklist */}
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
              {passed ? (
                <Check className="size-3" />
              ) : (
                <X className="size-3" />
              )}
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Inline field error ─────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
  );
}

// ─── Validation helpers ─────────────────────────────────────────

function validateEmail(email: string): string | undefined {
  if (!email) return undefined; // don't show error for empty
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address";
  }
  return undefined;
}

function validateName(name: string): string | undefined {
  if (!name) return undefined;
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return undefined;
  if (password.length < 8) return "At least 8 characters required";
  if (!/[A-Z]/.test(password)) return "Must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Must contain a number";
  return undefined;
}

// ─── Main form ──────────────────────────────────────────────────

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  // Field values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Touched state (only show errors after user interacts)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Computed validation errors
  const errors = {
    name: !isLogin ? validateName(name) : undefined,
    email: validateEmail(email),
    password: !isLogin ? validatePassword(password) : undefined,
  };

  // Is form valid?
  const isFormValid = isLogin
    ? email.length > 0 && password.length > 0 && !errors.email
    : name.trim().length >= 2 &&
      email.length > 0 &&
      password.length >= 8 &&
      !errors.name &&
      !errors.email &&
      !errors.password;

  const markTouched = useCallback(
    (field: string) =>
      setTouched((prev) => ({ ...prev, [field]: true })),
    [],
  );

  // Clear server error on field change
  useEffect(() => {
    setError(null);
  }, [name, email, password]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Force-show all errors
    setTouched({ name: true, email: true, password: true });
    if (!isFormValid) return;

    setLoading(true);

    const payload = isLogin
      ? { email: email.trim().toLowerCase(), password }
      : {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      router.push(ROUTES.dashboard);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15">
          <Sparkles className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLogin
            ? "Sign in to pick up your study plan where you left off."
            : "Start planning smarter — it only takes a minute."}
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Full name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Alex Johnson"
                  autoComplete="name"
                  className={cn(
                    "h-11 pl-10",
                    touched.name &&
                      errors.name &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => markTouched("name")}
                />
              </div>
              {touched.name && <FieldError message={errors.name} />}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@university.edu"
                autoComplete="email"
                className={cn(
                  "h-11 pl-10",
                  touched.email &&
                    errors.email &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
              />
            </div>
            {touched.email && <FieldError message={errors.email} />}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              {isLogin && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={
                  isLogin
                    ? "Enter your password"
                    : "Min 8 chars, uppercase, lowercase & number"
                }
                autoComplete={isLogin ? "current-password" : "new-password"}
                className={cn(
                  "h-11 pl-10",
                  touched.password &&
                    errors.password &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
              />
            </div>
            {!isLogin && <PasswordStrengthIndicator password={password} />}
            {isLogin && touched.password && !password && (
              <FieldError message="Password is required" />
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
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Please wait…
              </>
            ) : (
              <>
                {isLogin ? "Sign in" : "Create account"}{" "}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <Link
          href={isLogin ? ROUTES.register : ROUTES.login}
          className={cn(
            "font-medium text-primary underline-offset-4 hover:underline",
          )}
        >
          {isLogin ? "Sign up free" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
