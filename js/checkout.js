/* ============================================
   CHECKOUT.JS — Full Checkout Logic + QRIS QR
   ============================================ */

let selectedShipping = { type: 'express', fee: 0 };
let selectedPayment = 'qris';

// ============================================
// INIT
// ============================================
function initCheckoutPage() {
  renderOrderSummary();

  // Redirect to cart if empty
  if (window.cart.getCount() === 0) {
    setTimeout(() => {
      window.location.href = 'cart.html';
    }, 500);
    return;
  }

  // Load server settings (payment + shipping) and render UI
  fetchAndApplySettings().then(() => {
    // Draw QR only if QRIS is selected
    if (selectedPayment === 'qris') drawQRCode();
    updateQRISAmount();
  });
}

async function fetchAndApplySettings() {
  try {
    const res = await fetch('/api/settings.php');
    const json = await res.json();
    if (!json.success || !json.settings) return;

    const cfg = json.settings;

    // Render shipping methods
    if (cfg.shipping && Array.isArray(cfg.shipping.methods)) {
      renderShippingOptions(cfg.shipping.methods, cfg.shipping.free_shipping_threshold || 0);
    }

    // Render payment methods
    if (cfg.payment && cfg.payment.enabled_methods) {
      renderPaymentMethods(cfg.payment.enabled_methods);
    }

    // Set default selected payment if available
    const enabled = cfg.payment && cfg.payment.enabled_methods ? cfg.payment.enabled_methods : {};
    if (enabled.qris) selectedPayment = 'qris';
    else if (enabled.gopay) selectedPayment = 'gopay';
    else if (enabled.dana) selectedPayment = 'dana';
    else if (enabled.ovo) selectedPayment = 'ovo';
    else selectedPayment = 'cod';

  } catch (e) {
    console.error('Failed to load settings', e);
  }
}

function renderShippingOptions(methods, freeThreshold = 0) {
  const container = document.querySelector('.shipping-options');
  if (!container) return;
  container.innerHTML = '';
  methods.forEach(m => {
    const fee = m.fee || 0;
    const id = `ship-${m.id}`;
    const label = document.createElement('label');
    label.className = 'shipping-option' + (m.id === (selectedShipping.type || '') ? ' selected' : '');
    label.id = id;
    label.setAttribute('onclick', `selectShipping('${m.id}', ${fee})`);
    label.innerHTML = `
      <input type="radio" name="shipping" value="${m.id}" ${m.id === (selectedShipping.type || '') ? 'checked' : ''}>
      <div class="shipping-left">
        <div class="shipping-icon">🚚</div>
        <div>
          <span class="shipping-name">${m.name}</span>
          <span class="shipping-time">Estimasi: ${m.estimate || '-'}</span>
        </div>
      </div>
      <span class="shipping-price" id="${id}-price">${fee === 0 || fee === '0' ? '<span class="free-badge">GRATIS</span>' : formatPrice(fee)}</span>
    `;
    container.appendChild(label);
  });
}

