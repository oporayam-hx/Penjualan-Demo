/* ============================================
   MAIN.JS — SembakoMart
   Handles: Navbar, Cart State, Data, Utilities
   ============================================ */

// ============================================
// PRODUCT DATABASE
// ============================================
const BASE_PRODUCTS = [
  // Beras & Sereal
  { id: 1, name: 'Beras Premium Pulen', cat: 'beras', emoji: '🌾', image: 'img/beras_premium.png', weight: '5 kg', price: 78000, originalPrice: 85000, badge: 'best', rating: 4.9, reviews: 312, desc: 'Beras pilihan kualitas premium, pulen dan wangi. Cocok untuk nasi sehari-hari keluarga.', stock: 100, featured: true, isNew: false },
  { id: 2, name: 'Beras Merah Organik', cat: 'beras', emoji: '🌾', weight: '2 kg', price: 45000, originalPrice: 52000, badge: 'new', rating: 4.7, reviews: 89, desc: 'Beras merah organik tanpa pestisida. Kaya serat dan nutrisi untuk diet sehat.', stock: 50, featured: false, isNew: true },
  { id: 3, name: 'Oatmeal Instan', cat: 'beras', emoji: '🥣', weight: '1 kg', price: 38000, originalPrice: null, badge: null, rating: 4.5, reviews: 156, desc: 'Oatmeal instan bergizi tinggi. Sarapan sehat yang praktis dan mengenyangkan.', stock: 75, featured: false, isNew: false },
  { id: 4, name: 'Beras Basmati', cat: 'beras', emoji: '🌾', weight: '1 kg', price: 35000, originalPrice: 40000, badge: 'promo', rating: 4.6, reviews: 67, desc: 'Beras basmati impor berkualitas tinggi. Aroma harum dan butiran panjang sempurna.', stock: 40, featured: false, isNew: false },
  
  // Minyak & Lemak
  { id: 5, name: 'Minyak Goreng Premium', cat: 'minyak', emoji: '🫙', image: 'img/minyak_goreng.png', weight: '2 liter', price: 32000, originalPrice: 38000, badge: 'promo', rating: 4.8, reviews: 445, desc: 'Minyak goreng premium bebas kolesterol. Jernih, tidak bau, tahan panas tinggi.', stock: 200, featured: true, isNew: false },
  { id: 6, name: 'Minyak Zaitun Extra Virgin', cat: 'minyak', emoji: '🫒', weight: '500 ml', price: 95000, originalPrice: 110000, badge: 'best', rating: 4.9, reviews: 233, desc: 'Minyak zaitun extra virgin cold-pressed. Ideal untuk salad dan memasak sehat.', stock: 60, featured: true, isNew: false },
  { id: 7, name: 'Margarin Blue Band', cat: 'minyak', emoji: '🧈', weight: '200 gr', price: 15000, originalPrice: null, badge: null, rating: 4.6, reviews: 178, desc: 'Margarin berkualitas tinggi untuk memasak, memanggang roti dan kue.', stock: 150, featured: false, isNew: false },
  { id: 8, name: 'Minyak Kelapa Murni', cat: 'minyak', emoji: '🥥', weight: '500 ml', price: 42000, originalPrice: 48000, badge: 'new', rating: 4.7, reviews: 92, desc: 'Minyak kelapa murni (VCO) cold-pressed. Multifungsi untuk masak dan perawatan.', stock: 45, featured: false, isNew: true },

  // Gula & Pemanis
  { id: 9, name: 'Gula Pasir Putih', cat: 'gula', emoji: '🍚', image: 'img/gula_pasir.png', weight: '1 kg', price: 16000, originalPrice: null, badge: null, rating: 4.7, reviews: 521, desc: 'Gula pasir putih halus berkualitas SNI. Untuk memasak dan minuman sehari-hari.', stock: 300, featured: true, isNew: false },
  { id: 10, name: 'Gula Merah Jawa', cat: 'gula', emoji: '🟫', weight: '500 gr', price: 18000, originalPrice: 22000, badge: 'promo', rating: 4.8, reviews: 187, desc: 'Gula merah jawa asli dari pengrajin lokal. Manis alami untuk masakan tradisional.', stock: 80, featured: false, isNew: false },
  { id: 11, name: 'Madu Hutan Murni', cat: 'gula', emoji: '🍯', weight: '350 ml', price: 85000, originalPrice: 95000, badge: 'best', rating: 4.9, reviews: 304, desc: 'Madu hutan murni tanpa campuran, kaya antioksidan dan enzim alami.', stock: 55, featured: true, isNew: false },
  { id: 12, name: 'Gula Kelapa Organik', cat: 'gula', emoji: '🌴', weight: '250 gr', price: 22000, originalPrice: null, badge: 'new', rating: 4.5, reviews: 44, desc: 'Gula kelapa organik rendah GI. Alternatif sehat pengganti gula pasir.', stock: 35, featured: false, isNew: true },

  // Bumbu Dapur
  { id: 13, name: 'Garam Laut Premium', cat: 'bumbu', emoji: '🧂', weight: '500 gr', price: 8500, originalPrice: null, badge: null, rating: 4.6, reviews: 389, desc: 'Garam laut alami beryodium. Rasa gurih sempurna untuk setiap masakan.', stock: 400, featured: false, isNew: false },
  { id: 14, name: 'Merica Bubuk Hitam', cat: 'bumbu', emoji: '🌶️', weight: '100 gr', price: 22000, originalPrice: 26000, badge: 'promo', rating: 4.7, reviews: 212, desc: 'Merica hitam bubuk pilihan dengan aroma kuat dan rasa pedas yang khas.', stock: 120, featured: false, isNew: false },
  { id: 15, name: 'Kecap Manis Premium', cat: 'bumbu', emoji: '🍶', weight: '600 ml', price: 24000, originalPrice: null, badge: 'best', rating: 4.9, reviews: 567, desc: 'Kecap manis premium dengan cita rasa autentik khas Indonesia.', stock: 180, featured: true, isNew: false },
  { id: 16, name: 'Bawang Putih Bubuk', cat: 'bumbu', emoji: '🧄', weight: '100 gr', price: 18000, originalPrice: 22000, badge: null, rating: 4.5, reviews: 99, desc: 'Bawang putih bubuk halus untuk bumbu praktis masakan sehari-hari.', stock: 90, featured: false, isNew: false },
  { id: 17, name: 'Kunyit Bubuk Asli', cat: 'bumbu', emoji: '🌿', weight: '100 gr', price: 15000, originalPrice: null, badge: 'new', rating: 4.6, reviews: 78, desc: 'Kunyit bubuk organik kaya kurkumin. Untuk masakan dan manfaat kesehatan.', stock: 65, featured: false, isNew: true },

  // Tepung
  { id: 18, name: 'Tepung Terigu Protein Tinggi', cat: 'tepung', emoji: '🌾', weight: '1 kg', price: 14000, originalPrice: null, badge: null, rating: 4.7, reviews: 234, desc: 'Tepung terigu protein tinggi untuk roti dan pastri dengan tekstur sempurna.', stock: 200, featured: false, isNew: false },
  { id: 19, name: 'Tepung Maizena', cat: 'tepung', emoji: '🌽', weight: '500 gr', price: 12000, originalPrice: 14000, badge: 'promo', rating: 4.6, reviews: 156, desc: 'Tepung maizena halus untuk pengental saus, sup, dan kue.', stock: 150, featured: false, isNew: false },
  { id: 20, name: 'Tepung Beras', cat: 'tepung', emoji: '🍚', weight: '500 gr', price: 10000, originalPrice: null, badge: null, rating: 4.5, reviews: 88, desc: 'Tepung beras halus untuk kue tradisional dan masakan Indonesia.', stock: 120, featured: false, isNew: false },

  // Minuman
  { id: 21, name: 'Air Mineral 6x1.5L', cat: 'minuman', emoji: '💧', weight: '6x1500 ml', price: 28000, originalPrice: 32000, badge: 'promo', rating: 4.8, reviews: 892, desc: 'Air mineral segar kemasan 1.5 liter isi 6. Murni dari sumber pegunungan.', stock: 500, featured: true, isNew: false },
  { id: 22, name: 'Teh Hitam Premium', cat: 'minuman', emoji: '🍵', weight: '200 gr', price: 32000, originalPrice: 38000, badge: 'best', rating: 4.8, reviews: 334, desc: 'Teh hitam pilihan dengan cita rasa kuat dan aroma harum. Untuk teh tubruk terbaik.', stock: 80, featured: false, isNew: false },
  { id: 23, name: 'Kopi Arabika Gayo', cat: 'minuman', emoji: '☕', image: 'img/kopi_gayo.png', weight: '250 gr', price: 75000, originalPrice: 85000, badge: 'best', rating: 4.9, reviews: 445, desc: 'Kopi arabika single origin Gayo Aceh. Cita rasa fruity, asam ringan, dan kompleks.', stock: 40, featured: true, isNew: false },
  { id: 24, name: 'Susu UHT Full Cream', cat: 'minuman', emoji: '🥛', weight: '1 liter', price: 18000, originalPrice: null, badge: null, rating: 4.7, reviews: 267, desc: 'Susu UHT full cream kaya kalsium dan protein untuk kebutuhan nutrisi keluarga.', stock: 200, featured: false, isNew: false },

  // Makanan Kaleng
  { id: 25, name: 'Ikan Sarden Tomat', cat: 'kaleng', emoji: '🐟', weight: '425 gr', price: 19000, originalPrice: 22000, badge: 'promo', rating: 4.5, reviews: 178, desc: 'Ikan sarden dalam saus tomat lezat. Praktis dan bergizi tinggi untuk lauk sehari-hari.', stock: 150, featured: false, isNew: false },
  { id: 26, name: 'Kornet Daging Sapi', cat: 'kaleng', emoji: '🥩', weight: '340 gr', price: 38000, originalPrice: 44000, badge: null, rating: 4.6, reviews: 123, desc: 'Kornet daging sapi berkualitas tinggi. Lembut, gurih, dan praktis disajikan.', stock: 90, featured: false, isNew: false },
  { id: 27, name: 'Kacang Merah Kaleng', cat: 'kaleng', emoji: '🫘', weight: '400 gr', price: 14000, originalPrice: null, badge: 'new', rating: 4.4, reviews: 56, desc: 'Kacang merah dalam air garam, siap saji. Kaya protein nabati dan serat.', stock: 110, featured: false, isNew: true },

  // Kebersihan
  { id: 28, name: 'Sabun Cuci Piring Cair', cat: 'kebersihan', emoji: '🧴', weight: '800 ml', price: 22000, originalPrice: 26000, badge: 'promo', rating: 4.7, reviews: 445, desc: 'Sabun cuci piring cair dengan formula antibakteri. Bersih maksimal, lembut di tangan.', stock: 200, featured: false, isNew: false },
  { id: 29, name: 'Deterjen Bubuk', cat: 'kebersihan', emoji: '🧺', weight: '1 kg', price: 18000, originalPrice: null, badge: null, rating: 4.6, reviews: 312, desc: 'Deterjen bubuk formula konsentrat. Pakaian bersih bersih optimal dan wangi tahan lama.', stock: 180, featured: false, isNew: false },
  { id: 30, name: 'Sabun Mandi Batang', cat: 'kebersihan', emoji: '🧼', weight: '90 gr x 3', price: 15000, originalPrice: 18000, badge: 'promo', rating: 4.5, reviews: 189, desc: 'Sabun mandi batang isi 3 dengan formula pelembab. Kulit bersih, lembut, dan wangi seharian.', stock: 250, featured: false, isNew: false },
];

