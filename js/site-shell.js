
(()=>{
const header=()=>`<div class="dg-top"><span>Desh Ki Parampara, Har Ghar Tak</span><span>Pure • Traditional • Trusted</span><span>🇮🇳 Made in India &nbsp; 🛡 GST Certified &nbsp; 🎧 Support</span></div>
<header class="dg-head" data-common-header>
<a class="dg-brand" href="index.html"><img src="images/deshigram-wordmark.png?v=20261006" alt="DeshiGram" width="225" height="70"></a>
<form class="dg-search" action="products.html"><input name="q" aria-label="Search products" placeholder="Search for dry fruits, seeds, healthy food and more..."><button aria-label="Search">⌕</button></form>
<nav class="dg-simple-actions" aria-label="Account and cart">
<a href="account.html" class="dg-simple-action" aria-label="Account"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-4.4 3.2-6.6 7.5-6.6s6.8 2.2 7.5 6.6"/></svg><span>Account</span></a>
<a href="account.html#cart" class="dg-simple-action" aria-label="Cart"><span class="dg-cart-count" data-cart-count>0</span><svg viewBox="0 0 24 24"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20.5 7H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg><span>Cart</span></a>
</nav>
<a class="dg-now-tab" href="quick-delivery.html"><img src="images/deshigram-now-delivery.png?v=20261006" alt="DeshiGram NOW delivery"><span><b>DeshiGram<br>NOW</b><small>Quick Delivery • 30–60 min</small></span><i>›</i></a>
</header>`;
const footer=()=>`<footer class="footer dg-market-footer" data-common-footer><div class="container dg-market-footer-grid">
<div class="dg-footer-brand"><img src="images/logo.webp" alt="DeshiGram"><p>Desh Ki Parampara, Har Ghar Tak.</p></div>
<div class="dg-footer-column"><h3>Quick Links</h3><a href="index.html">Home</a><a href="products.html">Products</a><a href="about.html">About Us</a><a href="contact.html">Contact Us</a><a href="distributors.html">Distributorship</a></div>
<div class="dg-footer-column"><h3>Customer Service</h3><a href="shipping-delivery.html">Shipping &amp; Delivery</a><a href="returns-refunds.html">Returns &amp; Refunds</a><a href="faq.html">FAQs</a><a href="terms.html">Terms &amp; Conditions</a><a href="privacy.html">Privacy Policy</a><a href="policies.html">All Policies</a></div>
<div class="dg-footer-column"><h3>Company</h3><a href="about.html">About DeshiGram</a><a href="about.html#our-values">Our Values</a><a href="policies.html#quality">Quality Promise</a><a href="contact.html">Support</a></div>
<div class="dg-footer-meta"><div class="dg-fssai-compact"><strong>FSSAI Registered</strong><span>22726302000355</span><span>GST Certified</span></div><div class="dg-payments-compact"><strong>We Accept</strong><div class="dg-payment-badges"><span>UPI</span><span>RuPay</span><span>VISA</span><span>Mastercard</span></div><div class="dg-official-mails"><a href="mailto:info@deshigram.in">info@deshigram.in</a><a href="mailto:support@deshigram.in">support@deshigram.in</a></div></div></div>
</div><div class="container dg-footer-bottom"><span>© <span data-year></span> DeshiGram. All rights reserved.</span><span>🇮🇳 Made in India</span><span>Powered by <strong>RK &amp; Sons Retail Group</strong></span></div></footer>`;
function cartCount(){let n=0;for(const k of ['deshigram_cart','dg_cart','cart']){try{const v=JSON.parse(localStorage.getItem(k)||'null');if(Array.isArray(v)){n=v.reduce((a,x)=>a+Number(x.quantity||x.qty||1),0);break}}catch(e){}}document.querySelectorAll('[data-cart-count]').forEach(x=>{x.textContent=n;x.classList.toggle('is-visible',n>0)})}
function mount(){
 document.querySelectorAll('.dg-top').forEach((x,i)=>{if(i>0)x.remove()});
 const oldHeader=document.querySelector('header'); if(oldHeader) oldHeader.outerHTML=header(); else document.body.insertAdjacentHTML('afterbegin',header());
 const top=document.querySelector('.dg-top'); if(!top) document.body.insertAdjacentHTML('afterbegin',header().match(/^<div class="dg-top">[\s\S]*?<\/div>/)[0]);
 const oldFooter=document.querySelector('footer'); if(oldFooter) oldFooter.outerHTML=footer(); else document.body.insertAdjacentHTML('beforeend',footer());
 document.querySelectorAll('[data-year]').forEach(x=>x.textContent=new Date().getFullYear()); cartCount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
window.addEventListener('storage',cartCount);
})();
