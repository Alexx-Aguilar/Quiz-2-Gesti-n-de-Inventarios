const state = { products: [], comparisons: new Map(), alerts: [], errors: [], toastTimer: null };
const $ = (selector) => document.querySelector(selector);
const formatMoney = (value, currency = 'CRC') => new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

async function requestJson(url, options) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 404) throw new Error(body.error || `Error HTTP ${response.status}`);
  return { response, body };
}

function showToast(message, kind = 'success') {
  const toast = $('#toast');
  toast.className = `toast toast-${kind}`;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => { toast.hidden = true; }, 5200);
}

function setLoading(isLoading) {
  $('#catalog').setAttribute('aria-busy', String(isLoading));
  const button = $('#update');
  button.disabled = isLoading;
  button.classList.toggle('is-loading', isLoading);
  button.querySelector('span:last-child').textContent = isLoading ? 'Actualizando…' : 'Actualizar precios';
}

function paintSkeletons() {
  $('#catalog').innerHTML = Array.from({ length: 4 }, () => '<article class="skeleton-card" aria-hidden="true"><div class="skeleton skeleton-line short"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></article>').join('');
}

async function loadDashboard() {
  $('#loadError').hidden = true;
  paintSkeletons();
  try {
    const [productResult, alertResult, errorResult, configResult] = await Promise.all([
      requestJson('/api/products'), requestJson('/api/alerts'), requestJson('/api/errors'), requestJson('/api/config')
    ]);
    state.products = productResult.body;
    state.alerts = alertResult.body;
    state.errors = errorResult.body;
    $('#threshold').textContent = `${configResult.body.thresholdPercent} %`;
    const compareResults = await Promise.all(state.products.map(async (product) => {
      try {
        const result = await requestJson(`/api/products/${encodeURIComponent(product.code)}/compare`);
        return [product.code, result.response.status === 404 ? null : result.body];
      } catch (error) { return [product.code, { error: error.message }]; }
    }));
    state.comparisons = new Map(compareResults);
    updateSummary();
    renderCategoryOptions();
    renderCatalog();
    renderAlerts();
    renderErrors();
    $('#catalog').setAttribute('aria-busy', 'false');
  } catch (error) {
    $('#catalog').innerHTML = '';
    $('#resultCount').textContent = 'No se pudo cargar el catálogo';
    $('#loadError').textContent = `No fue posible consultar el servidor: ${error.message}. Comprueba que la aplicación siga ejecutándose.`;
    $('#loadError').hidden = false;
    $('#catalog').setAttribute('aria-busy', 'false');
  }
}

function updateSummary() {
  const offers = [...state.comparisons.values()].flatMap((entry) => entry?.offers || []);
  const suppliers = new Set(offers.map((offer) => offer.supplier));
  const timestamps = offers.map((offer) => new Date(offer.captured_at).getTime()).filter(Number.isFinite);
  $('#productCount').textContent = state.products.length;
  $('#supplierCount').textContent = suppliers.size;
  $('#alertCount').textContent = state.alerts.length;
  $('#lastUpdated').textContent = timestamps.length ? formatDate(Math.max(...timestamps)) : 'Pendiente';
}

