/* Main Admin only: acknowledge clicks without implying save success. */
(() => {
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button');
    if (!button || button.disabled) return;
    button.classList.remove('dg-clicked');
    void button.offsetWidth;
    button.classList.add('dg-clicked');
    clearTimeout(button.__dgClickTimer);
    button.__dgClickTimer = setTimeout(() => button.classList.remove('dg-clicked'), 240);
  }, true);
})();
