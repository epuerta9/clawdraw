import { createClient, type Client } from "@libsql/client"

let db: Client | null = null

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (!url) {
      throw new Error("TURSO_DATABASE_URL is required")
    }

    db = createClient({
      url,
      authToken,
    })
  }
  return db
}

export async function closeDb(): Promise<void> {
  if (db) {
    db.close()
    db = null
  }
}
