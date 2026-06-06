import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 400, error.issues);
  }
  console.error(error);
  return jsonError("Internal server error", 500);
}
