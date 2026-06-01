import type { NextConfig } from "next";

// Allow sign-in and HMR when opening the dev server via LAN IP (e.g. http://10.x.x.x:3000).
// Override with DEV_ALLOWED_ORIGIN in .env.local if your IP changes.
const lanOrigin = process.env.DEV_ALLOWED_ORIGIN?.trim();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    ...(lanOrigin ? [lanOrigin] : []),
    "10.71.127.94",
  ],
};

export default nextConfig;
