  /* ─── Language Toggle ─── */
  function setLang(lang) {
    const html = document.getElementById('html-root');
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-ar').classList.toggle('active', lang === 'ar');

    // Update form placeholders
    document.querySelectorAll('[data-ph-en]').forEach(el => {
      el.placeholder = lang === 'ar'
        ? el.getAttribute('data-ph-ar')
        : el.getAttribute('data-ph-en');
    });

    sessionStorage.setItem('kims-lang', lang);

    if (document.getElementById('cal-month-label')) renderCal();
  }

  /* ─── Mobile Nav ─── */
  function toggleNav() {
    document.getElementById('nav-links').classList.toggle('open');
  }

  /* ─── Menu Filter ─── */
  // Exposed on window so other modules (index-favorites.js, etc.) can access it.
  window.menuData = {
    'hot-coffee': {
      en: 'Hot Coffee', ar: 'قهوة ساخنة',
      items: [
        { emoji:'☕', en:'Hot Americano',  ar:'أمريكانو ساخن',    descEn:'Bold espresso with hot water',          descAr:'إسبريسو قوي مع الماء الساخن',        price:'15' },
        { emoji:'🥛', en:'Hot Latte',      ar:'لاتيه ساخن',        descEn:'Smooth espresso with steamed milk',     descAr:'إسبريسو ناعم مع الحليب المبخر',      price:'18' },
        { emoji:'☁️', en:'Cappuccino',     ar:'كابتشينو',           descEn:'Espresso with velvety milk foam',       descAr:'إسبريسو مع رغوة حليب مخملية',        price:'18' },
        { emoji:'🤍', en:'Flat White',     ar:'فلات وايت',          descEn:'Velvety microfoam over espresso',       descAr:'رغوة ناعمة فوق الإسبريسو',           price:'20' },
      ]
    },
    'cold-coffee': {
      en: 'Cold Coffee', ar: 'قهوة باردة',
      items: [
        { emoji:'🧊', en:'Iced Americano',        ar:'آيسد أمريكانو',      descEn:'Cold brew over crystal ice',          descAr:'قهوة باردة على الثلج',              price:'16' },
        { emoji:'🥛', en:'Iced Latte',            ar:'آيسد لاتيه',          descEn:'Espresso over cold milk & ice',        descAr:'إسبريسو مع حليب بارد وثلج',        price:'18' },
        { emoji:'🫙', en:'Cold Brew',             ar:'كولد برو',             descEn:'Slow-steeped for 12 hours',            descAr:'مستخلص ببطء لمدة 12 ساعة',         price:'20' },
        { emoji:'🍮', en:'Caramel Frappuccino',   ar:'فرابتشينو كراميل',    descEn:'Blended coffee with caramel',          descAr:'قهوة مثلجة بالكراميل',             price:'22' },
      ]
    },
    'matcha': {
      en: 'Matcha', ar: 'ماتشا',
      items: [
        { emoji:'🍵', en:'Matcha Latte',        ar:'ماتشا لاتيه',        descEn:'Premium Japanese matcha with milk',    descAr:'ماتشا ياباني فاخر مع الحليب',      price:'22' },
        { emoji:'🧊', en:'Iced Matcha',         ar:'آيسد ماتشا',          descEn:'Chilled matcha over ice',              descAr:'ماتشا باردة على الثلج',             price:'22' },
        { emoji:'💚', en:'Matcha Frappuccino',  ar:'ماتشا فرابتشينو',     descEn:'Blended matcha with cream',            descAr:'ماتشا مثلجة بالكريمة',             price:'24' },
      ]
    },
    'hot-tea': {
      en: 'Hot Tea', ar: 'شاي ساخن',
      items: [
        { emoji:'🫖', en:'English Breakfast', ar:'إنجليش بريكفاست', descEn:'Classic strong black tea',             descAr:'شاي أسود كلاسيكي قوي',             price:'12' },
        { emoji:'🍃', en:'Green Tea',          ar:'شاي أخضر',         descEn:'Light & antioxidant-rich',             descAr:'خفيف وغني بمضادات الأكسدة',        price:'12' },
        { emoji:'🌼', en:'Chamomile',          ar:'كاموميل',           descEn:'Calming herbal blend',                 descAr:'مزيج عشبي مهدئ',                   price:'14' },
      ]
    },
    'smoothie': {
      en: 'Smoothie', ar: 'سموثي',
      items: [
        { emoji:'🥭', en:'Mango Smoothie', ar:'سموثي المانجو',    descEn:'Fresh mango blended smooth',          descAr:'مانجو طازجة مخلوطة',               price:'22' },
        { emoji:'🫐', en:'Berry Blast',    ar:'سموثي التوت',       descEn:'Mixed berries & yogurt',               descAr:'توت مشكل مع الزبادي',              price:'22' },
        { emoji:'🍍', en:'Tropical Mix',   ar:'مزيج استوائي',      descEn:'Pineapple, mango & coconut',           descAr:'أناناس ومانجو وجوز الهند',         price:'24' },
      ]
    },
    'frappe': {
      en: 'Frappé', ar: 'فرابيه',
      items: [
        { emoji:'🧋', en:'Caramel Frappé',  ar:'فرابيه كراميل',  descEn:'Blended coffee with rich caramel',    descAr:'قهوة مثلجة بالكراميل الغني',        price:'22' },
        { emoji:'🍫', en:'Mocha Frappé',    ar:'فرابيه موكا',    descEn:'Coffee & chocolate blended with ice', descAr:'قهوة وشوكولاتة مثلجة',              price:'22' },
        { emoji:'🤍', en:'Vanilla Frappé',  ar:'فرابيه فانيليا', descEn:'Smooth vanilla blended with cream',   descAr:'فانيليا ناعمة مع الكريمة',          price:'20' },
        { emoji:'💚', en:'Matcha Frappé',   ar:'فرابيه ماتشا',   descEn:'Premium matcha blended with ice',     descAr:'ماتشا فاخرة مثلجة',                 price:'24' },
      ]
    },
    'milkshake': {
      en: 'Milkshake', ar: 'ميلك شيك',
      items: [
        { emoji:'🍫', en:'Chocolate Milkshake',   ar:'ميلك شيك شوكولاتة', descEn:'Rich dark chocolate shake',          descAr:'شيك شوكولاتة داكنة غني',            price:'20' },
        { emoji:'🤍', en:'Vanilla Milkshake',     ar:'ميلك شيك فانيليا',  descEn:'Classic creamy vanilla shake',        descAr:'شيك فانيليا كريمي كلاسيكي',         price:'20' },
        { emoji:'🍓', en:'Strawberry Milkshake',  ar:'ميلك شيك فراولة',   descEn:'Fresh strawberry blended shake',      descAr:'شيك فراولة طازجة',                  price:'20' },
        { emoji:'🥭', en:'Mango Milkshake',       ar:'ميلك شيك مانجو',    descEn:'Tropical mango cream shake',          descAr:'شيك مانجو استوائي كريمي',            price:'22' },
      ]
    },
    'yogurt': {
      en: 'Yogurt', ar: 'يوغرت',
      items: [
        { emoji:'🍓', en:'Strawberry Yogurt',   ar:'يوغرت فراولة',      descEn:'Creamy yogurt with fresh strawberry', descAr:'يوغرت كريمي بالفراولة الطازجة',     price:'16' },
        { emoji:'🫐', en:'Mixed Berry Yogurt',  ar:'يوغرت توت مشكل',    descEn:'Yogurt with assorted berries',         descAr:'يوغرت مع توت مشكل',                 price:'16' },
        { emoji:'🥭', en:'Mango Yogurt',        ar:'يوغرت مانجو',       descEn:'Smooth yogurt with mango chunks',      descAr:'يوغرت ناعم مع قطع المانجو',         price:'16' },
        { emoji:'🤍', en:'Plain Yogurt',        ar:'يوغرت سادة',        descEn:'Fresh natural yogurt with honey',      descAr:'يوغرت طبيعي طازج مع العسل',        price:'14' },
      ]
    },
    'mojito': {
      en: 'Mojito', ar: 'موهيتو',
      items: [
        { emoji:'🌿', en:'Classic Mojito',     ar:'موهيتو كلاسيك',   descEn:'Mint, lime & sparkling water',        descAr:'نعناع وليمون وماء فوار',             price:'18' },
        { emoji:'🍓', en:'Strawberry Mojito',  ar:'موهيتو فراولة',   descEn:'Fresh strawberry with mint & lime',    descAr:'فراولة طازجة مع نعناع وليمون',      price:'20' },
        { emoji:'🥭', en:'Mango Mojito',       ar:'موهيتو مانجو',    descEn:'Tropical mango with mint & lime',      descAr:'مانجو استوائية مع نعناع وليمون',    price:'20' },
        { emoji:'🍋', en:'Mint Lemonade',      ar:'ليمون بالنعناع',  descEn:'Zesty lemon with fresh mint',          descAr:'ليمون منعش مع نعناع طازج',          price:'16' },
      ]
    },
    'pastry': {
      en: 'Pastry', ar: 'معجنات',
      items: [
        { emoji:'🥐', en:'Butter Croissant', ar:'كرواسون بالزبدة',   descEn:'Flaky, freshly baked daily',           descAr:'مقرمش ومخبوز يومياً',             price:'12' },
        { emoji:'🫐', en:'Blueberry Muffin', ar:'مافن توت أزرق',     descEn:'Soft muffin with juicy blueberries',   descAr:'مافن طري بالتوت الأزرق',          price:'12' },
        { emoji:'🌀', en:'Cinnamon Roll',    ar:'لفة القرفة',          descEn:'Warm, sweet & soft baked roll',        descAr:'لفة مخبوزة دافئة وحلوة',          price:'14' },
        { emoji:'🥮', en:'Almond Danish',    ar:'دنيش باللوز',         descEn:'Buttery pastry with almond cream',     descAr:'معجنات زبدية بكريمة اللوز',       price:'14' },
      ]
    },
    'dessert': {
      en: 'Dessert', ar: 'حلويات',
      items: [
        { emoji:'🍫', en:'Chocolate Cake',  ar:'كيك الشوكولاتة',  descEn:'Rich dark chocolate slice',            descAr:'شريحة شوكولاتة داكنة غنية',       price:'18' },
        { emoji:'🍰', en:'Cheesecake',      ar:'تشيز كيك',         descEn:'Creamy New York style cheesecake',      descAr:'تشيز كيك نيويورك كريمي',           price:'20' },
        { emoji:'☕', en:'Tiramisu',        ar:'تيراميسو',          descEn:'Classic Italian coffee dessert',        descAr:'ديسرت إيطالي كلاسيكي بالقهوة',   price:'22' },
        { emoji:'🟫', en:'Chocolate Brownie',ar:'براوني شوكولاتة', descEn:'Fudgy & warm from the oven',           descAr:'براوني طري ودافئ من الفرن',        price:'14' },
      ]
    },
    'food': {
      en: 'Food', ar: 'مأكولات',
      items: [
        { emoji:'🥪', en:'Club Sandwich',   ar:'ساندويش كلوب',    descEn:'Toasted with fresh fillings',           descAr:'محمص مع حشوة طازجة',              price:'25' },
        { emoji:'🥗', en:'Caesar Salad',    ar:'سلطة سيزر',        descEn:'Crispy romaine with classic dressing',  descAr:'خس مقرمش بصوص كلاسيكي',           price:'22' },
        { emoji:'🌯', en:'Chicken Wrap',    ar:'راب الدجاج',        descEn:'Grilled chicken with fresh veggies',    descAr:'دجاج مشوي مع خضار طازجة',         price:'25' },
        { emoji:'🥑', en:'Avocado Toast',   ar:'توست الأفوكادو',   descEn:'Toasted bread with fresh avocado',      descAr:'خبز محمص مع أفوكادو طازج',        price:'20' },
      ]
    }
  };

  /* ─── Cart System ─── */
  let cart = [];

  /* ─── Size Picker ─── */
  const DRINK_CATS = new Set(['hot-coffee','cold-coffee','matcha','hot-tea','smoothie','frappe','milkshake','mojito','yogurt']);
  const SIZE_MODS  = { S: 0, M: 3000, L: 6000 };
  let _sizePicker  = { catKey: null, idx: null, selectedSize: 'M' };

  function addToCart(catKey, idx) {
    const item = menuData[catKey] && menuData[catKey].items && menuData[catKey].items[idx];
    if (!item) return;
    const hasOptions = Array.isArray(item.modifier_group_ids) && item.modifier_group_ids.length > 0;
    if (hasOptions) {
      openOptionsPicker(catKey, idx, null);
    } else {
      addToCartFinal(catKey, idx, null);
    }
  }

  function openSizePicker(catKey, idx) {
    const item = menuData[catKey].items[idx];
    _sizePicker = { catKey, idx, selectedSize: 'M' };
    const basePrice = parseInt(item.price);
    document.getElementById('size-thumb').textContent = item.emoji;
    document.getElementById('size-name-en').textContent = item.en;
    document.getElementById('size-name-ar').textContent = item.ar;
    const isAr = document.getElementById('html-root').lang === 'ar';
    const sizeLabels = isAr
      ? { S: 'صغير', M: 'وسط', L: 'كبير' }
      : { S: 'Small', M: 'Medium', L: 'Large' };
    const sizeVolumes = { S: '350ml', M: '450ml', L: '600ml' };
    document.getElementById('size-options').innerHTML = ['S','M','L'].map(s => `
      <button class="size-btn${s === 'M' ? ' selected' : ''}" id="size-opt-${s}" onclick="selectSize('${s}')">
        <span class="size-letter">${s}</span>
        <span class="size-name">${sizeLabels[s]}</span>
        <span class="size-volume">${sizeVolumes[s]}</span>
        <span class="size-price">${(basePrice + SIZE_MODS[s]).toLocaleString()} IQD</span>
      </button>`).join('');
    document.getElementById('size-overlay').classList.add('open');
  }

  function selectSize(size) {
    _sizePicker.selectedSize = size;
    ['S','M','L'].forEach(s => document.getElementById('size-opt-' + s)?.classList.toggle('selected', s === size));
  }

  function closeSizePicker(e) {
    if (e && e.target !== document.getElementById('size-overlay')) return;
    document.getElementById('size-overlay').classList.remove('open');
  }

  function confirmSize() {
    const { catKey, idx, selectedSize } = _sizePicker;
    document.getElementById('size-overlay').classList.remove('open');
    const item = menuData[catKey] && menuData[catKey].items && menuData[catKey].items[idx];
    const hasOptions = item && Array.isArray(item.modifier_group_ids) && item.modifier_group_ids.length > 0;
    if (hasOptions) {
      // chain into options picker, carrying the chosen size
      openOptionsPicker(catKey, idx, selectedSize);
    } else {
      addToCartFinal(catKey, idx, selectedSize);
    }
  }

  /* ─── Options picker (modifiers + optional size) ─── */
  let _optsPicker = null;

  function openOptionsPicker(catKey, idx, size) {
    const item = menuData[catKey].items[idx];
    const groups = (item.modifier_group_ids || [])
      .map(id => window.MODIFIER_GROUPS_BY_ID && window.MODIFIER_GROUPS_BY_ID.get(id))
      .filter(Boolean);
    const opts = {};
    groups.forEach(g => {
      if (g.selection === 'multi') {
        opts[g.code] = (g.options || []).filter(o => o.is_default).map(o => o.code);
      } else {
        const def = (g.options || []).find(o => o.is_default) || (g.options || [])[0];
        if (def) opts[g.code] = def.code;
      }
    });
    _optsPicker = { catKey, idx, item, groups, opts, size: size || null };
    document.getElementById('opt-thumb').textContent = item.emoji || '🍽️';
    document.getElementById('opt-name-en').textContent = item.en;
    document.getElementById('opt-name-ar').textContent = item.ar;
    // Header subtitle: base price + size badge if pre-selected
    const isAr = document.getElementById('html-root').lang === 'ar';
    const sizeLabels = isAr ? { S:'صغير', M:'وسط', L:'كبير' } : { S:'Small', M:'Medium', L:'Large' };
    const subPrice = `${parseInt(item.price).toLocaleString()} IQD`;
    document.getElementById('opt-base-sub').textContent = size
      ? `${subPrice} · ${sizeLabels[size] || size}`
      : subPrice;
    renderOptionsPicker();
    document.getElementById('opt-overlay').classList.add('open');
  }

  function renderOptionsPicker() {
    const p = _optsPicker;
    const isAr = document.getElementById('html-root').lang === 'ar';
    let html = '';
    p.groups.forEach(g => {
      const groupNm = isAr ? (g.name_ar || g.name_en || g.code) : (g.name_en || g.name_ko || g.code);
      const isMulti = g.selection === 'multi';
      const required = g.required ? ' *' : '';
      const buttons = (g.options || []).map(o => {
        const optNm = isAr ? (o.name_ar || o.name_en || o.code) : (o.name_en || o.name_ko || o.code);
        const dv = Number(o.price_delta_iqd) || 0;
        const sub = dv > 0 ? `<small>+${dv.toLocaleString()}</small>`
                  : dv < 0 ? `<small>${dv.toLocaleString()}</small>` : '';
        const sel = isMulti
          ? (Array.isArray(p.opts[g.code]) && p.opts[g.code].includes(o.code))
          : (p.opts[g.code] === o.code);
        return `<button class="opt-btn${sel?' on':''}" type="button" onclick="pickOption('${esc(g.code)}','${esc(o.code)}')">${esc(optNm)}${sub}</button>`;
      }).join('');
      html += `<div class="opt-group"><div class="opt-group-label">${esc(groupNm)}${required}</div><div class="opt-buttons">${buttons}</div></div>`;
    });
    document.getElementById('opt-body').innerHTML = html;
    updateOptTotal();
  }

  // setOptSize kept for backwards-compat (no longer wired in markup; size is
  // now picked in the legacy size picker before the options modal opens).
  function setOptSize(s) {
    if (!_optsPicker) return;
    _optsPicker.size = s;
  }

  function pickOption(gCode, oCode) {
    const p = _optsPicker; if (!p) return;
    const grp = p.groups.find(x => x.code === gCode);
    if (!grp) return;
    if (grp.selection === 'multi') {
      const cur = Array.isArray(p.opts[gCode]) ? p.opts[gCode].slice() : [];
      const ix = cur.indexOf(oCode);
      if (ix >= 0) cur.splice(ix, 1); else cur.push(oCode);
      p.opts[gCode] = cur;
    } else {
      p.opts[gCode] = oCode;
    }
    renderOptionsPicker();
  }

  function calcOptTotal() {
    const p = _optsPicker; if (!p) return 0;
    let total = parseInt(p.item.price) || 0;
    if (p.size && SIZE_MODS[p.size] != null) total += SIZE_MODS[p.size];
    p.groups.forEach(g => {
      const sel = p.opts[g.code];
      if (g.selection === 'multi') {
        (Array.isArray(sel) ? sel : []).forEach(code => {
          const o = (g.options || []).find(x => x.code === code);
          if (o) total += Number(o.price_delta_iqd) || 0;
        });
      } else if (sel) {
        const o = (g.options || []).find(x => x.code === sel);
        if (o) total += Number(o.price_delta_iqd) || 0;
      }
    });
    return Math.max(0, total);
  }

  function updateOptTotal() {
    const total = calcOptTotal();
    const el = document.getElementById('opt-total');
    if (el) el.textContent = `${total.toLocaleString()} IQD`;
  }

  function closeOptionsPicker(e) {
    if (e && e.target !== document.getElementById('opt-overlay')) return;
    document.getElementById('opt-overlay').classList.remove('open');
  }

  function _collectSelectedOptions() {
    const p = _optsPicker;
    const ids = []; const labels = [];
    if (!p) return { ids, labels };
    const isAr = document.getElementById('html-root').lang === 'ar';
    p.groups.forEach(g => {
      const sel = p.opts[g.code];
      const collect = (code) => {
        const o = (g.options || []).find(x => x.code === code);
        if (!o) return;
        ids.push(o.id);
        labels.push(isAr ? (o.name_ar || o.name_en || o.code) : (o.name_en || o.name_ko || o.code));
      };
      if (g.selection === 'multi') (Array.isArray(sel) ? sel : []).forEach(collect);
      else if (sel) collect(sel);
    });
    return { ids, labels };
  }

  function confirmOptions() {
    const p = _optsPicker; if (!p) return;
    // required-group enforcement
    for (const g of p.groups) {
      if (!g.required) continue;
      const sel = p.opts[g.code];
      const ok = g.selection === 'multi'
        ? (Array.isArray(sel) && sel.length > 0)
        : !!sel;
      if (!ok) {
        const isAr = document.getElementById('html-root').lang === 'ar';
        const nm = isAr ? (g.name_ar || g.name_en || g.code) : (g.name_en || g.name_ko || g.code);
        alert((isAr ? 'الرجاء اختيار ' : 'Please choose ') + nm);
        return;
      }
    }
    const item = p.item;
    const total = calcOptTotal();
    const { ids, labels } = _collectSelectedOptions();
    const optsHash = ids.slice().sort((a,b)=>a-b).join('-');
    const cartKey = `${p.catKey}:${p.idx}:${p.size||'-'}:${optsHash}`;
    const sizeSuffix = p.size && p.size !== 'M' ? ` (${p.size})` : '';
    const labelSuffix = labels.length ? ` — ${labels.join(', ')}` : '';
    const existing = cart.find(c => c.cartKey === cartKey);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        cartKey, catKey: p.catKey, idx: p.idx, qty: 1,
        name: item.en + sizeSuffix + labelSuffix,
        nameAr: item.ar + sizeSuffix + labelSuffix,
        price: total, emoji: item.emoji, size: p.size,
        menu_item_id: item.menu_item_id || null,
        code: item.code || null,
        modifier_option_ids: ids,
      });
    }
    updateCartBadge();
    showToast('✓ ' + item.en);
    document.getElementById('opt-overlay').classList.remove('open');
  }

  function addToCartFinal(catKey, idx, size) {
    const item = menuData[catKey].items[idx];
    const basePrice = parseInt(item.price);
    const price = size ? basePrice + SIZE_MODS[size] : basePrice;
    const cartKey = size ? `${catKey}:${idx}:${size}` : `${catKey}:${idx}`;
    const existing = cart.find(c => c.cartKey === cartKey);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ cartKey, catKey, idx, qty: 1, name: item.en, nameAr: item.ar, price, emoji: item.emoji, size });
    }
    updateCartBadge();
    showToast('✓ ' + item.en + (size ? ` (${size})` : ''));
  }

  function updateCartBadge() {
    const total = cart.reduce((s, c) => s + c.qty, 0);
    const badge = document.getElementById('cart-badge');
    badge.textContent = total;
    badge.classList.toggle('show', total > 0);
    document.getElementById('btn-checkout').disabled = total === 0;
    renderCartItems();
  }

  function renderCartItems() {
    const container = document.getElementById('cart-items');
    const lang = document.getElementById('html-root').getAttribute('lang');
    const emptyHtml = `<div class="cart-empty" id="cart-empty">
      <div class="empty-icon">🛒</div>
      <span class="en">Your cart is empty</span>
      <span class="ar">سلتك فارغة</span>
    </div>`;
    if (cart.length === 0) {
      container.innerHTML = emptyHtml;
      document.getElementById('cart-total').textContent = '0 IQD';
      return;
    }
    let html = '';
    cart.forEach((c, i) => {
      const name = lang === 'ar' ? c.nameAr : c.name;
      const sizeTag = c.size ? `<span class="size-tag">${c.size}</span>` : '';
      html += `<div class="cart-item">
        <span class="cart-item-emoji">${c.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${name}${sizeTag}</div>
          <div class="cart-item-price">${c.price * c.qty} IQD</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
        </div>
      </div>`;
    });
    container.innerHTML = html;
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById('cart-total').textContent = total.toLocaleString() + ' IQD';
  }

  function changeQty(i, delta) {
    cart[i].qty += delta;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    updateCartBadge();
  }

  function openCart() {
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-drawer').classList.add('open');
    renderCartItems();
  }

  function closeCart() {
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
  }

  
  const _urlParams = new URLSearchParams(location.search);
  const dineInToken = _urlParams.get('t') || null;
  const dineInTable = _urlParams.get('table') || null;

  
  let dineSessionToken = null;
  if (dineInToken) {
    fetch('/api/dine-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: dineInToken })
    }).then(r => r.json()).then(d => {
      if (d.sessionToken) dineSessionToken = d.sessionToken;
    }).catch(() => {});
  }

  /* ─── Checkout ─── */
  let selectedType = null;

  function openCheckout() {
    closeCart();
    
    const dineBtn = document.getElementById('type-dine');
    if (!dineInToken) {
      dineBtn.disabled = false;
      dineBtn.style.opacity = '0.55';
      dineBtn.style.cursor = 'pointer';
      dineBtn.style.pointerEvents = '';
      dineBtn.title = 'In-store only';
    } else {
      dineBtn.disabled = false;
      dineBtn.style.opacity = '';
      dineBtn.style.cursor = '';
      dineBtn.style.pointerEvents = '';
      dineBtn.title = '';
      
      const tableInput = document.getElementById('input-table');
      if (tableInput && dineInTable) tableInput.value = dineInTable;
      
      document.getElementById('checkout-modal').classList.add('open');
      selectType('dine');
      return;
    }
    document.getElementById('checkout-modal').classList.add('open');
  }

  function closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('open');
    selectedType = null;
    ['dine','pickup','delivery'].forEach(t => {
      document.getElementById('type-'+t).classList.remove('selected');
      document.getElementById('form-'+t).style.display = 'none';
    });
    document.getElementById('btn-next').disabled = true;
  }

  function selectType(type) {
    if (type === 'dine' && !dineInToken) {
      const _dineLang = document.getElementById('html-root').getAttribute('lang');
      showToast(_dineLang === 'ar'
        ? '🪑 هذه الخاصية متاحة داخل المطعم فقط — امسح رمز QR على الطاولة'
        : '🪑 In-store only — scan the table QR code');
      return;
    }
    selectedType = type;
    ['dine','pickup','delivery'].forEach(t => {
      document.getElementById('type-'+t).classList.toggle('selected', t === type);
      document.getElementById('form-'+t).style.display = t === type ? '' : 'none';
    });
    document.getElementById('btn-next').disabled = (type === 'delivery');

    if (type === 'pickup' && authState.customer) {
      const nameEl  = document.getElementById('input-name');
      const phoneEl = document.getElementById('input-phone');
      if (!nameEl.value)  nameEl.value  = authState.customer.name  || '';
      if (!phoneEl.value) phoneEl.value = authState.customer.phone || '';
    }
  }

  function goConfirm() {
    if (!selectedType || selectedType === 'delivery') return;
    if (selectedType === 'dine' && !document.getElementById('input-table').value.trim()) {
      showToast('⚠️ Please enter a table number');
      return;
    }
    if (selectedType === 'pickup') {
      if (!document.getElementById('input-name').value.trim()) { showToast('⚠️ Please enter your name'); return; }
      if (!validatePhone(document.getElementById('input-phone').value)) { showToast('⚠️ Phone must be 11 digits (xxxx xxx xxxx)'); return; }
      if (!document.getElementById('input-arrival').value) { showToast('⚠️ Please select your arrival time'); return; }
    }
    const savedType = selectedType;
    closeCheckout();
    selectedType = savedType;
    // build confirm modal
    const lang = document.getElementById('html-root').getAttribute('lang');
    let itemsHtml = '';
    cart.forEach(c => {
      const name = lang === 'ar' ? c.nameAr : c.name;
      const sizeStr = c.size ? ` (${c.size})` : '';
      itemsHtml += `<div class="confirm-item-row"><span>${c.emoji} ${name}${sizeStr} x${c.qty}</span><span>${(c.price*c.qty).toLocaleString()} IQD</span></div>`;
    });
    document.getElementById('confirm-items').innerHTML = itemsHtml;
    const total = cart.reduce((s,c) => s + c.price*c.qty, 0);
    document.getElementById('confirm-total-price').textContent = total.toLocaleString() + ' IQD';

    
    const placeBtn = document.getElementById('btn-place-order');
    if (selectedType === 'pickup') {
      placeBtn.querySelector('.en').textContent = '💳 Pay & Order';
      placeBtn.querySelector('.ar').textContent = '💳 الدفع والطلب';
    } else {
      placeBtn.querySelector('.en').textContent = 'Yes, Order Now ✓';
      placeBtn.querySelector('.ar').textContent = 'نعم، اطلب الآن ✓';
    }

    document.getElementById('confirm-modal').classList.add('open');
  }

  function closeConfirm() {
    document.getElementById('confirm-modal').classList.remove('open');
    openCheckout();
  }

  
  let _statusOrderId = null;
  let _statusPollTimer = null;
  const lang = document.documentElement.lang || 'en';

  const STATUS_TEXT = {
    en: {
      new:       'Your order has been received',
      making:    'We are preparing your order…',
      done:      '🎉 Ready! Please come and pick up.',
      cancelled: '❌ This order has been cancelled.',
    },
    ar: {
      new:       'تم استلام طلبك',
      making:    'جارٍ تحضير طلبك…',
      done:      '🎉 جاهز! تفضل بالاستلام.',
      cancelled: '❌ تم إلغاء هذا الطلب.',
    }
  };

  function renderStatusModal(order) {
    const l = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    const steps = ['new','making','done'];
    const si = steps.indexOf(order.status);

    document.getElementById('status-order-num-val').textContent = order.num;

    const infoMap = {
      en: order.type === 'dine' ? `Dine-in — Table ${order.table_num}` : `Pickup — ${order.customer_name || ''}`,
      ar: order.type === 'dine' ? `داخل المقهى — طاولة ${order.table_num}` : `استلام — ${order.customer_name || ''}`,
    };
    document.getElementById('status-order-info').textContent = infoMap[l];

    // Steps
    steps.forEach((step, i) => {
      const el = document.getElementById('sstep-' + step);
      if (!el) return;
      el.classList.remove('active','done');
      if (order.status === 'cancelled') return;
      if (i < si) el.classList.add('done');
      else if (i === si) el.classList.add('active');
    });
    const c1 = document.getElementById('sconn-1');
    const c2 = document.getElementById('sconn-2');
    if (c1) c1.classList.toggle('filled', si >= 1 && order.status !== 'cancelled');
    if (c2) c2.classList.toggle('filled', si >= 2 && order.status !== 'cancelled');

    const msgEl = document.getElementById('status-msg');
    const texts = STATUS_TEXT[l] || STATUS_TEXT.en;
    const txt = texts[order.status] || texts.new;
    const spinner = (order.status === 'new' || order.status === 'making')
      ? '<span class="status-spinner"></span>' : '';
    msgEl.innerHTML = txt + spinner;
    msgEl.className = 'status-msg' + (order.status === 'done' ? ' ready' : order.status === 'cancelled' ? ' cancelled' : '');
  }

  function showMyOrderFab(status) {
    const fab = document.getElementById('my-order-fab');
    if (!fab) return;
    const l = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    const label = fab.querySelector('.fab-label');
    if (status === 'done') {
      fab.classList.add('done-state');
      if (label) label.textContent = l === 'ar' ? '🎉 طلبك جاهز!' : '🎉 Order Ready!';
    } else if (status === 'making') {
      fab.classList.remove('done-state');
      if (label) label.textContent = l === 'ar' ? '☕ جارٍ التحضير…' : '☕ Preparing…';
    } else {
      fab.classList.remove('done-state');
      if (label) label.textContent = l === 'ar' ? '📋 طلبي الحالي' : '📋 My Order';
    }
    fab.classList.add('show');
  }

  function hideMyOrderFab() {
    const fab = document.getElementById('my-order-fab');
    if (fab) fab.classList.remove('show');
  }

  function openMyOrder() {
    if (!_statusOrderId) return;
    fetch(`/api/orders/${_statusOrderId}`)
      .then(r => r.ok ? r.json() : null)
      .then(order => {
        if (!order) return;
        renderStatusModal(order);
        document.getElementById('status-modal').classList.add('open');
      }).catch(() => {});
  }

  function startStatusPolling(orderId) {
    _statusOrderId = orderId;
    if (_statusPollTimer) clearInterval(_statusPollTimer);

    async function poll() {
      if (!_statusOrderId) return;
      try {
        const res = await fetch(`/api/orders/${_statusOrderId}`);
        if (!res.ok) return;
        const order = await res.json();
        renderStatusModal(order);
        
        if (document.getElementById('status-modal').classList.contains('open')) {
          renderStatusModal(order);
        }
        showMyOrderFab(order.status);
        if (order.status === 'done' || order.status === 'cancelled') {
          clearInterval(_statusPollTimer);
          _statusPollTimer = null;
          
          if (order.status === 'done' && authState.customer) {
            const isAr = document.documentElement.lang === 'ar';
            
            fetch('/api/customers/stamps', { headers: authHeader() })
              .then(r => r.ok ? r.json() : null)
              .then(data => {
                if (!data) return;
                const av = data.available;
                showToast(isAr
                  ? `☕ تم إضافة طابع! لديك ${av} طابع`
                  : `☕ Stamp earned! You have ${av} stamp${av !== 1 ? 's' : ''}`
                );
              }).catch(() => {});
          }
          
          setTimeout(() => {
            hideMyOrderFab();
            clearActiveOrder();
            _statusOrderId = null;
          }, 5000);
        }
      } catch (e) { console.warn('[order-poll] fetch failed', e); }
    }

    poll(); 
    _statusPollTimer = setInterval(poll, 4000);
  }

  function closeStatusModal() {
    document.getElementById('status-modal').classList.remove('open');
    
    if (_statusOrderId) {
      fetch(`/api/orders/${_statusOrderId}`)
        .then(r => r.ok ? r.json() : null)
        .then(order => { if (order) showMyOrderFab(order.status); })
        .catch(() => {});
    }
  }

  /* ─── 카드 결제 API 플레이스홀더 ───────────────────────────────────────
   *  결제 업체 API 코드를 받으면 이 함수 안을 교체하세요.
   *  반드시 { success: true/false, transactionId: '...' } 형태를 반환해야 합니다.
   *  amount 단위: IQD 정수
   * ------------------------------------------------------------------- */
  async function processCardPayment(cardData, amount) {
    
    throw new Error('PAYMENT_API_NOT_CONFIGURED');
  }

  
  function openPaymentModal() {
    const total = cart.reduce((s,c) => s + c.price*c.qty, 0);
    document.getElementById('pay-amount-display').textContent = total.toLocaleString() + ' IQD';
    document.getElementById('pay-card-num').value = '';
    document.getElementById('pay-expiry').value = '';
    document.getElementById('pay-cvv').value = '';
    document.getElementById('pay-holder').value = '';
    document.getElementById('pay-error').textContent = '';
    document.getElementById('payment-modal').classList.add('open');
  }

  function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('open');
  }

  async function submitPayment() {
    const btn = document.getElementById('btn-pay-now');
    const cardNum = document.getElementById('pay-card-num').value.replace(/\s/g,'');
    const expiry  = document.getElementById('pay-expiry').value.trim();
    const cvv     = document.getElementById('pay-cvv').value.trim();
    const holder  = document.getElementById('pay-holder').value.trim();
    const errorEl = document.getElementById('pay-error');
    errorEl.textContent = '';

    if (cardNum.length < 13) { errorEl.textContent = '⚠️ Invalid card number'; return; }
    if (!expiry)              { errorEl.textContent = '⚠️ Enter expiry date'; return; }
    if (cvv.length < 3)       { errorEl.textContent = '⚠️ Invalid CVV'; return; }
    if (!holder)              { errorEl.textContent = '⚠️ Enter cardholder name'; return; }

    btn.disabled = true;
    btn.querySelector('.en').textContent = 'Processing…';
    btn.querySelector('.ar').textContent = '…جارٍ المعالجة';

    const total = cart.reduce((s,c) => s + c.price*c.qty, 0);
    try {
      const result = await processCardPayment({ cardNum, expiry, cvv, holder }, total);
      if (result && result.success) {
        closePaymentModal();
        await placeOrderInternal(result.transactionId);
      } else {
        errorEl.textContent = '⚠️ Payment failed. Please try again.';
      }
    } catch (e) {
      if (e.message === 'PAYMENT_API_NOT_CONFIGURED') {
        errorEl.textContent = '⚠️ Online card payment is temporarily unavailable. Please order Dine-in at the cafe, or contact us via WhatsApp.';
      } else {
        errorEl.textContent = '⚠️ Payment error: ' + e.message;
      }
    } finally {
      btn.disabled = false;
      btn.querySelector('.en').textContent = 'Pay Now';
      btn.querySelector('.ar').textContent = 'ادفع الآن';
    }
  }

  async function placeOrder() {
    
    if (selectedType === 'pickup') {
      document.getElementById('confirm-modal').classList.remove('open');
      openPaymentModal();
      return;
    }
    await placeOrderInternal(null);
  }

  async function placeOrderInternal(transactionId) {
    const btn = document.getElementById('btn-place-order');
    if (btn) btn.disabled = true;
    const total = cart.reduce((s,c) => s + c.price*c.qty, 0);

    
    let cName = null, cPhone = null, cArrival = null;
    if (selectedType === 'pickup') {
      cName   = document.getElementById('input-name').value.trim()   || (authState.customer?.name  ?? null);
      cPhone  = document.getElementById('input-phone').value.trim()  || (authState.customer?.phone ?? null);
      cArrival = document.getElementById('input-arrival').value.trim() || null;
    } else if (selectedType === 'dine' && authState.customer) {
      cName  = authState.customer.name  || null;
      cPhone = authState.customer.phone || null;
    }

    let savedOrder = null;
    let orderError = null;
    try {
      const headers = { 'Content-Type': 'application/json', ...authHeader() };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: selectedType,
          tableNum: selectedType === 'dine' ? document.getElementById('input-table').value : null,
          dineSessionToken: selectedType === 'dine' ? dineSessionToken : null,
          customerName: cName,
          customerPhone: cPhone,
          arrivalTime: cArrival,
          items: cart.map(c => ({
            emoji: c.emoji, name: c.name, nameAr: c.nameAr, qty: c.qty, price: c.price,
            size: c.size || null,
            menu_item_id: c.menu_item_id || null,
            code: c.code || null,
            modifier_option_ids: Array.isArray(c.modifier_option_ids) ? c.modifier_option_ids : []
          })),
          total,
          paymentTransactionId: transactionId || null,
          source: 'online'
        })
      });
      if (res.ok) {
        const data = await res.json();
        savedOrder = data.order;
      } else {
        const d = await res.json().catch(() => ({}));
        orderError = d.error || 'ORDER_FAILED';
      }
    } catch (e) {
      orderError = 'NETWORK_ERROR';
      console.warn('Order API unavailable:', e);
    }

    btn.disabled = false;

    if (orderError === 'QR_REQUIRED' || orderError === 'QR_INVALID' || orderError === 'QR_EXPIRED') {
      showToast('❌ امسح رمز QR الموجود على الطاولة مجدداً');
      return;
    }
    if (orderError) {
      showToast('❌ فشل إرسال الطلب / Failed to place order');
      return;
    }

    cart = [];
    updateCartBadge();
    document.getElementById('confirm-modal').classList.remove('open');
    const nameEl = document.getElementById('input-name');
    const phoneEl = document.getElementById('input-phone');
    const arrivalEl = document.getElementById('input-arrival');
    if (nameEl) nameEl.value = '';
    if (phoneEl) phoneEl.value = '';
    if (arrivalEl) arrivalEl.value = '';

    if (savedOrder) {
      saveActiveOrder(savedOrder.id, savedOrder.num);
      renderStatusModal(savedOrder);
      document.getElementById('status-modal').classList.add('open');
      startStatusPolling(savedOrder.id);
    } else {
      showToast('✅ Order placed!');
    }
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // Meeting Room Calendar — extracted to index-meeting.js


  // Sprint 2.7+: ordered list of category codes used to render the tile grid.
  // Filled from /api/menu/public (DB-driven). Empty array → use hardcoded
  // menuData keys as a last-resort fallback for first-install/offline.
  window._dynamicCategoryOrder = [];

  // Show the favorites panel — wired to the new search-bar Favorites button.
  function showFavoritesPanel() {
    document.querySelectorAll('.cat-tile').forEach(t => t.classList.remove('active'));
    const btn = document.getElementById('menu-fav-btn');
    if (btn) btn.classList.add('active');
    renderFavoritesPanel();
  }

  // Render the dynamic category tile grid from the current `menuData` keyed
  // by `_dynamicCategoryOrder`. Falls back to hardcoded menuData keys when DB
  // hasn't been fetched yet (e.g. before DOMContentLoaded await completes).
  function renderCategoryTiles() {
    const grid = document.getElementById('cat-grid');
    if (!grid) return;
    const codes = window._dynamicCategoryOrder.length
      ? window._dynamicCategoryOrder
      : Object.keys(menuData);
    grid.innerHTML = codes.map(code => {
      const cat = menuData[code];
      if (!cat) return '';
      const safeCode = String(code).replace(/'/g, '');
      const icon = esc(cat.icon || '📋');
      const en = esc(cat.en || code);
      const ar = esc(cat.ar || cat.en || code);
      return `<div class="cat-tile" data-cat="${esc(code)}" onclick="showCategory('${safeCode}', this)">
        <div class="cat-circle">${icon}</div>
        <span class="cat-label en">${en}</span>
        <span class="cat-label ar">${ar}</span>
      </div>`;
    }).join('');
  }

  // Favorites (renderFavoritesPanel, addToCartFromFav) — extracted to index-favorites.js

  function showCategory(cat, tile) {
    const data = menuData[cat];
    const grid = document.getElementById('menu-grid');
    if (!data) {
      // Defensive: tile clicked for a category that no longer exists in the
      // current menuData (e.g. owner deleted it between fetch and click).
      grid.innerHTML = '';
      return;
    }
    document.getElementById('cat-panel-title').innerHTML =
      `<span class="en">${esc(data.en)}</span><span class="ar">${esc(data.ar)}</span>`;

    // Mark active tile (also clear favorites button highlight)
    document.querySelectorAll('.cat-tile').forEach(t => t.classList.remove('active'));
    const favBtn = document.getElementById('menu-fav-btn');
    if (favBtn) favBtn.classList.remove('active');
    if (tile) tile.classList.add('active');

    const favKeys = new Set((authState.favorites || []).map(f => f.menu_key));

    if (!data.items || data.items.length === 0) {
      // Empty category — guide the owner/customer rather than rendering nothing
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--text-soft);">
        <div style="font-size:2.5rem;margin-bottom:12px;">🍽️</div>
        <span class="en">No items yet in this category</span>
        <span class="ar">لا توجد أصناف في هذه الفئة بعد</span>
      </div>`;
      grid.classList.remove('updated');
      void grid.offsetWidth;
      grid.classList.add('updated');
      return;
    }

    grid.innerHTML = data.items.map((item, idx) => {
      const key = `${cat}:${idx}`;
      const starred = favKeys.has(key) ? 'starred' : '';
      const starIcon = favKeys.has(key) ? '★' : '☆';
      const thumb = item.photo_url
        ? `<div class="card-thumb-placeholder has-photo"><img src="${esc(item.photo_url)}" alt=""></div>`
        : `<div class="card-thumb-placeholder">${item.emoji}</div>`;
      const badges = renderBadges(item);
      return `
      <div class="menu-card ${badges.glowClass}">
        ${badges.html}
        <button class="btn-star ${starred}" onclick="toggleFavorite('${key}','${item.en.replace(/'/g,"\\'")}','${item.ar.replace(/'/g,"\\'")}','${item.emoji}',${item.price})" title="Favorite">
          ${starIcon}
        </button>
        ${thumb}
        <div class="card-body">
          <div class="card-name en">${item.en}</div>
          <div class="card-name ar">${item.ar}</div>
          <div class="card-desc en">${item.descEn}</div>
          <div class="card-desc ar">${item.descAr}</div>
          <div class="card-footer">
            <div>
              <div class="card-price en">${parseInt(item.price).toLocaleString()} IQD</div>
              <div class="card-price ar">${parseInt(item.price).toLocaleString()} دينار</div>
            </div>
            <button class="btn-add" onclick="addToCart('${cat}', ${idx})">
              <span class="en">+ Add</span><span class="ar">+ أضف</span>
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    // Trigger fade-in animation
    grid.classList.remove('updated');
    void grid.offsetWidth; // reflow
    grid.classList.add('updated');
  }

  function showCategories() {
    // no-op — flat layout, categories always visible
  }

  /* ─── Menu Search ─── */
  function clearMenuSearch() {
    const input = document.getElementById('menu-search');
    if (input) { input.value = ''; searchMenu(''); input.focus(); }
  }

  function searchMenu(rawQuery) {
    const query = (rawQuery || '').trim().toLowerCase();
    const wrap = document.getElementById('menu-search-wrap');
    const catGrid = document.getElementById('cat-grid');
    const grid = document.getElementById('menu-grid');
    const titleEl = document.getElementById('cat-panel-title');
    const isAr = document.documentElement.lang === 'ar';

    if (wrap) wrap.classList.toggle('has-text', query.length > 0);

    if (!query) {
      if (catGrid) catGrid.style.display = '';
      // On clear, restore the first category (Sprint 2.7+: no group tabs)
      const firstTile = document.querySelector('.cat-tile');
      if (firstTile) showCategory(firstTile.dataset.cat, firstTile);
      return;
    }

    if (catGrid) catGrid.style.display = 'none';

    const favKeys = new Set((authState.favorites || []).map(f => f.menu_key));
    const results = [];
    Object.keys(menuData).forEach(cat => {
      const items = (menuData[cat] && menuData[cat].items) || [];
      items.forEach((item, idx) => {
        const hay = [item.en, item.ar, item.descEn, item.descAr]
          .map(s => String(s || '').toLowerCase()).join(' ');
        if (hay.includes(query)) results.push({ cat, idx, item });
      });
    });

    titleEl.innerHTML =
      `<span class="en">Search results (${results.length})</span>` +
      `<span class="ar">نتائج البحث (${results.length})</span>`;

    if (results.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--text-soft);">
        <div style="font-size:2.5rem;margin-bottom:12px;">🔍</div>
        <span class="en">No items match "${esc(rawQuery)}"</span>
        <span class="ar">لا توجد نتائج لـ "${esc(rawQuery)}"</span>
      </div>`;
      return;
    }

    grid.innerHTML = results.map(({ cat, idx, item }) => {
      const key = `${cat}:${idx}`;
      const starred = favKeys.has(key) ? 'starred' : '';
      const starIcon = favKeys.has(key) ? '★' : '☆';
      const thumb = item.photo_url
        ? `<div class="card-thumb-placeholder has-photo"><img src="${esc(item.photo_url)}" alt=""></div>`
        : `<div class="card-thumb-placeholder">${item.emoji}</div>`;
      const badges = renderBadges(item);
      return `
      <div class="menu-card ${badges.glowClass}">
        ${badges.html}
        <button class="btn-star ${starred}" onclick="toggleFavorite('${key}','${String(item.en).replace(/'/g,"\\'")}','${String(item.ar).replace(/'/g,"\\'")}','${item.emoji}',${item.price})" title="Favorite">${starIcon}</button>
        ${thumb}
        <div class="card-body">
          <div class="card-name en">${item.en}</div>
          <div class="card-name ar">${item.ar}</div>
          <div class="card-desc en">${item.descEn || ''}</div>
          <div class="card-desc ar">${item.descAr || ''}</div>
          <div class="card-footer">
            <div>
              <div class="card-price en">${parseInt(item.price).toLocaleString()} IQD</div>
              <div class="card-price ar">${parseInt(item.price).toLocaleString()} دينار</div>
            </div>
            <button class="btn-add" onclick="addToCart('${cat}', ${idx})">
              <span class="en">+ Add</span><span class="ar">+ أضف</span>
            </button>
          </div>
        </div>
      </div>`;
    }).join('');
    grid.classList.remove('updated');
    void grid.offsetWidth;
    grid.classList.add('updated');
  }

  /* ─── XSS helper ─── */
  function esc(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Returns HTML for top-right ribbon stack + a class name to apply to the
  // outer .menu-card for the glow effect. Priority for glow color:
  //   signature (gold) > best (red) > new (green).
  function renderBadges(item) {
    const ribbons = [];
    if (item.is_signature) ribbons.push('<span class="card-ribbon ribbon-signature"><span class="en">⭐ SIGNATURE</span><span class="ar">⭐ مميز</span></span>');
    if (item.is_best)      ribbons.push('<span class="card-ribbon ribbon-best"><span class="en">🔥 BEST</span><span class="ar">🔥 الأكثر مبيعاً</span></span>');
    if (item.is_new)       ribbons.push('<span class="card-ribbon ribbon-new"><span class="en">🆕 NEW</span><span class="ar">🆕 جديد</span></span>');
    if (ribbons.length === 0) return { html: '', glowClass: '' };
    const glowClass = item.is_signature ? 'glow-signature' : item.is_best ? 'glow-best' : 'glow-new';
    return { html: `<div class="card-ribbon-stack">${ribbons.join('')}</div>`, glowClass };
  }
  window.renderBadges = renderBadges;

  // Auth (state, modal, login, signup, logout) — extracted to index-auth.js

  // Profile + Stamps + Order History — extracted to index-profile.js

  // Table Reservation — extracted to index-reserve.js
  // Helper kept here because it directly reads authState (same script scope).
  function prefillResContactIfLoggedIn() {
    if (authState.token && authState.customer) {
      const nameEl = document.getElementById('res-name');
      const phoneEl = document.getElementById('res-phone');
      if (nameEl && !nameEl.value) nameEl.value = authState.customer.name || '';
      if (phoneEl && !phoneEl.value) phoneEl.value = authState.customer.phone || '';
    }
  }


  // Favorites (loadFavorites, renderFavsList, toggleFavorite) — extracted to index-favorites.js


  function saveActiveOrder(orderId, orderNum) {
    localStorage.setItem('kims-active-order', JSON.stringify({ id: orderId, num: orderNum, ts: Date.now() }));
  }

  function clearActiveOrder() {
    localStorage.removeItem('kims-active-order');
  }

  function resumeActiveOrderIfNeeded() {
    try {
      const saved = JSON.parse(localStorage.getItem('kims-active-order') || 'null');
      if (!saved) return;
      
      if (Date.now() - saved.ts > 2 * 60 * 60 * 1000) { clearActiveOrder(); return; }
      fetch(`/api/orders/${saved.id}`).then(r => r.ok ? r.json() : null).then(order => {
        if (!order) { clearActiveOrder(); return; }
        if (order.status === 'done' || order.status === 'cancelled') { clearActiveOrder(); return; }
        _statusOrderId = saved.id;
        renderStatusModal(order);
        showMyOrderFab(order.status);
        startStatusPolling(saved.id);
      }).catch(e => console.warn('[resume-order] fetch failed', e));
    } catch (e) { console.warn('[resume-order] storage parse failed', e); }
  }

  /* ─── Contact Form ─── */
  async function handleForm(e) {
    e.preventDefault();
    const lang = document.getElementById('html-root').getAttribute('lang');
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('f-name').value.trim(),
          email: document.getElementById('f-email').value.trim(),
          message: document.getElementById('f-msg').value.trim(),
          lang
        })
      });
      if (res.ok) {
        showToast(lang === 'ar' ? '✅ شكراً! سنتواصل معك قريباً.' : '✅ Thank you! We\'ll be in touch soon.');
        form.reset();
      } else {
        showToast(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, please try again.');
      }
    } catch (_) {
      showToast(lang === 'ar' ? 'تعذّر الإرسال، تحقق من اتصالك' : 'Could not send. Check your connection.');
    } finally {
      btn.disabled = false;
    }
  }

  /* ─── Phone formatting: xxxx xxx xxxx (11 digits) ─── */
  function formatPhoneInput(e) {
    const input = e.target;
    
    let digits = input.value.replace(/\D/g, '');
    
    if (digits.length > 11) digits = digits.slice(0, 11);
    
    let formatted = '';
    if (digits.length <= 4) {
      formatted = digits;
    } else if (digits.length <= 7) {
      formatted = digits.slice(0,4) + ' ' + digits.slice(4);
    } else {
      formatted = digits.slice(0,4) + ' ' + digits.slice(4,7) + ' ' + digits.slice(7);
    }
    input.value = formatted;
  }

  function validatePhone(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 && digits.startsWith('0');
  }

  function phoneDigits(value) {
    return value.replace(/\D/g, '');
  }

  function attachPhoneFormat(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', formatPhoneInput);
    el.addEventListener('keydown', (e) => {
      
      if (e.key === 'Backspace') {
        const val = el.value;
        if (val.endsWith(' ')) {
          e.preventDefault();
          el.value = val.slice(0, -2);
        }
      }
    });
    el.placeholder = '0000 000 0000';
  }

  /* ─── Sprint 2.7+: DB-driven menu — categories AND items come from
     /api/menu/public. The hardcoded menuData object remains as a last-resort
     fallback for first-install/offline; once the DB returns at least one
     active category we rebuild menuData entirely from the DB so any custom
     category the owner added in Settings (e.g. "test", "specials") appears
     as a tile. Sold-out items are filtered so customers can't order them. */
  async function mergeDbMenuIntoMenuData() {
    try {
      const r = await fetch('/api/menu/public');
      if (!r.ok) return;
      const data = await r.json();
      const cats  = Array.isArray(data && data.categories) ? data.categories : [];
      const items = Array.isArray(data && data.items) ? data.items : [];
      const groups = Array.isArray(data && data.modifier_groups) ? data.modifier_groups : [];
      window.MODIFIER_GROUPS_BY_ID = new Map(groups.map(g => [g.id, g]));
      if (cats.length === 0) return; // first install / no categories yet

      // Group items by category code; drop sold-out lines.
      const byCat = {};
      items.forEach(it => {
        if (it.sold_out) return;
        if (!it.category_code) return;
        const k = it.category_code;
        if (!byCat[k]) byCat[k] = [];
        byCat[k].push(it);
      });

      // Rebuild menuData from DB. For each DB category:
      //   - Use DB names + icon
      //   - If DB has items: use them
      //   - Else if category code matches a hardcoded fallback: keep its items
      //   - Else: empty items list (tile shows but clicking shows empty state)
      const next = {};
      cats.forEach(c => {
        const fallback = window.menuData[c.code];
        const dbItems = byCat[c.code];
        next[c.code] = {
          en:    c.name_en || c.code,
          ar:    c.name_ar || c.name_en || c.code,
          icon:  c.icon || (fallback && fallback.icon) || '📋',
          color: c.color || null,
          items: dbItems
            ? dbItems.map(it => ({
                emoji:   it.emoji || '🍽️',
                photo_url: it.photo_url || null,
                en:      it.name_en || it.code,
                ar:      it.name_ar || it.name_en || it.code,
                descEn:  it.description || '',
                descAr:  it.description || '',
                price:   String(it.base_price),
                menu_item_id: it.id,
                code: it.code,
                is_new:       !!it.is_new,
                is_best:      !!it.is_best,
                is_signature: !!it.is_signature,
                modifier_group_ids: Array.isArray(it.modifier_group_ids) ? it.modifier_group_ids : []
              }))
            : (fallback ? fallback.items : [])
        };
      });
      window.menuData = next;
      window._dynamicCategoryOrder = cats
        .slice()
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(c => c.code);
    } catch (err) {
      console.warn('[menu] /api/menu/public fetch failed; using hardcoded fallback', err);
    }
  }

  /* ─── Init ─── */
  document.addEventListener('DOMContentLoaded', async () => {
    // Detect language
    const saved = sessionStorage.getItem('kims-lang');
    setLang(saved || 'ar');

    // Sprint 2.7+: pull DB menu before first render so DB-backed categories
    // and items appear on the very first paint instead of flashing the
    // hardcoded fallback.
    await mergeDbMenuIntoMenuData();

    // Render category tiles dynamically and auto-open the first one.
    renderCategoryTiles();
    const firstTile = document.querySelector('.cat-tile');
    if (firstTile) showCategory(firstTile.dataset.cat, firstTile);

    // Init meeting room calendar
    renderCal();
    setTimeout(renderCal, 0);

    // Close mobile nav on link click
    document.querySelectorAll('#nav-links a').forEach(a =>
      a.addEventListener('click', () =>
        document.getElementById('nav-links').classList.remove('open')
      )
    );

    
    ['login-phone','signup-phone','input-phone','book-phone'].forEach(attachPhoneFormat);

    // Auth: restore session
    loadAuthState();
    updateAuthUI(); 
    if (authState.token) {
      
      try {
        const r = await fetch('/api/customers/me', { headers: authHeader() });
        if (r.ok) {
          const d = await r.json();
          authState.customer = d.customer;
          saveAuthState(!!localStorage.getItem('kims-auth')); 
          authState.favorites = [];
          await loadFavorites();
          updateAuthUI();
        }

      } catch (e) { console.warn('[boot] customer refresh failed', e); }
    }

    // Resume active order status if any
    resumeActiveOrderIfNeeded();
  });
