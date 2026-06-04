import { handleApiError, jsonSuccess } from "@/lib/api";
import {
  createPasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/auth/password-reset";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = forgotPasswordSchema.parse(await request.json());

    const token = await createPasswordResetToken(body.email);

    // If token exists, send the email. Otherwise do nothing — don't reveal
    // whether the email exists in our system.
    if (token) {
      await sendPasswordResetEmail(body.email, token);
    }

    // Always return the same response regardless of whether the email exists
    return jsonSuccess({
      message:
        "If an account with that email exists, we've sent a password reset link. Check your inbox.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
