import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const url='https://kqkpbqpfnupjpthtpvdn.supabase.co';
const key='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
const status=document.getElementById('dgNowSettingsStatus');
if(!key){if(status)status.textContent='Supabase key not found. Reload admin page.';}else{
const db=createClient(url,key);
const fields={center_name:'dgNowCenter',center_address:'dgNowAddress',latitude:'dgNowLat',longitude:'dgNowLng',radius_km:'dgNowRadius',local_delivery_enabled:'dgNowEnabled'};
async function load(){const {data,error}=await db.rpc('dg_now_read_settings');if(error){status.textContent=error.message;return;}for(const [k,id] of Object.entries(fields)){const el=document.getElementById(id);if(el.type==='checkbox')el.checked=!!data?.[k];else el.value=data?.[k]??'';}}
document.getElementById('dgNowSettingsForm')?.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Saving…';const val=id=>document.getElementById(id).value.trim();const lat=val('dgNowLat'),lng=val('dgNowLng');const {error}=await db.rpc('dg_now_admin_save_settings',{p_name:val('dgNowCenter'),p_address:val('dgNowAddress'),p_lat:lat===''?null:Number(lat),p_lng:lng===''?null:Number(lng),p_radius:Number(val('dgNowRadius')),p_enabled:document.getElementById('dgNowEnabled').checked});status.textContent=error?'Error: '+error.message:'✓ Delivery settings saved';if(!error)await load();});
load();
}