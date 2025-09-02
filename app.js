// Minimal cart interaction and chip toggles
document.addEventListener('DOMContentLoaded', () => {
  const cartCount = document.getElementById('cart-count');
  let count = 0;
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      count++;
      if(cartCount) cartCount.textContent = count;
      const live = document.getElementById('live');
      if(live) live.textContent = `Added to cart. Total ${count} items.`;
    });
  });
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const pressed = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', (!pressed).toString());
    });
  });
});
