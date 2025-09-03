// cart-perekrestok.js
// Implements add-to-cart logic similar to Perekrestok.ru:
// initially a single button "В корзину", which transforms into a quantity control with − / +.
// State is persisted in localStorage, and the cart count is updated via a custom event.

(function(){
  const STORAGE_KEY = 'cart.state.v1';
  const liveRegion = document.getElementById('live');

  // Load cart state from localStorage
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { items: {} };
    } catch (e) {
      return { items: {} };
    }
  }

  // Persist cart state to localStorage and broadcast update
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.dispatchEvent(new CustomEvent('cart:update', { detail: state }));
  }

  // Internal cart state
  const state = loadState();

  // Utility: get quantity of a SKU
  function getQty(sku) {
    return state.items[sku] ? state.items[sku].qty : 0;
  }

  // Add one item to cart
  function addOne(sku, meta) {
    const item = state.items[sku] || { qty: 0, name: meta.name || sku, price: meta.price || 0 };
    item.qty += 1;
    state.items[sku] = item;
    saveState();
  }

  // Decrease quantity by one
  function decOne(sku) {
    const item = state.items[sku];
    if (!item) return;
    item.qty -= 1;
    if (item.qty <= 0) {
      delete state.items[sku];
    }
    saveState();
  }

  // Announce a message via the live region for assistive technologies
  function announce(msg) {
    if (!liveRegion) return;
    liveRegion.textContent = '';
    // Delay assignment to ensure update is announced
    setTimeout(() => {
      liveRegion.textContent = msg;
    }, 10);
  }

  // Create counter markup with minus / qty / plus
  function createCounter(sku, qty) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cart-ctrl';
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', 'Количество');

    const minus = document.createElement('button');
    minus.dataset.action = 'minus';
    minus.setAttribute('aria-label', 'Уменьшить количество');
    minus.textContent = '−';

    const qtySpan = document.createElement('span');
    qtySpan.className = 'qty';
    qtySpan.textContent = String(qty);
    qtySpan.setAttribute('aria-live', 'polite');

    const plus = document.createElement('button');
    plus.dataset.action = 'plus';
    plus.setAttribute('aria-label', 'Увеличить количество');
    plus.textContent = '+';

    wrapper.appendChild(minus);
    wrapper.appendChild(qtySpan);
    wrapper.appendChild(plus);
    return wrapper;
  }

  // Swap a cart-slot's content to a counter for given sku and quantity
  function swapToCounter(slotEl, sku, qty) {
    if (!slotEl) return;
    slotEl.innerHTML = '';
    slotEl.appendChild(createCounter(sku, qty));
  }

  // Swap a cart-slot back to an add button
  function swapToAdd(slotEl, sku) {
    if (!slotEl) return;
    slotEl.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'btn primary';
    btn.dataset.action = 'add';
    btn.setAttribute('aria-label', 'Добавить в корзину');
    btn.textContent = 'В корзину';
    slotEl.appendChild(btn);
  }

  // Update the quantity label in an existing counter
  function updateCounter(slotEl, qty) {
    const qtySpan = slotEl.querySelector('.qty');
    if (qtySpan) {
      qtySpan.textContent = String(qty);
    }
  }

  // Render all cart-slots based on current state
  function renderAll() {
    document.querySelectorAll('.cart-slot[data-slot]').forEach(slot => {
      const sku = slot.dataset.slot;
      const qty = getQty(sku);
      if (qty > 0) {
        swapToCounter(slot, sku, qty);
      } else {
        swapToAdd(slot, sku);
      }
    });
    // After initial render, update cart count display
    document.dispatchEvent(new CustomEvent('cart:update', { detail: state }));
  }

  // Handle click events on cart controls
  document.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    // Determine the slot and sku
    const slotEl = actionEl.closest('.cart-slot');
    if (!slotEl) return;
    const sku = slotEl.dataset.slot;
    // Find product info from nearest element with data-sku
    const productEl = actionEl.closest('[data-sku]');
    const name = productEl ? (productEl.dataset.name || sku) : sku;
    const price = productEl ? Number(productEl.dataset.price || 0) : 0;
    if (action === 'add') {
      addOne(sku, { name, price });
      announce(`${name}: добавлено 1 шт.`);
      swapToCounter(slotEl, sku, getQty(sku));
    } else if (action === 'plus') {
      addOne(sku, { name, price });
      const q = getQty(sku);
      updateCounter(slotEl, q);
      announce(`${name}: ${q} шт.`);
    } else if (action === 'minus') {
      decOne(sku);
      const q = getQty(sku);
      if (q <= 0) {
        swapToAdd(slotEl, sku);
        announce(`${name}: удалено из корзины.`);
      } else {
        updateCounter(slotEl, q);
        announce(`${name}: ${q} шт.`);
      }
    }
  });

  // Render on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  } else {
    renderAll();
  }
})();