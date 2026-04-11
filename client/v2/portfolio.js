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
      //`https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
      `http://localhost:3000/deals?page=${page}&size=${size}`
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
  const ids = [...new Set(getIdsFromDeals(deals).filter(id => id != null && id !== ''))];
  ids.sort((a, b) => String(a).localeCompare(String(b), undefined, {numeric: true}));

  const options = ['<option value="">Choisir un set</option>',
    ...ids.map(id => `<option value="${id}">${id}</option>`) 
  ].join('');

  selectLegoSetIds.innerHTML = options;
};

const loadSalesForSelectedSet = async () => {
  const legoId = selectLegoSetIds.value;  console.log('Loading sales for:', legoId);
  if (!legoId) {
    sectionSales.innerHTML = '<h2>Vinted Sales</h2><p>Choisissez un set pour afficher les ventes.</p>';
    spanNbSales.innerHTML = '0';
    spanP5Price.innerHTML = '0';
    spanP25Price.innerHTML = '0';
    spanP50Price.innerHTML = '0';
    spanAvgPrice.innerHTML = '0';
    spanLifetimeValue.innerHTML = '-';
    return;
  }

  const sales = await fetchSales(legoId);
  renderSales(sales);
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

  const firstRealOption = selectLegoSetIds.options[1];
  if (firstRealOption) {
    selectLegoSetIds.value = firstRealOption.value; // forcer la valeur
    await loadSalesForSelectedSet();
  }  /*
  // Automatically load sales for the first selected set (or placeholder)
  if (selectLegoSetIds.options.length > 1) {
    selectLegoSetIds.selectedIndex = 1; // first real set
    await loadSalesForSelectedSet();
  } else {
    await loadSalesForSelectedSet();
  }*/
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
 * Render Vinted sales table with pagination (20 rows initially, show more button)
 * @param {Array} sales - sales data
 */
const renderSalesTable = (sales) => {
  console.log('renderSalesTable called with:', sales);
  console.log('Raw sales data:', JSON.stringify(sales, null, 2));

  if (!sales || sales.length === 0) {
    sectionSales.innerHTML = '<h2>Vinted Sales</h2><p>No sales found</p>';
    return;
  }

  try {
    const ROWS_PER_PAGE = 20;
    const totalRows = sales.length;
    const showMore = totalRows > ROWS_PER_PAGE;
    
    // Build all rows but mark first 20 as visible
    const allRowsTemplate = sales
      .map((sale, index) => {
        const dateStr = sale.published ? new Date(sale.published).toLocaleDateString() : 'N/A';
        const price = sale.price || 'N/A';
        const currency = sale.currency || 'EUR';
        const link = sale.link || '#';
        const title = sale.title || 'N/A';
        const isHidden = index >= ROWS_PER_PAGE ? ' style="display: none;" class="hidden-row"' : '';

        return `
        <tr${isHidden}>
          <td>${title}</td>
          <td>${dateStr}</td>
          <td>${price} ${currency}</td>
          <td><a href="${link}" target="_blank" style="color: #007bff; text-decoration: none;">View on Vinted</a></td>
        </tr>
      `;
      })
      .join('');

    const showMoreBtn = showMore ? `
      <button id="show-more-sales-btn" style="
        margin-top: 15px;
        padding: 10px 20px;
        background-color: #9B8EC7;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      ">Show More (${totalRows - ROWS_PER_PAGE} more)</button>
    ` : '';

    const template = `
      <h2>Vinted Sales (${sales.length} items)</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Title</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Link</th>
          </tr>
        </thead>
        <tbody>
          ${allRowsTemplate}
        </tbody>
      </table>
      ${showMoreBtn}
    `;

    sectionSales.innerHTML = template;
    
    // Add click handler for show more button
    if (showMore) {
      const btn = document.getElementById('show-more-sales-btn');
      btn.addEventListener('click', () => {
        const hiddenRows = sectionSales.querySelectorAll('.hidden-row');
        hiddenRows.forEach(row => row.style.display = '');
        btn.style.display = 'none';
      });
    }
    
    console.log('Sales table rendered successfully with', sales.length, 'items');
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
/*
const calculateAverage = (sales) => {
  if (sales.length === 0) return 0;
  const sum = sales.reduce((acc, sale) => acc + sale.price, 0);
  return (sum / sales.length).toFixed(2);
};*/
const calculateAverage = (sales) => {
  const validSales = sales.filter(s => s.price != null && !isNaN(s.price));
  if (validSales.length === 0) return 0;
  const sum = validSales.reduce((acc, sale) => acc + parseFloat(sale.price), 0);
  return (sum / validSales.length).toFixed(2);
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
      `http://localhost:3000/api/vinted?id=${id}`
    );

    const body = await response.json();
    console.log('Sales API Response:', body);

    // Handle direct array response (from server returning sales directly)
    if (Array.isArray(body)) {
      console.log('Direct array response - using as-is');
      return body;
    }

    // Handle wrapped response {data: [...]}
    if (body.data && Array.isArray(body.data)) {
      console.log('Wrapped response with data field - extracting data array');
      return body.data;
    }

    // Handle wrapped response {success: true, data: [...]}
    if (body.success === true && Array.isArray(body.data)) {
      console.log('Wrapped response with success - extracting data');
      return body.data;
    }

    // Handle if body.data is an object (convert to array)
    if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
      const salesData = Object.values(body.data);
      console.log('Converted object to array:', salesData);
      return salesData;
    }

    console.error('Unexpected API response format:', body);
    return [];
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

  console.log('renderSales called with:', sales);
  console.log('First sale:', sales[0]);
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

  //const prices = sales.map(sale => sale.price);
  const prices = sales
  .map(sale => parseFloat(sale.price))
  .filter(p => !isNaN(p)); //  ignore les undefined/null
  console.log('Extracted prices:', prices);
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
// Select change event uses shared loader to avoid duplicate logic
selectLegoSetIds.addEventListener('change', async () => {
  await loadSalesForSelectedSet();
});