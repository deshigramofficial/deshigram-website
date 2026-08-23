const menuButton = document.getElementById("menuButton");
const navigation = document.getElementById("navigation");
const currentYear = document.getElementById("currentYear");

if (menuButton && navigation) {
  const navigationLinks = navigation.querySelectorAll("a");
  menuButton.addEventListener("click", () => {
    navigation.classList.toggle("is-open");
    const isOpen = navigation.classList.contains("is-open");
    menuButton.textContent = isOpen ? "✕" : "☰";
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("is-open");
      menuButton.textContent = "☰";
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

if (currentYear) currentYear.textContent = new Date().getFullYear();

const revealElements = document.querySelectorAll(".reveal");
if (revealElements.length) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
}

const siteSearch = document.getElementById("siteSearch");
const searchToggle = document.getElementById("searchToggle");
const productSearchInput = document.getElementById("productSearchInput");
const searchResults = document.getElementById("searchResults");

const searchableProducts = [
  { name: "Dry Fruits Energy Powder", description: "DeshiGram food product", href: "products.html" },
  { name: "Pack of 1", description: "100g pack", href: "products.html" },
  { name: "Pack of 2", description: "200g value pack", href: "products.html" },
  { name: "Pack of 3", description: "300g family pack", href: "products.html" }
];

function renderSearchResults(query = "") {
  if (!searchResults) return;
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery ? searchableProducts.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery)) : searchableProducts;
  searchResults.innerHTML = matches.length ? matches.map((product) => `<a class="search-result-item" href="${product.href}">${product.name}<small>${product.description}</small></a>`).join("") : '<p class="search-empty">No product found.</p>';
}

if (siteSearch && productSearchInput) {
  const updateSearch = () => {
    const query = productSearchInput.value.trim();
    if (query) {
      renderSearchResults(query);
      siteSearch.classList.add("has-results");
    } else {
      siteSearch.classList.remove("has-results");
      if (searchResults) searchResults.innerHTML = "";
    }
  };

  productSearchInput.addEventListener("input", updateSearch);
  productSearchInput.addEventListener("focus", updateSearch);

  if (searchToggle) {
    searchToggle.addEventListener("click", () => {
      const willOpen = !siteSearch.classList.contains("is-open");
      siteSearch.classList.toggle("is-open", willOpen);
      searchToggle.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) window.setTimeout(() => productSearchInput.focus(), 50);
    });
  }

  document.addEventListener("click", (event) => {
    if (!siteSearch.contains(event.target)) {
      siteSearch.classList.remove("is-open", "has-results");
      if (searchToggle) searchToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      siteSearch.classList.remove("is-open", "has-results");
      if (searchToggle && window.innerWidth <= 900) searchToggle.focus();
    }
  });
}

function setupCarousel(rootSelector, options = {}) {
  document.querySelectorAll(rootSelector).forEach((carousel) => {
    const track = carousel.querySelector(options.trackSelector || '.pack-carousel-track, .about-banner-track');
    if (!track) return;
    const slides = Array.from(track.children);
    const prev = carousel.querySelector(options.prevSelector || '.pack-carousel-arrow.prev');
    const next = carousel.querySelector(options.nextSelector || '.pack-carousel-arrow.next');
    const dots = Array.from(carousel.querySelectorAll(options.dotSelector || '.pack-carousel-dots button, .about-banner-dots button'));
    let index = 0;
    let intervalId = null;

    const setActive = (newIndex) => {
      index = (newIndex + slides.length) % slides.length;
      if (carousel.matches('[data-home-carousel], [data-about-full-carousel]')) {
        slides.forEach((slide, idx) => slide.classList.toggle('active', idx === index));
      } else {
        track.style.transform = `translateX(-${index * 100}%)`;
      }
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === index));
    };

    const startAuto = () => {
      if (!options.auto) return;
      stopAuto();
      intervalId = window.setInterval(() => setActive(index + 1), options.delay || 3200);
    };

    const stopAuto = () => {
      if (intervalId) window.clearInterval(intervalId);
    };

    prev?.addEventListener('click', () => { setActive(index - 1); startAuto(); });
    next?.addEventListener('click', () => { setActive(index + 1); startAuto(); });
    dots.forEach((dot, idx) => dot.addEventListener('click', () => { setActive(idx); startAuto(); }));
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('touchstart', stopAuto, { passive: true });
    carousel.addEventListener('touchend', startAuto, { passive: true });

    setActive(0);
    startAuto();
  });
}