function renderCategoryOptions() {
  const select = $('#categoryFilter');
  const selected = select.value;
  const categories = [...new Set(state.products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  select.innerHTML = '<option value="">Todas las categorías</option>' + categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  select.value = categories.includes(selected) ? selected : '';
}

function filteredProducts() {
  const query = $('#search').value.trim().toLocaleLowerCase('es');
  const category = $('#categoryFilter').value;
  const products = state.products.filter((product) => {
    const matchesQuery = `${product.name} ${product.code} ${product.category}`.toLocaleLowerCase('es').includes(query);
    return matchesQuery && (!category || product.category === category);
  });
  return products.sort((a, b) => {
    if ($('#sortBy').value === 'name') return a.name.localeCompare(b.name, 'es');
    const pa = state.comparisons.get(a.code)?.offers?.[0]?.price ?? Number.POSITIVE_INFINITY;
    const pb = state.comparisons.get(b.code)?.offers?.[0]?.price ?? Number.POSITIVE_INFINITY;
    return pa - pb || a.name.localeCompare(b.name, 'es');
  });
}

function renderCatalog() {
  const products = filteredProducts();
  $('#resultCount').textContent = `Mostrando ${products.length} de ${state.products.length} productos`;
  if (!state.products.length) {
    $('#catalog').innerHTML = '<div class="empty-state"><span class="empty-icon">▦</span><h3>El catálogo está listo para iniciar</h3><p>Captura los primeros precios de las fuentes de demostración para ver las comparaciones.</p><button class="button button-primary" data-action="update">Actualizar precios</button></div>';
    return;
  }
  if (!products.length) {
    $('#catalog').innerHTML = '<div class="empty-state"><span class="empty-icon">⌕</span><h3>No hay resultados</h3><p>Prueba con otro término o limpia los filtros.</p><button class="button button-secondary" data-action="clear-filters">Limpiar filtros</button></div>';
    return;
  }
  $('#catalog').innerHTML = products.map(renderProductCard).join('');
}

function renderProductCard(product) {
  const comparison = state.comparisons.get(product.code);
  const offers = comparison?.offers || [];
  if (comparison?.error) return `<article class="product-card"><div class="product-head"><span class="category-tag">${escapeHtml(product.category)}</span></div><h3>${escapeHtml(product.name)}</h3><p class="product-code">${escapeHtml(product.code)}</p><div class="notice notice-error compact">No se pudo leer la comparación: ${escapeHtml(comparison.error)}</div></article>`;
  if (!offers.length) return `<article class="product-card"><div class="product-head"><span class="category-tag">${escapeHtml(product.category)}</span><span class="no-price-tag">Sin capturas</span></div><h3>${escapeHtml(product.name)}</h3><p class="product-code">${escapeHtml(product.code)}</p><p class="no-price-copy">Actualiza las fuentes para agregar precios a este artículo.</p></article>`;
  const best = offers[0];
  const spread = offers.length > 1 ? offers[offers.length - 1].price - best.price : 0;
  const maxPrice = Math.max(...offers.map((offer) => Number(offer.price)), 1);
  const rows = offers.map((offer, index) => `<div class="offer-row ${index === 0 ? 'offer-best' : ''}">
    <div class="offer-main"><span class="rank ${index === 0 ? 'rank-best' : ''}">${index + 1}</span><div class="offer-name"><strong>${escapeHtml(offer.supplier)}</strong><small>${escapeHtml(offer.supplier_name)} · ${escapeHtml(offer.supplier_sku)}</small></div>
      ${index === 0 ? '<span class="best-tag">MEJOR</span>' : ''}<strong class="offer-price">${formatMoney(offer.price, offer.currency)}</strong></div>
    <div class="price-track" aria-hidden="true"><span style="width:${Math.max(8, (Number(offer.price) / maxPrice) * 100)}%"></span></div>
  </div>`).join('');
  return `<article class="product-card">
    <div class="product-head"><span class="category-tag">${escapeHtml(product.category)}</span><button class="text-button" data-action="history" data-code="${escapeHtml(product.code)}" data-name="${escapeHtml(product.name)}">Ver historial <span aria-hidden="true">↗</span></button></div>
    <h3>${escapeHtml(product.name)}</h3><p class="product-code">${escapeHtml(product.code)} <span>· ${escapeHtml(product.unit)}</span></p>
    <div class="best-price-box"><div><span>MEJOR PRECIO ACTUAL</span><strong>${formatMoney(best.price, best.currency)}</strong><small>${escapeHtml(best.supplier)}</small></div><span class="best-icon" aria-hidden="true">✓</span></div>
    <div class="offers-heading"><span>COMPARACIÓN DE OFERTAS</span><span>${offers.length} proveedor${offers.length === 1 ? '' : 'es'}</span></div>
    <div class="offers">${rows}</div>
    ${offers.length > 1 ? `<div class="spread-note"><span>Diferencia entre ofertas</span><strong>${formatMoney(spread, best.currency)} <small>por ${escapeHtml(product.unit)}</small></strong></div>` : ''}
    <p class="captured-note">Capturado ${formatDate(best.captured_at)}</p>
  </article>`;
}

function renderAlerts() {
  const alerts = state.alerts;
  $('#alerts-title').parentElement.parentElement.querySelector('.section-copy').textContent = alerts.length ? `${alerts.length} variación${alerts.length === 1 ? '' : 'es'} registradas en las últimas capturas.` : 'Variaciones que alcanzan o superan el umbral configurado.';
  if (!alerts.length) {
    $('#alerts').innerHTML = '<div class="empty-alert"><span class="empty-alert-icon">✓</span><div><strong>Todo tranquilo por ahora</strong><p>No hay cambios de precio que superen el umbral configurado.</p></div></div>';
    return;
  }
  $('#alerts').innerHTML = alerts.slice(0, 8).map((alert) => {
    const rising = Number(alert.change_percent) > 0;
    return `<article class="alert-row"><span class="alert-direction ${rising ? 'direction-up' : 'direction-down'}" aria-label="${rising ? 'Aumento' : 'Disminución'}">${rising ? '↑' : '↓'}</span>
      <div class="alert-product"><strong>${escapeHtml(alert.product)}</strong><small>${escapeHtml(alert.supplier)} · ${escapeHtml(alert.supplier_name)}</small></div>
      <div class="alert-change"><strong>${formatMoney(alert.previous_price)} <span>→</span> ${formatMoney(alert.current_price)}</strong><small>${formatDate(alert.created_at)}</small></div>
      <span class="change-pill ${rising ? 'change-up' : 'change-down'}">${rising ? '+' : ''}${Number(alert.change_percent).toFixed(1)}%</span></article>`;
  }).join('');
}

function renderErrors() {
  $('#sourceErrors').hidden = !state.errors.length;
  $('#errorsList').innerHTML = state.errors.slice(0, 5).map((error) => `<article class="error-row"><span class="error-dot"></span><div><strong>${escapeHtml(error.supplier_name)}</strong><p>${escapeHtml(error.message)}</p><small>${formatDate(error.created_at)}</small></div></article>`).join('');
}

async function openHistory(code, name) {
  const dialog = $('#historyDialog');
  $('#historyTitle').textContent = name;
  $('#historyContent').innerHTML = '<div class="empty-inline">Cargando historial…</div>';
  dialog.showModal();
  try {
    const { body } = await requestJson(`/api/products/${encodeURIComponent(code)}/history`);
    if (!body.length) { $('#historyContent').innerHTML = '<div class="empty-inline">Todavía no hay capturas registradas.</div>'; return; }
    $('#historyContent').innerHTML = `<div class="history-caption">${body.length} captura${body.length === 1 ? '' : 's'} guardadas · de más reciente a más antigua</div><div class="history-table-wrap"><table class="history-table"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Código del proveedor</th><th>Precio</th></tr></thead><tbody>${body.map((item) => `<tr><td>${formatDate(item.captured_at)}</td><td>${escapeHtml(item.supplier)}</td><td><code>${escapeHtml(item.supplier_sku)}</code></td><td><strong>${formatMoney(item.price, item.currency)}</strong></td></tr>`).join('')}</tbody></table></div>`;
  } catch (error) { $('#historyContent').innerHTML = `<div class="notice notice-error">No se pudo cargar el historial: ${escapeHtml(error.message)}</div>`; }
}

async function updatePrices() {
  setLoading(true);
  try {
    const response = await fetch('/api/update', { method: 'POST', cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    await loadDashboard();
    if (!response.ok || body.error) showToast(body.error || 'Algunas fuentes tuvieron problemas. Revisa su estado abajo.', 'warning');
    else showToast('Precios actualizados y guardados en el historial.');
  } catch (error) {
    showToast(`No se pudo actualizar: ${error.message}`, 'error');
  } finally { setLoading(false); }
}

$('#update').addEventListener('click', updatePrices);
$('#search').addEventListener('input', renderCatalog);
$('#categoryFilter').addEventListener('change', renderCatalog);
$('#sortBy').addEventListener('change', renderCatalog);
$('#closeHistory').addEventListener('click', () => $('#historyDialog').close());
$('#historyDialog').addEventListener('click', (event) => { if (event.target === $('#historyDialog')) $('#historyDialog').close(); });
$('#catalog').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'history') openHistory(button.dataset.code, button.dataset.name);
  if (button.dataset.action === 'update') updatePrices();
  if (button.dataset.action === 'clear-filters') { $('#search').value = ''; $('#categoryFilter').value = ''; renderCatalog(); }
});
loadDashboard();