function renderPaymentMethods(enabled) {
  const container = document.getElementById('paymentMethods');
  if (!container) return;
  container.innerHTML = '';

  // QRIS
  if (enabled.qris) {
    const div = document.createElement('div');
    div.className = 'payment-method selected';
    div.id = 'pay-qris';
    div.setAttribute('onclick', "selectPayment('qris', this)");
    div.innerHTML = `
      <input type="radio" name="payment" value="qris" checked>
      <div class="payment-method-header">
        <div class="payment-left">
          <div class="payment-icon-wrap" style="background:linear-gradient(135deg,#FFE5E5,#FFB3B3);">
            <span style="font-size:1.5rem;">📱</span>
          </div>
          <div class="payment-info">
            <span class="payment-name">QRIS</span>
            <span class="payment-sub">Scan QR Code dari aplikasi e-wallet</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;"></div>
      </div>
      <div class="payment-detail">
        <div class="qris-panel">
          <div class="qris-code-wrap" id="qrisCodeWrap">
            <canvas id="qrisCanvas" width="180" height="180"></canvas>
          </div>
          <div class="qris-amount-display">Total: <span id="qrisAmount">Rp 0</span></div>
        </div>
      </div>
    `;
    container.appendChild(div);
  }

  // E-wallet buttons (deeplink style)
  const ewallets = ['gopay','dana','ovo'];
  const enabledE = ewallets.filter(k => enabled[k]);
  if (enabledE.length) {
    const div = document.createElement('div');
    div.className = 'payment-method';
    div.id = 'pay-ewallets';
    div.innerHTML = `<div class="payment-method-header"><div class="payment-left"><div class="payment-icon-wrap" style="background:linear-gradient(135deg,#E8F5E9,#C8E6C9);"><span style="font-size:1.2rem;">📲</span></div><div class="payment-info"><span class="payment-name">E-Wallet</span><span class="payment-sub">Buka aplikasi e-wallet untuk membayar</span></div></div></div>`;
    const btns = document.createElement('div');
    btns.style.display = 'flex'; btns.style.gap = '6px'; btns.style.marginTop = '8px';
    enabledE.forEach(k => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-admin-secondary';
      b.textContent = k.toUpperCase();
      b.onclick = () => selectPayment(k, b);
      btns.appendChild(b);
    });
    div.appendChild(btns);
    container.appendChild(div);
  }

  // Bank transfer
  if (enabled.bank_transfer) {
    const div = document.createElement('div');
    div.className = 'payment-method';
    div.id = 'pay-bank';
    div.setAttribute('onclick', "selectPayment('bank', this)");
    div.innerHTML = `
      <input type="radio" name="payment" value="bank">
      <div class="payment-method-header">
        <div class="payment-left">
          <div class="payment-icon-wrap" style="background:linear-gradient(135deg,#E8F5E9,#C8E6C9);">
            <span style="font-size:1.5rem;">🏦</span>
          </div>
          <div class="payment-info">
            <span class="payment-name">Transfer Bank</span>
            <span class="payment-sub">BCA, Mandiri, BRI, BNI</span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(div);
  }
}

// ============================================
// ORDER SUMMARY
// ============================================
function renderOrderSummary() {
  const items = window.cart.getItems();
  const osItems = document.getElementById('osItems');
  const osItemCount = document.getElementById('osItemCount');

  if (!osItems) return;

  if (items.length === 0) {
    osItems.innerHTML = `<p style="text-align:center; color:var(--text-light); padding:1rem; font-size:0.85rem;">Keranjang kosong</p>`;
    return;
  }

  if (osItemCount) osItemCount.textContent = `${window.cart.getCount()} item`;

  osItems.innerHTML = items.map(({ product, qty }) => {
    const priceNum = Number(product.price);
    const lineTotal = Number.isFinite(priceNum) ? priceNum * qty : null;
    const priceHtml = lineTotal !== null ? formatPrice(lineTotal) : '<span class="price-missing">—</span>';

    return `
      <div class="os-item">
        <div class="os-item-emoji">
          ${product.image ? `<img src="${product.image}" alt="${product.name}">` : product.emoji}
        </div>
        <div class="os-item-info">
          <div class="os-item-name">${product.name}</div>
          <div class="os-item-qty">${qty}x • ${product.weight}</div>
        </div>
        <div class="os-item-price">${priceHtml}</div>
      </div>
    `;
  }).join('');

  updateOrderTotals();
}

function updateOrderTotals() {
  const subtotal = window.cart.getSubtotal();
  const shippingFee = selectedShipping.fee;
  const total = subtotal + shippingFee;

  const osSubtotal = document.getElementById('osSubtotal');
  const osShipping = document.getElementById('osShipping');
  const osTotal = document.getElementById('osTotal');
  const placeOrderTotal = document.getElementById('placeOrderTotal');

  if (osSubtotal) osSubtotal.textContent = formatPrice(subtotal);
  if (osShipping) {
    osShipping.textContent = shippingFee === 0 ? 'GRATIS ✓' : formatPrice(shippingFee);
    osShipping.style.color = shippingFee === 0 ? '#10B981' : '';
  }
  if (osTotal) osTotal.textContent = formatPrice(total);
  if (placeOrderTotal) placeOrderTotal.textContent = formatPrice(total);

  // Update QRIS amount
  updateQRISAmount();
}

// ============================================
// SHIPPING SELECTION
// ============================================
function selectShipping(type, fee) {
  selectedShipping = { type, fee };

  // Remove selected class from all
  document.querySelectorAll('.shipping-option').forEach(el => el.classList.remove('selected'));
  
  // Add selected to chosen
  const selected = document.getElementById(`ship-${type}`);
  if (selected) selected.classList.add('selected');

  updateOrderTotals();
}

// ============================================
// PAYMENT SELECTION
// ============================================
function selectPayment(type, el) {
  selectedPayment = type;
  
  // Update UI
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');

  // Update QRIS if switching to it
  if (type === 'qris') {
    setTimeout(() => {
      drawQRCode();
      updateQRISAmount();
    }, 100);
  }
}

function selectBank(bank) {
  document.querySelectorAll('.bank-option').forEach(el => el.classList.remove('selected-bank'));
  const bankEls = document.querySelectorAll('.bank-option');
  bankEls.forEach(el => {
    if (el.querySelector('.bank-name').textContent.includes(bank)) {
      el.classList.add('selected-bank');
    }
  });
}

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} berhasil disalin!`, 'success', '📋');
  }).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(`${label} berhasil disalin!`, 'success', '📋');
  });
}

