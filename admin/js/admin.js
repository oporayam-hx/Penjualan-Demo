/* ============================================
   ADMIN.JS — Admin Dashboard Logic
   ============================================ */

// 1. Session Check
if (localStorage.getItem('sembako_admin_logged_in') !== 'true') {
  window.location.href = 'index.html';
}

function handleLogout() {
  localStorage.removeItem('sembako_admin_logged_in');
  localStorage.removeItem('sembako_admin_user');
  window.location.href = 'index.html';
}

// ============================================
// ADMIN CONFIG
// ============================================
const ADMIN_KEY = 'sembako-admin';

// ============================================
// STATISTICS & UTILS
// ============================================
async function updateDashboardStats() {
  const statTotalProducts = document.getElementById('statTotalProducts');
  const statCustomProducts = document.getElementById('statCustomProducts');
  const statTotalOrders = document.getElementById('statTotalOrders');

  if (statTotalProducts) statTotalProducts.textContent = PRODUCTS.length;

  const customProducts = PRODUCTS.filter(p => !BASE_PRODUCTS.some(bp => String(bp.id) === String(p.id)));
  if (statCustomProducts) statCustomProducts.textContent = customProducts.length;

  if (statTotalOrders) {
    try {
      const res = await fetch('/api/orders.php?adminKey=' + encodeURIComponent(ADMIN_KEY));
      const json = await res.json();
      if (json.success && Array.isArray(json.orders)) {
        statTotalOrders.textContent = json.orders.length;
      } else {
        statTotalOrders.textContent = '0';
      }
    } catch (err) {
      statTotalOrders.textContent = '0';
    }
  }
}

