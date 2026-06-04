import { z } from "zod";

// ─── Password rules ─────────────────────────────────────────────

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`)
  .refine((pw) => /[A-Z]/.test(pw), "Password must contain at least 1 uppercase letter")
  .refine((pw) => /[a-z]/.test(pw), "Password must contain at least 1 lowercase letter")
  .refine((pw) => /[0-9]/.test(pw), "Password must contain at least 1 number");

// ─── Schemas ────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(254, "Email is too long")
    .trim()
    .toLowerCase(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// ─── Client-side helpers (shared with frontend) ──────────────────

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} {
  const checks = {
    minLength: password.length >= PASSWORD_MIN,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let strength: PasswordStrength;
  if (score <= 2) strength = "weak";
  else if (score === 3) strength = "fair";
  else if (score === 4) strength = "good";
  else strength = "strong";

  return { strength, score, checks };
}

// ─── Forgot / Reset password ────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export { passwordSchema };
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
