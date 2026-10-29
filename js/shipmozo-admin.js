// DeshiGram Main Admin — Shipmozo safe read-only foundation. No Shipmozo keys or external calls.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient('https://kqkpbqpfnupjpthtpvdn.supabase.co','sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const panel=document.querySelector('[data-panel="shipmozo"]'),output=document.getElementById('shipmozoOrders'),status=document.getElementById('shipmozoStatus');
const money=n=>'₹'+Number(n||0).toFixed(2);
const pill=(v)=>'<span class="sm-pill">'+esc(String(v||'Pending').replaceAll('_',' '))+'</span>';
const box=(label,value,note)=>'<article class="sm-stat"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(note)+'</span></article>';
async function refresh(){
 if(!panel||!panel.classList.contains('active'))return;
 status.textContent='Loading shipping orders…';
 const {data,error}=await db.rpc('main_shipmozo_shipping_overview');
 if(error||!data){status.textContent='Unable to load Shipping Manager: '+(error?.message||'Admin login required');return;}
 const shipments=new Map((data.shipments||[]).map(s=>[String(s.order_id),s])),orders=data.orders||[];
 const synced=orders.filter(o=>shipments.has(String(o.id))).length,cod=orders.filter(o=>String(o.payment_method||'').toUpperCase()==='COD').length;
 status.textContent='Last refreshed '+new Date().toLocaleTimeString('en-IN')+' · '+orders.length+' eligible orders';
 const summary='<div class="sm-stats">'+box('Eligible orders',orders.length,'COD and paid orders')+box('Shipmozo records',synced,'Linked shipments')+box('COD orders',cod,'Collect total, not just product price')+box('Awaiting sync',Math.max(0,orders.length-synced),'Check queue if delayed')+'</div>';
 const rows=orders.map(o=>{
  const sh=shipments.get(String(o.id)),isCod=String(o.payment_method||'').toUpperCase()==='COD',total=Number(o.total_amount||0),fees=['delivery_fee','platform_fee','packaging_fee','payment_fee'].reduce((n,k)=>n+Number(o[k]||0),0);
  const product=Math.max(0,total-fees);
  return '<tr><td><strong>'+esc(o.order_number)+'</strong><small>'+esc(o.product_name||'Product')+'</small></td><td>'+pill(o.order_status)+'</td><td><strong>'+esc(isCod?'COD':'PREPAID')+'</strong><small>'+money(total)+' payable</small></td><td>'+esc(o.pincode||'—')+'</td><td>'+esc(sh?.courier_name||'Not assigned')+'<small>AWB: '+esc(sh?.awb_number||'Pending')+'</small></td><td>'+pill(sh?.last_tracking_status||sh?.state||'Awaiting sync')+'</td><td><details><summary>View details</summary><div class="sm-details"><div><b>Website order</b><span>'+esc(o.order_number)+'</span></div><div><b>Shipmozo ID</b><span>'+esc(sh?.shipmozo_order_id||'Not created')+'</span></div><div><b>Product value (estimated)</b><span>'+money(product)+'</span></div><div><b>Website fees</b><span>'+money(fees)+'</span></div><div><b>Customer payable</b><span>'+money(total)+'</span></div><div><b>COD collectible</b><span>'+money(isCod?total:0)+'</span></div><div><b>Courier / AWB</b><span>'+esc(sh?.courier_name||'—')+' / '+esc(sh?.awb_number||'—')+'</span></div><div><b>Last tracking</b><span>'+esc(sh?.last_tracking_status||'Awaiting update')+'</span></div></div></details></td></tr>';
 }).join('');
 output.innerHTML=summary+'<div class="sm-note"><strong>Invoice and COD are different:</strong> Shipmozo Push-Order supports product prices and COD amount, but the supplied API guide does not document separate invoice fields for delivery, platform, packaging or payment fees. Never increase product price just to match COD.</div><div class="sm-table-wrap"><table class="sm-table"><thead><tr><th>Order / product</th><th>Order status</th><th>Payment</th><th>PIN</th><th>Courier / AWB</th><th>Shipmozo status</th><th>Details</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+(orders.length?'':'<p class="sm-empty">No eligible orders yet.</p>');
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
testButton.textContent='Refresh Shipmozo Tracking & Orders';
settings.append(testButton);
testButton.addEventListener('click',async()=>{
 const {data:{session}}=await db.auth.getSession();
 if(!session){msg.textContent='Login required';return;}
 testButton.disabled=true;msg.textContent='Checking Shipmozo tracking…';
 try { const res=await fetch('https://kqkpbqpfnupjpthtpvdn.supabase.co/functions/v1/shipping-sync-worker',{method:'POST',headers:{Authorization:'Bearer '+session.access_token}});
 const result=await res.json();
 if(!res.ok||result.error){msg.textContent='Tracking sync failed: '+(result.error||res.status);return;}
 const failures=result.tracking_errors||[];
 msg.textContent='Checked '+(result.tracking_checked||0)+' shipments · Updated '+(result.tracking_updated||0)+(failures.length?' · '+failures.length+' tracking issues: '+failures.map(x=>x.order+': '+x.message).join('; '):' · No tracking API errors');
 await refresh();
 }catch(e){msg.textContent='Tracking refresh failed: '+e.message;}finally{testButton.disabled=false;}
});

const shippingStyles=document.createElement('style');
shippingStyles.textContent=`
[data-panel="shipmozo"] .panel{max-width:100%}
.sm-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}
.sm-stat{padding:18px;border:1px solid #dce7df;border-radius:14px;background:linear-gradient(145deg,#fff,#f5faf6);display:grid;gap:7px}
.sm-stat small{font-weight:700;color:#56715d}.sm-stat strong{font-size:27px;color:#183b28}.sm-stat span{font-size:12px;color:#6b7d71}
.sm-note{background:#f5f8f5;border-left:3px solid #47785a;padding:13px 16px;border-radius:9px;margin:12px 0 18px;color:#3d5144;line-height:1.6}
.sm-table-wrap{overflow-x:auto;border:1px solid #e1e9e3;border-radius:12px}
.sm-table{width:100%;border-collapse:collapse;min-width:850px;text-align:left}
.sm-table th{background:#f2f7f3;color:#47604e;font-size:12px;padding:13px}
.sm-table td{padding:14px 13px;border-top:1px solid #e9eeea;vertical-align:top;font-size:13px}
.sm-table td small{display:block;color:#78877c;margin-top:5px}.sm-pill{display:inline-block;background:#e9f4ec;color:#27613a;border-radius:30px;padding:5px 10px;text-transform:capitalize;font-size:12px;font-weight:700}
.sm-table details{min-width:120px}.sm-table summary{cursor:pointer;color:#236a41;font-weight:700}
.sm-details{min-width:260px;display:grid;gap:9px;margin-top:10px;padding:12px;background:#f7faf7;border-radius:10px}
.sm-details div{display:flex;justify-content:space-between;gap:15px}.sm-details b{color:#637568;font-size:11px}.sm-details span{font-size:12px;text-align:right;overflow-wrap:anywhere}
@media(max-width:800px){.sm-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:420px){.sm-stats{grid-template-columns:1fr}}
`;
document.head.append(shippingStyles);

// Refresh the read-only shipping overview when admin returns to this tab.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&panel?.classList.contains('active'))refresh();});
setInterval(()=>{if(!document.hidden&&panel?.classList.contains('active'))refresh();},90000);