setupCarousel('[data-pack-carousel]', { auto: false, trackSelector: '.pack-carousel-track', prevSelector: '.pack-carousel-arrow.prev', nextSelector: '.pack-carousel-arrow.next', dotSelector: '.pack-carousel-dots button' });
setupCarousel('[data-home-carousel]', { auto: true, delay: 4200, trackSelector: '.home-banner-track', prevSelector: '.home-banner-arrow.prev', nextSelector: '.home-banner-arrow.next', dotSelector: '.home-banner-dots button' });
setupCarousel('[data-about-full-carousel]', { auto: true, delay: 4200, trackSelector: '.about-full-track', prevSelector: '.about-full-arrow.prev', nextSelector: '.about-full-arrow.next', dotSelector: '.about-full-dots button' });

// Full-width DeshiGram showcase slider: auto-rotate + arrows + swipe.
(() => {
  const root = document.getElementById('dgShowcaseSlider');
  if (!root) return;
  const slides = [...root.querySelectorAll('.dg-showcase-slide')];
  const dots = [...root.querySelectorAll('.dg-showcase-dots button')];
  const prev = root.querySelector('.dg-showcase-arrow.prev');
  const next = root.querySelector('.dg-showcase-arrow.next');
  if (!slides.length) return;
  let index = 0, timer, touchStartX = null;
  const show = (i) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((s,n)=>s.classList.toggle('is-active',n===index));
    dots.forEach((d,n)=>d.classList.toggle('is-active',n===index));
  };
  const stop = () => timer && clearInterval(timer);
  const start = () => { stop(); timer = setInterval(()=>show(index+1), 4800); };
  prev?.addEventListener('click',()=>{show(index-1);start();});
  next?.addEventListener('click',()=>{show(index+1);start();});
  dots.forEach((d,n)=>d.addEventListener('click',()=>{show(n);start();}));
  root.addEventListener('mouseenter',stop); root.addEventListener('mouseleave',start);
  root.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX;stop();},{passive:true});
  root.addEventListener('touchend',e=>{if(touchStartX!==null){const dx=e.changedTouches[0].clientX-touchStartX;if(Math.abs(dx)>45)show(index+(dx<0?1:-1));touchStartX=null;}start();},{passive:true});
  show(0); start();
})();

// Contact shortcut pills: scroll to form and preselect the right enquiry type.
document.querySelectorAll('[data-contact-subject]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = document.getElementById('contactSubject');
    if (select) select.value = link.dataset.contactSubject || '';
    window.setTimeout(() => document.getElementById('contactName')?.focus(), 500);
  });
});

// DeshiGram customer login/account indicator.
(function(){
  function readSupabaseSession(){
    try{
      const key=Object.keys(localStorage).find(k=>/^sb-.*-auth-token$/.test(k));
      if(!key) return null;
      const raw=JSON.parse(localStorage.getItem(key)||'null');
      return raw?.user ? raw : raw?.currentSession || raw?.session || null;
    }catch(_){return null;}
  }
  function displayName(session){
    const user=session?.user;
    const name=(user?.user_metadata?.full_name||'').trim();
    if(name) return name.split(/\s+/)[0];
    const phone=(user?.user_metadata?.phone||'').replace(/\D/g,'');
    return phone ? `••${phone.slice(-4)}` : 'Customer';
  }
  function applyAccountIndicator(){
    const s=readSupabaseSession();
    const loggedIn=!!s?.user;
    const links=[...document.querySelectorAll('a[href$="account.html"], a[href*="account.html?"]')];
    links.forEach(link=>{
      link.classList.add('dg-account-link');
      if(loggedIn){
        link.classList.add('is-logged-in');
        link.innerHTML=`<span class="dg-account-dot" aria-hidden="true"></span><span>Hi, ${displayName(s)} · My Account</span>`;
        link.setAttribute('aria-label',`My Account, logged in as ${displayName(s)}`);
      }else{
        link.classList.remove('is-logged-in');
        link.textContent='Login';
        link.setAttribute('aria-label','Customer Login');
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyAccountIndicator); else applyAccountIndicator();
  window.addEventListener('storage',applyAccountIndicator);
})();
