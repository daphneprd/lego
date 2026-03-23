// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};
let favorites = JSON.parse(localStorage.getItem('legoFavorites')) || [];

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Save favorites to localStorage
 */
const saveFavorites = () => {
  localStorage.setItem('legoFavorites', JSON.stringify(favorites));
};

/**
 * Toggle favorite status for a deal
 * @param {String} uuid - deal uuid
 */
const toggleFavorite = (uuid) => {
  const index = favorites.indexOf(uuid);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(uuid);
  }
  saveFavorites();
  render(currentDeals, currentPagination);
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  div.className = 'deals-grid';
  const template = deals
    .map(deal => {
      const isFavorite = favorites.includes(deal.uuid);
      const heartIcon = isFavorite ? '❤' : '♡';
      const discountBadge = deal.discount >= 25 ? `<div class="discount-badge">${deal.discount}% OFF</div>` : '';
      const hotBadge = deal.temperature >= 100 ? `<div class="hot-badge">HOT</div>` : '';
      const imageHtml = deal.photo ? `<img class="deal-image" src="${deal.photo}" alt="${deal.title}">` : `<div class="deal-image placeholder">🧱</div>`;
      return `
      <div class="deal-card" id="${deal.uuid}">
        <div class="deal-image-container">
          ${discountBadge}
          ${hotBadge}
          ${imageHtml}
          <button class="favorite-btn" onclick="toggleFavorite('${deal.uuid}')">${heartIcon}</button>
        </div>
        <div class="deal-info">
          <div class="deal-title">${deal.title}</div>
          <div class="deal-price">€${deal.price}</div>
          <div class="deal-lego-id">${deal.id}</div>
        </div>
        <div class="deal-buttons">
          <button class="view-sales-btn" onclick="window.open('${deal.link}', '_blank')">View Deal</button>
        </div>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  let filteredDeals = deals;

  if (checkboxBestDiscount.checked) {
    filteredDeals = filteredDeals.filter(deal => deal.discount >= 25);
  }
  if (checkboxBestComments.checked) {
    filteredDeals = filteredDeals.filter(deal => deal.comments >= 15);
  }
  if (checkboxHotDeals.checked) {
    filteredDeals = filteredDeals.filter(deal => deal.temperature >= 100);
  }
  if (checkboxFavoritesOnly.checked) {
    filteredDeals = filteredDeals.filter(deal => favorites.includes(deal.uuid));
  }
  const sortedDeals = sortDeals(filteredDeals, selectSort.value);

  renderDeals(sortedDeals);
  //renderDeals(filteredDeals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(sortedDeals);
};
/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
// Select the page to display
selectPage.addEventListener('change', async (event) => {
  const page = parseInt(event.target.value);
  const size = currentPagination.size;

  const deals = await fetchDeals(page, size);

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

// Select  discount above 25%
const checkboxBestDiscount = document.querySelector('#best-discount');
checkboxBestDiscount.addEventListener('change', () => {
  render(currentDeals, currentPagination);
});

// Filter only nb of comments above 15
const checkboxBestComments = document.querySelector('#most-commented');
checkboxBestComments.addEventListener('change', () => {
  render(currentDeals, currentPagination);
});
// Filter only hot deal
const checkboxHotDeals = document.querySelector('#hot-deals');
checkboxHotDeals.addEventListener('change', () => {
  render(currentDeals, currentPagination);
});

// Filter only favorites
const checkboxFavoritesOnly = document.querySelector('#favorites-only');
checkboxFavoritesOnly.addEventListener('change', () => {
  render(currentDeals, currentPagination);
});


// sort by price 
const selectSort = document.querySelector('#sort-select');
const sortDeals = (deals, sortType) => {

  const sortedDeals = [...deals]; // copy array

  if (sortType === "price-asc") {
    sortedDeals.sort((a, b) => a.price - b.price);
  }

  if (sortType === "price-desc") {
    sortedDeals.sort((a, b) => b.price - a.price);
  }
  if (sortType === "date-asc") {
    sortedDeals.sort((a, b) => a.published - b.published);
  }
  if (sortType === "date-desc") {
    sortedDeals.sort((a, b) => b.published - a.published);
  }

  return sortedDeals;
};
selectSort.addEventListener('change', () => {
  render(currentDeals, currentPagination);
});

// display nb of vinted sales
const spanNbSales = document.querySelector('#nbSales');
const spanP5Price = document.querySelector('#p5Price');
const spanP25Price = document.querySelector('#p25Price');
const spanP50Price = document.querySelector('#p50Price');
const spanAvgPrice = document.querySelector('#avgPrice');
const spanLifetimeValue = document.querySelector('#lifetimeValue');
const sectionSales = document.querySelector('#sales');

/**
 * Render Vinted sales table
 * @param {Array} sales - sales data
 */
const renderSalesTable = (sales) => {
  console.log('renderSalesTable called with:', sales);

  if (!sales || sales.length === 0) {
    sectionSales.innerHTML = '<h2>Vinted Sales</h2><p>No sales found</p>';
    return;
  }

  try {
    const rowsTemplate = sales
      .map(sale => {
        const dateStr = sale.published ? new Date(sale.published).toLocaleDateString() : 'N/A';
        const price = sale.price || 'N/A';
        const currency = sale.currency || 'EUR';
        const link = sale.link || '#';

        return `
        <tr>
          <td>${dateStr}</td>
          <td>${price}</td>
          <td>${currency}</td>
          <td><a href="${link}" target="_blank">View</a></td>
        </tr>
      `;
      })
      .join('');

    const template = `
      <h2>Vinted Sales</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Price</th>
            <th>Currency</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          ${rowsTemplate}
        </tbody>
      </table>
    `;

    sectionSales.innerHTML = template;
    console.log('Sales table rendered successfully');
  } catch (error) {
    console.error('Error rendering sales table:', error);
    sectionSales.innerHTML = '<h2>Vinted Sales</h2><p>Error displaying sales</p>';
  }
};

/**
 * Calculate percentile from array of values
 * @param {Array} values - sorted array of numbers
 * @param {Number} p - percentile (0-100)
 * @returns {Number} percentile value
 */
const calculatePercentile = (values, p) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

/**
 * Calculate average price
 * @param {Array} sales - sales data
 * @returns {Number} average price
 */
const calculateAverage = (sales) => {
  if (sales.length === 0) return 0;
  const sum = sales.reduce((acc, sale) => acc + sale.price, 0);
  return (sum / sales.length).toFixed(2);
};

/**
 * Calculate lifetime value in days
 * @param {Array} sales - sales data
 * @returns {String} lifetime value formatted as "X days"
 */
const calculateLifetimeValue = (sales) => {
  if (sales.length < 2) return '-';

  const dates = sales.map(sale => new Date(sale.published));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const diffTime = Math.abs(maxDate - minDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
};

const fetchSales = async (id) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/sales?id=${id}`
    );

    const body = await response.json();
    console.log('Sales API Response:', body);
    console.log('body.data type:', typeof body.data);
    console.log('body.data:', body.data);

    if (body.success !== true) {
      console.error('API Error:', body);
      return [];
    }

    // Handle if body.data is an object (convert to array)
    let salesData = body.data;
    if (typeof salesData === 'object' && !Array.isArray(salesData)) {
      // If it's an object, try to get values as array
      salesData = Object.values(salesData);
      console.log('Converted object to array:', salesData);
    }

    console.log('Final Sales data:', salesData);
    return Array.isArray(salesData) ? salesData : [];
  } catch (error) {
    console.error('Fetch Error:', error);
    return [];
  }
};
const renderSales = sales => {
  // Ensure sales is an array
  if (!Array.isArray(sales)) {
    sales = [];
  }

  spanNbSales.innerHTML = sales.length;

  if (sales.length === 0) {
    spanP5Price.innerHTML = '0';
    spanP25Price.innerHTML = '0';
    spanP50Price.innerHTML = '0';
    spanAvgPrice.innerHTML = '0';
    spanLifetimeValue.innerHTML = '-';
    renderSalesTable([]);
    return;
  }

  const prices = sales.map(sale => sale.price);
  const p5 = calculatePercentile(prices, 5).toFixed(2);
  const p25 = calculatePercentile(prices, 25).toFixed(2);
  const p50 = calculatePercentile(prices, 50).toFixed(2);
  const avg = calculateAverage(sales);
  const lifetime = calculateLifetimeValue(sales);

  spanP5Price.innerHTML = p5;
  spanP25Price.innerHTML = p25;
  spanP50Price.innerHTML = p50;
  spanAvgPrice.innerHTML = avg;
  spanLifetimeValue.innerHTML = lifetime;

  renderSalesTable(sales);
};
//const selectLegoSetIds = document.querySelector('#lego-set-id-select');
selectLegoSetIds.addEventListener('change', async (event) => {

  const legoId = event.target.value;

  const sales = await fetchSales(legoId);

  renderSales(sales);

});