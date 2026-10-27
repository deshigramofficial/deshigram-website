/* Public website settings. Static banner fallback remains if database is unavailable. */
(async()=>{
const base='https://kqkpbqpfnupjpthtpvdn.supabase.co',key='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
const reveal=()=>document.documentElement.classList.add('dg-banners-ready');setTimeout(reveal,3500);let rows;try{const control=await fetch(base+'/rest/v1/d2c_quick_controls?key=eq.banners&select=enabled',{headers:{apikey:key}});if(control.ok){const flags=await control.json();if(flags[0]?.enabled===false){reveal();return;}}}catch(_){}try{const r=await fetch(base+'/rest/v1/website_customization?select=*&order=slot.asc',{headers:{apikey:key,Authorization:'Bearer '+key}});if(!r.ok){reveal();return;}rows=await r.json()}catch{reveal();return}
const map=new Map(rows.map(r=>[r.slot,r]));const safe=u=>{if(!u)return '';try{const x=new URL(u,location.href);return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return ''}};
const carousel=document.querySelector('[data-carousel]');
if(carousel){
 const saved=[...map.entries()].filter(([slot])=>/^showcase_\d+$/.test(slot)).sort((a,b)=>Number(a[0].split('_')[1])-Number(b[0].split('_')[1]));
 const original=[...carousel.querySelectorAll('.dg-slide')];
 // Admin is the source of truth: render every published, visible showcase banner.
 // Retain the static artwork only if Admin has no published showcase rows.
 if(saved.length){
  const slides=[];
  for(const [slot,row] of saved){
   if(row.visible===false||!row.image_url)continue;
   const slide=document.createElement('a');slide.className='dg-slide';
   const href=safe(row.link_url);slide.href=href||'products.html';
   if(row.new_tab){slide.target='_blank';slide.rel='noopener noreferrer'}
   const img=document.createElement('img');img.src=row.image_url;img.alt=row.title||'DeshiGram promotional banner';img.decoding='async';img.style.setProperty('transform',`scale(${Math.min(150,Math.max(60,Number(row.banner_scale)||100))/100})`);img.loading=slides.length?'lazy':'eager';
   if(row.mobile_image_url){const picture=document.createElement('picture');const source=document.createElement('source');source.media='(max-width: 760px)';source.srcset=row.mobile_image_url;picture.append(source,img);slide.append(picture)}else slide.append(img);
   slides.push(slide);
  }
  original.forEach(slide=>slide.remove());
  const controls=carousel.querySelector('.dg-prev');
  slides.forEach(slide=>carousel.insertBefore(slide,controls));
 }
 // If the first slide was disabled in Admin, promote the next visible slide.
 const visibleSlides=[...carousel.querySelectorAll('.dg-slide')].filter(slide=>!slide.hidden&&slide.style.display!=='none');
 visibleSlides.forEach(slide=>slide.classList.remove('active'));
 if(visibleSlides.length)visibleSlides[0].classList.add('active');
 carousel.dispatchEvent(new Event('dg:banners-updated'));reveal();
}
reveal();const hero=map.get('hero');if(hero){const sec=document.querySelector('.dg-hero');if(sec){sec.hidden=hero.visible===false;const img=sec.querySelector('.dg-hero-visual img');if(img&&hero.image_url)img.src=hero.image_url;const h=sec.querySelector('.dg-hero-copy h1');if(h&&hero.title)h.textContent=hero.title;const p=sec.querySelector('.dg-hero-copy p');if(p&&hero.subtitle)p.textContent=hero.subtitle;const a=sec.querySelector('.dg-hero-actions a');if(a&&safe(hero.link_url))a.href=safe(hero.link_url)}}
const featured=map.get('featured');if(featured){const sec=document.querySelector('.dg-now-promo');if(sec){sec.hidden=featured.visible===false;const img=sec.querySelector('img');if(img&&featured.image_url){img.src=featured.image_url;img.style.transform='scale('+Math.min(150,Math.max(60,Number(featured.banner_scale)||100))/100+')';img.style.transformOrigin='center';}const a=sec.querySelector('a');if(a&&safe(featured.link_url))a.href=safe(featured.link_url)}}
})();
