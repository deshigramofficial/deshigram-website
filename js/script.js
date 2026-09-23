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

let searchableProducts = [];
function syncSearchProducts(){const list=window.DESHIGRAM_CATALOG?.products||window.PRODUCTS||[];searchableProducts=list.map(p=>({name:p.name,description:`${p.weight||p.net_quantity||''} • ${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(p.price||p.selling_price||0))}`,href:`product/index.html?id=${encodeURIComponent(p.id||p.slug)}`}));}
document.addEventListener('deshigram:catalog',syncSearchProducts);syncSearchProducts();

function renderSearchResults(query = "") {
  if (!searchResults) return;
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery ? searchableProducts.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery)) : searchableProducts;
  searchResults.innerHTML = matches.length ? matches.map((product) => `<a class="search-result-item" href="${product.href}">${product.name}<small>${product.description}</small></a>`).join("") : '<p class="search-empty">No product found.</p>';
}

if (siteSearch && searchToggle && productSearchInput) {
  searchToggle.addEventListener("click", () => {
    const willOpen = !siteSearch.classList.contains("is-open");
    siteSearch.classList.toggle("is-open", willOpen);
    searchToggle.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      renderSearchResults(productSearchInput.value);
      window.setTimeout(() => productSearchInput.focus(), 50);
    }
  });

  productSearchInput.addEventListener("focus",()=>renderSearchResults(productSearchInput.value));
  productSearchInput.addEventListener("input", (event) => renderSearchResults(event.target.value));

  document.addEventListener("click", (event) => {
    if (!siteSearch.contains(event.target)) {
      siteSearch.classList.remove("is-open");
      searchToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      siteSearch.classList.remove("is-open");
      searchToggle.setAttribute("aria-expanded", "false");
      searchToggle.focus();
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

// Dynamic showcase: works with banners added, hidden or removed by Admin.
(() => {
 const root=document.getElementById('dgShowcaseSlider');if(!root)return;
 const dotsBox=root.querySelector('.dg-showcase-dots');let active=0,timer,touchX=null;
 const slides=()=>[...root.querySelectorAll('.dg-showcase-slide')].filter(s=>!s.hidden&&s.style.display!=='none');
 function show(n){const list=slides();if(!list.length)return;active=((n%list.length)+list.length)%list.length;
  root.querySelectorAll('.dg-showcase-slide').forEach(s=>s.classList.toggle('is-active',s===list[active]));
  dotsBox.replaceChildren(...list.map((s,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Banner '+(i+1));b.classList.toggle('is-active',i===active);b.addEventListener('click',()=>{show(i);start()});return b}));
  list.forEach((s,i)=>{if(i===active){const img=s.querySelector('img');if(img)img.loading='eager'}});
 }
 const stop=()=>clearInterval(timer);const start=()=>{stop();if(slides().length>1)timer=setInterval(()=>show(active+1),5200)};
 root.querySelector('.dg-showcase-arrow.prev')?.addEventListener('click',()=>{show(active-1);start()});
 root.querySelector('.dg-showcase-arrow.next')?.addEventListener('click',()=>{show(active+1);start()});
 root.addEventListener('mouseenter',stop);root.addEventListener('mouseleave',start);
 root.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;stop()},{passive:true});
 root.addEventListener('touchend',e=>{if(touchX!==null){const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>45)show(active+(dx<0?1:-1));touchX=null}start()},{passive:true});
 root.addEventListener('dg:banners-updated',()=>{active=0;show(0);start()});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());show(0);start();
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
