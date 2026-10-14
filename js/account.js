document.addEventListener('DOMContentLoaded', async ()=>{
  const api=window.DESHIGRAM_INTEGRATIONS;
  const authPanel=document.getElementById('authPanel');
  const dashboard=document.getElementById('accountDashboard');
  const loginForm=document.getElementById('loginForm');
  const signupForm=document.getElementById('signupForm');
  const authStatus=document.getElementById('authStatus');
  const profileForm=document.getElementById('profileForm');
  const ordersEl=document.getElementById('myOrders');
  const logoutBtn=document.getElementById('logoutBtn');
  const accountCart=document.getElementById('accountCartItems');
  document.querySelectorAll('[data-account-tab]').forEach(button=>button.addEventListener('click',()=>{const tab=button.dataset.accountTab;document.querySelectorAll('[data-account-tab]').forEach(b=>b.classList.toggle('active',b===button));document.querySelectorAll('[data-account-section]').forEach(el=>el.hidden=el.dataset.accountSection!==tab);}));
  const switchBtns=document.querySelectorAll('[data-auth-tab]');
  document.getElementById('googleSignIn')?.addEventListener('click',async()=>{try{await api.signInWithGoogle();}catch(err){setStatus(authStatus,err.message||'Google sign-in unavailable.','error');}});
  const params=new URLSearchParams(location.search); const next=['cart.html','checkout.html','account.html'].includes(params.get('next'))?params.get('next'):''; let recoveryMode=params.get('recovery')==='1' || location.hash.includes('type=recovery');
  const forgotForm=document.getElementById('forgotPasswordForm');
  const newPasswordForm=document.getElementById('newPasswordForm');
  const showForgot=document.getElementById('showForgotPassword');
  const backFromForgot=document.getElementById('backFromForgot');

  function setStatus(el,msg,type=''){if(!el)return;el.textContent=msg||'';el.classList.remove('is-error','is-success');if(type)el.classList.add(type==='error'?'is-error':'is-success');}

  function showLoginForms(){
    if(loginForm) loginForm.hidden=false;
    if(signupForm) signupForm.hidden=true;
    if(forgotForm) forgotForm.hidden=true;
    if(newPasswordForm) newPasswordForm.hidden=true;
  }
  function showTab(name){
    document.querySelectorAll('.auth-form').forEach(x=>x.hidden=x.dataset.form!==name);
    switchBtns.forEach(x=>x.classList.toggle('active',x.dataset.authTab===name));
    setStatus(authStatus,'');
  }
  switchBtns.forEach(btn=>btn.addEventListener('click',()=>showTab(btn.dataset.authTab)));

  function money(v){return `₹${Number(v||0).toFixed(2)}`}
  const safe=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let orderItems=[],orderNotifications=[];
  const policy='Orders can be cancelled before shipping. Once shipped, cancellation is not available. For order issues, please contact support as per our Return & Refund Policy.';
  const formatStatus=value=>String(value||'placed').replace(/_/g,' ').replace(/\\b\\w/g,c=>c.toUpperCase());
  function trackingLink(item){
    if(!item?.tracking_url)return '';
    try{const u=new URL(item.tracking_url);const domains=['delhivery.com','bluedart.com','dtdc.in','ecomexpress.in','xpressbees.com','indiapost.gov.in','shiprocket.in','shadowfax.in','ekartlogistics.com','amazonshipping.in','trackon.in'];if(u.protocol!=='https:'||u.username||u.password||!domains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)))return '';return u.href;}catch{return '';}
  }
  function orderCard(o,reviewed){
    const stages=['placed','confirmed','packed','shipped','out_for_delivery','delivered'];
    const current=stages.indexOf(o.order_status);
    const cancelled=o.order_status==='cancelled';
    const items=orderItems.filter(x=>x.order_id===o.id);
    const activity=orderNotifications.filter(n=>n.order_id===o.id);
    const courier=items.find(x=>x.tracking_url||x.tracking_id||x.courier_name);
    const url=trackingLink(courier);
    const canCancel=['placed','confirmed','packed'].includes(o.order_status)&&!items.some(x=>['picked_up','shipped','delivered'].includes(x.fulfillment_status));
    const productRows=items.length?items:[{product_name:o.product_name,quantity:o.quantity}];
    const productMedia=productRows.map(item=>{
      const name=String(item.product_name||'').toLowerCase();
      const family=/panch.poshan|seed powder/.test(name)?'panch':/dry.fruit|energy powder/.test(name)?'dry':null;
      const packMatch=name.match(/pack\s*(?:of\s*)?([123])\b/);
      const pack=packMatch?packMatch[1]:null;
      // Do not guess a different pack or product when the historical item is ambiguous.
      if(!family||!pack)return '<span class="dg-order-product-name">'+safe(item.product_name||'Product')+' × '+(Number(item.quantity)||1)+'</span>';
      const slug=family==='panch'?'panch-poshan-'+(pack==='1'?'100g':'pack-'+pack):'pack-'+pack;
      const image=family==='panch'?'images/panch-poshan-'+(pack==='1'?'100g':'pack-'+pack)+'.png':'images/pack-'+pack+'.webp';
      const link='product/index.html?id='+encodeURIComponent(slug);
      return '<a class="dg-order-product-link" href="'+safe(link)+'" aria-label="View '+safe(item.product_name)+'"><img src="'+safe(image)+'" alt="" loading="lazy" width="64" height="64"><span>'+safe(item.product_name)+' × '+(Number(item.quantity)||1)+'</span></a>';
    }).join('');
    const products='<div class="dg-order-product-list">'+productMedia+'</div>';
    
    return `<article class="account-order-card dg-premium-order"><div class="account-order-head"><div><small>${new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</small><h3>${safe(o.order_number)}</h3></div><span class="order-status">${safe(formatStatus(o.order_status))}</span></div>
    <p class="dg-order-products">${products}</p><div class="dg-order-amount"><strong>${money(o.total_amount)}</strong><span>Payment: ${safe(formatStatus(o.payment_status))} · ${safe(o.payment_method||'—')}</span></div>
    <div class="dg-order-progress" aria-label="Order progress">${cancelled?'<span class="dg-cancelled">Cancelled</span>':stages.map((x,i)=>`<span class="${i<=current?'done':''}">${safe(formatStatus(x))}</span>`).join('')}</div>
    ${courier?`<div class="dg-courier-box">${courier.courier_name?`<span>Courier: <strong>${safe(courier.courier_name)}</strong></span>`:''}${courier.tracking_id?`<span>Tracking: ${url?`<a href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(courier.tracking_id)}</a>`:`<strong>${safe(courier.tracking_id)}</strong>`}</span>`:''}${url?`<a class="button button-secondary" href="${safe(url)}" target="_blank" rel="noopener noreferrer">Track Order ↗</a>`:''}</div>`:''}
    <div class="dg-order-actions"><a href="mailto:support@deshigram.in?subject=${encodeURIComponent('Help with order '+o.order_number)}">Help with order</a>${reviewed?'<span>✓ Reviewed</span>':!cancelled?`<button class="button button-secondary rate-order-btn" type="button" data-order-id="${safe(o.id)}" data-order-number="${safe(o.order_number)}">Rate Product</button>`:''}</div>
    ${activity.length?`<details class="dg-order-activity"><summary>Order activity (${activity.length})</summary><ol>${activity.map(n=>`<li><time>${new Date(n.created_at).toLocaleString('en-IN')}</time><p>${safe(n.message)}</p></li>`).join('')}</ol></details>`:''}
    </article>`;
  }


  function renderAccountCart(){if(!accountCart||!window.DESHIGRAM_CART)return;const items=window.DESHIGRAM_CART.getCart();accountCart.innerHTML=items.length?items.map(i=>`<article class="account-cart-row"><img src="${i.image||'images/favicon.png'}" alt="${i.name}"><div><strong>${i.name}</strong><small>${i.weight||''}</small><div class="account-cart-controls"><button type="button" data-ac-minus="${i.id}">−</button><span>${i.quantity}</span><button type="button" data-ac-plus="${i.id}">+</button><button type="button" class="account-cart-delete" data-ac-delete="${i.id}">Delete</button></div></div><b>${money(i.price*i.quantity)}</b></article>`).join(''):'<div class="account-empty compact"><p>Your cart is empty.</p><a href="products.html">Browse products</a></div>';accountCart.querySelectorAll('[data-ac-minus]').forEach(b=>b.addEventListener('click',()=>{const i=window.DESHIGRAM_CART.getCart().find(x=>x.id===b.dataset.acMinus);if(i)window.DESHIGRAM_CART.updateQuantity(i.id,i.quantity-1)}));accountCart.querySelectorAll('[data-ac-plus]').forEach(b=>b.addEventListener('click',()=>{const i=window.DESHIGRAM_CART.getCart().find(x=>x.id===b.dataset.acPlus);if(i)window.DESHIGRAM_CART.updateQuantity(i.id,i.quantity+1)}));accountCart.querySelectorAll('[data-ac-delete]').forEach(b=>b.addEventListener('click',()=>window.DESHIGRAM_CART.removeProduct(b.dataset.acDelete)))}
  window.addEventListener('deshigram:cart-updated',renderAccountCart);

  async function loadDashboard(){
    const session=await api.getSession();
    if(!session){authPanel.hidden=false;dashboard.hidden=true;return;}
    if(next && next!=='account.html'){location.replace(next);return;}
    authPanel.hidden=true;dashboard.hidden=false;renderAccountCart();
    const [profileResult,ordersResult,reviewsResult,itemsResult,notificationsResult]=await Promise.allSettled([api.getProfile(),api.getMyOrders(),api.getApprovedReviews(),api.getMyOrderItems(),api.getMyOrderNotifications()]);
    orderItems=itemsResult.status==='fulfilled'?itemsResult.value:[];
    orderNotifications=notificationsResult.status==='fulfilled'?notificationsResult.value:[];
    const inbox=document.getElementById('orderNotifications');if(inbox)inbox.innerHTML='';
    const profile=profileResult.status==='fulfilled'?profileResult.value:null;
    const orders=ordersResult.status==='fulfilled'?ordersResult.value:null;
    const reviews=reviewsResult.status==='fulfilled'?reviewsResult.value:[];
    document.getElementById('accountName').textContent=profile?.full_name||'Customer';
    profileForm.full_name.value=profile?.full_name||'';
    profileForm.phone.value=profile?.phone||'';
    for(const field of ['saved_address','saved_city','saved_state','saved_pincode'])if(profileForm.elements[field])profileForm.elements[field].value=profile?.[field]||'';
    const reviewed=new Set((reviews||[]).filter(r=>r.order_id).map(r=>r.order_id));
    ordersEl.innerHTML=ordersResult.status==='rejected'?'<div class="account-empty"><h3>Could not load orders</h3><p>Please refresh or sign in again.</p></div>':orders?.length?(()=>{const ordered=[...orders].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));const active=ordered.filter(o=>!['delivered','cancelled'].includes(o.order_status));const past=ordered.filter(o=>['delivered','cancelled'].includes(o.order_status));return (active.length?'<h3 class="dg-order-group-title">Active Orders</h3>'+active.map(o=>orderCard(o,reviewed.has(o.id))).join(''):'')+(past.length?'<h3 class="dg-order-group-title">Past Orders</h3>'+past.map(o=>orderCard(o,reviewed.has(o.id))).join(''):'');})():'<div class="account-empty"><h3>No orders yet</h3><p>Your DeshiGram orders will appear here.</p><a class="button button-primary" href="products.html">Shop Products</a></div>';
    document.querySelectorAll('.rate-order-btn').forEach(btn=>btn.addEventListener('click',()=>openReview(btn.dataset.orderId,btn.dataset.orderNumber)));
  }

  showForgot?.addEventListener('click',()=>{loginForm.hidden=true;signupForm.hidden=true;forgotForm.hidden=false;setStatus(authStatus,'');});
  backFromForgot?.addEventListener('click',()=>{showTab('login');forgotForm.hidden=true;});
  forgotForm?.addEventListener('submit',async e=>{e.preventDefault();setStatus(authStatus,'Sending reset link…');try{await api.sendPasswordReset(new FormData(forgotForm).get('email'));setStatus(authStatus,'Password reset link sent. Check your email.','success');}catch(err){setStatus(authStatus,err.message||'Could not send reset link','error');}});
  newPasswordForm?.addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(newPasswordForm).entries());if(d.password!==d.confirm_password){setStatus(authStatus,'Passwords do not match.','error');return;}setStatus(authStatus,'Updating password…');try{await api.updatePassword(d.password);setStatus(authStatus,'Password updated. You can continue to your account.','success');history.replaceState({},'',location.pathname);await loadDashboard();}catch(err){setStatus(authStatus,err.message||'Could not update password','error');}});
  api.getClient()?.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){recoveryMode=true;authPanel.hidden=false;dashboard.hidden=true;loginForm.hidden=true;signupForm.hidden=true;forgotForm.hidden=true;newPasswordForm.hidden=false;setStatus(authStatus,'Choose a new password.');}});
  if(recoveryMode){authPanel.hidden=false;dashboard.hidden=true;loginForm.hidden=true;signupForm.hidden=true;forgotForm.hidden=true;newPasswordForm.hidden=false;}

  loginForm?.addEventListener('submit',async e=>{
    e.preventDefault(); setStatus(authStatus,'Logging in…');
    try{await api.signInCustomer(Object.fromEntries(new FormData(loginForm).entries())); if(next){location.href=next;return;} await loadDashboard();}
    catch(err){setStatus(authStatus,err.message||'Login failed','error');}
  });
  signupForm?.addEventListener('submit',async e=>{
    e.preventDefault(); const d=Object.fromEntries(new FormData(signupForm).entries());
    if(d.password!==d.confirm_password){setStatus(authStatus,'Passwords do not match.','error');return;}
    setStatus(authStatus,'Creating account…');
    try{const out=await api.signUpCustomer(d); if(!out?.session){setStatus(authStatus,'Account created. Please login.','success');return;} if(next){location.href=next;return;} await loadDashboard();}
    catch(err){setStatus(authStatus,err.message||'Account could not be created','error');}
  });
  profileForm?.addEventListener('submit',async e=>{e.preventDefault();const s=document.getElementById('profileStatus');setStatus(s,'Saving…');try{await api.updateProfile(Object.fromEntries(new FormData(profileForm).entries()));setStatus(s,'Profile updated.','success');await loadDashboard();}catch(err){setStatus(s,err.message||'Could not update profile','error');}});
  logoutBtn?.addEventListener('click',async()=>{await api.signOut();location.href='account.html';});

  const modal=document.getElementById('reviewModal');
  const reviewForm=document.getElementById('accountReviewForm');
  function openReview(id,num){reviewForm.order_id.value=id;document.getElementById('reviewOrderNumber').textContent=num;document.getElementById('accountReviewStatus').textContent='';modal.hidden=false;document.body.classList.add('account-modal-open');}
  function closeReview(){modal.hidden=true;document.body.classList.remove('account-modal-open');reviewForm.reset();}
  document.querySelectorAll('[data-close-review]').forEach(x=>x.addEventListener('click',closeReview));
  reviewForm?.addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(reviewForm).entries());const st=document.getElementById('accountReviewStatus');setStatus(st,'Submitting…');try{await api.submitOrderReview({orderId:d.order_id,rating:d.rating,review:d.review});api.track('review_submit',{rating:Number(d.rating),verified:true});setStatus(st,'Review submitted.','success');setTimeout(async()=>{closeReview();await loadDashboard();},900);}catch(err){setStatus(st,err.message||'Could not submit review','error');}});

  if(!recoveryMode){showTab('login');await loadDashboard();}
});
