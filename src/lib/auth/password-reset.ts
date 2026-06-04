import { createHash, randomBytes } from "crypto";
import { connectDB } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import User from "@/models/User";

const RESET_TOKEN_EXPIRY_MINUTES = 30;

/** Generate a crypto-secure reset token and its hash for storage. */
function generateResetToken(): { rawToken: string; hashedToken: string } {
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
}

/** Hash a raw token for comparison (same algo used during generation). */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Create a password reset token for the given email.
 * Returns the raw token (to be sent in the link) or null if email not found.
 * IMPORTANT: Caller must not reveal whether the email exists.
 */
export async function createPasswordResetToken(
  email: string,
): Promise<string | null> {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return null;

  const { rawToken, hashedToken } = generateResetToken();
  const expires = new Date(
    Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = expires;
  await user.save();

  return rawToken;
}

/**
 * Validate a reset token and set a new password.
 * Returns true on success, throws on invalid/expired token.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  await connectDB();

  const hashedToken = hashToken(rawToken);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires +password");

  if (!user) {
    throw new Error(
      "Invalid or expired reset link. Please request a new password reset.",
    );
  }

  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined as unknown as string;
  user.resetPasswordExpires = undefined as unknown as Date;
  await user.save();
}

/**
 * Send a password reset email.
 * Falls back to console logging in development if no email provider is configured.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  // Check if an email provider is configured
  const hasEmailProvider = !!process.env.SMTP_HOST || !!process.env.RESEND_API_KEY;

  if (!hasEmailProvider) {
    // Development fallback — log the reset link
    console.log("\n" + "=".repeat(60));
    console.log("🔑 PASSWORD RESET LINK (dev mode — no email provider)");
    console.log("=".repeat(60));
    console.log(`Email: ${email}`);
    console.log(`Link:  ${resetUrl}`);
    console.log(`Expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes`);
    console.log("=".repeat(60) + "\n");
    return;
  }

  // TODO: Integrate with email provider (Resend, SendGrid, SMTP, etc.)
  // For now, this is a placeholder for production email sending
  console.log(
    `[Email] Would send password reset to ${email} — URL: ${resetUrl}`,
  );
}
