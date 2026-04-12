// ==================== SHOPWAVE APP ====================
const API = 'http://localhost:3000/api';
let currentUser = null;
let token = localStorage.getItem('shopwave_token');
let currentPage = 'home';
let allProducts = [];
let allCategories = [];
let cartCount = 0;
let wishlistIds = [];
let filters = { category: '', search: '', minPrice: '', maxPrice: '', brand: '', rating: '', sort: '' };

// ==================== THEME TOGGLE ====================
function initTheme() {
  const saved = localStorage.getItem('shopwave_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('shopwave_theme', next);
  // Update all toggle thumbs
  document.querySelectorAll('.toggle-thumb').forEach(el => {
    el.textContent = next === 'light' ? '☀️' : '🌙';
  });
}

function getThemeToggleHTML() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const icon = current === 'light' ? '☀️' : '🌙';
  return `<button class="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode" id="themeToggleBtn"><div class="toggle-thumb">${icon}</div></button>`;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  if (token) loadUser();
  else updateAuthUI();
  loadCategories();
  loadProducts();
  setupEventListeners();
  setupScrollEffect();
});

async function loadUser() {
  try {
    const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
    const data = await res.json();
    if (res.ok) { currentUser = data.user; updateAuthUI(); loadCart(); loadWishlist(); loadNotifications(); }
    else { token = null; localStorage.removeItem('shopwave_token'); updateAuthUI(); }
  } catch(e) { console.error('Auth error:', e); }
}

function authHeaders() { return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }; }

function updateAuthUI() {
  const authArea = document.getElementById('authArea');
  if (!authArea) return;
  const toggle = getThemeToggleHTML();
  if (currentUser) {
    authArea.innerHTML = `
      ${toggle}
      <button class="nav-btn" onclick="showNotifications()" id="notifBtn">🔔<span class="badge" id="notifBadge" style="display:none">0</span></button>
      <button class="nav-btn" onclick="navigateTo('wishlist')">❤️<span class="badge" id="wishBadge" style="display:none">0</span></button>
      <button class="nav-btn" onclick="navigateTo('cart')">🛒<span class="badge" id="cartBadge" style="display:none">0</span></button>
      <div class="nav-user" onclick="toggleUserMenu()">
        <div class="avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
        <span style="font-size:0.85rem;font-weight:500">${currentUser.name.split(' ')[0]}</span>
      </div>`;
    if (currentUser.role === 'admin') {
      const adminBtn = document.createElement('a');
      adminBtn.href = '/admin.html';
      adminBtn.innerHTML = '<button class="nav-btn" title="Admin Panel">⚙️</button>';
      authArea.prepend(adminBtn);
    }
  } else {
    authArea.innerHTML = `${toggle}<a href="/login.html"><button class="btn-primary" style="padding:8px 20px;font-size:0.85rem">Login</button></a>`;
  }
}

// ==================== CATEGORIES ====================
async function loadCategories() {
  try {
    const res = await fetch(`${API}/categories`);
    const data = await res.json();
    allCategories = data.categories;
    renderCategories();
    renderFilterCategories();
  } catch(e) { console.error('Categories error:', e); }
}

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  grid.innerHTML = allCategories.map(c => `
    <div class="category-card" onclick="filterByCategory('${c.id}')">
      <div class="icon">${c.icon}</div>
      <div class="name">${c.name}</div>
      <div class="count">${c.productCount} products</div>
    </div>`).join('');
}

function renderFilterCategories() {
  const el = document.getElementById('filterCategories');
  if (!el) return;
  el.innerHTML = allCategories.map(c => `
    <label class="filter-option">
      <input type="checkbox" value="${c.id}" onchange="toggleCategoryFilter(this)" ${filters.category === c.id ? 'checked' : ''}>
      ${c.name} (${c.productCount})
    </label>`).join('');
}

function filterByCategory(catId) {
  filters.category = catId;
  loadProducts();
  navigateTo('shop');
}

function filterByCategoryName(name) {
  const cat = allCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (cat) {
    filterByCategory(cat.id);
  } else {
    // Fallback: Navigate to shop and search by name
    filters.search = name;
    navigateTo('shop');
    loadProducts();
  }
}

function toggleCategoryFilter(el) {
  filters.category = el.checked ? el.value : '';
  document.querySelectorAll('#filterCategories input').forEach(i => { if (i !== el) i.checked = false; });
  loadProducts();
}

// ==================== PRODUCTS ====================
async function loadProducts() {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k,v]) => { if (v) params.set(k, v); });
  params.set('limit', '100'); // Show all matching products
  try {
    const res = await fetch(`${API}/products?${params}`);
    const data = await res.json();
    allProducts = data.products;
    renderProducts(data.products, data.total);
  } catch(e) { console.error('Products error:', e); }
}

function renderProducts(products, total) {
  const gridId = currentPage === 'shop' ? 'shopProductsGrid' : 'productsGrid';
  const grid = document.getElementById(gridId);
  if (!grid) return;
  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">🔍</div><h3>No Products Found</h3><p>Try adjusting your filters or search terms</p></div>`;
    return;
  }
  grid.innerHTML = products.map(p => {
    const discount = Math.round((1 - p.price / p.originalPrice) * 100);
    const inWishlist = wishlistIds.includes(p.id);
    return `
    <div class="product-card" onclick="showProduct('${p.id}')">
      <div class="image-wrap">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
        <button class="wishlist-btn ${inWishlist ? 'active' : ''}" onclick="event.stopPropagation();toggleWishlist('${p.id}')">${inWishlist ? '❤️' : '🤍'}</button>
      </div>
      <div class="info">
        <div class="brand">${p.brand}</div>
        <div class="name">${p.name}</div>
        <div class="price-row">
          <span class="price">₹${p.price.toLocaleString()}</span>
          ${p.originalPrice > p.price ? `<span class="original-price">₹${p.originalPrice.toLocaleString()}</span>` : ''}
        </div>
        <div class="rating">
          ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}
          <span>(${p.ratingCount})</span>
        </div>
        <button class="add-cart-btn" onclick="event.stopPropagation();addToCart('${p.id}')">🛒 Add to Cart</button>
      </div>
    </div>`;
  }).join('');
  const totalEl = document.getElementById('productsTotal');
  if (totalEl) totalEl.textContent = `${total} products found`;
}

