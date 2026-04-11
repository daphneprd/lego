import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'client/v2')));

const DEALS_FILE  = path.join(__dirname, 'deals.json');
const VINTED_FILE = path.join(__dirname, 'vinted-sales.json');

let dealsCache  = [];
let vintedCache = {};

const loadDealsCache = async () => {
  if (!existsSync(DEALS_FILE)) {
    console.warn(`deals.json introuvable.`);
    dealsCache = [];
    return;
  }
  const raw = await readFile(DEALS_FILE, 'utf-8');
  dealsCache = JSON.parse(raw).result ?? [];
  console.log(`deals.json chargé (${dealsCache.length} deals)`);
};

const loadVintedCache = async () => {
  if (!existsSync(VINTED_FILE)) {
    console.warn(`vinted-sales.json introuvable. Lance d'abord : node vinted_scrap.js`);
    vintedCache = {};
    return;
  }
  const raw = await readFile(VINTED_FILE, 'utf-8');
  vintedCache = JSON.parse(raw);
  console.log(`vinted-sales.json chargé (${Object.keys(vintedCache).length} sets)`);
};

await loadDealsCache();
await loadVintedCache();


//GET /deals?page=1&size=6 — lit deals.json, pas de scraping live 
app.get('/deals', (req, res) => {
  const page = parseInt(req.query.page ?? '1');
  const size = parseInt(req.query.size ?? '6');

  const start  = (page - 1) * size;
  const result = dealsCache.slice(start, start + size);

  res.json({
    success: true,
    data: {
      result,
      meta: {
        count:       dealsCache.length,
        pageCount:   Math.ceil(dealsCache.length / size),
        currentPage: page,
      }
    }
  });
});

// GET /api/vinted?id=21333 — lit vinted-sales.json
app.get('/api/vinted', (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ success: false, error: 'Paramètre id manquant' });

  const sales = vintedCache[id] ?? [];
  console.log(` Set ${id} → ${sales.length} vente(s) servie(s) depuis le cache`);

  res.json({ data: sales });
});

// GET /api/reload — recharge les deux fichiers sans redémarrer 
app.get('/api/reload', async (req, res) => {
  await loadDealsCache();
  await loadVintedCache();
  res.json({ success: true, message: `Rechargé : ${dealsCache.length} deals, ${Object.keys(vintedCache).length} sets Vinted` });
});
app.listen(3000, () => console.log('Serveur démarré sur http://localhost:3000'));