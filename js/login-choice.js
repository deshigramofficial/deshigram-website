(function(){
  function ensureModal(){
    if(document.getElementById('dgLoginChoice')) return;
    const wrap=document.createElement('div');
    wrap.id='dgLoginChoice';
    wrap.className='dg-login-choice';
    wrap.hidden=true;
    wrap.innerHTML=`<div class="dg-login-backdrop" data-dg-login-close></div><section class="dg-login-dialog" role="dialog" aria-modal="true" aria-labelledby="dgLoginTitle"><button class="dg-login-close" type="button" aria-label="Close" data-dg-login-close>×</button><div class="dg-login-brand"><img src="images/logo.webp" alt="DeshiGram"><div><strong>DeshiGram</strong><span>Choose how you want to continue</span></div></div><h2 id="dgLoginTitle">Login to DeshiGram</h2><div class="dg-login-options"><a href="account.html" class="dg-login-option"><span class="dg-login-icon">👤</span><span><strong>Customer Login</strong><small>Orders, account & reviews</small></span><b>→</b></a><a href="seller.html" class="dg-login-option"><span class="dg-login-icon">🏪</span><span><strong>Seller Login</strong><small>Listings, orders & payments</small></span><b>→</b></a></div><p class="dg-login-note">One simple login choice. No extra steps.</p></section>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click',e=>{if(e.target.closest('[data-dg-login-close]')) close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  function open(){ensureModal();const el=document.getElementById('dgLoginChoice');el.hidden=false;document.body.classList.add('dg-login-open');}
  function close(){const el=document.getElementById('dgLoginChoice');if(el)el.hidden=true;document.body.classList.remove('dg-login-open');}
  document.addEventListener('DOMContentLoaded',()=>{
    ensureModal();
    document.querySelectorAll('a[href="account.html"],a[href^="account.html?"]').forEach(a=>{
      if(a.closest('.dg-login-dialog')||a.hasAttribute('data-direct-account')) return;
      if(/login/i.test(a.textContent||'')){
        a.classList.add('dg-login-trigger');
        a.addEventListener('click',e=>{e.preventDefault();open();});
      }
    });
  });
  window.DG_LOGIN_CHOICE={open,close};
})();
