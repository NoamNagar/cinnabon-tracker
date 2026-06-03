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
      qty NUMERIC,
      cost NUMERIC,
      month TEXT,
      time TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE,
      unit TEXT,
      quantity NUMERIC DEFAULT 0,
      alert_threshold NUMERIC DEFAULT 0,
      price_per_unit NUMERIC DEFAULT 0
    )
  `);
  const check = await pool.query('SELECT COUNT(*) FROM inventory');
  if (parseInt(check.rows[0].count) === 0) {
    const items = [
      ['בקבוק קרמל',     'יחידה', 0, 3,  24.96],
      ['בקבוק שוקולד',   'יחידה', 0, 3,  30.27],
      ['מונין פסיפלורה', 'יחידה', 0, 2,  88.00],
      ['מונין מנגו',     'יחידה', 0, 2,  69.81],
      ['מונין תות',      'יחידה', 0, 2,  60.68],
      ['שמנת מתוקה 42%', 'יחידה', 0, 3,  41.00],
      ['שקית קפה',       'יחידה', 0, 2,  78.00],
      ['פקאן 10 קג',     'יחידה', 0, 1, 635.00],
      ['קמח',            'ק"ג',   0, 50,  1.35],
      ['אבקת סוכר',      'ק"ג',   0, 20,  0.28],
      ['קינמון',         'ק"ג',   0, 5,   3.30],
      ['קקאו',           'ק"ג',   0, 5,   1.68],
      ['סוכר חום',       'ק"ג',   0, 20,  0.28],
      ['מרגרינה',        'ק"ג',   0, 10,  0.70],
      ['שמרים',          'ק"ג',   0, 2,   1.46],
      ['גבינת שמנת',     'ק"ג',   0, 5,  13.80],
      ['סוכר לבן',       'ק"ג',   0, 20,  0.28],
    ];
    for (const [name, unit, qty, threshold, price] of items) {
      await pool.query(
        'INSERT INTO inventory (name, unit, quantity, alert_threshold, price_per_unit) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [name, unit, qty, threshold, price]
      );
    }
  }
}
initDB();

const RECIPES = {
  'בצק':      { label: 'הכנת בצק',       costPerUnit: 177.82 },
  'קינמון':   { label: 'תערובת קינמון',  costPerUnit: 141.06 },
  'פרוסטינג': { label: 'פרוסטינג',       costPerUnit: 187.72 },
  'שוקולד':   { label: 'שוקולד',          costPerUnit: 142.24 },
};

const UNITS = {
  'קרמל':         { label: 'בקבוק קרמל',     price: 24.96, inventoryName: 'בקבוק קרמל',     inventoryQty: 1 },
  'בקבוק שוקולד': { label: 'בקבוק שוקולד',   price: 30.27, inventoryName: 'בקבוק שוקולד',   inventoryQty: 1 },
  'פקאן':         { label: 'פקאן 10 קג',      price: 635,   inventoryName: 'פקאן 10 קג',      inventoryQty: 1 },
  'פסיפלורה':     { label: 'מונין פסיפלורה', price: 88,    inventoryName: 'מונין פסיפלורה', inventoryQty: 1 },
  'מנגו':         { label: 'מונין מנגו',      price: 69.81, inventoryName: 'מונין מנגו',      inventoryQty: 1 },
  'תות':          { label: 'מונין תות',       price: 60.68, inventoryName: 'מונין תות',       inventoryQty: 1 },
  'שמנת':         { label: 'שמנת מתוקה 42%', price: 41,    inventoryName: 'שמנת מתוקה 42%', inventoryQty: 1 },
  'קפה':          { label: 'שקית קפה',        price: 78,    inventoryName: 'שקית קפה',        inventoryQty: 1 },
};

const RECIPE_INGREDIENTS = {
  'הכנת בצק':      { 'קמח': 9.8, 'מרגרינה': 1.14, 'שמרים': 0.09, 'תמצית וניל': 0.01, 'תמצית לימון': 0.01 },
  'תערובת קינמון': { 'סוכר חום': 12.5, 'קינמון': 1.3 },
  'פרוסטינג':      { 'מרגרינה': 3.75, 'גבינת שמנת': 4.0, 'אבקת סוכר': 6.25 },
  'שוקולד':        { 'מרגרינה': 4.1, 'קקאו': 1.4, 'סוכר לבן': 7.0 },
};

function getMonth() {
  const d = new Date();
  const israelTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  return israelTime.getFullYear() + '-' + String(israelTime.getMonth()+1).padStart(2,'0');
}

async function sendWhatsAppAlert(message) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    const toNumber   = 'whatsapp:+972544968864';
    if (!accountSid || !authToken || !fromNumber) {
      console.log('Twilio credentials missing');
      return;
    }
    const bodyStr = `To=${encodeURIComponent(toNumber)}&From=${encodeURIComponent(fromNumber)}&Body=${encodeURIComponent(message)}`;
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        },
        body: bodyStr
      }
    );
    const result = await response.json();
    console.log('WhatsApp alert sent:', result.sid || result.message);
  } catch(e) {
    console.error('WhatsApp alert error:', e);
  }
}

async function deductInventory(label, qty) {
  const ingredients = RECIPE_INGREDIENTS[label];
  const alerts = [];
  if (ingredients) {
    for (const [ing, amountPerUnit] of Object.entries(ingredients)) {
      const total = amountPerUnit * qty;
      await pool.query(
        'UPDATE inventory SET quantity = GREATEST(0, quantity - $1) WHERE name = $2',
        [total, ing]
      );
      const res = await pool.query('SELECT * FROM inventory WHERE name = $1', [ing]);
      if (res.rows.length > 0) {
        const item = res.rows[0];
        if (parseFloat(item.quantity) <= parseFloat(item.alert_threshold)) {
          alerts.push(`⚠️ ${item.name} – נשאר ${parseFloat(item.quantity).toFixed(1)} ${item.unit}`);
        }
      }
    }
  } else {
    for (const [key, unit] of Object.entries(UNITS)) {
      if (unit.label === label && unit.inventoryName) {
        await pool.query(
          'UPDATE inventory SET quantity = GREATEST(0, quantity - $1) WHERE name = $2',
          [qty, unit.inventoryName]
        );
        const res = await pool.query('SELECT * FROM inventory WHERE name = $1', [unit.inventoryName]);
        if (res.rows.length > 0) {
          const item = res.rows[0];
          if (parseFloat(item.quantity) <= parseFloat(item.alert_threshold)) {
            alerts.push(`⚠️ ${item.name} – נשאר ${parseFloat(item.quantity).toFixed(1)} ${item.unit}`);
          }
        }
        break;
      }
    }
  }
  if (alerts.length > 0) {
    const msg = '🔴 התראת מלאי – סינבון\n\n' + alerts.join('\n');
    await sendWhatsAppAlert(msg);
  }
}

app.post('/webhook', async (req, res) => {
  const body = req.body.Body || '';
  const from = req.body.From || '';
  const text = body.trim();
  const nums = text.replace(/[^\d]/g, '');
  const qty  = parseInt(nums) || 1;

  let found = null;

  // בדיקת מתכונים קודם
  for (const k in RECIPES) {
    if (text.includes(k) && !text.includes('בקבוק')) {
      found = { key: k, type: 'recipe', qty };
      break;
    }
  }

  // בדיקת יחידות
  if (!found) {
    // בקבוק שוקולד קודם (כדי לא להתבלבל עם שוקולד)
    const unitKeys = Object.keys(UNITS).sort((a,b) => b.length - a.length);
    for (const k of unitKeys) {
      if (text.includes(k)) {
        found = { key: k, type: 'unit', qty };
        break;
      }
    }
  }

  let reply = '';
  if (found) {
    const cost  = found.type === 'recipe'
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
    await deductInventory(label, found.qty);
    reply = `✅ נרשם: ${label} × ${found.qty}`;
  } else {
    reply = `❌ לא זיהיתי. נסה: "בצק 2", "קינמון 1", "קרמל 3", "קפה 2", "בקבוק שוקולד 1"`;
  }

  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Message>${reply}</Message></Response>`);
});

