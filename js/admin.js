(() => {
  const URL='https://kqkpbqpfnupjpthtpvdn.supabase.co';
  const KEY='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
  const loginBox=document.getElementById('loginBox');
  const dashboard=document.getElementById('dashboard');
  const msg=document.getElementById('loginMessage');
  const logout=document.getElementById('logoutBtn');
  const refresh=document.getElementById('refreshBtn');
  const storeKey='dg_admin_session';
  const PAGE_SIZE=25;
  let page=0, totalOrders=0, currentOrders=[];

  function saveSession(s){localStorage.setItem(storeKey,JSON.stringify(s));}
  function getSession(){try{return JSON.parse(localStorage.getItem(storeKey)||'null')}catch{return null}}
  function clearSession(){localStorage.removeItem(storeKey)}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function request(path, opts={}){
    const s=getSession();
    const h={apikey:KEY,'Content-Type':'application/json',...(opts.headers||{})};
    if(s?.access_token) h.Authorization=`Bearer ${s.access_token}`;
    const r=await fetch(URL+path,{...opts,headers:h});
    const t=await r.text(); let d=t; try{d=t?JSON.parse(t):null}catch{}
    if(!r.ok) throw new Error(d?.msg||d?.message||d?.error_description||`Request failed (${r.status})`);
    return d;
  }
  async function login(email,password){return request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});}
  async function stats(){return request('/rest/v1/rpc/admin_dashboard_stats',{method:'POST',body:'{}'});}
  async function history(){
    const search=document.getElementById('orderSearch')?.value.trim()||'';
    const status=document.getElementById('orderStatusFilter')?.value||'';
    return request('/rest/v1/rpc/admin_orders_history',{method:'POST',body:JSON.stringify({p_limit:PAGE_SIZE,p_offset:page*PAGE_SIZE,p_search:search,p_status:status})});
  }
  async function updateOrder(payload){return request('/rest/v1/rpc/admin_update_order',{method:'POST',body:payload});}
  const rupees=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n||0));
  const date=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  function put(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}
  function badge(v,type='order'){return `<span class="status-badge ${esc(type)} ${esc(String(v||'').toLowerCase())}">${esc(String(v||'—').replace(/\b\w/g,m=>m.toUpperCase()))}</span>`;}

  function renderStats(d){
    put('visitorsTotal',d.visitors_total||0);put('visitorsToday',d.visitors_today||0);put('visitorsMonth',d.visitors_month||0);put('pageviewsTotal',d.pageviews_total||0);
    put('ordersTotal',d.orders_total||0);put('ordersToday',d.orders_today||0);put('salesTotal',rupees(d.sales_total));put('reviewsTotal',d.reviews_total||0);put('avgRating',`${Number(d.average_rating||0).toFixed(1)} ★`);
    const orders=document.getElementById('ordersBody');
    orders.innerHTML=(d.latest_orders||[]).map(o=>`<tr><td><strong>${esc(o.order_number)}</strong></td><td>${esc(o.customer_name)}</td><td>${esc(o.phone)}</td><td>${esc(o.product_name)}</td><td>${esc(o.quantity)}</td><td>${rupees(o.total_amount)}</td><td>${badge(o.payment_status,'payment')}</td><td>${badge(o.order_status)}</td><td>${date(o.created_at)}</td></tr>`).join('')||'<tr><td colspan="9">No orders yet.</td></tr>';
    const reviews=document.getElementById('reviewList');
    reviews.innerHTML=(d.latest_reviews||[]).map(r=>`<div class="review-row"><b><span>${esc(r.name||'Customer')} ${r.verified?'<span class="verified">Verified</span>':''}</span><span class="stars">${'★'.repeat(Math.max(1,Math.min(5,Math.round(Number(r.rating||0)))))} ${Number(r.rating||0).toFixed(1)}</span></b><p>${esc(r.review||'Rating submitted.')}</p></div>`).join('')||'<p class="admin-note">No reviews yet.</p>';
  }

  function renderHistory(d){
    totalOrders=Number(d?.total||0);currentOrders=d?.orders||[];
    put('historyCount',`${totalOrders} order${totalOrders===1?'':'s'}`);put('historyPage',`Page ${page+1}`);
    const body=document.getElementById('historyBody');
    body.innerHTML=currentOrders.map((o,i)=>`<tr><td><strong>${esc(o.order_number)}</strong><small>${esc(o.phone)}</small></td><td>${esc(o.customer_name)}<small>${esc([o.city,o.state].filter(Boolean).join(', '))}</small></td><td class="product-cell">${esc(o.product_name)}</td><td>${rupees(o.total_amount)}</td><td>${badge(o.payment_status,'payment')}</td><td>${badge(o.order_status)}</td><td>${esc(o.courier_name||'—')}<small>${esc(o.awb_code||'')}</small></td><td>${date(o.created_at)}</td><td><button class="admin-btn tiny" type="button" data-order-row="${i}">Open</button></td></tr>`).join('')||'<tr><td colspan="9">No matching orders.</td></tr>';
    body.querySelectorAll('[data-order-row]').forEach(btn=>btn.addEventListener('click',()=>openOrder(Number(btn.dataset.orderRow))));
    document.getElementById('historyPrev').disabled=page<=0;
    document.getElementById('historyNext').disabled=(page+1)*PAGE_SIZE>=totalOrders;
  }

  async function loadHistory(){try{renderHistory(await history());}catch(e){document.getElementById('historyBody').innerHTML=`<tr><td colspan="9">${esc(e.message)}. Run admin-order-history-setup.sql in Supabase.</td></tr>`;}}

  function openOrder(index){
    const o=currentOrders[index]; if(!o)return;
    document.getElementById('modalOrderId').value=o.id;
    put('modalOrderNumber',o.order_number||'Order');
    document.getElementById('modalPaymentStatus').value=o.payment_status||'pending';
    document.getElementById('modalOrderStatus').value=o.order_status||'placed';
    document.getElementById('modalCourier').value=o.courier_name||'';
    document.getElementById('modalAwb').value=o.awb_code||'';
    document.getElementById('modalTracking').value=o.tracking_url||'';
    document.getElementById('modalOrderDetails').innerHTML=`
      <div><span>Customer</span><strong>${esc(o.customer_name)}</strong><small>${esc(o.phone)}</small></div>
      <div><span>Product</span><strong>${esc(o.product_name)}</strong><small>Qty ${esc(o.quantity)}</small></div>
      <div><span>Total</span><strong>${rupees(o.total_amount)}</strong><small>UTR: ${esc(o.transaction_id||'—')}</small></div>
      <div><span>Delivery address</span><strong>${esc(o.shipping_address||'—')}</strong><small>${esc([o.city,o.state,o.pincode].filter(Boolean).join(', '))}</small></div>`;
    document.getElementById('orderUpdateMessage').textContent='';
    document.getElementById('orderModal').classList.remove('hidden');document.body.classList.add('modal-open');
  }
  function closeOrder(){document.getElementById('orderModal').classList.add('hidden');document.body.classList.remove('modal-open');}

  async function load(){
    try{const d=await stats();loginBox.classList.add('hidden');dashboard.style.display='block';logout.classList.remove('hidden');refresh.classList.remove('hidden');renderStats(d);await loadHistory();}
    catch(e){clearSession();loginBox.classList.remove('hidden');dashboard.style.display='none';logout.classList.add('hidden');refresh.classList.add('hidden');msg.textContent=e.message.includes('Not authorized')?'This account is not authorized for the DeshiGram dashboard.':'';}
  }
  document.getElementById('adminLoginForm').addEventListener('submit',async e=>{e.preventDefault();msg.textContent='Signing in...';try{const s=await login(document.getElementById('adminEmail').value.trim(),document.getElementById('adminPassword').value);saveSession(s);msg.textContent='';await load();}catch(err){msg.textContent=err.message;}});
  logout.addEventListener('click',()=>{clearSession();location.reload()});refresh.addEventListener('click',load);
  document.getElementById('orderSearchBtn')?.addEventListener('click',()=>{page=0;loadHistory();});
  document.getElementById('orderSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();page=0;loadHistory();}});
  document.getElementById('orderStatusFilter')?.addEventListener('change',()=>{page=0;loadHistory();});
  document.getElementById('historyPrev')?.addEventListener('click',()=>{if(page>0){page--;loadHistory();}});
  document.getElementById('historyNext')?.addEventListener('click',()=>{if((page+1)*PAGE_SIZE<totalOrders){page++;loadHistory();}});
  document.querySelectorAll('[data-close-order]').forEach(x=>x.addEventListener('click',closeOrder));
  document.getElementById('orderUpdateForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const m=document.getElementById('orderUpdateMessage');m.textContent='Saving…';
    try{await updateOrder({p_order_id:document.getElementById('modalOrderId').value,p_order_status:document.getElementById('modalOrderStatus').value,p_payment_status:document.getElementById('modalPaymentStatus').value,p_courier_name:document.getElementById('modalCourier').value,p_awb_code:document.getElementById('modalAwb').value,p_tracking_url:document.getElementById('modalTracking').value});m.textContent='Order updated successfully.';await Promise.all([loadHistory(),stats().then(renderStats)]);setTimeout(closeOrder,700);}catch(err){m.textContent=err.message;}
  });
  if(getSession()?.access_token) load();
})();
