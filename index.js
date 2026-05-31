const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      from_number TEXT,
      text TEXT,
      label TEXT,
      qty INTEGER,
      cost NUMERIC,
      month TEXT,
      time TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
initDB();

const RECIPES = {
  'בצק':      { label: 'הכנת בצק',       costPerUnit: 177.82 },
  'קינמון':   { label: 'תערובת קינמון',  costPerUnit: 141.06 },
  'פרוסטינג': { label: 'פרוסטינג',       costPerUnit: 187.72 },
  'שוקולד':   { label: 'שוקולד',          costPerUnit: 142.24 },
};

const UNITS = {
  'קרמל':         { label: 'בקבוק קרמל',     price: 24.96 },
  'פקאן':         { label: 'פקאן 10 קג',      price: 635 },
  'פסיפלורה':     { label: 'מונין פסיפלורה', price: 88 },
  'מנגו':         { label: 'מונין מנגו',      price: 69.81 },
  'תות':          { label: 'מונין תות',       price: 60.68 },
  'שמנת':         { label: 'שמנת מתוקה 42%', price: 41 },
  'קפה':          { label: 'שקית קפה',        price: 78 },
  'שוקולד בקבוק': { label: 'בקבוק שוקולד',   price: 30.27 },
};

function getMonth() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}

app.post('/webhook', async (req, res) => {
  const body = req.body.Body || '';
  const from = req.body.From || '';
  const text = body.trim();
  const nums = text.replace(/[^\d]/g, '');
  const qty = parseInt(nums) || 1;

  let found = null;
  for (const k in RECIPES) {
    if (text.includes(k)) { found = { key: k, type: 'recipe', qty }; break; }
  }
  if (!found) {
    for (const k in UNITS) {
      if (text.includes(k)) { found = { key: k, type: 'unit', qty }; break; }
    }
  }

  let reply = '';
  if (found) {
    const cost = found.type === 'recipe'
      ? found.qty * RECIPES[found.key].costPerUnit
      : found.qty * UNITS[found.key].price;
    const label = found.type === 'recipe'
      ? RECIPES[found.key].label
      : UNITS[found.key].label;
    const month = getMonth();
    await pool.query(
      'INSERT INTO events (from_number, text, label, qty, cost, month) VALUES ($1,$2,$3,$4,$5,$6)',
      [from, text, label, found.qty, cost, month]
    );
    reply = `✅ נרשם: ${label} × ${found.qty}`;
  } else {
    reply = `❌ לא זיהיתי. נסה: "בצק 2", "קינמון 1", "קרמל 3", "קפה 2"`;
  }

  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Message>${reply}</Message></Response>`);
});

app.get('/api/months', async (req, res) => {
  const result = await pool.query(
    'SELECT DISTINCT month FROM events ORDER BY month DESC'
  );
  res.json(result.rows.map(r => r.month));
});

app.get('/api/log', async (req, res) => {
  const month = req.query.month || getMonth();
  const result = await pool.query(
    'SELECT * FROM events WHERE month=$1 ORDER BY time DESC LIMIT 50',
    [month]
  );
  res.json(result.rows);
});

app.get('/api/summary', async (req, res) => {
  const month = req.query.month || getMonth();
  const result = await pool.query(
    'SELECT label, SUM(qty) as qty, SUM(cost) as cost FROM events WHERE month=$1 GROUP BY label ORDER BY cost DESC',
    [month]
  );
  const summary = {};
  result.rows.forEach(r => {
    summary[r.label] = { qty: parseInt(r.qty), cost: parseFloat(r.cost) };
  });
  res.json(summary);
});

app.post('/api/reset', async (req, res) => {
  const month = req.query.month || getMonth();
  await pool.query('DELETE FROM events WHERE month=$1', [month]);
  res.json({ ok: true });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
