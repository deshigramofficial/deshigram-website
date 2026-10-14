/* Main Website announcement display. Read-only, falls back to existing static strips. */
(async()=>{
const endpoint='https://kqkpbqpfnupjpthtpvdn.supabase.co/rest/v1/main_site_announcements?select=*';
const key='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
const validColor=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:null;
const safeMessages=rows=>Array.isArray(rows)?rows.filter(s=>typeof s==='string').map(s=>s.trim().slice(0,140)).filter(Boolean).slice(0,10):[];
function apply(rows){
 for(const row of rows){
  const node=document.querySelector(row.strip==='top'?'.dg-top':'.dg-offer-ticker');
  if(!node||!['top','offer'].includes(row.strip))continue;
  node.hidden=row.enabled===false;
  if(row.enabled===false){node.style.setProperty('display','none','important');continue}
  if(validColor(row.background_color))node.style.setProperty('background',row.background_color,'important');
  if(validColor(row.text_color))node.style.setProperty('color',row.text_color,'important');
  const messages=safeMessages(row.messages);
  if(!messages.length)continue;
  if(row.strip==='top'){
   node.replaceChildren(...messages.map(s=>{const el=document.createElement('span');el.textContent=s;return el}))
  }else{
   const track=node.firstElementChild||node.appendChild(document.createElement('div'));
   track.replaceChildren(...[...messages,...messages].map(s=>{const el=document.createElement('span');el.textContent=s;return el}));
   track.style.setProperty('animation-duration',({slow:'48s',normal:'32s',fast:'18s'}[row.speed]||'32s'),'important')
  }
 }
}
try{
 const res=await fetch(endpoint,{headers:{apikey:key},cache:'no-store'});
 if(!res.ok)return;
 const rows=await res.json();if(Array.isArray(rows))apply(rows);
}catch(e){console.warn('Announcement defaults retained',e)}
})();
