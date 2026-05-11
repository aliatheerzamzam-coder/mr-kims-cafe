/* ============================================================
   Mr. Kim's CAFE — Favorites
   Public globals: loadFavorites, renderFavsList, renderFavoritesPanel,
                   toggleFavorite, addToCartFromFav
   Depends on globals (defined in index.js):
     authState (window.authState), menuData (window.menuData),
     authHeader, showToast, openAuthModal, updateAuthUI,
     addToCart, closeProfileModal, esc
   ============================================================ */
(function () {

  function renderFavoritesPanel() {
    const grid = document.getElementById('menu-grid');
    document.getElementById('cat-panel-title').innerHTML =
      `<span class="en">⭐ Favorites</span><span class="ar">⭐ المفضلة</span>`;

    // Clear active tile selection (favorites is not a category tile)
    document.querySelectorAll('.cat-tile').forEach(t => t.classList.remove('active'));
    // Show all tiles so user can navigate back to a category
    document.querySelectorAll('.cat-tile').forEach(t => t.style.display = '');

    if (!window.authState.customer) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--text-soft);">
        <div style="font-size:2.5rem;margin-bottom:12px;">⭐</div>
        <div style="font-weight:800;margin-bottom:8px;">
          <span class="en">Login to see your favorites</span><span class="ar">سجّل الدخول لعرض المفضلة</span>
        </div>
        <button class="btn-add" style="margin-top:8px;" onclick="openAuthModal('login')">
          <span class="en">Login</span><span class="ar">دخول</span>
        </button>
      </div>`;
      return;
    }

    const favKeys = new Set(window.authState.favorites.map(f => f.menu_key));
    if (favKeys.size === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--text-soft);">
        <div style="font-size:2.5rem;margin-bottom:12px;">⭐</div>
        <span class="en">No favorites yet. Tap ★ on any item to save it!</span>
        <span class="ar">لا مفضلة بعد. اضغط ★ على أي عنصر لحفظه!</span>
      </div>`;
      return;
    }

    // Render favorites as menu cards
    const cards = window.authState.favorites.map(fav => {
      const key = fav.menu_key; // "hot-coffee:0" format
      return `
      <div class="menu-card">
        <button class="btn-star starred" onclick="toggleFavorite('${key}','${esc(fav.menu_name)}','${esc(fav.menu_name_ar)}','${fav.menu_emoji}',${fav.menu_price})" title="Remove from favorites">★</button>
        <div class="card-thumb-placeholder">${fav.menu_emoji}</div>
        <div class="card-body">
          <div class="card-name en">${esc(fav.menu_name)}</div>
          <div class="card-name ar">${esc(fav.menu_name_ar)}</div>
          <div class="card-footer">
            <div>
              <div class="card-price en">${parseInt(fav.menu_price).toLocaleString()} IQD</div>
              <div class="card-price ar">${parseInt(fav.menu_price).toLocaleString()} دينار</div>
            </div>
            <button class="btn-add" onclick="addToCartFromFav('${key}')">
              <span class="en">+ Add</span><span class="ar">+ أضف</span>
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    grid.innerHTML = cards;
    grid.classList.remove('updated');
    void grid.offsetWidth;
    grid.classList.add('updated');
  }

  function addToCartFromFav(key) {
    const [cat, idx] = key.split(':');
    addToCart(cat, parseInt(idx));
  }

  async function loadFavorites() {
    if (!window.authState.token) return;
    try {
      const res = await fetch('/api/customers/favorites', { headers: authHeader() });
      if (res.ok) window.authState.favorites = await res.json();
    } catch (e) { console.warn('[favorites] fetch failed', e); }
  }

  function renderFavsList() {
    const el = document.getElementById('favs-list');
    const l = document.getElementById('html-root').lang;
    if (!window.authState.favorites || window.authState.favorites.length === 0) {
      el.innerHTML = `<div style="text-align:center;padding:32px 0;color:var(--text-soft);font-size:0.85rem;">
        ${l==='ar' ? 'لا مفضلة بعد' : 'No favorites yet. Tap ★ on any menu item!'}
      </div>`;
      return;
    }
    el.innerHTML = window.authState.favorites.map(fav => {
      const key = fav.menu_key;
      const name = l==='ar' ? (fav.menu_name_ar||fav.menu_name) : fav.menu_name;
      return `<div class="fav-card">
        <span class="fav-emoji">${fav.menu_emoji}</span>
        <div class="fav-info">
          <div class="fav-name">${esc(name)}</div>
          <div class="fav-price">${parseInt(fav.menu_price).toLocaleString()} IQD</div>
        </div>
        <button class="btn-fav-add" onclick="addToCartFromFav('${key}');closeProfileModal()">
          ${l==='ar' ? '+ أضف' : '+ Add'}
        </button>
        <button class="btn-fav-remove" onclick="toggleFavorite('${key}','','','','',true)" title="Remove">✕</button>
      </div>`;
    }).join('');
  }

  async function toggleFavorite(key, name, nameAr, emoji, price, fromProfile) {
    if (!window.authState.customer) {
      openAuthModal('login');
      showToast(document.getElementById('html-root').lang === 'ar' ? 'سجّل الدخول لحفظ المفضلة' : 'Login to save favorites');
      return;
    }
    const [cat, idx] = key.split(':');
    const item = window.menuData[cat]?.items?.[parseInt(idx)];
    const finalName    = name    || item?.en   || '';
    const finalNameAr  = nameAr  || item?.ar   || '';
    const finalEmoji   = emoji   || item?.emoji || '';
    const finalPrice   = price   || item?.price || 0;

    try {
      const res = await fetch('/api/customers/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ menu_key: key, menu_name: finalName, menu_name_ar: finalNameAr, menu_emoji: finalEmoji, menu_price: finalPrice })
      });
      if (!res.ok) return;
      const data = await res.json();
      await loadFavorites();
      updateAuthUI();
      const l = document.getElementById('html-root').lang;
      if (data.action === 'added') {
        showToast(l==='ar' ? '⭐ تمت الإضافة إلى المفضلة' : '⭐ Added to Favorites!');
      } else {
        showToast(l==='ar' ? 'تمت الإزالة من المفضلة' : 'Removed from Favorites');
      }

      if (fromProfile) { renderFavsList(); }
      else {
        const panel = document.getElementById('items-panel');
        if (panel.style.display !== 'none') {
          // Sprint 2.7+: group-tabs removed; favorites lives on `#menu-fav-btn`
          // and is "active" when the user has clicked it.
          const favBtn = document.getElementById('menu-fav-btn');
          if (favBtn?.classList.contains('active')) { renderFavoritesPanel(); }
          else {
            document.querySelectorAll('.btn-star').forEach(btn => {
              const onclick = btn.getAttribute('onclick') || '';
              const keyMatch = onclick.match(/toggleFavorite\('([^']+)'/);
              if (keyMatch) {
                const bKey = keyMatch[1];
                const isFav = window.authState.favorites.some(f => f.menu_key === bKey);
                btn.textContent = isFav ? '★' : '☆';
                btn.classList.toggle('starred', isFav);
              }
            });
          }
        }
      }
    } catch (e) { console.warn('[toggleFavorite] failed', e); }
  }

  // Expose to global scope (inline onclick + index.js callers)
  window.loadFavorites = loadFavorites;
  window.renderFavsList = renderFavsList;
  window.renderFavoritesPanel = renderFavoritesPanel;
  window.toggleFavorite = toggleFavorite;
  window.addToCartFromFav = addToCartFromFav;
})();
