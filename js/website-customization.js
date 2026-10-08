/* Public website settings. Static banner fallback remains if database is unavailable. */
(async()=>{
const base='https://kqkpbqpfnupjpthtpvdn.supabase.co',key='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
let rows;try{const control=await fetch(base+'/rest/v1/d2c_quick_controls?key=eq.banners&select=enabled',{headers:{apikey:key}});if(control.ok){const flags=await control.json();if(flags[0]?.enabled===false)return;}}catch(_){}try{const r=await fetch(base+'/rest/v1/website_customization?select=*&order=slot.asc',{headers:{apikey:key,Authorization:'Bearer '+key}});if(!r.ok)return;rows=await r.json()}catch{return}
const map=new Map(rows.map(r=>[r.slot,r]));const safe=u=>{if(!u)return '';try{const x=new URL(u,location.href);return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return ''}};
const carousel=document.querySelector('[data-carousel]');
if(carousel){
 const slides=[...carousel.querySelectorAll('.dg-slide')];
 for(const [i,slide] of slides.entries()){
  const row=map.get('showcase_'+(i+1));if(!row)continue;
  slide.hidden=row.visible===false;slide.style.display=row.visible===false?'none':'';
  const img=slide.querySelector('img');if(img&&row.image_url)img.src=row.image_url;if(img&&row.title)img.alt=row.title;
  if(row.mobile_image_url&&img){let picture=slide.querySelector('picture');if(!picture){picture=document.createElement('picture');img.replaceWith(picture);picture.append(img)}let source=picture.querySelector('source[data-admin-mobile]');if(!source){source=document.createElement('source');source.dataset.adminMobile='1';source.media='(max-width: 760px)';picture.prepend(source)}source.srcset=row.mobile_image_url}
  const href=safe(row.link_url);if(href)slide.href=href;if(row.new_tab){slide.target='_blank';slide.rel='noopener noreferrer'}else{slide.removeAttribute('target');slide.removeAttribute('rel')}
 }
 carousel.dispatchEvent(new Event('dg:banners-updated'));
}
const hero=map.get('hero');if(hero){const sec=document.querySelector('.dg-hero');if(sec){sec.hidden=hero.visible===false;const img=sec.querySelector('.dg-hero-visual img');if(img&&hero.image_url)img.src=hero.image_url;const h=sec.querySelector('.dg-hero-copy h1');if(h&&hero.title)h.textContent=hero.title;const p=sec.querySelector('.dg-hero-copy p');if(p&&hero.subtitle)p.textContent=hero.subtitle;const a=sec.querySelector('.dg-hero-actions a');if(a&&safe(hero.link_url))a.href=safe(hero.link_url)}}
const featured=map.get('featured');if(featured){const sec=document.querySelector('#featured-products');if(sec){sec.hidden=featured.visible===false;const h=sec.querySelector('h2');if(h&&featured.title)h.textContent=featured.title}}
})();
