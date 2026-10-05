document.addEventListener("DOMContentLoaded", function () {
  const carousels = document.querySelectorAll("[data-premium-carousel]");
  carousels.forEach(function (root) {
    const slides = Array.from(root.querySelectorAll(".premium-slide"));
    const dots = Array.from(root.querySelectorAll(".premium-dots button"));
    const prev = root.querySelector(".premium-arrow.prev");
    const next = root.querySelector(".premium-arrow.next");
    if (slides.length < 2) return;

    let index = Math.max(0, slides.findIndex(s => s.classList.contains("is-active")));
    let timer = null;
    let touchX = 0;

    function show(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function start() {
      stop();
      timer = setInterval(() => show(index + 1), 4500);
    }

    if (next) next.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation(); show(index + 1); start();
    });
    if (prev) prev.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation(); show(index - 1); start();
    });
    dots.forEach((dot, i) => dot.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation(); show(i); start();
    }));

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    root.addEventListener("touchstart", e => {
      touchX = e.changedTouches[0].clientX;
      stop();
    }, {passive:true});
    root.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 45) show(index + (dx < 0 ? 1 : -1));
      start();
    }, {passive:true});

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else start();
    });

    show(index);
    start();
  });
});