// ============================================
// QR CODE GENERATOR (Canvas-based)
// ============================================
function drawQRCode(seed) {
  const canvas = document.getElementById('qrisCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const size = 180;
  canvas.width = size;
  canvas.height = size;

  // Clear
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Draw QR pattern (visual mock — actual QRIS would need a library)
  drawQRPattern(ctx, size, seed || 'SEMBAKOMART2025');
}

function drawQRPattern(ctx, size, seed) {
  const moduleSize = 6;
  const margin = 10;
  const modules = Math.floor((size - margin * 2) / moduleSize);

  // Use seeded-like pattern for consistency
  const seedStr = String(seed || 'SEMBAKOMART2025');
  let seedNum = 0;
  for (let i = 0; i < seedStr.length; i++) seedNum = (seedNum + seedStr.charCodeAt(i)) % 97;
  
  ctx.fillStyle = '#1B1B2F';

  // Draw modules based on hash-like pattern
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      const hash = (row * 31 + col * 17 + row * col + seedNum + (row+col)) % 100;
      const shouldDraw = shouldDrawModule(row, col, modules, hash);
      
      if (shouldDraw) {
        ctx.fillRect(
          margin + col * moduleSize,
          margin + row * moduleSize,
          moduleSize - 1,
          moduleSize - 1
        );
      }
    }
  }

  // Draw 3 corner finder patterns
  drawFinderPattern(ctx, margin, margin, moduleSize);
  drawFinderPattern(ctx, size - margin - 7 * moduleSize, margin, moduleSize);
  drawFinderPattern(ctx, margin, size - margin - 7 * moduleSize, moduleSize);

  // QRIS Logo in center
  const logoSize = 32;
  const logoX = (size - logoSize) / 2;
  const logoY = (size - logoSize) / 2;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
  
  ctx.fillStyle = '#E00025';
  roundRect(ctx, logoX, logoY, logoSize, logoSize, 6);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('QRIS', logoX + logoSize / 2, logoY + logoSize / 2);
}

function shouldDrawModule(row, col, modules, hash) {
  // Skip finder pattern areas
  if ((row < 8 && col < 8) || (row < 8 && col >= modules - 8) || (row >= modules - 8 && col < 8)) {
    return false;
  }
  // Skip timing patterns
  if (row === 6 || col === 6) return row % 2 === 0 || col % 2 === 0;
  
  // Data modules
  return hash < 55;
}

function drawFinderPattern(ctx, x, y, ms) {
  // Outer black 7x7
  ctx.fillStyle = '#1B1B2F';
  ctx.fillRect(x, y, ms * 7, ms * 7);
  
  // Inner white 5x5
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + ms, y + ms, ms * 5, ms * 5);
  
  // Center black 3x3
  ctx.fillStyle = '#1B1B2F';
  ctx.fillRect(x + ms * 2, y + ms * 2, ms * 3, ms * 3);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function updateQRISAmount() {
  const total = window.cart.getSubtotal() + selectedShipping.fee;
  const qrisAmount = document.getElementById('qrisAmount');
  if (qrisAmount) qrisAmount.textContent = formatPrice(total);
}

// ============================================
// FORM VALIDATION
// ============================================
function validateForm() {
  let valid = true;

  const fields = [
    { id: 'firstName', errId: 'err-firstName', label: 'Nama depan' },
    { id: 'phone', errId: 'err-phone', label: 'No. WhatsApp' },
    { id: 'address', errId: 'err-address', label: 'Alamat' },
    { id: 'city', errId: 'err-city', label: 'Kota' },
  ];

  fields.forEach(field => {
    const input = document.getElementById(field.id);
    const err = document.getElementById(field.errId);
    
    if (!input || !input.value.trim()) {
      if (input) input.classList.add('error');
      if (err) err.classList.add('visible');
      valid = false;
    } else {
      if (input) input.classList.remove('error');
      if (err) err.classList.remove('visible');
    }
  });

  // Validate phone format
  const phone = document.getElementById('phone');
  if (phone && phone.value.trim()) {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(phone.value.replace(/[\s-]/g, ''))) {
      phone.classList.add('error');
      const errPhone = document.getElementById('err-phone');
      if (errPhone) {
        errPhone.textContent = 'Format no. WhatsApp tidak valid (contoh: 08123456789)';
        errPhone.classList.add('visible');
      }
      valid = false;
    }
  }

  return valid;
}

