// settings.js — Admin Settings page

if (localStorage.getItem('sembako_admin_logged_in') !== 'true') {
  window.location.href = 'index.html';
}

function el(id) { return document.getElementById(id); }

async function loadSettings() {
  try {
    const res = await fetch('/api/settings.php');
    const json = await res.json();
    if (json.success && json.settings) {
      const s = json.settings;
      el('provider').value = s.payment.provider || 'xendit';
      el('mode').value = s.payment.mode || 'sandbox';
      const em = s.payment.enabled_methods || {};
      el('m_qris').checked = !!em.qris;
      el('m_gopay').checked = !!em.gopay;
      el('m_dana').checked = !!em.dana;
      el('m_ovo').checked = !!em.ovo;
      el('m_bank').checked = !!em.bank_transfer;

      // shipping
      renderShippingList(s.shipping.methods || []);
      el('freeThreshold').value = s.shipping.free_shipping_threshold || 0;
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
}

function renderShippingList(methods) {
  const container = el('shippingList');
  container.innerHTML = '';
  methods.forEach((m, idx) => {
    const row = document.createElement('div');
    row.className = 'shipping-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr 120px 120px 80px';
    row.style.gap = '8px';
    row.style.marginBottom = '8px';

    row.innerHTML = `
      <input class="form-input ship-name" value="${escapeHtml(m.name)}" data-idx="${idx}" />
      <input class="form-input ship-fee" type="number" min="0" value="${m.fee}" />
      <input class="form-input ship-estimate" value="${escapeHtml(m.estimate)}" />
      <button type="button" class="btn-admin-secondary ship-remove">Hapus</button>
    `;

    container.appendChild(row);

    row.querySelector('.ship-remove').addEventListener('click', () => {
      row.remove();
    });
  });
}

function escapeHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

el('addShippingBtn').addEventListener('click', () => {
  const container = el('shippingList');
  const row = document.createElement('div');
  row.className = 'shipping-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '1fr 120px 120px 80px';
  row.style.gap = '8px';
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <input class="form-input ship-name" placeholder="Nama metode (contoh: Reguler)" />
    <input class="form-input ship-fee" type="number" min="0" value="0" />
    <input class="form-input ship-estimate" placeholder="Estimasi (contoh: 1-2 hari)" />
    <button type="button" class="btn-admin-secondary ship-remove">Hapus</button>
  `;
  container.appendChild(row);
  row.querySelector('.ship-remove').addEventListener('click', () => row.remove());
});

el('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset pengaturan ke default?')) return;
  // Reset by calling server with default adminKey in data file
  const adminKey = prompt('Masukkan adminKey untuk konfirmasi reset:');
  if (!adminKey) return;
  fetch('/api/settings.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey, payment: { provider: 'xendit', mode: 'sandbox', enabled_methods: { qris:true, gopay:true, dana:true, ovo:true, bank_transfer:true } }, shipping: { default: 'express', free_shipping_threshold: 100000, methods: [ {id:'express', name:'Pengiriman Ekspres', fee:0, estimate:'1-3 jam', free_above:100000} ] } })
  }).then(r=>r.json()).then(j=>{ if (j.success) { alert('Telah di-reset'); loadSettings(); } else alert('Gagal reset: '+(j.error||'unknown')); }).catch(e=>alert('Error')); 
});

el('settingsForm').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const adminKey = el('adminKey').value.trim();
  if (!adminKey) { alert('Masukkan Admin Key untuk menyimpan'); return; }

  const payment = {
    provider: el('provider').value,
    mode: el('mode').value,
    enabled_methods: {
      qris: el('m_qris').checked,
      gopay: el('m_gopay').checked,
      dana: el('m_dana').checked,
      ovo: el('m_ovo').checked,
      bank_transfer: el('m_bank').checked
    },
    webhook_secret: el('webhook_secret').value.trim()
  };

  // shipping
  const shippingRows = Array.from(document.querySelectorAll('.shipping-row'));
  const methods = shippingRows.map((row, i) => {
    const name = row.querySelector('.ship-name').value.trim() || ('Method ' + (i+1));
    const fee = parseInt(row.querySelector('.ship-fee').value) || 0;
    const estimate = row.querySelector('.ship-estimate').value.trim() || '';
    return { id: name.toLowerCase().replace(/[^a-z0-9]/g,'_') + '_' + i, name, fee, estimate, free_above: 0 };
  });

  const shipping = { methods, default: methods.length ? methods[0].id : null, free_shipping_threshold: parseInt(el('freeThreshold').value) || 0 };

  fetch('/api/settings.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey, payment, shipping })
  }).then(r=>r.json()).then(j=>{
    if (j.success) {
      alert('Pengaturan tersimpan');
      el('adminKey').value = '';
      loadSettings();
    } else {
      alert('Gagal menyimpan: ' + (j.error || 'unknown'));
    }
  }).catch(err => {
    console.error(err);
    alert('Terjadi kesalahan saat menyimpan.');
  });
});

// Initialize
loadSettings();
