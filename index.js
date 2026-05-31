const express = require('express');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

let log = [];

app.post('/webhook', (req, res) => {
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
    log.push({ from, text, label, qty: found.qty, cost, time: new Date().toISOString() });
    reply = `✅ נרשם: ${label} × ${found.qty} = ${Math.round(cost)} ₪`;
  } else {
    reply = `❌ לא זיהיתי. נסה: "בצק 2", "קינמון 1", "קרמל 3", "קפה 2"`;
  }

  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Message>${reply}</Message></Response>`);
});

app.get('/log', (req, res) => res.json(log));
app.post('/reset', (req, res) => { log = []; res.json({ ok: true }); });

app.get('/summary', (req, res) => {
  const summary = {};
  log.forEach(e => {
    if (!summary[e.label]) summary[e.label] = { qty: 0, cost: 0 };
    summary[e.label].qty += e.qty;
    summary[e.label].cost += e.cost;
  });
  res.json(summary);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
