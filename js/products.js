/* ============================================
   PRODUCTS.JS — Catalog & Filter Logic
   ============================================ */

// State
let currentCat = 'semua';
let currentSort = 'default';
let currentSearch = '';
let currentMaxPrice = 200000;
let currentPage = 1;
const ITEMS_PER_PAGE = 12;
let currentView = 'grid';

// ============================================
// INIT PRODUCTS PAGE
// ============================================
function initProductsPage() {
  // Read URL params
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('cat');
  const searchParam = params.get('search');

  if (catParam) {
    currentCat = catParam === 'promo' ? 'promo' : catParam;
  }
  if (searchParam) {
    currentSearch = searchParam;
    const searchInput = document.getElementById('productSearch');
    if (searchInput) searchInput.value = searchParam;
  }

  renderSidebarCats();
  setupFilters();
  renderProducts();
  injectModal();
}

// ============================================
// SIDEBAR CATEGORIES
// ============================================
function renderSidebarCats() {
  const container = document.getElementById('sidebarCats');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <div class="cat-item ${currentCat === cat.id ? 'active' : ''}" 
         id="cat-${cat.id}"
         onclick="selectCategory('${cat.id}')">
      <div class="cat-item-left">
        <span>${cat.emoji}</span>
        <span>${cat.name}</span>
      </div>
      <span class="cat-badge">${cat.count}</span>
    </div>
  `).join('');
}

function selectCategory(catId) {
  currentCat = catId;
  currentPage = 1;

  // Update sidebar
  document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
  const active = document.getElementById(`cat-${catId}`);
  if (active) active.classList.add('active');

  // Update URL without reload
  const url = new URL(window.location);
  if (catId === 'semua') {
    url.searchParams.delete('cat');
  } else {
    url.searchParams.set('cat', catId);
  }
  window.history.replaceState({}, '', url);

  renderProducts();
}

function clearCategoryFilter() {
  selectCategory('semua');
}

// ============================================
// FILTERS SETUP
// ============================================
function setupFilters() {
  // Search
  const searchInput = document.getElementById('productSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      renderProducts();
    }, 300));
  }

  // Price Slider
  const priceSlider = document.getElementById('priceSlider');
  const priceMax = document.getElementById('priceMax');
  if (priceSlider) {
    priceSlider.addEventListener('input', () => {
      currentMaxPrice = parseInt(priceSlider.value);
      priceMax.textContent = formatPrice(currentMaxPrice);
      currentPage = 1;
      renderProducts();
    });
  }

  // Sort
  document.querySelectorAll('input[name="sort"]').forEach(radio => {
    radio.addEventListener('change', () => {
      currentSort = radio.value;
      currentPage = 1;
      renderProducts();
    });
  });
}

// ============================================
// RENDER PRODUCTS
// ============================================
function getFilteredProducts() {
  let products = [...PRODUCTS];

  // Category filter
  if (currentCat === 'promo') {
    products = products.filter(p => p.originalPrice && p.originalPrice > p.price);
  } else if (currentCat !== 'semua') {
    products = products.filter(p => p.cat === currentCat);
  }

  // Search filter
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q) ||
      (p.desc && p.desc.toLowerCase().includes(q))
    );
  }

  // Price filter
  products = products.filter(p => p.price <= currentMaxPrice);

  // Sort
  switch (currentSort) {
    case 'price-asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
      products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    default:
      products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  return products;
}

function renderProducts() {
  const container = document.getElementById('productsContainer');
  const countEl = document.getElementById('resultsCount');
  const pagination = document.getElementById('pagination');
  const filterTag = document.getElementById('activeFilterTag');
  const filterText = document.getElementById('activeFilterText');

  if (!container) return;

  const filtered = getFilteredProducts();
  const total = filtered.length;

  // Update count
  if (countEl) {
    countEl.innerHTML = `Menampilkan <strong>${total}</strong> produk`;
  }

  // Update filter tag
  if (filterTag && filterText) {
    if (currentCat !== 'semua') {
      const cat = CATEGORIES.find(c => c.id === currentCat);
      filterText.textContent = cat ? `${cat.emoji} ${cat.name}` : currentCat;
      filterTag.style.display = 'flex';
    } else {
      filterTag.style.display = 'none';
    }
  }

  // Pagination
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  // Render products
  if (paginated.length === 0) {
    container.className = 'products-grid';
    container.innerHTML = `
      <div class="no-results" style="grid-column:1/-1;">
        <div class="no-results-emoji">🔍</div>
        <h3>Produk tidak ditemukan</h3>
        <p>Coba ubah kata kunci atau filter pencarian Anda</p>
        <button onclick="clearCategoryFilter(); document.getElementById('productSearch').value=''; currentSearch=''; renderProducts();" class="btn-primary" style="margin-top:1rem; border:none; cursor:pointer;">
          Reset Filter
        </button>
      </div>
    `;
  } else {
    container.className = currentView === 'list' ? 'products-grid list-view' : 'products-grid';
    container.innerHTML = paginated.map(p => renderProductCard(p)).join('');
  }

  // Render pagination
  if (pagination && totalPages > 1) {
    let pages = '';
    
    pages += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages += `<span style="color:var(--text-light); padding:0 4px;">…</span>`;
      }
    }
    
    pages += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    
    pagination.innerHTML = pages;
  } else if (pagination) {
    pagination.innerHTML = '';
  }
}

function goToPage(page) {
  const filtered = getFilteredProducts();
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderProducts();
  window.scrollTo({ top: 200, behavior: 'smooth' });
}

// ============================================
// VIEW TOGGLE (Grid / List)
// ============================================
function setView(view) {
  currentView = view;
  
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const container = document.getElementById('productsContainer');
  
  if (view === 'grid') {
    gridBtn?.classList.add('active');
    listBtn?.classList.remove('active');
    if (container) container.className = 'products-grid';
  } else {
    listBtn?.classList.add('active');
    gridBtn?.classList.remove('active');
    if (container) container.className = 'products-grid list-view';
  }
}

// ============================================
// UTILS
// ============================================
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('products')) {
    if (window.appReady && window.appReady.then) {
      window.appReady.then(initProductsPage).catch(initProductsPage);
    } else {
      initProductsPage();
    }
  }
});
