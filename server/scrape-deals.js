// Scrape deals et les mets dans deals.json

import { scrape } from './websites/deallabs.js';
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'deals.json');

const main = async () => {
  const pages = parseInt(process.argv[2] ?? '1');
  const allDeals = [];

  for (let page = 1; page <= pages; page++) {
    console.log(` Scraping page ${page}...`);
    const deals = await scrape(page);

    if (!deals || deals.length === 0) {
      console.log(`  Aucun deal trouvé page ${page}, arrêt.`);
      break;
    }

    allDeals.push(...deals);
    console.log(`   ${deals.length} deals récupérés (total : ${allDeals.length})`);
  }

  const output = {
    result: allDeals,
    meta: { count: allDeals.length }
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\ndeals.json sauvegardé (${allDeals.length} deals)`);
  console.log(`   Prix remplis : ${allDeals.filter(d => d.price).length}`);
  console.log(`   Photos remplies : ${allDeals.filter(d => d.photo).length}`);
};

main().catch(err => { console.error('Erreur fatale :', err); process.exit(1); });