// ==================== PRODUCT DETAIL ====================
async function showProduct(productId) {
  try {
    const res = await fetch(`${API}/products/${productId}`);
    const data = await res.json();
    const p = data.product;
    if (token) fetch(`${API}/browsing-history`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ productId }) });
    const discount = Math.round((1 - p.price / p.originalPrice) * 100);
    const stockClass = p.stock === 0 ? 'out-stock' : p.stock < 10 ? 'low-stock' : 'in-stock';
    const stockText = p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? `Only ${p.stock} left!` : 'In Stock';

    const modal = document.getElementById('productModal');
    modal.querySelector('.modal-body').innerHTML = `
      <div class="product-detail">
        <div class="image-section"><img src="${p.images[0]}" alt="${p.name}"></div>
        <div class="info-section">
          <span class="brand-tag">${p.brand}</span>
          <h2>${p.name}</h2>
          <div class="rating" style="margin:8px 0">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))} <span style="color:var(--text-muted)">(${p.ratingCount} reviews)</span></div>
          <div class="price-block">
            <span class="current">₹${p.price.toLocaleString()}</span>
            ${p.originalPrice > p.price ? `<span class="original">₹${p.originalPrice.toLocaleString()}</span><span class="save">Save ${discount}%</span>` : ''}
          </div>
          <p class="desc">${p.description}</p>
          <div class="stock-info ${stockClass}">● ${stockText}</div>
          <div class="qty-selector">
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <span class="qty-val" id="detailQty">1</span>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>
          <div class="action-btns">
            <button class="btn-primary" onclick="addToCart('${p.id}',getQty())" ${p.stock===0?'disabled':''}>🛒 Add to Cart</button>
            <button class="btn-secondary" onclick="toggleWishlist('${p.id}')">❤️ Wishlist</button>
          </div>
        </div>
      </div>
      <div class="reviews-section">
        <h3 style="margin-bottom:1rem">Customer Reviews</h3>
        ${currentUser ? `
        <div style="margin-bottom:1.5rem">
          <div style="display:flex;gap:4px;margin-bottom:8px" id="reviewStars">${[1,2,3,4,5].map(i=>`<span style="cursor:pointer;font-size:1.3rem" onclick="setReviewRating(${i})" data-star="${i}">☆</span>`).join('')}</div>
          <div style="display:flex;gap:8px"><input type="text" id="reviewText" placeholder="Write a review..." style="flex:1;padding:10px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:8px;color:var(--text-primary);outline:none">
          <button class="btn-primary" onclick="submitReview('${p.id}')" style="padding:10px 20px">Submit</button></div>
        </div>` : ''}
        <div id="reviewsList">${data.reviews.map(r => `
          <div class="review-card">
            <div class="review-header"><span class="review-user">${r.userName}</span><span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span></div>
            <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            <p class="review-text">${r.comment}</p>
          </div>`).join('') || '<p style="color:var(--text-muted)">No reviews yet. Be the first!</p>'}</div>
      </div>
      ${data.related.length ? `
      <div style="padding:2rem;border-top:1px solid var(--border-glass)">
        <h3 style="margin-bottom:1rem">Related Products</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem">
          ${data.related.map(r => `<div class="product-card" onclick="showProduct('${r.id}')" style="cursor:pointer">
            <div class="image-wrap" style="height:150px"><img src="${r.images[0]}" alt="${r.name}"></div>
            <div class="info"><div class="name">${r.name}</div><div class="price" style="color:var(--accent-teal);font-weight:800">₹${r.price.toLocaleString()}</div></div>
          </div>`).join('')}
        </div>
      </div>` : ''}`;
    modal.classList.add('active');
  } catch(e) { console.error('Product detail error:', e); showToast('Error loading product', 'error'); }
}

let reviewRating = 0;
function setReviewRating(n) {
  reviewRating = n;
  document.querySelectorAll('#reviewStars span').forEach((s,i) => s.textContent = i < n ? '★' : '☆');
}
function getQty() { return parseInt(document.getElementById('detailQty')?.textContent || '1'); }
function changeQty(d) {
  const el = document.getElementById('detailQty');
  const v = Math.max(1, parseInt(el.textContent) + d);
  el.textContent = v;
}

async function submitReview(productId) {
  if (!reviewRating) return showToast('Please select a rating', 'error');
  const comment = document.getElementById('reviewText').value;
  try {
    await fetch(`${API}/reviews`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ productId, rating: reviewRating, comment }) });
    showToast('Review submitted! ⭐', 'success');
    showProduct(productId);
  } catch(e) { showToast('Error submitting review', 'error'); }
}

// ==================== CART ====================
async function addToCart(productId, quantity = 1) {
  if (!token) return window.location.href = '/login.html';
  try {
    const res = await fetch(`${API}/cart`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ productId, quantity }) });
    if (res.ok) { showToast('Added to cart! 🛒', 'success'); loadCart(); }
    else { const d = await res.json(); showToast(d.error, 'error'); }
  } catch(e) { showToast('Error adding to cart', 'error'); }
}

async function loadCart() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/cart`, { headers: authHeaders() });
    const data = await res.json();
    cartCount = data.count;
    const badge = document.getElementById('cartBadge');
    if (badge) { badge.textContent = cartCount; badge.style.display = cartCount > 0 ? 'flex' : 'none'; }
    if (currentPage === 'cart') renderCart(data);
  } catch(e) { console.error('Cart error:', e); }
}

function renderCart(data) {
  const container = document.getElementById('cartContent');
  if (!container) return;
  if (data.items.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🛒</div><h3>Your Cart is Empty</h3><p>Add some products to get started!</p><button class="btn-primary" onclick="navigateTo('shop')">Browse Products</button></div>`;
    return;
  }
  const activeItems = data.items.filter(i => !i.savedForLater);
  const savedItems = data.items.filter(i => i.savedForLater);
  container.innerHTML = `
    <div class="cart-container">
      <div class="cart-items">
        <h2 style="margin-bottom:1rem">Shopping Cart (${activeItems.length})</h2>
        ${activeItems.map(i => `
          <div class="cart-item">
            <img src="${i.product.images[0]}" alt="${i.product.name}" onclick="showProduct('${i.productId}')">
            <div class="details">
              <h3>${i.product.name}</h3>
              <div class="brand">${i.product.brand}</div>
              <div class="price">₹${i.product.price.toLocaleString()}</div>
              <div class="actions">
                <div class="qty-selector" style="margin:0">
                  <button class="qty-btn" onclick="updateCartQty('${i.productId}',${i.quantity - 1})">−</button>
                  <span class="qty-val">${i.quantity}</span>
                  <button class="qty-btn" onclick="updateCartQty('${i.productId}',${i.quantity + 1})">+</button>
                </div>
                <button class="save-later-btn" onclick="saveForLater('${i.productId}')">Save for Later</button>
                <button class="remove-btn" onclick="removeFromCart('${i.productId}')">✕ Remove</button>
              </div>
            </div>
          </div>`).join('')}
        ${savedItems.length ? `<h3 style="margin:2rem 0 1rem">Saved for Later (${savedItems.length})</h3>
          ${savedItems.map(i => `
            <div class="cart-item" style="opacity:0.7">
              <img src="${i.product.images[0]}" alt="${i.product.name}">
              <div class="details">
                <h3>${i.product.name}</h3>
                <div class="price">₹${i.product.price.toLocaleString()}</div>
                <div class="actions">
                  <button class="save-later-btn" onclick="moveToCart('${i.productId}')">Move to Cart</button>
                  <button class="remove-btn" onclick="removeFromCart('${i.productId}')">✕ Remove</button>
                </div>
              </div>
            </div>`).join('')}` : ''}
      </div>
      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>₹${data.total.toLocaleString()}</span></div>
        <div class="summary-row"><span>Savings</span><span class="green">-₹${data.savings.toLocaleString()}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${data.total > 999 ? '<span class="green">FREE</span>' : '₹99'}</span></div>
        <div class="summary-row total"><span>Total</span><span>₹${(data.total + (data.total > 999 ? 0 : 99)).toLocaleString()}</span></div>
        <div class="coupon-input">
          <input type="text" id="couponCode" placeholder="Coupon code">
          <button onclick="applyCoupon()">Apply</button>
        </div>
        <button class="btn-primary" style="width:100%;margin-top:1rem" onclick="navigateTo('checkout')">Proceed to Checkout</button>
      </div>
    </div>`;
}

