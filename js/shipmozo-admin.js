// DeshiGram Main Admin — Shipmozo safe read-only foundation. No Shipmozo keys or external calls.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient('https://kqkpbqpfnupjpthtpvdn.supabase.co','sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const panel=document.querySelector('[data-panel="shipmozo"]'),output=document.getElementById('shipmozoOrders'),status=document.getElementById('shipmozoStatus');
async function refresh(){
 if(!panel||!panel.classList.contains('active'))return;
 status.textContent='Loading eligible website orders…';
 const {data,error}=await db.rpc('main_shipmozo_shipping_overview');
 if(error||!data){status.textContent='Unable to load Shipping Manager: '+(error?.message||'Admin authentication required');return;}
 const shipments=new Map((data.shipments||[]).map(s=>[s.order_id,s]));
 const orders=data.orders||[];
 status.textContent=orders.length+' eligible orders · '+shipments.size+' shipment records · Live automatic shipping sync enabled';
 output.innerHTML='<p style="margin:0 0 12px;padding:12px;border:1px solid #d8e3da;border-radius:8px"><strong>Shipmozo automatic sync:</strong> Eligible COD and paid orders sync automatically to Shipmozo. Courier booking remains in Shipmozo Dashboard. Cancellation and tracking status are polled automatically.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:760px"><thead><tr><th>Order</th><th>Status</th><th>Payment</th><th>Destination</th><th>Courier / AWB</th><th>Shipping</th><th>Sync</th></tr></thead><tbody>'+orders.map(o=>{
 const sh=shipments.get(o.id),payment=String(o.payment_method||'').toUpperCase()==='COD'?'COD':'PREPAID';
 return '<tr><td><strong>'+esc(o.order_number)+'</strong><br><small>'+esc(o.product_name)+'</small></td><td>'+esc(o.order_status)+'</td><td>'+esc(payment)+'<br>₹'+Number(o.total_amount||0).toFixed(2)+'</td><td>'+esc(o.pincode)+'</td><td>'+esc(sh?.courier_name||'Not assigned')+'<br>'+esc(sh?.awb_number||'—')+'</td><td>'+esc(sh?.state||'Not booked')+'<br>'+esc(sh?.shipping_charge==null?'—':'₹'+sh.shipping_charge)+'</td><td>'+esc(sh?.state||'Awaiting sync')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
}
document.querySelector('[data-section="shipmozo"]')?.addEventListener('click',refresh);
document.getElementById('refreshAll')?.addEventListener('click',()=>{if(panel?.classList.contains('active'))refresh()});

const settings=document.createElement('div');settings.style.cssText='margin-bottom:20px;padding:16px;border:1px solid #dce6df;border-radius:12px';
settings.innerHTML='<h3>Shipping Providers</h3><p>Connect Shipmozo now; Shiprocket connector can be added later. Credentials are stored in the secure backend, never in browser storage.</p><div id="shippingProvidersStatus">Open Shipping Manager to load providers.</div><form id="shippingConnectForm" autocomplete="off" style="display:grid;gap:10px;max-width:520px;margin-top:16px"><label>Shipmozo Public Key<input name="public_key" type="password" required autocomplete="off" placeholder="Public Key" style="width:100%"></label><label>Shipmozo Private Key<input name="private_key" type="password" required autocomplete="off" placeholder="Private Key" style="width:100%"></label><button type="submit">Save Shipmozo Keys Securely</button></form><div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap"><button type="button" id="shippingTest">Test Shipmozo Connection</button><select id="shippingWarehouse"><option value="">Select pickup warehouse after test</option></select><button type="button" id="shippingSaveWarehouse">Save Warehouse</button></div><p id="shippingConnectionMessage" role="status"></p><p><strong>Automatic order sync:</strong> active for eligible orders. Shipmozo status is checked periodically. Parcel weight and dimensions must match the actual package.</p>';
panel?.querySelector('.panel')?.prepend(settings);
const endpoint='https://kqkpbqpfnupjpthtpvdn.supabase.co/functions/v1/shipping-admin';
async function shippingAction(body){
 const {data:{session}}=await db.auth.getSession();
 if(!session?.access_token)throw Error('Admin login required');
 const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0','authorization':'Bearer '+session.access_token},body:JSON.stringify(body)});
 const data=await r.json();if(!r.ok||data.error)throw Error(data.error||'Connection error');return data;
}
const msg=document.getElementById('shippingConnectionMessage');
async function loadProviders(){
 try{const d=await shippingAction({action:'status'});document.getElementById('shippingProvidersStatus').textContent=(d.providers||[]).map(p=>p.display_name+': '+(d.connected.includes(p.provider)?'Keys saved':'Not connected')+' · '+(p.is_enabled?'Active':'Inactive')).join(' | ');}
 catch(e){document.getElementById('shippingProvidersStatus').textContent=e.message;}
}
document.querySelector('[data-section="shipmozo"]')?.addEventListener('click',loadProviders);
document.getElementById('shippingConnectForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;msg.textContent='Saving keys securely…';try{const d=await shippingAction({action:'save_shipmozo',public_key:form.elements.public_key.value,private_key:form.elements.private_key.value});form.reset();msg.textContent=d.message;await loadProviders();}catch(err){msg.textContent=err.message;}});
document.getElementById('shippingTest')?.addEventListener('click',async()=>{msg.textContent='Checking Shipmozo API…';try{const d=await shippingAction({action:'test_shipmozo'});msg.textContent=d.message;const sel=document.getElementById('shippingWarehouse');sel.innerHTML='<option value="">Select pickup warehouse</option>'+(d.warehouses||[]).filter(w=>w.status==='ACTIVE').map(w=>'<option value="'+esc(w.id)+'">'+esc(w.name)+'</option>').join('');await loadProviders();}catch(err){msg.textContent=err.message;}});
document.getElementById('shippingSaveWarehouse')?.addEventListener('click',async()=>{const id=document.getElementById('shippingWarehouse').value;if(!id){msg.textContent='Choose a warehouse first';return;}try{await shippingAction({action:'set_warehouse',warehouse_id:id});msg.textContent='Pickup warehouse saved';}catch(err){msg.textContent=err.message;}});

const testButton=document.createElement('button');
testButton.type='button';
testButton.textContent='Sync queued orders to Shipmozo';
settings.append(testButton);
testButton.addEventListener('click',async()=>{
 const {data:{session}}=await db.auth.getSession();
 if(!session){msg.textContent='Login required';return;}
 const res=await fetch('https://kqkpbqpfnupjpthtpvdn.supabase.co/functions/v1/shipping-sync-worker',{method:'POST',headers:{Authorization:'Bearer '+session.access_token}});
 const result=await res.json();
 msg.textContent=JSON.stringify(result);
});