const PRODUCTS = [];

const CATEGORIES = [
  { id: 'semua', name: 'Semua', emoji: '🏪', count: 0 },
  { id: 'beras', name: 'Beras & Sereal', emoji: '🌾', count: 0 },
  { id: 'minyak', name: 'Minyak', emoji: '🫙', count: 0 },
  { id: 'gula', name: 'Gula & Madu', emoji: '🍯', count: 0 },
  { id: 'bumbu', name: 'Bumbu Dapur', emoji: '🌶️', count: 0 },
  { id: 'tepung', name: 'Tepung', emoji: '🌽', count: 0 },
  { id: 'minuman', name: 'Minuman', emoji: '☕', count: 0 },
  { id: 'kaleng', name: 'Makanan Kaleng', emoji: '🐟', count: 0 },
  { id: 'kebersihan', name: 'Kebersihan', emoji: '🧴', count: 0 },
];

async function loadProducts() {
  PRODUCTS.length = 0;

  try {
    const res = await fetch('/api/products.php');
    const json = await res.json();
    if (json.success && Array.isArray(json.products)) {
      json.products.forEach(p => {
        PRODUCTS.push({
          ...p,
          originalPrice: p.originalPrice === null ? null : Number(p.originalPrice),
          price: Number(p.price) || 0,
          rating: Number(p.rating) || 0,
          reviews: Number(p.reviews) || 0,
          stock: Number(p.stock) || 0,
          featured: !!p.featured,
          isNew: !!p.isNew,
          desc: p.desc ?? p.description ?? '',
        });
      });
    } else {
      throw new Error('Invalid product response');
    }
  } catch (err) {
    console.warn('Failed to load products from server, falling back to local data', err);
    BASE_PRODUCTS.forEach(p => PRODUCTS.push({ ...p }));
  }

  updateCategoryCounts();
}

