#!/usr/bin/env node

// Simple MongoDB connection test script using Mongoose (ESM version)
// - Looks for connection string in env: MONGODB_URL or MONGODB_URI
// - If not set in process.env, it will try to load from a local .env file without external deps

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

function loadEnvFileIfNeeded() {
  // If either is already present, skip reading .env
  if (process.env.MONGODB_URL || process.env.MONGODB_URI) return;
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch (_) {
    // Silently ignore .env parsing failures; script will report missing URI later
  }
}

async function main() {
  loadEnvFileIfNeeded();
  const uri = process.env.MONGODB_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error('[db-test] Error: MONGODB_URL (or MONGODB_URI) is not set.');
    process.exit(1);
  }

  const start = Date.now();
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 2,
    });
    const time = Date.now() - start;
    const info = conn.connection;
    console.log(`[db-test] Connected successfully in ${time}ms`);
    console.log(`[db-test] Host: ${info.host}  Port: ${info.port}  Name: ${info.name}`);
    // Run a ping command to validate connectivity further
    const res = await info.db.admin().ping();
    console.log(`[db-test] Ping: ${JSON.stringify(res)}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    const time = Date.now() - start;
    console.error(`[db-test] Connection failed after ${time}ms`);
    console.error('[db-test] Error:', err && err.message ? err.message : err);
    // Optionally show more details in verbose mode
    if (process.env.DEBUG || process.env.VERBOSE) {
      console.error(err);
    }
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

main();
