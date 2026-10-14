import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://kqkpbqpfnupjpthtpvdn.supabase.co','sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0');
const forms=[...document.querySelectorAll('[data-announcement-strip]')],status=document.getElementById('dgAnnouncementAdminStatus');
const defaults={top:['Desh Ki Parampara, Har Ghar Tak','Pure • Traditional • Trusted','Made in India'],offer:['Original DeshiGram products','Pan India delivery','Secure shopping']};
const message=(s,error=false)=>{status.textContent=s;status.style.color=error?'#b42318':'#264c3b'};
function addRow(form,value=''){
 const list=form.querySelector('[data-message-list]');if(list.children.length>=10)return;
 const row=document.createElement('div');row.className='dg-announcement-message';
 const input=document.createElement('input');input.type='text';input.maxLength=140;input.value=value;input.placeholder='Short announcement';input.setAttribute('aria-label','Announcement message');
 const up=document.createElement('button');up.type='button';up.textContent='↑';up.title='Move up';
 const down=document.createElement('button');down.type='button';down.textContent='↓';down.title='Move down';
 const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Delete message';
 up.addEventListener('click',()=>{if(row.previousElementSibling)list.insertBefore(row,row.previousElementSibling);preview(form)});
 down.addEventListener('click',()=>{if(row.nextElementSibling)list.insertBefore(row.nextElementSibling,row);preview(form)});
 del.addEventListener('click',()=>{row.remove();preview(form)});
 input.addEventListener('input',()=>preview(form));row.append(input,up,down,del);list.append(row);
}
const values=form=>[...form.querySelectorAll('.dg-announcement-message input')].map(x=>x.value.trim()).filter(Boolean);
function preview(form){
 const box=form.querySelector('[data-announcement-preview]');box.replaceChildren();
 box.style.backgroundColor=form.elements.background_color.value;box.style.color=form.elements.text_color.value;
 if(!form.elements.enabled.checked){box.textContent='Strip disabled';return}
 const messages=values(form);
 if(form.dataset.announcementStrip==='top'){box.textContent=messages.join('   •   ')||'No messages';return}
 const track=document.createElement('div');track.className='preview-track';
 [...messages,...messages].forEach(s=>{const el=document.createElement('span');el.textContent=s;track.append(el)});
 const speed=form.elements.speed.value;track.style.animationDuration=({slow:'48s',normal:'32s',fast:'18s'}[speed]||'32s');
 box.append(track);
}
async function authorized(){
 const {data:{session}}=await db.auth.getSession();if(!session)return false;
 const {data,error}=await db.rpc('is_deshigram_admin');return !error&&data===true;
}
let loaded=false;
async function load(){
 if(loaded)return;
 if(!(await authorized())){message('Sign in as an authorized Main Admin to manage announcements.',true);return}
 const {data,error}=await db.from('main_site_announcements').select('*');
 if(error){message('Announcements table not ready. Apply the reviewed migration before saving: '+error.message,true);return}
 for(const form of forms){
  const row=(data||[]).find(x=>x.strip===form.dataset.announcementStrip);
  if(row){form.elements.enabled.checked=row.enabled;form.elements.background_color.value=row.background_color;form.elements.text_color.value=row.text_color;if(form.elements.speed)form.elements.speed.value=row.speed}
  const messages=Array.isArray(row?.messages)?row.messages:defaults[form.dataset.announcementStrip];
  form.querySelector('[data-message-list]').replaceChildren();messages.forEach(s=>addRow(form,s));preview(form);
 }
 loaded=true;message('Announcement settings loaded.');
}
forms.forEach(form=>{
 defaults[form.dataset.announcementStrip].forEach(s=>addRow(form,s));preview(form);
 form.querySelector('[data-add-message]').addEventListener('click',()=>{addRow(form);preview(form)});
 form.addEventListener('input',()=>preview(form));form.addEventListener('change',()=>preview(form));
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!(await authorized())){message('Admin authorization required.',true);return}
  const payload={strip:form.dataset.announcementStrip,enabled:form.elements.enabled.checked,messages:values(form),background_color:form.elements.background_color.value,text_color:form.elements.text_color.value,speed:form.elements.speed?.value||'normal',updated_at:new Date().toISOString()};
  const {error}=await db.from('main_site_announcements').upsert(payload,{onConflict:'strip'});
  message(error?'Save failed: '+error.message:'Saved '+payload.strip+' strip.',!!error);
 });
});
document.querySelector('[data-section="announcements"]')?.addEventListener('click',load);
if(location.hash==='#announcements')load();
