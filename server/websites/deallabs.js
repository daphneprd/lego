import * as cheerio from 'cheerio';
import { v5 as uuidv5 } from 'uuid';

const parse = html => {
  try {
    const $ = cheerio.load(html);
    const deals = [];

    $('article').each((_, el) => {
      const raw = $(el).find('[data-vue3]').first().attr('data-vue3');
      if (!raw) return;

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      const t = data?.props?.thread;
      if (!t) return;

      const title = t.title || '';
      const slug = t.titleSlug || '';
      const link = `https://www.dealabs.com/bons-plans/${slug}-${t.threadId}`;
      const price = t.nextBestPrice != null ? parseFloat(t.nextBestPrice)
                  : t.price != null        ? parseFloat(t.price)
                  : null;
      const discount = t.nextBestPrice && t.price ? Math.round((t.nextBestPrice - t.price) / t.nextBestPrice * 100) : 0;
      const temperature = t.temperature ?? 0;
      const comments = t.commentCount ?? 0;
      const published = t.publishedAt
        ? new Date(t.publishedAt).getTime() / 1000
        : Date.now() / 1000;
      const photo = t.mainImage?.path && t.mainImage?.name
        ? `https://static-pepper.dealabs.com/${t.mainImage.path}/${t.mainImage.name}.jpg`
        : null;
      const idMatch = title.match(/\b(\d{4,6})\b/);

      deals.push({
        uuid: uuidv5(link, uuidv5.URL),
        id: idMatch ? idMatch[1] : null,
        title,
        price,
        discount,
        temperature,
        comments,
        published,
        link,
        photo,
      });
    });

    return deals;
  } catch (error) {
    console.error('Parse error:', error);
    return [];
  }
};

const scrape = async (page = 1) => {
  try {
    const url = page === 1
      ? 'https://www.dealabs.com/groupe/lego'
      : `https://www.dealabs.com/groupe/lego?page=${page}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (response.ok) {
      const html = await response.text();
      return parse(html);
    }

    console.error(response.status, response.statusText);
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { scrape };