async function updateCartQty(productId, qty) {
  if (qty < 1) return removeFromCart(productId);
  await fetch(`${API}/cart/${productId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ quantity: qty }) });
  loadCart();
}
async function removeFromCart(productId) {
  await fetch(`${API}/cart/${productId}`, { method: 'DELETE', headers: authHeaders() });
  showToast('Removed from cart', 'info'); loadCart();
}
async function saveForLater(productId) {
  await fetch(`${API}/cart/${productId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ savedForLater: true }) });
  showToast('Saved for later', 'info'); loadCart();
}
async function moveToCart(productId) {
  await fetch(`${API}/cart/${productId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ savedForLater: false }) });
  showToast('Moved to cart', 'success'); loadCart();
}
async function applyCoupon() {
  const code = document.getElementById('couponCode').value.trim().toUpperCase();
  if (!code) return;
  try {
    const res = await fetch(`${API}/coupons/validate`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ code, total: 1000 }) });
    const data = await res.json();
    if (res.ok) showToast(`Coupon applied! Save ₹${data.discount} 🎉`, 'success');
    else showToast(data.error, 'error');
  } catch(e) { showToast('Invalid coupon', 'error'); }
}

// ==================== WISHLIST ====================
async function loadWishlist() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/wishlist`, { headers: authHeaders() });
    const data = await res.json();
    wishlistIds = data.items.map(i => i.id);
    const badge = document.getElementById('wishBadge');
    if (badge) { badge.textContent = wishlistIds.length; badge.style.display = wishlistIds.length > 0 ? 'flex' : 'none'; }
    if (currentPage === 'wishlist') renderWishlist(data.items);
  } catch(e) { console.error('Wishlist error:', e); }
}

async function toggleWishlist(productId) {
  if (!token) return window.location.href = '/login.html';
  try {
    if (wishlistIds.includes(productId)) {
      await fetch(`${API}/wishlist/${productId}`, { method: 'DELETE', headers: authHeaders() });
      showToast('Removed from wishlist', 'info');
    } else {
      await fetch(`${API}/wishlist`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ productId }) });
      showToast('Added to wishlist! ❤️', 'success');
    }
    loadWishlist(); loadProducts();
  } catch(e) { showToast('Error updating wishlist', 'error'); }
}

function renderWishlist(items) {
  const container = document.getElementById('wishlistContent');
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">❤️</div><h3>Your Wishlist is Empty</h3><p>Save your favorite products here!</p><button class="btn-primary" onclick="navigateTo('shop')">Browse Products</button></div>`;
    return;
  }
  container.innerHTML = `<div class="wishlist-grid">${items.map(p => `
    <div class="product-card">
      <div class="image-wrap" onclick="showProduct('${p.id}')">
        <img src="${p.images[0]}" alt="${p.name}">
        <button class="wishlist-btn active" onclick="event.stopPropagation();toggleWishlist('${p.id}')">❤️</button>
      </div>
      <div class="info">
        <div class="brand">${p.brand}</div>
        <div class="name">${p.name}</div>
        <div class="price-row"><span class="price">₹${p.price.toLocaleString()}</span></div>
        <button class="add-cart-btn" onclick="addToCart('${p.id}')">🛒 Move to Cart</button>
      </div>
    </div>`).join('')}</div>`;
}
// ==================== ORDERS ====================
async function loadOrders() {
  if (!token) return;
  try {
    const [ordersRes, returnsRes] = await Promise.all([
      fetch(`${API}/orders`, { headers: authHeaders() }),
      fetch(`${API}/returns`, { headers: authHeaders() })
    ]);

    if (!ordersRes.ok) {
      console.error('Orders API error:', ordersRes.status);
      renderOrders([], []);
      return;
    }

    const ordersData = await ordersRes.json();
    let returnsData = { returns: [] };
    if (returnsRes.ok) {
      try { returnsData = await returnsRes.json(); } catch(_) {}
    }
    renderOrders(ordersData.orders || [], returnsData.returns || []);
  } catch(e) {
    console.error('Orders error:', e);
    const container = document.getElementById('ordersContent');
    if (container) container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Couldn't load orders</h3><p>Please refresh the page.</p></div>`;
  }
}

