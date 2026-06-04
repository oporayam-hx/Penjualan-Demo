/* ============================================
   CART.JS — Shopping Cart Logic
   ============================================ */

const SHIPPING_FEE = 15000;
const FREE_SHIPPING_THRESHOLD = 100000;

const PROMO_CODES = {
  'SEMBAKO10': { discount: 0.10, label: '10% off' },
  'HEMAT20': { discount: 0.20, label: '20% off' },
  'GRATIS': { discount: 0, freeShipping: true, label: 'Gratis ongkir' },
  'NEWUSER': { discount: 0.15, label: '15% off' },
};

let appliedPromo = null;

// ============================================
// RENDER CART
// ============================================
function renderCart() {
  const items = window.cart.getItems();
  const listEl = document.getElementById('cartItemsList');
  const totalItems = document.getElementById('cartTotalItems');
  const clearBtn = document.getElementById('clearCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (!listEl) return;

  // Update header counts
  const totalQty = window.cart.getCount();
  if (totalItems) totalItems.textContent = `(${totalQty} item)`;

  if (items.length === 0) {
    if (clearBtn) clearBtn.style.display = 'none';
    listEl.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-emoji">🛒</span>
        <h3>Keranjang Masih Kosong</h3>
        <p>Yuk, tambahkan produk sembako pilihan Anda!</p>
        <a href="products.html" class="btn-primary" style="display:inline-flex; margin-top:1rem;">🛍️ Mulai Belanja</a>
      </div>
    `;
    if (checkoutBtn) {
      checkoutBtn.style.pointerEvents = 'none';
      checkoutBtn.style.opacity = '0.5';
    }
  } else {
    if (clearBtn) clearBtn.style.display = 'flex';
    listEl.innerHTML = items.map(item => renderCartItem(item)).join('');
    if (checkoutBtn) {
      checkoutBtn.style.pointerEvents = '';
      checkoutBtn.style.opacity = '';
    }
  }

  updateSummary();
  renderRecommended(items);
}

function renderCartItem(item) {
  const { product, qty } = item;
  const subtotal = product.price * qty;

  return `
    <div class="cart-item" id="cart-item-${product.id}">
      <div class="cart-item-img">
        ${product.image ? `<img src="${product.image}" alt="${product.name}">` : product.emoji}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-meta">${product.weight} • ${formatPrice(product.price)} / satuan</div>
        <div class="cart-item-controls">
          <div class="cart-qty-wrap">
            <button class="cart-qty-btn" onclick="updateCartQty(${product.id}, ${qty - 1})" aria-label="Kurangi">−</button>
            <div class="cart-qty-val">${qty}</div>
            <button class="cart-qty-btn" onclick="updateCartQty(${product.id}, ${qty + 1})" aria-label="Tambah">+</button>
          </div>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <span class="cart-item-price">${formatPrice(subtotal)}</span>
        <button class="cart-item-remove" onclick="removeFromCart(${product.id})" aria-label="Hapus item" title="Hapus">🗑️</button>
      </div>
    </div>
  `;
}

// ============================================
// CART ACTIONS
// ============================================
function updateCartQty(productId, newQty) {
  window.cart.updateQty(productId, newQty);
  renderCart();
}

function removeFromCart(productId) {
  const item = window.cart.getItems().find(i => idEq(i.id, productId));
  window.cart.removeItem(productId);
  
  // Animate out
  const el = document.getElementById(`cart-item-${productId}`);
  if (el) {
    el.style.transition = 'all 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(-20px)';
    setTimeout(() => renderCart(), 300);
  } else {
    renderCart();
  }
  
  if (item?.product) {
    showToast(`${item.product.name} dihapus dari keranjang`, 'error', '🗑️');
  }
}

function confirmClearCart() {
  if (window.cart.getCount() === 0) return;
  
  // Simple confirm
  const confirmed = window.confirm('Hapus semua item dari keranjang?');
  if (confirmed) {
    window.cart.clearCart();
    appliedPromo = null;
    const promoSuccess = document.getElementById('promoSuccess');
    if (promoSuccess) promoSuccess.classList.remove('visible');
    renderCart();
    showToast('Keranjang berhasil dikosongkan', 'success', '🗑️');
  }
}

// ============================================
// SUMMARY & PRICING
// ============================================
function updateSummary() {
  const subtotal = window.cart.getSubtotal();
  const shippingFee = getShippingFee(subtotal);
  const discountAmount = getDiscountAmount(subtotal);
  const total = subtotal - discountAmount + shippingFee;

  const subtotalEl = document.getElementById('summarySubtotal');
  const discountRow = document.getElementById('summaryDiscountRow');
  const discountEl = document.getElementById('summaryDiscount');
  const shippingEl = document.getElementById('summaryShipping');
  const totalEl = document.getElementById('summaryTotal');

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  
  if (discountRow && discountEl) {
    if (discountAmount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `−${formatPrice(discountAmount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
  
  if (shippingEl) {
    if (shippingFee === 0) {
      shippingEl.innerHTML = '<span style="color:#10B981; font-weight:700;">GRATIS! ✓</span>';
    } else {
      shippingEl.textContent = formatPrice(shippingFee);
    }
  }
  
  if (totalEl) totalEl.textContent = formatPrice(Math.max(0, total));
}

function getShippingFee(subtotal) {
  if (appliedPromo && appliedPromo.freeShipping) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEE;
}

function getDiscountAmount(subtotal) {
  if (!appliedPromo || !appliedPromo.discount) return 0;
  return Math.round(subtotal * appliedPromo.discount);
}

// ============================================
// PROMO CODE
// ============================================
function applyPromo() {
  const input = document.getElementById('promoInput');
  const successEl = document.getElementById('promoSuccess');
  const promoAmountEl = document.getElementById('promoAmount');
  
  if (!input) return;
  
  const code = input.value.trim().toUpperCase();
  
  if (!code) {
    showToast('Masukkan kode promo terlebih dahulu!', 'error', '⚠️');
    return;
  }

  const promo = PROMO_CODES[code];
  if (!promo) {
    showToast('Kode promo tidak valid atau sudah kedaluwarsa', 'error', '❌');
    input.style.borderColor = '#EF4444';
    setTimeout(() => input.style.borderColor = '', 2000);
    return;
  }

  appliedPromo = promo;
  input.disabled = true;
  
  const subtotal = window.cart.getSubtotal();
  const discount = getDiscountAmount(subtotal);
  
  let msg = '';
  if (promo.freeShipping) {
    msg = 'Gratis ongkir';
  } else {
    msg = formatPrice(discount);
  }
  
  if (promoAmountEl) promoAmountEl.textContent = msg;
  if (successEl) successEl.classList.add('visible');
  
  updateSummary();
  showToast(`Kode promo "${code}" berhasil! ${promo.label}`, 'success', '🎉');
}

// ============================================
// RECOMMENDED PRODUCTS
// ============================================
function renderRecommended(cartItems) {
  const container = document.getElementById('recommendedProducts');
  if (!container) return;

  const cartIds = cartItems.map(i => String(i.id));
  const cartCats = [...new Set(cartItems.map(i => i.product?.cat).filter(Boolean))];

  // Get products from same categories not in cart
  let recommended = PRODUCTS.filter(p => !cartIds.includes(String(p.id)));
  
  if (cartCats.length > 0) {
    const sameCat = recommended.filter(p => cartCats.includes(p.cat));
    const others = recommended.filter(p => !cartCats.includes(p.cat));
    recommended = [...sameCat.slice(0, 3), ...others.slice(0, 1)].slice(0, 4);
  } else {
    recommended = recommended.filter(p => p.featured).slice(0, 4);
  }

  container.innerHTML = recommended.map(p => renderProductCard(p)).join('');
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('cart')) {
    renderCart();
    injectModal();
  }
});