// Helper: robust ID equality (handles string/number IDs)
function idEq(a, b) {
  return String(a) === String(b);
}

function updateCategoryCounts() {
  CATEGORIES.forEach(cat => {
    if (cat.id === 'semua') {
      cat.count = PRODUCTS.length;
    } else {
      cat.count = PRODUCTS.filter(p => p.cat === cat.id).length;
    }
  });
}

// Initial load
loadProducts();


const TESTIMONIALS = [
  { name: 'Bu Sari W.', location: 'Jakarta Selatan', rating: 5, text: 'Belanja di SembakoMart sangat praktis! Produknya lengkap dan harganya terjangkau. Pengiriman juga cepat, kurang dari 2 jam sudah sampai. Recommended banget!', avatar: '👩' },
  { name: 'Pak Budi S.', location: 'Depok', rating: 5, text: 'Sudah berlangganan 3 bulan. Kualitas produk terjamin, beras premiumnya pulen banget. Bayar pakai QRIS juga mudah, langsung pakai GoPay.', avatar: '👨' },
  { name: 'Ibu Rina M.', location: 'Bekasi', rating: 5, text: 'Minyak goreng dan bumbu dasapurnya selalu fresh. Senang belanja di sini karena ada notifikasi kalau ada promo. Hemat banyak!', avatar: '👩‍🦱' },
];

