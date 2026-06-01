import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

// Official @google/genai env precedence
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

if (!apiKey) {
  console.error("Set GOOGLE_API_KEY or GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { apiVersion: process.env.GEMINI_API_VERSION || "v1beta" },
});

async function main() {
  console.log("Testing @google/genai with native x-goog-api-key auth...");
  console.log(`Key prefix: ${apiKey.slice(0, 3)}...`);

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-lite",
      contents: "Reply with exactly: WORKING",
    });

    console.log("SUCCESS:");
    console.log(response.text);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}

main();
