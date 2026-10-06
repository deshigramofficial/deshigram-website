(() => {
  const legacy=[];
  const esc=v=>String(v||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const initials=n=>String(n||'Customer').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  const stars=r=>'★'.repeat(Math.max(1,Math.min(5,Math.round(Number(r)||0))));
  function card(r){return `<article class="customer-review-card live-review-card"><div class="review-card-top"><span class="review-avatar">${esc(initials(r.name))}</span><div><strong>${esc(r.name)}</strong><span class="review-badge verified">✓ Verified Customer</span></div></div><div class="review-stars">${stars(r.rating)} <span>${Number(r.rating).toFixed(1)}</span></div><p>“${esc(r.review)}”</p></article>`;}
  function summary(items){const avg=items.reduce((s,r)=>s+Number(r.rating),0)/Math.max(items.length,1);return{avg,count:items.length};}
  async function init(){
    const viewport=document.querySelector('[data-review-slider]');
    const track=document.querySelector('[data-live-reviews]');
    const summaryEl=document.querySelector('[data-review-summary]');
    if(!track) return;
    let live=[];try{live=await window.DESHIGRAM_INTEGRATIONS.getApprovedReviews()||[];}catch(_){}
    const names=new Set(legacy.map(x=>x.name.toLowerCase()));
    const extra=live.filter(x=>x.verified && !names.has(String(x.name||'').toLowerCase()));
    const all=[...legacy,...extra];
    track.innerHTML=all.length?all.map(card).join(''):'<p class="dg-no-verified-reviews">Verified customer ratings will appear here after approval.</p>';
    const s=summary(all); if(summaryEl)summaryEl.innerHTML=`<strong>${s.avg.toFixed(1)}/5</strong> average from ${s.count} verified customer rating${s.count===1?'':'s'}.`;
    const prev=document.querySelector('[data-review-prev]'),next=document.querySelector('[data-review-next]');
    const step=()=>Math.min(viewport?.clientWidth||320,380);
    prev?.addEventListener('click',()=>viewport.scrollBy({left:-step(),behavior:'smooth'}));
    next?.addEventListener('click',()=>viewport.scrollBy({left:step(),behavior:'smooth'}));
  }
  document.addEventListener('DOMContentLoaded',init);
})();
