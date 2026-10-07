/* Public website settings. Static banner fallback remains if database is unavailable. */
(async()=>{
const base='https://kqkpbqpfnupjpthtpvdn.supabase.co',key='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
let rows;try{const r=await fetch(base+'/rest/v1/website_customization?select=*&order=slot.asc',{headers:{apikey:key,Authorization:'Bearer '+key}});if(!r.ok)return;rows=await r.json()}catch{return}
const map=new Map(rows.map(r=>[r.slot,r]));const safe=u=>{if(!u)return '';try{const x=new URL(u,location.href);return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return ''}};
const carousel=document.querySelector('[data-carousel]');
if(carousel){
 const bannerRows=rows.filter(r=>/^showcase_\d+$/.test(r.slot)).sort((a,b)=>Number(a.slot.split('_')[1])-Number(b.slot.split('_')[1]));
 if(bannerRows.length){
  carousel.querySelectorAll('.dg-slide').forEach(x=>x.remove());
  const controls=carousel.querySelector('.dg-prev');
  for(const [i,r] of bannerRows.entries()){
   if(r.visible===false)continue;
   const a=document.createElement('a');a.className='dg-slide'+(i===0?' active':'');a.dataset.bannerSlot=r.slot;
   a.href=safe(r.link_url)||'#';if(r.new_tab){a.target='_blank';a.rel='noopener noreferrer'}
   const picture=document.createElement('picture');
   if(r.mobile_image_url){const source=document.createElement('source');source.media='(max-width: 760px)';source.srcset=r.mobile_image_url;picture.append(source)}
   const img=document.createElement('img');img.src=r.image_url||'';img.alt=r.title||'DeshiGram promotional banner';img.loading=i===0?'eager':'lazy';img.decoding='async';img.width=1536;img.height=819;picture.append(img);a.append(picture);
   carousel.insertBefore(a,controls);
  }
  carousel.dispatchEvent(new Event('dg:banners-updated'));
 }
}
const hero=map.get('hero');if(hero){const sec=document.querySelector('.dg-hero');if(sec){sec.hidden=hero.visible===false;const img=sec.querySelector('.dg-hero-visual img');if(img&&hero.image_url)img.src=hero.image_url;const h=sec.querySelector('.dg-hero-copy h1');if(h&&hero.title)h.textContent=hero.title;const p=sec.querySelector('.dg-hero-copy p');if(p&&hero.subtitle)p.textContent=hero.subtitle;const a=sec.querySelector('.dg-hero-actions a');if(a&&safe(hero.link_url))a.href=safe(hero.link_url)}}
const featured=map.get('featured');if(featured){const sec=document.querySelector('#featured-products');if(sec){sec.hidden=featured.visible===false;const h=sec.querySelector('h2');if(h&&featured.title)h.textContent=featured.title}}
})();
