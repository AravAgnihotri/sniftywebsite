/**
 * Snifty static site + waitlist API (SQLite).
 * Local / Railway / Render: npm install && npm run dev  (or: node waitlist-server.js)
 * Not deployed to Vercel — use .vercelignore + static hosting there only.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'data', 'waitlist.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS waitlist_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_entries(created_at);
`);

const insertStmt = db.prepare(
  'INSERT INTO waitlist_entries (name, email) VALUES (?, ?)'
);

const app = express();
app.disable('x-powered-by');

/** When the site is on Vercel and the API on another host, set WAITLIST_CORS_ORIGIN to your Vercel URL (e.g. https://sniftywebsite.vercel.app). */
const CORS_ORIGIN = (process.env.WAITLIST_CORS_ORIGIN || '').trim();
if (CORS_ORIGIN) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
}

app.use(express.json({ limit: '24kb' }));

/** Simple sliding-window rate limit per IP */
const rateBuckets = new Map();
function rateLimit(maxPerWindow, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let hits = rateBuckets.get(ip) || [];
    hits = hits.filter((t) => now - t < windowMs);
    if (hits.length >= maxPerWindow) {
      return res.status(429).json({
        error: 'Too many attempts from this address. Please wait a minute and try again.',
      });
    }
    hits.push(now);
    rateBuckets.set(ip, hits);
    next();
  };
}

const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

app.post('/api/waitlist', rateLimit(12, 60_000), (req, res) => {
  const name = String(req.body?.name ?? '')
    .trim()
    .slice(0, 120);
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 254);

  if (!name) {
    return res.status(400).json({ error: 'Please enter your first name.' });
  }
  if (!emailOk(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const info = insertStmt.run(name, email);
    return res.status(201).json({ ok: true, id: Number(info.lastInsertRowid) });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'That email is already on the list. Thanks for your enthusiasm!',
      });
    }
    console.error('waitlist insert error:', err);
    return res.status(500).json({
      error: 'Something went wrong saving your details. Please try again.',
    });
  }
});

app.use(express.static(ROOT, { extensions: ['html'], index: ['index.html'] }));

app.listen(PORT, () => {
  console.log(`Snifty site + waitlist API → http://localhost:${PORT}`);
  console.log(`SQLite database → ${DB_PATH}`);
});