function renderOrders(orders, existingReturns = []) {
  const container = document.getElementById('ordersContent');
  if (!container) return;
  if (!orders || orders.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📦</div><h3>No Orders Yet</h3><p>Start shopping to see your orders here!</p><button class="btn-primary" onclick="navigateTo('shop')">Start Shopping</button></div>`;
    return;
  }

  existingReturns = existingReturns || [];
  // Build a set of orderIds that already have a return request
  const returnedOrderIds = new Set(existingReturns.map(r => r.orderId));
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const ordersHTML = orders.map(o => {

    // Determine if this order is eligible for return (delivered + within 7 days)
    let returnEligible = false;
    let returnWindowExpiry = null;
    if (o.status === 'delivered') {
      const deliveredEntry = [...(o.statusHistory || [])].reverse().find(h => h.status === 'delivered');
      const deliveredAt = deliveredEntry ? new Date(deliveredEntry.timestamp) : new Date(o.createdAt);
      const elapsed = now - deliveredAt.getTime();
      returnEligible = elapsed <= SEVEN_DAYS_MS;
      const daysLeft = Math.max(0, Math.ceil((SEVEN_DAYS_MS - elapsed) / (1000 * 60 * 60 * 24)));
      returnWindowExpiry = daysLeft;
    }
    const hasReturn = returnedOrderIds.has(o.id);
    const existingReturn = existingReturns.find(r => r.orderId === o.id);

    return `
    <div class="order-card">
      <div class="order-header">
        <div><span class="order-id">${o.id}</span><br><span style="color:var(--text-muted);font-size:0.8rem">${new Date(o.createdAt).toLocaleDateString()}</span></div>
        <div style="display:flex;gap:8px;align-items:center">
          ${hasReturn ? `<span class="return-badge return-${existingReturn.status}">🔄 Return ${existingReturn.status}</span>` : ''}
          <span class="status-badge ${o.status}">${o.status.replace(/_/g,' ')}</span>
        </div>
      </div>
      <div class="order-items">${o.items.map(i => `
        <div class="order-item"><img src="${i.image}" alt="${i.name}"><div><div style="font-size:0.85rem;font-weight:500">${i.name}</div><div style="color:var(--text-muted);font-size:0.75rem">Qty: ${i.quantity}</div></div></div>`).join('')}
      </div>
      <div class="order-footer">
        <span style="font-weight:700;color:var(--accent-teal)">₹${o.total.toLocaleString()}</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${!['delivered','cancelled'].includes(o.status) ? `<button class="action-btn danger" onclick="cancelOrder('${o.id}')">Cancel</button>` : ''}
          <button class="action-btn" onclick="trackOrder('${o.id}')">Track Order</button>
          ${o.status === 'delivered' ? `<button class="action-btn" onclick="reorder('${o.id}')">Reorder</button>` : ''}
          ${returnEligible && !hasReturn ? `<button class="action-btn return-btn" onclick="requestReturn('${o.id}', ${o.total})" title="${returnWindowExpiry} day(s) left to return">↩️ Return / Refund <span style="font-size:0.7rem;opacity:0.7">(${returnWindowExpiry}d left)</span></button>` : ''}
          ${hasReturn ? `<button class="action-btn" onclick="viewReturn('${existingReturn.id}', '${o.id}')" style="border-color:rgba(108,99,255,0.4)">View Return</button>` : ''}
          ${o.status === 'delivered' && !returnEligible && !hasReturn ? `<span style="font-size:0.75rem;color:var(--text-muted)">Return window expired</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  // Returns summary section
  const returnsHTML = existingReturns.length > 0 ? `
    <div style="margin-top:2rem">
      <h3 style="margin-bottom:1rem;display:flex;align-items:center;gap:8px">🔄 My Return Requests <span style="font-size:0.8rem;color:var(--text-muted);font-weight:400">(${existingReturns.length} total)</span></h3>
      ${existingReturns.map(r => `
        <div class="order-card" style="border-left:3px solid ${r.status==='approved'?'var(--accent-teal)':r.status==='rejected'?'var(--accent-coral)':r.status==='completed'?'#22c55e':'var(--accent-purple)'}">
          <div class="order-header">
            <div>
              <span class="order-id">${r.id}</span>
              <span style="margin-left:8px;font-size:0.75rem;color:var(--text-muted)">for ${r.orderId}</span>
              <br><span style="color:var(--text-muted);font-size:0.75rem">${new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <span class="return-badge return-${r.status}">🔄 ${r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span>
          </div>
          <div style="display:flex;gap:1.5rem;padding:0.5rem 0;flex-wrap:wrap">
            <div><div style="font-size:0.75rem;color:var(--text-muted)">Type</div><div style="font-weight:600;font-size:0.9rem;text-transform:capitalize">${r.type}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-muted)">Reason</div><div style="font-weight:500;font-size:0.85rem">${r.reason}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-muted)">Refund Amount</div><div style="font-weight:700;color:var(--accent-teal)">₹${r.refundAmount.toLocaleString()}</div></div>
          </div>
          ${r.adminNote ? `<div style="margin-top:0.5rem;padding:0.5rem;background:var(--bg-glass);border-radius:8px;font-size:0.85rem;color:var(--text-secondary)">💬 Admin: ${r.adminNote}</div>` : ''}
        </div>`).join('')}
    </div>` : '';

  container.innerHTML = `<div class="orders-list">${ordersHTML}</div>${returnsHTML}`;
}

window.cancelOrder = function(orderId) {
  const modal = document.getElementById('productModal');
  modal.querySelector('.modal-body').innerHTML = `
    <div style="padding:2rem;max-height:80vh;overflow-y:auto">
      <h2 style="margin-bottom:0.5rem">Cancel Order</h2>
      <p style="color:var(--text-muted);margin-bottom:1.5rem">Please select a reason for cancelling:</p>
      
      <form id="cancelReasonForm" style="display:flex;flex-direction:column;gap:12px">
        <label class="radio-label"><input type="radio" name="reason" value="Ordered by mistake" required> Ordered by mistake</label>
        <label class="radio-label"><input type="radio" name="reason" value="Found a better price elsewhere"> Found a better price elsewhere</label>
        <label class="radio-label"><input type="radio" name="reason" value="Delivery time is too long"> Delivery time is too long</label>
        <label class="radio-label"><input type="radio" name="reason" value="Changed my mind"> Changed my mind</label>
        <label class="radio-label"><input type="radio" name="reason" value="Ordered wrong product/size"> Ordered wrong product/size</label>
        <label class="radio-label"><input type="radio" name="reason" value="Payment issue"> Payment issue</label>
        <label class="radio-label"><input type="radio" name="reason" value="Shipping cost too high"> Shipping cost too high</label>
        <label class="radio-label"><input type="radio" name="reason" value="Product not needed anymore"> Product not needed anymore</label>
        <label class="radio-label"><input type="radio" name="reason" value="Duplicate order"> Duplicate order</label>
        <label class="radio-label"><input type="radio" name="reason" value="Other"> Other</label>
        
        <div style="margin-top:10px;">
          <label style="display:block;margin-bottom:5px;font-size:0.9rem">👉 Tell us more (optional)</label>
          <textarea id="cancelFeedback" rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-glass);background:rgba(0,0,0,0.2);color:inherit" placeholder="Allow users to type their reason..."></textarea>
        </div>
        
        <div style="display:flex;gap:10px;margin-top:20px">
          <button type="button" class="btn-secondary" onclick="document.getElementById('productModal').classList.remove('active')" style="flex:1">Keep Order</button>
          <button type="submit" class="btn-primary" style="flex:1;background:var(--error);border-color:var(--error)">Confirm Cancel</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.add('active');

  document.getElementById('cancelReasonForm').onsubmit = async (e) => {
    e.preventDefault();
    const reason = document.querySelector('input[name="reason"]:checked').value;
    const notes = document.getElementById('cancelFeedback').value;
    
    try {
      const res = await fetch(`${API}/orders/${orderId}/cancel`, { 
        method: 'PUT', 
        headers: authHeaders(),
        body: JSON.stringify({ reason, notes })
      });
      if (res.ok) { 
        showToast('Order cancelled successfully', 'success'); 
        document.getElementById('productModal').classList.remove('active');
        loadOrders(); 
      }
      else { const d = await res.json(); showToast(d.error, 'error'); }
    } catch(err) { showToast('Error cancelling order', 'error'); }
  };
};

async function trackOrder(orderId) {
  try {
    const res = await fetch(`${API}/orders/${orderId}`, { headers: authHeaders() });
    const data = await res.json();
    const o = data.order;

    // All possible steps in order journey
    const allSteps = [
      { key: 'confirmed',        label: 'Order Confirmed',     icon: '✅' },
      { key: 'processing',       label: 'Processing',          icon: '⚙️' },
      { key: 'shipped',          label: 'Shipped',             icon: '🚚' },
      { key: 'out_for_delivery', label: 'Out for Delivery',    icon: '🛵' },
      { key: 'delivered',        label: 'Delivered',           icon: '🎉' }
    ];

    const isCancelled = o.status === 'cancelled';
    const currentIdx = allSteps.findIndex(s => s.key === o.status);

    // Build a map of status → history entry for timestamp & message
    const historyMap = {};
    (o.statusHistory || []).forEach(h => { historyMap[h.status] = h; });

    const stepsHTML = isCancelled
      ? `<div class="timeline-item active" style="border-left-color:#ef4444">
           <div class="status" style="color:#ef4444">❌ Order Cancelled</div>
           <div class="time">${historyMap['cancelled'] ? new Date(historyMap['cancelled'].timestamp).toLocaleString() : ''}</div>
           <p style="color:var(--text-secondary);font-size:0.85rem">${historyMap['cancelled']?.message || 'Order was cancelled'}</p>
         </div>`
      : allSteps.map((step, i) => {
          const h = historyMap[step.key];
          let cls = 'pending';
          if (i < currentIdx) cls = 'completed';
          else if (i === currentIdx) cls = 'active';
          return `
            <div class="timeline-item ${cls}">
              <div class="status">${step.icon} ${step.label}</div>
              ${h ? `<div class="time">${new Date(h.timestamp).toLocaleString()}</div>
                     <p style="color:var(--text-secondary);font-size:0.85rem">${h.message}</p>`
                  : `<div class="time" style="color:var(--text-muted);font-size:0.8rem">Pending</div>`}
            </div>`;
        }).join('');

    const modal = document.getElementById('productModal');
    modal.querySelector('.modal-body').innerHTML = `
      <div style="padding:2rem">
        <h2 style="margin-bottom:0.5rem">📦 Track Order</h2>
        <p style="color:var(--text-muted);margin-bottom:0.5rem">${o.id}</p>
        <span class="status-badge ${o.status}" style="display:inline-block;margin-bottom:1.5rem">${o.status.replace(/_/g,' ')}</span>
        <div class="order-timeline">${stepsHTML}</div>
        ${!isCancelled ? `
        <div style="margin-top:2rem;padding:1rem;background:var(--bg-glass);border-radius:12px">
          <p style="color:var(--text-secondary);font-size:0.85rem">Estimated Delivery</p>
          <p style="font-weight:700;font-size:1.1rem">${new Date(o.estimatedDelivery).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>` : ''}
      </div>`;
    modal.classList.add('active');
  } catch(e) { showToast('Error loading order', 'error'); }
}

async function reorder(orderId) {
  try {
    const res = await fetch(`${API}/orders/${orderId}`, { headers: authHeaders() });
    const data = await res.json();
    for (const item of data.order.items) { await addToCart(item.productId, item.quantity); }
    showToast('Items added to cart! 🛒', 'success');
    navigateTo('cart');
  } catch(e) { showToast('Error reordering', 'error'); }
}

// ==================== RETURN / REFUND ====================
window.requestReturn = function(orderId, orderTotal) {
  const modal = document.getElementById('productModal');
  modal.querySelector('.modal-body').innerHTML = `
    <div style="padding:2rem;max-height:85vh;overflow-y:auto">
      <h2 style="margin-bottom:0.3rem">↩️ Return / Refund Request</h2>
      <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.85rem">Order: <strong>${orderId}</strong> &nbsp;·&nbsp; Refund: <strong>₹${Number(orderTotal).toLocaleString()}</strong></p>

      <div style="background:rgba(0,212,170,0.08);border:1px solid rgba(0,212,170,0.2);border-radius:12px;padding:1rem;margin-bottom:1.5rem">
        <div style="color:var(--accent-teal);font-weight:600;font-size:0.85rem;margin-bottom:4px">✅ Return Policy</div>
        <div style="color:var(--text-secondary);font-size:0.82rem;line-height:1.6">
          • Returns accepted within <strong>7 days</strong> of delivery<br>
          • Refund processed within 5–7 business days<br>
          • Item must be unused and in original packaging
        </div>
      </div>

      <form id="returnForm" style="display:flex;flex-direction:column;gap:1rem">
        <!-- Return Type -->
        <div>
          <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:8px;color:var(--text-secondary)">REQUEST TYPE</label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
            <label class="return-type-card selected" data-type="refund" onclick="selectReturnType(this,'refund')">
              <input type="radio" name="returnType" value="refund" checked style="display:none">
              <div style="font-size:1.5rem;margin-bottom:4px">💰</div>
              <div style="font-weight:600;font-size:0.85rem">Refund</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">Get money back</div>
            </label>
            <label class="return-type-card" data-type="return" onclick="selectReturnType(this,'return')">
              <input type="radio" name="returnType" value="return" style="display:none">
              <div style="font-size:1.5rem;margin-bottom:4px">📦</div>
              <div style="font-weight:600;font-size:0.85rem">Return</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">Send item back</div>
            </label>
            <label class="return-type-card" data-type="exchange" onclick="selectReturnType(this,'exchange')">
              <input type="radio" name="returnType" value="exchange" style="display:none">
              <div style="font-size:1.5rem;margin-bottom:4px">🔄</div>
              <div style="font-weight:600;font-size:0.85rem">Exchange</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">Replace item</div>
            </label>
          </div>
        </div>

        <!-- Reason -->
        <div>
          <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:8px;color:var(--text-secondary)">REASON FOR RETURN</label>
          <select id="returnReason" style="width:100%;padding:12px 16px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:10px;color:var(--text-primary);font-size:0.9rem;outline:none" required>
            <option value="" disabled selected>Select a reason...</option>
            <option>Damaged or defective product</option>
            <option>Wrong item delivered</option>
            <option>Product not as described</option>
            <option>Size or fit issue</option>
            <option>Changed my mind</option>
            <option>Better price found elsewhere</option>
            <option>Missing parts or accessories</option>
            <option>Other</option>
          </select>
        </div>

        <!-- Description -->
        <div>
          <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:8px;color:var(--text-secondary)">DESCRIBE THE ISSUE (optional)</label>
          <textarea id="returnDescription" rows="3" placeholder="Tell us more about the issue..." style="width:100%;padding:12px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:10px;color:var(--text-primary);font-family:Inter,sans-serif;resize:vertical;outline:none;font-size:0.9rem"></textarea>
        </div>

        <div style="display:flex;gap:10px;margin-top:0.5rem">
          <button type="button" class="btn-secondary" onclick="document.getElementById('productModal').classList.remove('active')" style="flex:1">Cancel</button>
          <button type="submit" class="btn-primary" style="flex:2" id="returnSubmitBtn">Submit Request →</button>
        </div>
      </form>
    </div>`;
  modal.classList.add('active');

  document.getElementById('returnForm').onsubmit = async (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="returnType"]:checked')?.value;
    const reason = document.getElementById('returnReason').value;
    const description = document.getElementById('returnDescription').value;
    if (!reason) return showToast('Please select a reason', 'error');

    const btn = document.getElementById('returnSubmitBtn');
    btn.textContent = 'Submitting...'; btn.disabled = true;

    try {
      const res = await fetch(`${API}/orders/${orderId}/return`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ type, reason, description })
      });
      const data = await res.json();
      if (res.ok) {
        modal.querySelector('.modal-body').innerHTML = `
          <div style="padding:3rem;text-align:center">
            <div style="font-size:4rem;margin-bottom:1rem">✅</div>
            <h2 style="margin-bottom:0.5rem">Request Submitted!</h2>
            <p style="color:var(--text-secondary);margin-bottom:0.5rem">Your return request <strong style="color:var(--accent-teal)">${data.returnRequest.id}</strong> has been submitted.</p>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:2rem">We'll review your request and process the ${type} within 2–3 business days.</p>
            <button class="btn-primary" onclick="document.getElementById('productModal').classList.remove('active');loadOrders()">View My Orders</button>
          </div>`;
        showToast('Return request submitted! 🔄', 'success');
      } else {
        showToast(data.error || 'Failed to submit return', 'error');
        btn.textContent = 'Submit Request →'; btn.disabled = false;
      }
    } catch(err) { showToast('Error submitting return', 'error'); btn.textContent = 'Submit Request →'; btn.disabled = false; }
  };
};

