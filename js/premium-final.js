(()=>{
 const c=document.querySelector('[data-carousel]');if(!c)return;
 const dots=c.querySelector('.dg-dots');let index=0,timer;
 const slides=()=>[...c.querySelectorAll('.dg-slide')].filter(el=>!el.hidden&&el.style.display!=='none');
 function paint(){const list=slides();if(!list.length)return;index=((index%list.length)+list.length)%list.length;
  list.forEach((el,n)=>{const active=n===index;el.classList.toggle('active',active);el.style.setProperty('opacity',active?'1':'0','important');el.style.setProperty('visibility',active?'visible':'hidden','important');el.style.setProperty('pointer-events',active?'auto':'none','important');el.style.setProperty('z-index',active?'2':'1','important');});
  if(dots){dots.replaceChildren(...list.map((_,n)=>{const b=document.createElement('button');b.type='button';b.className='dg-dot'+(n===index?' active':'');b.setAttribute('aria-label','Banner '+(n+1));b.addEventListener('click',()=>move(n-index));return b;}));}
 }
 function schedule(){clearInterval(timer);if(slides().length>1)timer=setInterval(()=>{index++;paint()},5500)}
 function move(delta){index+=delta;paint();schedule()}
 c.querySelector('.dg-prev')?.addEventListener('click',e=>{e.preventDefault();move(-1)});
 c.querySelector('.dg-next')?.addEventListener('click',e=>{e.preventDefault();move(1)});
 c.addEventListener('dg:banners-updated',()=>{index=0;paint();schedule()});
 c.addEventListener('mouseenter',()=>clearInterval(timer));c.addEventListener('mouseleave',schedule);
 paint();schedule();
})();
function slug(v){return (v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
document.addEventListener('click',e=>{if(e.target.closest('button,.add-to-cart,[data-add-to-cart]'))return;let card=e.target.closest('.dg-product-card,.product-card,.seller-product-card');if(!card)return;let name=(card.querySelector('h2,h3,h4,.product-name,.seller-product-name')||{}).textContent||'';let img=(card.querySelector('img')||{}).src||'';let price=(card.textContent.match(/₹\s?[\d,]+/)||[])[0]||'';location.href='product-detail.html?name='+encodeURIComponent(name)+'&image='+encodeURIComponent(img)+'&price='+encodeURIComponent(price)+'&id='+encodeURIComponent(slug(name))})
const q=document.querySelector('#dgProductSearch');if(q){document.querySelector('.dg-search').addEventListener('submit',e=>{e.preventDefault();let term=q.value.toLowerCase();document.querySelectorAll('.dg-product-card,.product-card,.seller-product-card').forEach(x=>x.style.display=x.textContent.toLowerCase().includes(term)?'':'none')})}

