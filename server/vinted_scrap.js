//Scrape Vinted et genere vinted-sales.json

import { scrape as scrapeVinted } from './websites/vinted.js';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEALS_FILE  = path.join(__dirname, 'deals.json');
const OUTPUT_FILE = path.join(__dirname, 'vinted-sales.json');

const DELAY_MS = 1500;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const getIdsFromDealsFile = async () => {
  const raw = await readFile(DEALS_FILE, 'utf-8');
  const { result } = JSON.parse(raw);
  return [...new Set(result.map(d => d.id).filter(id => id != null && id !== ''))];
};

const loadExistingData = async () => {
  if (existsSync(OUTPUT_FILE)) {
    try { return JSON.parse(await readFile(OUTPUT_FILE, 'utf-8')); }
    catch { return {}; }
  }
  return {};
};

const main = async () => {
  const forceRescrape = process.argv.includes('--force');

  const ids = await getIdsFromDealsFile();
  console.log(`\n${ids.length} set(s) trouvé(s) dans deals.json : ${ids.join(', ')}\n`);

  if (ids.length === 0) {
    console.error(' Aucun ID trouvé dans deals.json.');
    process.exit(1);
  }

  const result = await loadExistingData();
  let scraped = 0, skipped = 0;

  for (const id of ids) {
    if (!forceRescrape && result[id] !== undefined) {
      console.log(`  Set ${id} déjà présent (${result[id].length} ventes), ignoré.`);
      skipped++;
      continue;
    }

    console.log(` Scraping set ${id}...`);
    try {
      const sales = await scrapeVinted(`lego ${id}`);
      result[id] = sales ?? [];
      console.log(`    ${result[id].length} vente(s) trouvée(s)`);
    } catch (err) {
      console.error(`Erreur pour le set ${id} :`, err.message);
      result[id] = [];
    }
    scraped++;
    await sleep(DELAY_MS);
  }

  await writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\nSauvegardé : ${OUTPUT_FILE}`);
  console.log(`   ${scraped} scrapé(s), ${skipped} ignoré(s), ${Object.keys(result).length} au total.\n`);
};

main().catch(err => { console.error('Erreur fatale :', err); process.exit(1); });