window.selectReturnType = function(el, type) {
  document.querySelectorAll('.return-type-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const radio = el.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
};

window.viewReturn = async function(returnId, orderId) {
  try {
    const res = await fetch(`${API}/returns`, { headers: authHeaders() });
    const data = await res.json();
    const r = data.returns.find(x => x.id === returnId);
    if (!r) return showToast('Return not found', 'error');

    const statusColors = { pending: 'var(--accent-purple)', approved: 'var(--accent-teal)', rejected: 'var(--accent-coral)', completed: '#22c55e' };
    const statusIcons = { pending: '⏳', approved: '✅', rejected: '❌', completed: '🎉' };

    const modal = document.getElementById('productModal');
    modal.querySelector('.modal-body').innerHTML = `
      <div style="padding:2rem">
        <h2 style="margin-bottom:0.3rem">🔄 Return Request</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1.5rem">${r.id} &nbsp;·&nbsp; for order ${r.orderId}</p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
          <div style="background:var(--bg-glass);border-radius:12px;padding:1rem">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">STATUS</div>
            <div style="font-weight:700;font-size:1.1rem;color:${statusColors[r.status]}">${statusIcons[r.status]} ${r.status.toUpperCase()}</div>
          </div>
          <div style="background:var(--bg-glass);border-radius:12px;padding:1rem">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">REFUND AMOUNT</div>
            <div style="font-weight:700;font-size:1.1rem;color:var(--accent-teal)">₹${r.refundAmount.toLocaleString()}</div>
          </div>
          <div style="background:var(--bg-glass);border-radius:12px;padding:1rem">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">TYPE</div>
            <div style="font-weight:600;text-transform:capitalize">${r.type}</div>
          </div>
          <div style="background:var(--bg-glass);border-radius:12px;padding:1rem">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">SUBMITTED</div>
            <div style="font-weight:500;font-size:0.85rem">${new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
          </div>
        </div>

        <div style="background:var(--bg-glass);border-radius:12px;padding:1rem;margin-bottom:1rem">
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px">REASON</div>
          <div style="font-weight:500">${r.reason}</div>
          ${r.description ? `<div style="color:var(--text-secondary);font-size:0.85rem;margin-top:6px">${r.description}</div>` : ''}
        </div>

        ${r.adminNote ? `<div style="background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.2);border-radius:12px;padding:1rem;margin-bottom:1rem">
          <div style="font-size:0.8rem;color:var(--accent-purple);margin-bottom:4px;font-weight:600">💬 ADMIN NOTE</div>
          <div style="font-size:0.9rem">${r.adminNote}</div>
        </div>` : ''}

        <div style="margin-top:1.5rem">
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.8rem">STATUS HISTORY</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${r.statusHistory.map(h => `
              <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-glass)">
                <div style="width:8px;height:8px;border-radius:50%;background:${statusColors[h.status]||'var(--text-muted)'};margin-top:5px;flex-shrink:0"></div>
                <div style="flex:1">
                  <div style="font-weight:600;text-transform:capitalize;font-size:0.85rem">${h.status}</div>
                  <div style="color:var(--text-muted);font-size:0.75rem">${new Date(h.timestamp).toLocaleString()}</div>
                  ${h.message ? `<div style="color:var(--text-secondary);font-size:0.8rem;margin-top:2px">${h.message}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>

        <button class="btn-secondary" style="width:100%;margin-top:1.5rem" onclick="document.getElementById('productModal').classList.remove('active')">Close</button>
      </div>`;
    modal.classList.add('active');
  } catch(e) { showToast('Error loading return details', 'error'); }
};



// ==================== CHECKOUT ====================
async function loadCheckout() {
  if (!token) return window.location.href = '/login.html';
  try {
    const [cartRes, addrRes] = await Promise.all([
      fetch(`${API}/cart`, { headers: authHeaders() }),
      fetch(`${API}/addresses`, { headers: authHeaders() })
    ]);
    const cartData = await cartRes.json();
    const addrData = await addrRes.json();
    renderCheckout(cartData, addrData.addresses);
  } catch(e) { console.error('Checkout error:', e); }
}

function renderCheckout(cartData, addresses) {
  const container = document.getElementById('checkoutContent');
  if (!container) return;
  const activeItems = cartData.items.filter(i => !i.savedForLater);
  const shipping = cartData.total > 999 ? 0 : 99;
  const tax = Math.round(cartData.total * 0.18);
  container.innerHTML = `
    <div class="checkout-container">
      <div class="checkout-step">
        <h3><span class="step-num">1</span>Delivery Address</h3>
        <div class="address-cards" id="addressCards">
          ${addresses.map(a => `
            <div class="address-card ${a.isDefault ? 'selected' : ''}" data-id="${a.id}" onclick="selectAddress(this,'${a.id}')">
              <div class="label">${a.label} ${a.isDefault ? '<span class="default-badge">Default</span>' : ''}</div>
              <div class="text">${a.street}<br>${a.city}, ${a.state} - ${a.zip}<br>📞 ${a.phone}</div>
            </div>`).join('')}
          <div class="address-card" onclick="showAddAddressForm()" style="display:flex;align-items:center;justify-content:center;min-height:120px;border-style:dashed">
            <div style="text-align:center;color:var(--text-muted)"><div style="font-size:2rem">+</div>Add New Address</div>
          </div>
        </div>
        <div id="newAddressForm" style="display:none;margin-top:1rem">
          <div class="form-row">
            <div class="form-group"><label>Label</label><input type="text" id="addrLabel" placeholder="Home, Office..."></div>
            <div class="form-group"><label>Phone</label><input type="text" id="addrPhone" placeholder="Phone number"></div>
          </div>
          <div class="form-group"><label>Street</label><input type="text" id="addrStreet" placeholder="Street address"></div>
          <div class="form-row">
            <div class="form-group"><label>City</label><input type="text" id="addrCity" placeholder="City"></div>
            <div class="form-group"><label>State</label><input type="text" id="addrState" placeholder="State"></div>
          </div>
          <div class="form-group"><label>ZIP</label><input type="text" id="addrZip" placeholder="ZIP code"></div>
          <button class="btn-primary" onclick="saveAddress()" style="margin-top:0.5rem">Save Address</button>
        </div>
      </div>
      <div class="checkout-step">
        <h3><span class="step-num">2</span>Payment Method</h3>
        <div class="payment-options">
          <div class="payment-option selected" data-method="upi" onclick="selectPayment(this,'upi')"><div class="icon">📱</div><div class="label">UPI</div><div style="font-size:0.75rem;color:var(--text-muted)">GPay / PhonePe</div></div>
          <div class="payment-option" data-method="card" onclick="selectPayment(this,'card')"><div class="icon">💳</div><div class="label">Card</div><div style="font-size:0.75rem;color:var(--text-muted)">Credit / Debit</div></div>
          <div class="payment-option" data-method="netbanking" onclick="selectPayment(this,'netbanking')"><div class="icon">🏦</div><div class="label">Net Banking</div><div style="font-size:0.75rem;color:var(--text-muted)">All banks</div></div>
          <div class="payment-option" data-method="cod" onclick="selectPayment(this,'cod')"><div class="icon">💵</div><div class="label">Cash on Delivery</div><div style="font-size:0.75rem;color:var(--text-muted)">Pay at door</div></div>
        </div>
      </div>
      <div class="checkout-step">
        <h3><span class="step-num">3</span>Order Summary</h3>
        ${activeItems.map(i => `
          <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-glass)">
            <img src="${i.product.images[0]}" style="width:50px;height:50px;border-radius:8px;object-fit:cover">
            <div style="flex:1"><div style="font-size:0.9rem;font-weight:500">${i.product.name}</div><div style="color:var(--text-muted);font-size:0.8rem">Qty: ${i.quantity}</div></div>
            <span style="font-weight:700">₹${(i.product.price * i.quantity).toLocaleString()}</span>
          </div>`).join('')}
        <div style="margin-top:1rem">
          <div class="summary-row"><span>Subtotal</span><span>₹${cartData.total.toLocaleString()}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span class="green">FREE</span>' : '₹99'}</span></div>
          <div class="summary-row"><span>Tax (18%)</span><span>₹${tax.toLocaleString()}</span></div>
          <div class="coupon-input"><input type="text" id="checkoutCoupon" placeholder="Coupon code"><button onclick="applyCheckoutCoupon()">Apply</button></div>
          <div id="couponDiscount"></div>
          <div class="summary-row total"><span>Total</span><span id="checkoutTotal">₹${(cartData.total + shipping + tax).toLocaleString()}</span></div>
        </div>
      </div>
      <button class="btn-primary" style="width:100%;padding:16px;font-size:1.1rem" onclick="placeOrder()">🛍️ Place Order</button>
    </div>`;
  window._checkoutData = { cartData, shipping, tax, addresses };
}

