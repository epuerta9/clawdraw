#!/usr/bin/env bun
// Preload environment from package directory
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env")

// Load .env file directly with Bun
const envFile = Bun.file(envPath)
if (await envFile.exists()) {
  const text = await envFile.text()
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=")
      if (key) {
        const value = valueParts.join("=")
        process.env[key] = value
      }
    }
  }
}

// Now run the app
await import("../src/index.tsx")
