/* Public website settings. Static banner fallback remains if database is unavailable. */
(async()=>{
const base='https://kqkpbqpfnupjpthtpvdn.supabase.co',key='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
let rows;try{const r=await fetch(base+'/rest/v1/website_customization?select=*&order=slot.asc',{headers:{apikey:key,Authorization:'Bearer '+key}});if(!r.ok)return;rows=await r.json()}catch{return}
const map=new Map(rows.map(r=>[r.slot,r]));const safe=u=>{if(!u)return '';try{const x=new URL(u,location.href);return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return ''}};
const track=document.querySelector('.dg-showcase-track');
if(track){const bannerRows=rows.filter(r=>/^showcase_\d+$/.test(r.slot)).sort((a,b)=>Number(a.slot.split('_')[1])-Number(b.slot.split('_')[1]));
const existing=[...track.querySelectorAll('[data-banner-slot]')];
for(const r of bannerRows){let fig=existing.find(e=>e.dataset.bannerSlot===r.slot);if(!fig){fig=document.createElement('figure');fig.className='dg-showcase-slide';fig.dataset.bannerSlot=r.slot;track.append(fig)}
fig.hidden=r.visible===false;fig.style.display=r.visible===false?'none':'';fig.classList.toggle('dg-festive-effects',!!r.festive_effects&&(!r.effect_until||new Date(r.effect_until+'T23:59:59')>=new Date()));
const fallbackSrc=fig.querySelector('img')?.getAttribute('src')||'';let picture=fig.querySelector('picture');if(!picture){picture=document.createElement('picture');fig.prepend(picture)}picture.replaceChildren();
if(r.mobile_image_url){const source=document.createElement('source');source.media='(max-width: 760px)';source.srcset=r.mobile_image_url;picture.append(source)}
const img=document.createElement('img');img.src=r.image_url||fallbackSrc;img.alt=r.title||'DeshiGram banner';img.loading='lazy';img.decoding='async';img.width=2048;img.height=768;picture.append(img);
fig.querySelector('.dg-custom-link')?.remove();if(r.link_url&&safe(r.link_url)){const a=document.createElement('a');a.className='dg-custom-link';a.href=safe(r.link_url);a.setAttribute('aria-label',r.title||'Open banner');if(r.new_tab){a.target='_blank';a.rel='noopener noreferrer'}a.style.cssText='position:absolute;inset:0;z-index:3';fig.append(a)}
}
// If an admin explicitly deleted a banner, remove its static fallback.
if(bannerRows.length){for(const fig of existing)if(!map.has(fig.dataset.bannerSlot))fig.remove()}
track.parentElement.dispatchEvent(new Event('dg:banners-updated'));
}
const hero=map.get('hero');if(hero){const sec=document.querySelector('.dg-hero');if(sec){sec.hidden=hero.visible===false;const img=sec.querySelector('.dg-hero-visual img');if(img&&hero.image_url)img.src=hero.image_url;const h=sec.querySelector('.dg-hero-copy h1');if(h&&hero.title)h.textContent=hero.title;const p=sec.querySelector('.dg-hero-copy p');if(p&&hero.subtitle)p.textContent=hero.subtitle;const a=sec.querySelector('.dg-hero-actions a');if(a&&safe(hero.link_url))a.href=safe(hero.link_url)}}
const featured=map.get('featured');if(featured){const sec=document.querySelector('#featured-products');if(sec){sec.hidden=featured.visible===false;const h=sec.querySelector('h2');if(h&&featured.title)h.textContent=featured.title}}
})();