// ============================================
// RENDER TABLE
// ============================================
function renderProductsTable(filteredProducts = PRODUCTS) {
  const tbody = document.getElementById('adminProductsTableBody');
  const countEl = document.getElementById('productCount');
  
  if (!tbody) return;

  if (countEl) countEl.textContent = filteredProducts.length;

  if (filteredProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:var(--admin-text-light); padding:3rem 1.5rem;">
          🔍 Tidak ada produk yang ditemukan.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredProducts.map(p => {
      const isCustom = !BASE_PRODUCTS.some(bp => String(bp.id) === String(p.id));
    const hasDiscount = p.originalPrice && p.originalPrice > p.price;
    
    // Label badge logic
    let labelHTML = '';
    if (isCustom) {
      labelHTML = `<span class="badge-admin-tag custom">Seller</span>`;
    } else if (p.badge) {
      labelHTML = `<span class="badge-admin-tag ${p.badge}">${p.badge}</span>`;
    } else {
      labelHTML = `<span style="color:var(--admin-text-light); font-size:0.75rem;">-</span>`;
    }

    return `
      <tr id="table-row-${p.id}">
        <td>
          <div class="product-row-info">
            <div class="product-row-emoji" style="overflow:hidden; display:flex; align-items:center; justify-content:center;">
                ${p.image ? `<img src="${p.image.startsWith('data:') ? p.image : '../' + p.image}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">` : p.emoji}
            </div>
            <div class="product-row-name-wrap">
              <span class="product-row-name">${p.name}</span>
              <span class="product-row-cat">${getCatName(p.cat)}</span>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight:700;">${formatPrice(p.price)}</div>
          ${hasDiscount ? `<div style="text-decoration:line-through; font-size:0.75rem; color:var(--admin-text-light);">${formatPrice(p.originalPrice)}</div>` : ''}
        </td>
        <td>
          <span style="font-weight:600; color:${p.stock <= 10 ? 'var(--admin-danger)' : 'inherit'};">
            ${p.stock}
          </span>
        </td>
        <td>${p.weight}</td>
        <td>${labelHTML}</td>
        <td>
          <div class="table-actions">
            <button class="btn-action edit" onclick="editProduct(${p.id})" title="Edit Produk">✏️</button>
            <button class="btn-action delete" onclick="deleteProduct(${p.id})" title="Hapus Produk">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================
// SEARCH & FILTER
// ============================================
function filterTable() {
  const searchQuery = document.getElementById('searchProduct').value.toLowerCase().trim();
  const categoryFilter = document.getElementById('filterCategory').value;

  const filtered = PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery);
    const matchesCat = categoryFilter === 'semua' || p.cat === categoryFilter;
    return matchesSearch && matchesCat;
  });

  renderProductsTable(filtered);
}

// ============================================
// CRUD OPERATIONS
// ============================================
function openProductModal(prod = null) {
  const modal = document.getElementById('productModal');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('productForm');

  if (!modal || !form) return;

  // Clear errors and form
  form.reset();

  if (prod) {
    // EDIT MODE
    title.textContent = '✏️ Edit Produk';
    document.getElementById('editProductId').value = prod.id;
    document.getElementById('prodName').value = prod.name;
    document.getElementById('prodCat').value = prod.cat;
    document.getElementById('prodPrice').value = prod.price;
    document.getElementById('prodOriginalPrice').value = prod.originalPrice || '';
    document.getElementById('prodStock').value = prod.stock;
    document.getElementById('prodWeight').value = prod.weight;
    document.getElementById('prodEmoji').value = prod.emoji;
    document.getElementById('prodImage').value = prod.image || '';
    // Show image preview when editing if image exists
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('prodImagePreview');
    if (prod.image) {
      previewContainer.style.display = 'flex';
      previewImg.src = prod.image.startsWith('data:') ? prod.image : '../' + prod.image;
    } else {
      previewContainer.style.display = 'none';
      previewImg.src = '';
    }
    document.getElementById('prodBadge').value = prod.badge || '';
    document.getElementById('prodDesc').value = prod.desc || '';
    document.getElementById('prodFeatured').checked = !!prod.featured;
    document.getElementById('prodIsNew').checked = !!prod.isNew;
  } else {
    // ADD MODE
    title.textContent = '➕ Tambah Produk Baru';
    document.getElementById('editProductId').value = '';
    document.getElementById('prodImage').value = '';
    // Auto-fill random emoji or keep empty
    document.getElementById('prodEmoji').value = '📦';
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('prodImagePreview');
    previewContainer.style.display = 'none';
    previewImg.src = '';
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function handleModalOverlayClick(e) {
  if (e.target.classList.contains('modal-overlay')) closeProductModal();
}

// ============================================
// IMAGE UPLOAD HELPERS
// ============================================
function handleImageUpload(e) {
  const file = e.target.files && e.target.files[0];
  const hiddenInput = document.getElementById('prodImage');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('prodImagePreview');

  if (!file) {
    hiddenInput.value = '';
    previewContainer.style.display = 'none';
    previewImg.src = '';
    return;
  }

  // Try server-side upload first
  const form = new FormData();
  form.append('image', file);

  // show temporary preview while uploading
  previewContainer.style.display = 'flex';
  previewImg.src = '';

  fetch('/api/upload.php', {
    method: 'POST',
    body: form
  }).then(res => res.json())
    .then(json => {
      if (json && json.success && json.path) {
        // Store server path (relative to project root)
        hiddenInput.value = json.path;
        // Preview using relative path from admin page
        previewImg.src = '../' + json.path;
      } else {
        // Fallback to client-side dataURL if server upload failed
        const reader = new FileReader();
        reader.onload = function(evt) {
          const dataUrl = evt.target.result;
          hiddenInput.value = dataUrl;
          previewImg.src = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    }).catch(() => {
      // Network or server error — fallback to dataURL
      const reader = new FileReader();
      reader.onload = function(evt) {
        const dataUrl = evt.target.result;
        hiddenInput.value = dataUrl;
        previewImg.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
}

function clearImageUpload() {
  const fileInput = document.getElementById('prodImageFile');
  const hiddenInput = document.getElementById('prodImage');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('prodImagePreview');

  if (fileInput) fileInput.value = '';
  if (hiddenInput) hiddenInput.value = '';
  if (previewImg) previewImg.src = '';
  if (previewContainer) previewContainer.style.display = 'none';
}

async function saveProduct(e) {
  e.preventDefault();

  const idInput = document.getElementById('editProductId').value;
  const name = document.getElementById('prodName').value.trim();
  const cat = document.getElementById('prodCat').value;
  const price = parseInt(document.getElementById('prodPrice').value) || 0;
  const origPriceVal = document.getElementById('prodOriginalPrice').value;
  const originalPrice = origPriceVal ? parseInt(origPriceVal) : null;
  const stock = parseInt(document.getElementById('prodStock').value) || 0;
  const weight = document.getElementById('prodWeight').value.trim();
  const emoji = document.getElementById('prodEmoji').value.trim();
  const image = document.getElementById('prodImage').value.trim();
  const badge = document.getElementById('prodBadge').value;
  const desc = document.getElementById('prodDesc').value.trim();
  const featured = document.getElementById('prodFeatured').checked;
  const isNew = document.getElementById('prodIsNew').checked;

  const productData = {
    name,
    cat,
    price,
    originalPrice,
    stock,
    weight,
    emoji,
    image: image || null,
    badge: badge || null,
    desc,
    featured,
    isNew,
    rating: 5.0,
    reviews: 0
  };

  const headers = { 'Content-Type': 'application/json' };
  let result;

  try {
    if (idInput) {
      const prodId = parseInt(idInput);
      result = await fetch('/api/products.php', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: prodId, adminKey: ADMIN_KEY, ...productData })
      });
    } else {
      result = await fetch('/api/products.php', {
        method: 'POST',
        headers,
        body: JSON.stringify({ adminKey: ADMIN_KEY, ...productData })
      });
    }

    const json = await result.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to save product');
    }

    await loadProducts();
    renderProductsTable();
    await updateDashboardStats();
    alert(idInput ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
    closeProductModal();
  } catch (err) {
    console.error(err);
    alert('Gagal menyimpan produk: ' + err.message);
  }
}

function editProduct(productId) {
  const prod = PRODUCTS.find(p => String(p.id) === String(productId));
  if (prod) {
    openProductModal(prod);
  }
}

async function deleteProduct(productId) {
  const prod = PRODUCTS.find(p => String(p.id) === String(productId));
  if (!prod) return;

  const confirmed = confirm(`Apakah Anda yakin ingin menghapus produk "${prod.name}"?`);
  if (!confirmed) return;

  if (prod.image && prod.image.startsWith('uploads/')) {
    fetch('/api/delete_upload.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: prod.image })
    }).catch(() => {});
    const thumb = prod.image.replace(/([^\/]+)$/, 'thumb_$1');
    fetch('/api/delete_upload.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: thumb })
    }).catch(() => {});
  }

  try {
    const res = await fetch('/api/products.php?id=' + encodeURIComponent(productId), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: ADMIN_KEY })
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to delete product');
    }
    await loadProducts();
    renderProductsTable();
    await updateDashboardStats();
    alert('Produk berhasil dihapus!');
  } catch (err) {
    console.error(err);
    alert('Gagal menghapus produk: ' + err.message);
  }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.appReady && window.appReady.then) {
    window.appReady.then(async () => {
      renderProductsTable();
      await updateDashboardStats();
    }).catch(async () => {
      renderProductsTable();
      await updateDashboardStats();
    });
  } else {
    renderProductsTable();
    updateDashboardStats();
  }
});