app.get('/api/months', async (req, res) => {
  const result = await pool.query('SELECT DISTINCT month FROM events ORDER BY month DESC');
  res.json(result.rows.map(r => r.month));
});

app.get('/api/log', async (req, res) => {
  const month = req.query.month || getMonth();
  const result = await pool.query(
    'SELECT * FROM events WHERE month=$1 ORDER BY time DESC LIMIT 100',
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
    summary[r.label] = { qty: parseFloat(r.qty), cost: parseFloat(r.cost) };
  });
  res.json(summary);
});

app.get('/api/inventory', async (req, res) => {
  const result = await pool.query('SELECT * FROM inventory ORDER BY unit, name');
  res.json(result.rows);
});

app.post('/api/inventory/update', async (req, res) => {
  const { id, quantity, alert_threshold } = req.body;
  await pool.query(
    'UPDATE inventory SET quantity=$1, alert_threshold=$2 WHERE id=$3',
    [quantity, alert_threshold, id]
  );
  res.json({ ok: true });
});

app.post('/api/inventory/add', async (req, res) => {
  const { name, unit, quantity, alert_threshold, price_per_unit } = req.body;
  await pool.query(
    'INSERT INTO inventory (name, unit, quantity, alert_threshold, price_per_unit) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name) DO UPDATE SET quantity=$3, alert_threshold=$4, price_per_unit=$5',
    [name, unit, quantity || 0, alert_threshold || 0, price_per_unit || 0]
  );
  res.json({ ok: true });
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM events WHERE id=$1', [id]);
  res.json({ ok: true });
});

app.post('/api/reset', async (req, res) => {
  const month = req.query.month || getMonth();
  await pool.query('DELETE FROM events WHERE month=$1', [month]);
  res.json({ ok: true });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