// ============================================
// CART MANAGEMENT
// ============================================
class CartManager {
  constructor() {
    this.cart = this.loadCart();
  }

  loadCart() {
    try {
      return JSON.parse(localStorage.getItem('sembako_cart')) || [];
    } catch {
      return [];
    }
  }

  saveCart() {
    localStorage.setItem('sembako_cart', JSON.stringify(this.cart));
    this.updateCartUI();
  }

  addItem(productId, qty = 1) {
    const product = PRODUCTS.find(p => idEq(p.id, productId));
    if (!product) return;

    const existing = this.cart.find(i => i.id === productId);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, product.stock);
    } else {
      this.cart.push({ id: productId, qty });
    }
    this.saveCart();
    return product;
  }

  removeItem(productId) {
    this.cart = this.cart.filter(i => !idEq(i.id, productId));
    this.saveCart();
  }

  updateQty(productId, qty) {
    const item = this.cart.find(i => idEq(i.id, productId));
    const product = PRODUCTS.find(p => idEq(p.id, productId));
    if (!item || !product) return;
    
    if (qty <= 0) {
      this.removeItem(productId);
    } else {
      item.qty = Math.min(qty, product.stock);
      this.saveCart();
    }
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  getItems() {
    return this.cart.map(i => ({
      ...i,
      product: PRODUCTS.find(p => idEq(p.id, i.id))
    })).filter(i => i.product);
  }

  getCount() {
    return this.cart.reduce((sum, i) => sum + i.qty, 0);
  }

  getSubtotal() {
    return this.getItems().reduce((sum, i) => {
      const price = Number(i.product.price);
      const unit = Number.isFinite(price) ? price : 0;
      return sum + (unit * i.qty);
    }, 0);
  }

  updateCartUI() {
    const count = this.getCount();
    const countEls = document.querySelectorAll('.cart-count');
    countEls.forEach(el => {
      el.textContent = count;
      if (count > 0) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  }
}

// Global cart instance
window.cart = new CartManager();

// ============================================
// UTILITIES
// ============================================
function formatPrice(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function showToast(message, type = 'success', icon = '✅') {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  wrap.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '⭐'.repeat(full);
  if (half) stars += '✨';
  return stars;
}

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SMK-${ts}-${rand}`;
}

// ============================================
// PRODUCT CARD RENDERER
// ============================================
function renderProductCard(product, extraClass = '') {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  
  const badgeHTML = product.badge ? 
    `<span class="product-badge badge-${product.badge}">${
      product.badge === 'promo' ? `−${discountPct}%` :
      product.badge === 'new' ? 'Baru' :
      'Terlaris'
    }</span>` : '';

  return `
    <div class="product-card ${extraClass}" data-id="${product.id}" onclick="openProductDetail(${product.id})">
      <div class="product-img-wrap">
        ${product.image ? `<img src="${product.image}" alt="${product.name}">` : `<div class="product-emoji">${product.emoji}</div>`}
        ${badgeHTML}
        <button class="product-wishlist" onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)" aria-label="Tambah ke wishlist">🤍</button>
      </div>
      <div class="product-info">
        <span class="product-cat">${getCatName(product.cat)}</span>
        <div class="product-name">${product.name}</div>
        <div class="product-weight">${product.weight}</div>
        <div class="product-footer">
          <div class="product-price-wrap">
            <span class="product-price">${formatPrice(product.price)}</span>
            ${hasDiscount ? `<span class="product-price-original">${formatPrice(product.originalPrice)}</span>` : ''}
          </div>
          <button class="add-cart-btn" id="addBtn-${product.id}" onclick="event.stopPropagation(); handleAddToCart(${product.id}, this)" aria-label="Tambah ke keranjang" title="Tambah ke keranjang">
            +
          </button>
        </div>
      </div>
    </div>
  `;
}

function getCatName(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? cat.name : catId;
}

function handleAddToCart(productId, btn) {
  const product = window.cart.addItem(productId);
  if (!product) return;

  // Button feedback
  btn.textContent = '✓';
  btn.classList.add('added');
  setTimeout(() => {
    btn.textContent = '+';
    btn.classList.remove('added');
  }, 1500);

  showToast(`${product.name} ditambahkan ke keranjang!`, 'success', '🛒');
}

function toggleWishlist(productId, btn) {
  const isActive = btn.textContent === '❤️';
  btn.textContent = isActive ? '🤍' : '❤️';
  const product = PRODUCTS.find(p => idEq(p.id, productId));
  if (product) {
    showToast(isActive ? 'Dihapus dari wishlist' : `${product.name} ditambahkan ke wishlist`, 'success', isActive ? '💔' : '❤️');
  }
}

// Product Detail Modal
let currentModalProduct = null;

function openProductDetail(productId) {
  const product = PRODUCTS.find(p => idEq(p.id, productId));
  if (!product) return;
  currentModalProduct = product;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  const modal = document.getElementById('productModal');
  if (!modal) return;

  const modalEmoji = modal.querySelector('#modalEmoji');
  if (product.image) {
    modalEmoji.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
  } else {
    modalEmoji.textContent = product.emoji;
  }
  modal.querySelector('#modalName').textContent = product.name;
  modal.querySelector('#modalCat').textContent = getCatName(product.cat);
  modal.querySelector('#modalRating').innerHTML = `<span class="modal-stars">⭐</span> <span>${product.rating}</span> <span class="modal-rating-text">(${product.reviews} ulasan)</span>`;
  modal.querySelector('#modalDesc').textContent = product.desc;
  modal.querySelector('#modalPrice').textContent = formatPrice(product.price);
  
  const oldPriceEl = modal.querySelector('#modalPriceOld');
  const discountEl = modal.querySelector('#modalDiscount');
  if (hasDiscount) {
    oldPriceEl.textContent = formatPrice(product.originalPrice);
    oldPriceEl.style.display = 'inline';
    discountEl.textContent = `−${discountPct}%`;
    discountEl.style.display = 'inline';
  } else {
    oldPriceEl.style.display = 'none';
    discountEl.style.display = 'none';
  }
  
  modal.querySelector('#modalQty').value = 1;
  modal.querySelector('#modalWeight').textContent = product.weight;
  modal.querySelector('#modalStock').textContent = product.stock > 10 ? 'Stok Tersedia' : `Stok terbatas (${product.stock})`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductDetail() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ============================================
// NAVBAR & HAMBURGER
// ============================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const navSearch = document.getElementById('navSearchInput');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }
  });

  // Hamburger
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.style.display === 'block';
      mobileMenu.style.display = isOpen ? 'none' : 'block';
    });
  }

  // Nav search — redirect to products page
  if (navSearch) {
    navSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && navSearch.value.trim()) {
        window.location.href = `products.html?search=${encodeURIComponent(navSearch.value.trim())}`;
      }
    });
  }

  // Highlight active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') && path.includes(link.getAttribute('href').replace('.html', ''))) {
      link.classList.add('active');
    }
  });
}

// ============================================
// FADE-IN ANIMATIONS
// ============================================
function initFadeAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ============================================
// HOME PAGE SPECIFIC
// ============================================
function initHomePage() {
  renderCategories();
  renderFeaturedProducts();
  renderNewProducts();
  renderTestimonials();
  injectModal();
}

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  grid.innerHTML = CATEGORIES.filter(c => c.id !== 'semua').map(cat => `
    <a href="products.html?cat=${cat.id}" class="category-card">
      <div class="category-icon">${cat.emoji}</div>
      <div class="category-name">${cat.name}</div>
      <div class="category-count">${cat.count} produk</div>
    </a>
  `).join('');
}

function renderFeaturedProducts() {
  const grid = document.getElementById('featuredProducts');
  if (!grid) return;

  const featured = PRODUCTS.filter(p => p.featured).slice(0, 8);
  grid.innerHTML = featured.map(p => renderProductCard(p)).join('');
}

function renderNewProducts() {
  const grid = document.getElementById('newProducts');
  if (!grid) return;

  const newProds = PRODUCTS.filter(p => p.isNew).slice(0, 4);
  grid.innerHTML = newProds.map(p => renderProductCard(p)).join('');
}

function renderTestimonials() {
  const container = document.getElementById('testimonials');
  if (!container) return;

  container.innerHTML = TESTIMONIALS.map(t => `
    <div class="fade-in" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:2rem; border:1px solid var(--border); box-shadow:var(--shadow-sm);">
      <div style="display:flex; gap:4px; color:#F59E0B; margin-bottom:0.8rem;">
        ${'⭐'.repeat(t.rating)}
      </div>
      <p style="font-size:0.88rem; color:var(--text); line-height:1.7; margin-bottom:1.2rem; font-style:italic;">"${t.text}"</p>
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:42px; height:42px; background:linear-gradient(135deg,var(--primary-light),var(--primary)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">${t.avatar}</div>
        <div>
          <div style="font-size:0.88rem; font-weight:700; color:var(--dark);">${t.name}</div>
          <div style="font-size:0.75rem; color:var(--text-light);">📍 ${t.location}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// PRODUCT MODAL (shared across pages)
// ============================================
function injectModal() {
  if (document.getElementById('productModal')) return;

  const modalHTML = `
    <div class="modal-overlay" id="productModal" onclick="handleModalClick(event)">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Detail Produk</h3>
          <button class="modal-close" onclick="closeProductDetail()">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-img" id="modalEmoji">🌾</div>
          <div class="modal-detail">
            <div class="modal-cat" id="modalCat">Kategori</div>
            <h2 class="modal-name" id="modalName">Nama Produk</h2>
            <div class="modal-rating" id="modalRating"></div>
            <p class="modal-desc" id="modalDesc">Deskripsi produk</p>
            <div style="font-size:0.78rem; color:var(--text-light); margin-bottom:0.8rem;">
              Ukuran: <strong id="modalWeight"></strong> &nbsp;|&nbsp; <span id="modalStock" style="color:var(--primary); font-weight:600;"></span>
            </div>
            <div class="modal-price-wrap">
              <span class="modal-price" id="modalPrice"></span>
              <span class="modal-price-old" id="modalPriceOld"></span>
              <span class="modal-discount" id="modalDiscount"></span>
            </div>
            <div class="modal-qty">
              <button class="qty-btn" onclick="changeModalQty(-1)">−</button>
              <input type="number" class="qty-input" id="modalQty" value="1" min="1" max="50">
              <button class="qty-btn" onclick="changeModalQty(1)">+</button>
            </div>
            <div class="modal-actions">
              <button class="modal-add-cart" onclick="addModalToCart()">🛒 Tambah Keranjang</button>
              <button class="modal-buy-now" onclick="buyNow()">Beli Sekarang</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductDetail();
  });
}

function handleModalClick(e) {
  if (e.target.classList.contains('modal-overlay')) closeProductDetail();
}

function changeModalQty(delta) {
  const input = document.getElementById('modalQty');
  const max = currentModalProduct ? currentModalProduct.stock : 50;
  let val = parseInt(input.value) + delta;
  val = Math.max(1, Math.min(max, val));
  input.value = val;
}

function addModalToCart() {
  if (!currentModalProduct) return;
  const qty = parseInt(document.getElementById('modalQty').value) || 1;
  
  for (let i = 0; i < qty; i++) {
    window.cart.addItem(currentModalProduct.id, i === 0 ? qty : 0);
    if (i === 0) break;
  }
  
  // Proper qty add
  const existing = window.cart.cart.find(i => i.id === currentModalProduct.id);
  if (existing) {
    existing.qty = qty;
  } else {
    window.cart.cart.push({ id: currentModalProduct.id, qty });
  }
  window.cart.saveCart();

  showToast(`${currentModalProduct.name} (${qty}x) ditambahkan!`, 'success', '🛒');
  closeProductDetail();
}

function buyNow() {
  if (!currentModalProduct) return;
  const qty = parseInt(document.getElementById('modalQty').value) || 1;

  const existing = window.cart.cart.find(i => i.id === currentModalProduct.id);
  if (existing) {
    existing.qty = qty;
  } else {
    window.cart.cart.push({ id: currentModalProduct.id, qty });
  }
  window.cart.saveCart();

  closeProductDetail();
  window.location.href = 'checkout.html';
}

// ============================================
// INIT
// ============================================
window.appReady = loadProducts();

document.addEventListener('DOMContentLoaded', () => {
  window.appReady.then(() => {
    initNavbar();
    window.cart.updateCartUI();
    initFadeAnimations();

    const path = window.location.pathname;
    if (path.includes('index') || path.endsWith('/') || path.endsWith('\\')) {
      initHomePage();
    }
  }).catch(() => {
    initNavbar();
    window.cart.updateCartUI();
    initFadeAnimations();
  });
});