let selectedAddress = null, selectedPayment = 'upi', checkoutDiscount = 0;
function selectAddress(el, id) { selectedAddress = id; document.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected')); el.classList.add('selected'); }
function selectPayment(el, method) { selectedPayment = method; document.querySelectorAll('.payment-option').forEach(c => c.classList.remove('selected')); el.classList.add('selected'); }
function showAddAddressForm() { document.getElementById('newAddressForm').style.display = 'block'; }
async function saveAddress() {
  const data = { label: document.getElementById('addrLabel').value, street: document.getElementById('addrStreet').value, city: document.getElementById('addrCity').value, state: document.getElementById('addrState').value, zip: document.getElementById('addrZip').value, phone: document.getElementById('addrPhone').value, isDefault: false };
  await fetch(`${API}/addresses`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  showToast('Address saved!', 'success'); loadCheckout();
}

async function placeOrder() {
  if (!selectedAddress) {
    const defaultAddr = window._checkoutData?.addresses?.find(a => a.isDefault);
    selectedAddress = defaultAddr?.id;
  }
  if (!selectedAddress) return showToast('Please select a delivery address', 'error');
  try {
    const res = await fetch(`${API}/orders`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ addressId: selectedAddress, paymentMethod: selectedPayment }) });
    const data = await res.json();
    if (res.ok) {
      const overlay = document.getElementById('successOverlay');
      overlay.querySelector('.order-id-display').textContent = data.order.id;
      overlay.classList.add('active');
      loadCart();
    } else showToast(data.error, 'error');
  } catch(e) { showToast('Error placing order', 'error'); }
}

