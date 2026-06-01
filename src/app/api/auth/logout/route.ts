import { SESSION_COOKIE } from "@/lib/constants";
import { jsonSuccess } from "@/lib/api";

export async function POST() {
  const response = jsonSuccess({ message: "Logged out" });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
