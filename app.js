// Minimal cart interaction and chip toggles
document.addEventListener('DOMContentLoaded', () => {
  // Handle filter chip toggles
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const pressed = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', (!pressed).toString());
    });
  });
  // Listen for cart update events dispatched from cart scripts
  document.addEventListener('cart:update', (e) => {
    const cartCountEl = document.getElementById('cart-count');
    const live = document.getElementById('live');
    if (!cartCountEl) return;
    const items = (e.detail && e.detail.items) || {};
    let total = 0;
    Object.values(items).forEach(item => {
      total += item.qty;
    });
    cartCountEl.textContent = total.toString();
    // Provide a polite live region message summarising the cart count
    if (live) {
      live.textContent = total === 0 ? 'Корзина пуста.' : `В корзине ${total} товар${getWordEnding(total)}.`;
    }
  });
});

// Helper to produce correct Russian word endings for numbers (1 товар, 2 товара, 5 товаров)
function getWordEnding(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ов';
}