// ==================== NOTIFICATIONS ====================
async function loadNotifications() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/notifications`, { headers: authHeaders() });
    const data = await res.json();
    const unread = data.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notifBadge');
    if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
    renderNotifications(data.notifications);
  } catch(e) { console.error('Notifications error:', e); }
}

function renderNotifications(notifications) {
  const panel = document.getElementById('notificationsPanel');
  if (!panel) return;
  panel.querySelector('.notif-list').innerHTML = notifications.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:2rem">No notifications yet</p>'
    : notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n.id}')">
        <div class="title">${n.title}</div>
        <div class="message">${n.message}</div>
        <div class="time">${timeAgo(new Date(n.createdAt))}</div>
      </div>`).join('');
}

function showNotifications() {
  document.getElementById('notificationsPanel')?.classList.toggle('active');
}
async function markNotifRead(id) {
  await fetch(`${API}/notifications/${id}/read`, { method: 'PUT', headers: authHeaders() });
  loadNotifications();
}

// ==================== SEARCH ====================
let searchTimeout;
function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = e.target.value.trim();
    if (q.length < 2) { document.getElementById('searchSuggestions')?.classList.remove('active'); return; }
    searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/products/search-suggestions?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const container = document.getElementById('searchSuggestions');
        if (data.suggestions.length > 0) {
          container.innerHTML = data.suggestions.map(s => `
            <div class="suggestion-item" onclick="showProduct('${s.id}')">
              <img src="${s.image}" alt="${s.name}">
              <div><div style="font-weight:500;font-size:0.9rem">${s.name}</div><div style="color:var(--text-muted);font-size:0.8rem">${s.brand} · ₹${s.price.toLocaleString()}</div></div>
            </div>`).join('');
          container.classList.add('active');
        } else container.classList.remove('active');
      } catch(e) {}
    }, 300);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { filters.search = input.value; loadProducts(); navigateTo('shop'); document.getElementById('searchSuggestions')?.classList.remove('active'); }
  });
}

