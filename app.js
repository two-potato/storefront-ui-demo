//
// Minimal JavaScript for Storefront UI demo
// Provides basic interaction feedback for "Add to cart" buttons.
//

document.addEventListener('DOMContentLoaded', () => {
  // Find all buttons with the class "add-to-cart"
  const buttons = document.querySelectorAll('.add-to-cart');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const original = btn.textContent;
      btn.textContent = 'Added ✓';
      btn.disabled = true;
      // After a brief delay revert back to original text
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 2000);
    });
  });
});