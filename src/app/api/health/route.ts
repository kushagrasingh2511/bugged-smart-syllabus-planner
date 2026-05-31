import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

export async function GET() {
  const timestamp = new Date().toISOString();
  const base = {
    service: "smart-syllabus-planner",
    timestamp,
  };

  if (!process.env.MONGODB_URI?.trim()) {
    return NextResponse.json({
      ...base,
      status: "degraded",
      database: {
        connected: false,
        error: "MONGODB_URI is not set in .env or .env.local",
      },
    });
  }

  try {
    await connectDB();
    const connected = mongoose.connection.readyState === 1;

    return NextResponse.json({
      ...base,
      status: connected ? "ok" : "degraded",
      database: {
        connected,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";

    return NextResponse.json(
      {
        ...base,
        status: "degraded",
        database: {
          connected: false,
          error: message,
        },
      },
      { status: 503 },
    );
  }
}