// ============================================
// PLACE ORDER
// ============================================
async function placeOrder() {
  if (window.cart.getCount() === 0) {
    showToast('Keranjang Anda kosong!', 'error', '❌');
    return;
  }

  if (!validateForm()) {
    showToast('Lengkapi data yang diperlukan!', 'error', '⚠️');
    const firstError = document.querySelector('.form-input.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Memproses pesanan...</span>';
  }

  const orderId = generateOrderId();
  const orderData = {
    id: orderId,
    items: window.cart.getItems().map(i => ({ id: i.product.id, name: i.product.name, qty: i.qty, price: Number(i.product.price) || 0 })),
    shipping: selectedShipping,
    payment: selectedPayment,
    customer: {
      name: `${document.getElementById('firstName').value} ${document.getElementById('lastName')?.value || ''}`.trim(),
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
    },
    total: window.cart.getSubtotal() + selectedShipping.fee,
    date: new Date().toISOString(),
    status: 'pending'
  };

  const onlineMethods = ['qris','gopay','dana','ovo'];
  if (onlineMethods.includes(selectedPayment)) {
    if (btn) { btn.disabled = true; btn.innerHTML = '<span>⏳ Membuat pembayaran...</span>'; }

    try {
      const res = await createPayment(orderData);
      if (!res || !res.success) {
        throw new Error(res?.error || 'Gagal membuat pembayaran');
      }

      const txId = res.txId;
      if (selectedPayment === 'qris' && res.qrPayload) {
        drawQRCode(txId);
        updateQRISAmount();
      }

      if (res.paymentUrl && selectedPayment !== 'qris') {
        window.open(res.paymentUrl, '_blank');
      }

      pollPaymentStatus(txId, async (status) => {
        if (status === 'paid') {
          await saveOrderToServer({ ...orderData, status: 'paid' });
          window.cart.clearCart();
          showSuccessModal(orderId);
        } else if (status === 'failed') {
          showToast('Pembayaran gagal', 'error', '❌');
        }
      });
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat membuat pembayaran', 'error', '❌');
      if (btn) { btn.disabled = false; btn.innerHTML = '<span>🛍️ Pesan Sekarang</span>'; }
    }

    return;
  }

  try {
    await saveOrderToServer(orderData);
    window.cart.clearCart();
    showSuccessModal(orderId);
  } catch (err) {
    console.error(err);
    showToast('Gagal menyimpan pesanan', 'error', '❌');
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>🛍️ Pesan Sekarang</span>'; }
  }
}

async function saveOrderToServer(orderData) {
  const res = await fetch('/api/orders.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to save order');
  }
  return json;
}

function createPayment(orderData) {
  return fetch('/api/payments/create.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: orderData.id, amount: orderData.total, method: orderData.payment })
  }).then(r => r.json());
}

function pollPaymentStatus(txId, cb, interval = 3000, timeout = 300000) {
  const start = Date.now();
  const iv = setInterval(async () => {
    try {
      const res = await fetch(`/api/payments/status.php?txId=${encodeURIComponent(txId)}`);
      const j = await res.json();
      if (j.success && j.payment) {
        if (j.payment.status === 'paid' || j.payment.status === 'failed') {
          clearInterval(iv);
          cb(j.payment.status);
        }
      }
    } catch (e) { console.error(e); }
    if (Date.now() - start > timeout) { clearInterval(iv); cb('failed'); }
  }, interval);
  return iv;

function showSuccessModal(orderId) {
  const modal = document.getElementById('successModal');
  const orderIdEl = document.getElementById('successOrderId');
  
  if (orderIdEl) orderIdEl.textContent = orderId;
  if (modal) modal.classList.add('open');

  // Update step indicator
  const step3 = document.getElementById('step3');
  if (step3) {
    step3.classList.add('active', 'done');
    step3.querySelector('.step-num').textContent = '✓';
  }
  const stepLine = document.querySelector('.step-line:last-of-type');
  if (stepLine) stepLine.classList.add('done');
}

// ============================================
// INPUT CLEANUP
// ============================================
function initInputListeners() {
  // Remove error state on input
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const errId = `err-${input.id}`;
      const err = document.getElementById(errId);
      if (err) err.classList.remove('visible');
    });
  });

  // Phone number formatting
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      let val = phoneInput.value.replace(/[^\d+]/g, '');
      phoneInput.value = val;
    });
  }

  // Postal code
  const postalInput = document.getElementById('postalCode');
  if (postalInput) {
    postalInput.addEventListener('input', () => {
      postalInput.value = postalInput.value.replace(/\D/g, '');
    });
  }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('checkout')) {
    if (window.appReady && window.appReady.then) {
      window.appReady.then(() => {
        initCheckoutPage();
        initInputListeners();
      }).catch(() => {
        initCheckoutPage();
        initInputListeners();
      });
    } else {
      initCheckoutPage();
      initInputListeners();
    }
  }
});
