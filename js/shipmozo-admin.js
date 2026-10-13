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
 status.textContent=orders.length+' eligible orders · '+shipments.size+' shipment records · Production actions disabled';
 output.innerHTML='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:760px"><thead><tr><th>Order</th><th>Status</th><th>Payment</th><th>Destination</th><th>Courier / AWB</th><th>Shipping</th><th>Actions</th></tr></thead><tbody>'+orders.map(o=>{
 const sh=shipments.get(o.id),payment=String(o.payment_method||'').toUpperCase()==='COD'?'COD':'PREPAID';
 return '<tr><td><strong>'+esc(o.order_number)+'</strong><br><small>'+esc(o.product_name)+'</small></td><td>'+esc(o.order_status)+'</td><td>'+esc(payment)+'<br>₹'+Number(o.total_amount||0).toFixed(2)+'</td><td>'+esc(o.pincode)+'</td><td>'+esc(sh?.courier_name||'Not assigned')+'<br>'+esc(sh?.awb_number||'—')+'</td><td>'+esc(sh?.state||'Not booked')+'<br>'+esc(sh?.shipping_charge==null?'—':'₹'+sh.shipping_charge)+'</td><td><button type="button" disabled title="Awaiting verified Shipmozo credentials, API guide and admin confirmation">Check Rates</button> <button type="button" disabled>Create Shipment</button> <button type="button" disabled>Select Courier</button> <button type="button" disabled>Schedule Pickup</button> <button type="button" disabled>Print Label</button> <button type="button" disabled>Track Order</button> <button type="button" disabled>Cancel Shipment</button></td></tr>';
 }).join('')+'</tbody></table></div>';
}
document.querySelector('[data-section="shipmozo"]')?.addEventListener('click',refresh);
document.getElementById('refreshAll')?.addEventListener('click',()=>{if(panel?.classList.contains('active'))refresh()});
