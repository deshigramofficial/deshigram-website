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
  let page=0, totalOrders=0, currentOrders=[], marketplace={sellers:[],products:[]}, fulfillment={items:[],settlements:[]}, ownedProducts=[];

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
  async function marketOverview(){return request('/rest/v1/rpc/admin_marketplace_overview',{method:'POST',body:'{}'});}
  async function reviewSeller(payload){return request('/rest/v1/rpc/admin_review_seller',{method:'POST',body:JSON.stringify(payload)});}
  async function reviewSellerProduct(payload){return request('/rest/v1/rpc/admin_review_seller_product',{method:'POST',body:JSON.stringify(payload)});}
  async function fulfillmentOverview(){return request('/rest/v1/rpc/admin_fulfillment_overview',{method:'POST',body:'{}'});}
  async function updateFulfillment(payload){return request('/rest/v1/rpc/admin_update_fulfillment_item',{method:'POST',body:JSON.stringify(payload)});}
  async function settleSeller(payload){return request('/rest/v1/rpc/admin_settle_seller_available',{method:'POST',body:JSON.stringify(payload)});}
  async function ownedProductsOverview(){return request('/rest/v1/rpc/admin_deshigram_products',{method:'POST',body:'{}'});}
  async function saveOwnedProduct(payload){return request('/rest/v1/rpc/admin_save_deshigram_product',{method:'POST',body:JSON.stringify(payload)});}
  async function deleteOwnedProduct(id){return request('/rest/v1/rpc/admin_delete_deshigram_product',{method:'POST',body:JSON.stringify({p_id:id})});}
  async function uploadOwnedImage(file){const sess=getSession();if(!sess?.access_token)throw new Error('Please login again');const safe=file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-');const path=`${Date.now()}-${Math.random().toString(36).slice(2,7)}-${safe}`;const r=await fetch(`${URL}/storage/v1/object/deshigram-products/${path}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${sess.access_token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error(d.message||'Image upload failed')}return path;}
  const rupees=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n||0));
  const date=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  function put(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}
  function badge(v,type='order'){return `<span class="status-badge ${esc(type)} ${esc(String(v||'').toLowerCase())}">${esc(String(v||'—').replace(/\b\w/g,m=>m.toUpperCase()))}</span>`;}

  function renderStats(d){
    put('visitorsTotal',d.visitors_total||0);put('visitorsToday',d.visitors_today||0);put('visitorsMonth',d.visitors_month||0);put('pageviewsTotal',d.pageviews_total||0);
    put('ordersTotal',d.orders_total||0);put('ordersToday',d.orders_today||0);put('salesTotal',rupees(d.sales_total));put('reviewsTotal',d.reviews_total||0);put('avgRating',`${Number(d.average_rating||0).toFixed(1)} ★`);
    put('visitorsTodayMini',`${d.visitors_today||0} today`);put('ordersTodayMini',`${d.orders_today||0} today`);put('avgRatingMini',`${Number(d.average_rating||0).toFixed(1)} ★ average`);
    const recent=d.latest_orders||[];
    const orders=document.getElementById('ordersBody');
    orders.innerHTML=recent.map(o=>`<tr><td><strong>${esc(o.order_number)}</strong></td><td>${esc(o.customer_name)}</td><td>${rupees(o.total_amount)}</td><td>${badge(o.payment_status,'payment')}</td><td>${badge(o.order_status)}</td><td>${date(o.created_at)}</td></tr>`).join('')||'<tr><td colspan="6">No orders yet.</td></tr>';

    const vals=recent.slice().reverse().map(o=>Number(o.total_amount||0));
    const line=document.getElementById('salesLine');
    if(line){
      if(vals.length<2){line.setAttribute('points','0,145 360,145');}
      else{const max=Math.max(...vals,1),min=Math.min(...vals,0),range=Math.max(max-min,1);const pts=vals.map((v,i)=>`${(i/(vals.length-1)*360).toFixed(1)},${(145-((v-min)/range)*120).toFixed(1)}`).join(' ');line.setAttribute('points',pts);}
    }
    put('recentSalesTotal',rupees(vals.reduce((a,b)=>a+b,0)));

    const productCounts={}; recent.forEach(o=>{const n=o.product_name||'Product';productCounts[n]=(productCounts[n]||0)+Number(o.quantity||1)});
    const top=Object.entries(productCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const topBox=document.getElementById('topProductsList');
    if(topBox) topBox.innerHTML=top.map(([name,count])=>`<div class="top-product-row"><b>${esc(name)}</b><span>${count}</span></div>`).join('')||'<p class="admin-note">No orders yet.</p>';

    const seen=new Set(); const customers=[]; recent.forEach(o=>{const key=(o.phone||o.customer_name||'').toLowerCase();if(key&&!seen.has(key)){seen.add(key);customers.push(o)}});
    const customerBox=document.getElementById('customerList');
    if(customerBox) customerBox.innerHTML=customers.slice(0,6).map(o=>{const initials=String(o.customer_name||'C').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();return `<div class="customer-row"><span class="customer-avatar">${esc(initials)}</span><div><b>${esc(o.customer_name||'Customer')}</b><small>${esc(o.phone||'')}</small></div><em>${esc(o.order_number||'')}</em></div>`}).join('')||'<p class="admin-note">No customers yet.</p>';

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
  function renderMarketplace(d){
    marketplace={sellers:d?.sellers||[],products:d?.products||[]};
    put('marketSellersTotal',d?.sellers_total||0);put('marketSellersPending',d?.sellers_pending||0);put('marketProductsReview',d?.products_review||0);put('marketProductsLive',d?.products_live||0);
    const sb=document.getElementById('marketSellerBody'); if(sb) sb.innerHTML=marketplace.sellers.map((x,i)=>`<tr><td><strong>${esc(x.business_name||x.full_name)}</strong><small>${esc(x.phone||'')}</small></td><td>${esc([x.city,x.state].filter(Boolean).join(', ')||'—')}</td><td>${esc(x.fssai_number||'Not added')}</td><td>${badge(String(x.verification_status||'pending').replace(/_/g,' '))}</td><td><button class="admin-btn tiny" data-seller-review="${i}">Review</button></td></tr>`).join('')||'<tr><td colspan="5">No sellers yet.</td></tr>';
    const pb=document.getElementById('marketProductBody'); if(pb) pb.innerHTML=marketplace.products.map((x,i)=>`<tr><td><strong>${esc(x.name)}</strong><small>${esc(x.category||'')}</small></td><td>${esc(x.business_name||x.full_name)}</td><td>${rupees(x.selling_price)}<small>MRP ${rupees(x.mrp)}</small></td><td>${badge(String(x.status||'').replace(/_/g,' '))}</td><td><button class="admin-btn tiny" data-product-review="${i}">Review</button></td></tr>`).join('')||'<tr><td colspan="5">No seller products yet.</td></tr>';
    document.querySelectorAll('[data-seller-review]').forEach(b=>b.addEventListener('click',()=>openSellerReview(Number(b.dataset.sellerReview))));
    document.querySelectorAll('[data-product-review]').forEach(b=>b.addEventListener('click',()=>openProductReview(Number(b.dataset.productReview))));
  }
  async function loadMarketplace(){try{renderMarketplace(await marketOverview());}catch(e){const sb=document.getElementById('marketSellerBody'),pb=document.getElementById('marketProductBody');if(sb)sb.innerHTML=`<tr><td colspan="5">${esc(e.message)}. Run seller-marketplace-setup.sql.</td></tr>`;if(pb)pb.innerHTML='<tr><td colspan="5">Marketplace setup required.</td></tr>';}}
  function openSellerReview(i){const x=marketplace.sellers[i];if(!x)return;document.getElementById('sellerReviewId').value=x.user_id;put('sellerReviewName',x.business_name||x.full_name);document.getElementById('sellerReviewStatus').value=x.verification_status||'pending';document.getElementById('sellerReviewNote').value=x.verification_note||'';document.getElementById('sellerReviewDetails').innerHTML=`<div><span>Owner</span><strong>${esc(x.full_name)}</strong><small>${esc(x.phone)}</small></div><div><span>Location</span><strong>${esc([x.city,x.state].filter(Boolean).join(', ')||'—')}</strong><small>${esc(x.fssai_number||'FSSAI not added')}</small></div>`;document.getElementById('sellerReviewModal').classList.remove('hidden');}
  function closeSellerReview(){document.getElementById('sellerReviewModal').classList.add('hidden');}
  function openProductReview(i){const x=marketplace.products[i];if(!x)return;document.getElementById('productReviewId').value=x.id;put('productReviewName',x.name);document.getElementById('productReviewStatus').value=x.status==='under_review'?'live':x.status;document.getElementById('productReviewPayout').value=x.seller_payout??'';document.getElementById('productReviewNote').value=x.review_note||'';document.getElementById('productReviewDetails').innerHTML=`<div><span>Seller</span><strong>${esc(x.business_name||x.full_name)}</strong><small>${esc(x.category)}</small></div><div><span>Price</span><strong>${rupees(x.selling_price)}</strong><small>MRP ${rupees(x.mrp)} • ${esc(x.net_quantity)}</small></div>`;document.getElementById('productReviewModal').classList.remove('hidden');}
  function closeProductReview(){document.getElementById('productReviewModal').classList.add('hidden');}

  function renderFulfillment(d){
    fulfillment={items:d?.items||[],settlements:d?.settlements||[]};
    put('readyPickupCount',d?.ready_count||0);put('pickupBookedCount',d?.pickup_booked_count||0);put('inTransitCount',d?.in_transit_count||0);put('availableSettlement',rupees(d?.available_payout||0));
    const fb=document.getElementById('fulfillmentBody');if(fb)fb.innerHTML=fulfillment.items.map((x,i)=>`<tr><td><strong>${esc(x.order_number)}</strong><small>${date(x.created_at)}</small></td><td>${esc(x.business_name||x.full_name)}<small>${esc(x.seller_phone||'')}</small></td><td>${esc([x.pickup_city,x.pickup_pincode].filter(Boolean).join(' • ')||'—')}</td><td>${esc(x.product_name)} × ${esc(x.quantity)}</td><td>${badge(String(x.fulfillment_status||'new').replace(/_/g,' '))}</td><td><button class="admin-btn tiny" data-fulfillment-row="${i}">Open</button></td></tr>`).join('')||'<tr><td colspan="6">No seller pickups yet.</td></tr>';
    const st=document.getElementById('settlementBody');if(st)st.innerHTML=fulfillment.settlements.map((x,i)=>`<tr><td><strong>${esc(x.business_name||x.full_name)}</strong></td><td>${esc(x.available_orders)}</td><td><strong>${rupees(x.available_amount)}</strong></td><td><button class="admin-btn tiny" data-settle-row="${i}">Mark Paid</button></td></tr>`).join('')||'<tr><td colspan="4">No seller settlement is available yet.</td></tr>';
    document.querySelectorAll('[data-fulfillment-row]').forEach(b=>b.addEventListener('click',()=>openFulfillment(Number(b.dataset.fulfillmentRow))));
    document.querySelectorAll('[data-settle-row]').forEach(b=>b.addEventListener('click',()=>settleAvailable(Number(b.dataset.settleRow))));
  }
  async function loadFulfillment(){try{renderFulfillment(await fulfillmentOverview())}catch(e){const b=document.getElementById('fulfillmentBody');if(b)b.innerHTML=`<tr><td colspan="6">${esc(e.message)}</td></tr>`}}
  function openFulfillment(i){const x=fulfillment.items[i];if(!x)return;document.getElementById('fulfillmentItemId').value=x.item_id;put('fulfillmentOrderTitle',x.order_number||'Pickup');document.getElementById('fulfillmentStatus').value=x.fulfillment_status||'ready';document.getElementById('fulfillmentCourier').value=x.courier_name||'';document.getElementById('fulfillmentTracking').value=x.tracking_id||'';document.getElementById('fulfillmentDetails').innerHTML=`<div><span>Seller Pickup</span><strong>${esc(x.business_name||x.full_name)}</strong><small>${esc([x.pickup_address,x.pickup_city,x.pickup_state,x.pickup_pincode].filter(Boolean).join(', '))}</small></div><div><span>Customer Delivery</span><strong>${esc(x.customer_name)}</strong><small>${esc([x.shipping_address,x.delivery_city,x.delivery_state,x.delivery_pincode].filter(Boolean).join(', '))}</small></div><div><span>Product</span><strong>${esc(x.product_name)} × ${esc(x.quantity)}</strong><small>Seller settlement ${rupees(Number(x.seller_payout_unit||0)*Number(x.quantity||0))}</small></div><div><span>Payment</span><strong>${esc(x.payment_method||'—')}</strong><small>${esc(x.payment_status||'pending')}</small></div>`;document.getElementById('fulfillmentMessage').textContent='';document.getElementById('fulfillmentModal').classList.remove('hidden');}
  function closeFulfillment(){document.getElementById('fulfillmentModal')?.classList.add('hidden')}
  async function settleAvailable(i){const x=fulfillment.settlements[i];if(!x)return;const ref=prompt(`Enter bank/UPI reference after paying ${rupees(x.available_amount)} to ${x.business_name||x.full_name}:`);if(!ref)return;try{await settleSeller({p_seller_id:x.seller_id,p_reference:ref.trim()});await loadFulfillment();alert('Seller settlement marked paid.')}catch(e){alert(e.message)}}


  function ownedImage(path){if(!path)return 'images/favicon.png';if(/^https?:\/\//.test(path)||path.startsWith('images/'))return path;return `${URL}/storage/v1/object/public/deshigram-products/${path}`}
  function renderOwnedProducts(){const q=(document.getElementById('ownedProductSearch')?.value||'').toLowerCase();const rows=ownedProducts.filter(p=>`${p.name} ${p.category} ${p.net_quantity}`.toLowerCase().includes(q));put('ownedProductCount',`${rows.length} product${rows.length===1?'':'s'}`);const grid=document.getElementById('ownedProductsGrid');if(!grid)return;grid.innerHTML=rows.length?rows.map((p,i)=>`<article class="owned-product-card"><img src="${esc(ownedImage(p.image_paths?.[0]))}" alt="${esc(p.name)}"><div><span class="status-badge order ${esc(p.status)}">${esc(p.status.replace(/_/g,' '))}</span><h3>${esc(p.name)}</h3><p>${esc(p.net_quantity)} • Stock ${esc(p.stock_quantity)}</p><strong>${rupees(p.selling_price)}</strong><small>MRP ${rupees(p.mrp)}</small></div><div class="owned-product-actions"><button class="admin-btn tiny" data-owned-edit="${i}" type="button">Edit</button><button class="admin-btn tiny danger" data-owned-delete="${i}" type="button">Delete</button></div></article>`).join(''):'<p class="admin-note">No matching products.</p>';grid.querySelectorAll('[data-owned-edit]').forEach(b=>b.addEventListener('click',()=>openOwnedProduct(Number(b.dataset.ownedEdit))));grid.querySelectorAll('[data-owned-delete]').forEach(b=>b.addEventListener('click',()=>removeOwnedProduct(Number(b.dataset.ownedDelete))))}
  async function loadOwnedProducts(){try{ownedProducts=await ownedProductsOverview()||[];renderOwnedProducts()}catch(e){const g=document.getElementById('ownedProductsGrid');if(g)g.innerHTML=`<p class="admin-note">${esc(e.message)}</p>`}}
  function splitLines(v){return String(v||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)}
  function openOwnedProduct(index=null){const p=index===null?null:ownedProducts[index];document.getElementById('ownedProductId').value=p?.id||'';document.getElementById('ownedProductExistingImages').value=JSON.stringify(p?.image_paths||[]);put('ownedProductModalTitle',p?'Edit Product':'Add Product');document.getElementById('opName').value=p?.name||'';document.getElementById('opCategory').value=p?.category||'';document.getElementById('opQuantity').value=p?.net_quantity||'';document.getElementById('opWeight').value=p?.packed_weight_grams||'';document.getElementById('opMrp').value=p?.mrp||'';document.getElementById('opPrice').value=p?.selling_price||'';document.getElementById('opStock').value=p?.stock_quantity??0;document.getElementById('opStatus').value=p?.status||'draft';document.getElementById('opShort').value=p?.short_description||'';document.getElementById('opDescription').value=p?.description||'';document.getElementById('opIngredients').value=(p?.ingredients||[]).join('\n');document.getElementById('opFeatures').value=(p?.features||[]).join('\n');document.getElementById('opUsage').value=(p?.usage_steps||[]).join('\n');document.getElementById('opStorage').value=p?.storage_instructions||'';document.getElementById('opImages').value='';document.getElementById('ownedProductImagePreview').innerHTML=(p?.image_paths||[]).map(x=>`<img src="${ownedImage(x)}" alt="">`).join('');document.getElementById('ownedProductMessage').textContent='';document.getElementById('ownedProductModal').classList.remove('hidden')}
  function closeOwnedProduct(){document.getElementById('ownedProductModal')?.classList.add('hidden')}
  async function removeOwnedProduct(index){const p=ownedProducts[index];if(!p||!confirm(`Delete ${p.name}? This removes it from the website.`))return;try{await deleteOwnedProduct(p.id);await loadOwnedProducts()}catch(e){alert(e.message)}}

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
    try{const d=await stats();loginBox.classList.add('hidden');dashboard.style.display='block';logout.classList.remove('hidden');refresh.classList.remove('hidden');renderStats(d);await Promise.all([loadHistory(),loadMarketplace(),loadFulfillment(),loadOwnedProducts()]);}
    catch(e){clearSession();loginBox.classList.remove('hidden');dashboard.style.display='none';logout.classList.add('hidden');refresh.classList.add('hidden');msg.textContent=e.message.includes('Not authorized')?'This account is not authorized for the DeshiGram dashboard.':'';}
  }
  document.getElementById('adminLoginForm').addEventListener('submit',async e=>{e.preventDefault();msg.textContent='Signing in...';try{const s=await login(document.getElementById('adminEmail').value.trim(),document.getElementById('adminPassword').value);saveSession(s);msg.textContent='';await load();}catch(err){msg.textContent=err.message;}});
  logout.addEventListener('click',()=>{clearSession();location.reload()});document.getElementById('sidebarLogout')?.addEventListener('click',()=>{clearSession();location.reload()});refresh.addEventListener('click',load);
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

  document.getElementById('addOwnedProductBtn')?.addEventListener('click',()=>openOwnedProduct());
  document.getElementById('ownedProductSearch')?.addEventListener('input',renderOwnedProducts);
  document.querySelectorAll('[data-close-owned-product]').forEach(x=>x.addEventListener('click',closeOwnedProduct));
  document.getElementById('ownedProductForm')?.addEventListener('submit',async e=>{e.preventDefault();const m=document.getElementById('ownedProductMessage');m.textContent='Saving…';try{const files=[...document.getElementById('opImages').files].slice(0,5);let images=JSON.parse(document.getElementById('ownedProductExistingImages').value||'[]');if(files.length){m.textContent='Uploading images…';images=[];for(const f of files)images.push(await uploadOwnedImage(f))}const payload={name:document.getElementById('opName').value.trim(),category:document.getElementById('opCategory').value.trim(),net_quantity:document.getElementById('opQuantity').value.trim(),packed_weight_grams:Number(document.getElementById('opWeight').value||0),mrp:Number(document.getElementById('opMrp').value||0),selling_price:Number(document.getElementById('opPrice').value||0),stock_quantity:Number(document.getElementById('opStock').value||0),status:document.getElementById('opStatus').value,short_description:document.getElementById('opShort').value.trim(),description:document.getElementById('opDescription').value.trim(),ingredients:splitLines(document.getElementById('opIngredients').value),features:splitLines(document.getElementById('opFeatures').value),usage_steps:splitLines(document.getElementById('opUsage').value),storage_instructions:document.getElementById('opStorage').value.trim(),image_paths:images};const id=document.getElementById('ownedProductId').value||null;await saveOwnedProduct({p_id:id,p_payload:payload});m.textContent='Product saved.';await loadOwnedProducts();setTimeout(closeOwnedProduct,500)}catch(err){m.textContent=err.message}});

  document.getElementById('marketplaceRefresh')?.addEventListener('click',loadMarketplace);
  document.querySelectorAll('[data-close-seller-review]').forEach(x=>x.addEventListener('click',closeSellerReview));
  document.querySelectorAll('[data-close-product-review]').forEach(x=>x.addEventListener('click',closeProductReview));
  document.getElementById('sellerReviewForm')?.addEventListener('submit',async e=>{e.preventDefault();const m=document.getElementById('sellerReviewMessage');m.textContent='Saving…';try{await reviewSeller({p_seller_id:document.getElementById('sellerReviewId').value,p_status:document.getElementById('sellerReviewStatus').value,p_note:document.getElementById('sellerReviewNote').value});m.textContent='Seller review saved.';await loadMarketplace();setTimeout(closeSellerReview,500);}catch(err){m.textContent=err.message;}});
  document.getElementById('productReviewForm')?.addEventListener('submit',async e=>{e.preventDefault();const m=document.getElementById('productReviewMessage');m.textContent='Saving…';try{const payout=document.getElementById('productReviewPayout').value;await reviewSellerProduct({p_product_id:document.getElementById('productReviewId').value,p_status:document.getElementById('productReviewStatus').value,p_note:document.getElementById('productReviewNote').value,p_seller_payout:payout===''?null:Number(payout)});m.textContent='Product review saved.';await loadMarketplace();setTimeout(closeProductReview,500);}catch(err){m.textContent=err.message;}});

  document.getElementById('fulfillmentRefresh')?.addEventListener('click',loadFulfillment);
  document.querySelectorAll('[data-close-fulfillment]').forEach(x=>x.addEventListener('click',closeFulfillment));
  document.getElementById('fulfillmentForm')?.addEventListener('submit',async e=>{e.preventDefault();const m=document.getElementById('fulfillmentMessage');m.textContent='Saving…';try{await updateFulfillment({p_item_id:document.getElementById('fulfillmentItemId').value,p_status:document.getElementById('fulfillmentStatus').value,p_courier:document.getElementById('fulfillmentCourier').value,p_tracking_id:document.getElementById('fulfillmentTracking').value});m.textContent='Pickup status updated.';await Promise.all([loadFulfillment(),loadHistory()]);setTimeout(closeFulfillment,500)}catch(err){m.textContent=err.message}});
  if(getSession()?.access_token) load();
})();
