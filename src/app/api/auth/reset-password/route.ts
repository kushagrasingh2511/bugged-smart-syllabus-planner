import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = resetPasswordSchema.parse(await request.json());

    try {
      await resetPasswordWithToken(body.token, body.password);
    } catch (error) {
      return jsonError(
        error instanceof Error
          ? error.message
          : "Invalid or expired reset link",
        400,
      );
    }

    return jsonSuccess({
      message:
        "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