// ==================== VOICE SEARCH ====================
function startVoiceSearch() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { showToast('Voice search not supported', 'error'); return; }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN'; recognition.continuous = false;
  const btn = document.querySelector('.voice-btn');
  btn?.classList.add('listening');
  showToast('🎤 Listening...', 'info');
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById('searchInput').value = transcript;
    filters.search = transcript; loadProducts(); navigateTo('shop');
    btn?.classList.remove('listening');
  };
  recognition.onerror = () => { btn?.classList.remove('listening'); showToast('Voice search failed', 'error'); };
  recognition.onend = () => btn?.classList.remove('listening');
  recognition.start();
}

// ==================== IMAGE SEARCH ====================
function startImageSearch() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!token) return window.location.href = '/login.html';
    showToast('🔍 Searching by image...', 'info');
    const formData = new FormData(); formData.append('image', file);
    try {
      const res = await fetch(`${API}/search/image`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await res.json();
      allProducts = data.products; renderProducts(data.products, data.products.length);
      navigateTo('shop'); showToast('Found similar products! 📷', 'success');
    } catch(e) { showToast('Image search failed', 'error'); }
  };
  input.click();
}

// ==================== CHATBOT ====================
function toggleChatbot() { document.getElementById('chatbotPanel')?.classList.toggle('active'); }
async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim(); if (!message) return;
  if (!token) return showToast('Please login to use chatbot', 'error');
  input.value = '';
  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML += `<div class="chat-msg user">${message}</div>`;
  msgs.scrollTop = msgs.scrollHeight;
  try {
    const res = await fetch(`${API}/chatbot`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ message }) });
    const data = await res.json();
    msgs.innerHTML += `<div class="chat-msg bot">${data.reply}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  } catch(e) { msgs.innerHTML += `<div class="chat-msg bot">Sorry, I'm having trouble. Please try again.</div>`; }
}

// ==================== RECOMMENDATIONS ====================
async function loadRecommendations() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/recommendations`, { headers: authHeaders() });
    const data = await res.json();
    const container = document.getElementById('recommendationsGrid');
    if (container && data.recommendations.length > 0) {
      container.innerHTML = data.recommendations.slice(0, 8).map(p => `
        <div class="product-card" onclick="showProduct('${p.id}')">
          <div class="image-wrap" style="height:180px"><img src="${p.images[0]}" alt="${p.name}"></div>
          <div class="info">
            <div class="brand">${p.brand}</div>
            <div class="name">${p.name}</div>
            <div class="price-row"><span class="price">₹${p.price.toLocaleString()}</span></div>
            <div class="rating">${'★'.repeat(Math.floor(p.rating))} <span>(${p.ratingCount})</span></div>
          </div>
        </div>`).join('');
      document.getElementById('recommendationsSection')?.style.setProperty('display', 'block');
    }
  } catch(e) { console.error('Recommendations error:', e); }
}

// ==================== NAVIGATION ====================
function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  switch(page) {
    case 'cart': loadCart(); break;
    case 'wishlist': loadWishlist(); break;
    case 'orders': loadOrders(); break;
    case 'checkout': loadCheckout(); break;
    case 'shop': loadProducts(); break;
    case 'home': loadProducts(); loadRecommendations(); break;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== FILTERS ====================
function applyFilters() {
  filters.minPrice = document.getElementById('filterMinPrice')?.value || '';
  filters.maxPrice = document.getElementById('filterMaxPrice')?.value || '';
  filters.rating = document.getElementById('filterRating')?.value || '';
  filters.sort = document.getElementById('filterSort')?.value || '';
  loadProducts();
}
function clearFilters() {
  filters = { category: '', search: '', minPrice: '', maxPrice: '', brand: '', rating: '', sort: '' };
  document.querySelectorAll('#filterCategories input').forEach(i => i.checked = false);
  ['filterMinPrice','filterMaxPrice','filterRating','filterSort'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  loadProducts();
}

// ==================== UTILITIES ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || (() => { const c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); return c; })();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function timeAgo(date) {
  const s = Math.floor((new Date() - date) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function setupScrollEffect() {
  window.addEventListener('scroll', () => {
    document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function setupEventListeners() {
  setupSearch();
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) document.getElementById('searchSuggestions')?.classList.remove('active');
    if (!e.target.closest('.notifications-panel') && !e.target.closest('#notifBtn')) document.getElementById('notificationsPanel')?.classList.remove('active');
  });
  document.getElementById('chatInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });
}

function closeModal() { document.getElementById('productModal')?.classList.remove('active'); }
function closeSuccess() { document.getElementById('successOverlay')?.classList.remove('active'); navigateTo('orders'); }
function toggleUserMenu() {
  const existing = document.getElementById('userDropdown');
  if (existing) { existing.remove(); return; }
  const menu = document.createElement('div');
  menu.id = 'userDropdown';
  menu.style.cssText = 'position:fixed;top:65px;right:20px;background:var(--bg-card);border:1px solid var(--border-glass);border-radius:12px;padding:8px;z-index:2000;min-width:180px;box-shadow:0 20px 60px rgba(0,0,0,0.5)';
  menu.innerHTML = `
    <div style="padding:10px 12px;border-bottom:1px solid var(--border-glass);margin-bottom:4px"><div style="font-weight:600">${currentUser.name}</div><div style="color:var(--text-muted);font-size:0.8rem">${currentUser.email}</div></div>
    <div class="suggestion-item" onclick="navigateTo('orders');document.getElementById('userDropdown')?.remove()">📦 My Orders</div>
    <div class="suggestion-item" onclick="navigateTo('wishlist');document.getElementById('userDropdown')?.remove()">❤️ Wishlist</div>
    <div class="suggestion-item" onclick="logout()" style="color:var(--accent-coral)">🚪 Logout</div>`;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', function handler(e) { if (!e.target.closest('#userDropdown')) { menu.remove(); document.removeEventListener('click', handler); } }), 10);
}

function logout() {
  token = null; currentUser = null;
  localStorage.removeItem('shopwave_token');
  window.location.reload();
}
