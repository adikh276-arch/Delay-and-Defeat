import fs from "fs";
import path from "path";
import { pool } from "../src/lib/db";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function initDb() {
  try {
    const schemaPath = path.resolve(process.cwd(), "database", "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");
    console.log("Executing Schema...");
    await pool.query(sql);
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Failed to execute DB initialization", err);
  } finally {
    process.exit(0);
  }
}

initDb();
