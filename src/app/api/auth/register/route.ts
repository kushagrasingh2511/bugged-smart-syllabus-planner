import {
  createSessionToken,
  hashPassword,
  sessionCookieOptions,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { registerSchema } from "@/lib/validations/auth";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    await connectDB();

    const existing = await User.findOne({ email: body.email });
    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    const password = await hashPassword(body.password);
    const user = await User.create({
      name: body.name,
      email: body.email,
      password,
    });

    const token = await createSessionToken({
      userId: user.userId,
      email: user.email,
    });

    const response = jsonSuccess(
      {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
        },
      },
      201,
    );

    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
