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
  const switchBtns=document.querySelectorAll('[data-auth-tab]');
  const next=new URLSearchParams(location.search).get('next') || '';

  function showTab(name){
    document.querySelectorAll('.auth-form').forEach(x=>x.hidden=x.dataset.form!==name);
    switchBtns.forEach(x=>x.classList.toggle('active',x.dataset.authTab===name));
    authStatus.textContent='';
  }
  switchBtns.forEach(btn=>btn.addEventListener('click',()=>showTab(btn.dataset.authTab)));

  function money(v){return `₹${Number(v||0).toFixed(2)}`}
  function orderCard(o, reviewed){
    const canReview=o.order_status!=='cancelled' && !reviewed;
    return `<article class="account-order-card">
      <div class="account-order-head"><div><small>${new Date(o.created_at).toLocaleDateString('en-IN')}</small><h3>${o.order_number}</h3></div><span class="order-status">${String(o.order_status||'placed').replace(/\b\w/g,m=>m.toUpperCase())}</span></div>
      <p>${o.product_name}</p><div class="account-order-meta"><span>Qty ${o.quantity}</span><strong>${money(o.total_amount)}</strong></div>
      ${o.awb_code?`<div class="account-tracking"><span>Tracking: <strong>${o.awb_code}</strong>${o.courier_name?` • ${o.courier_name}`:''}</span>${o.tracking_url?`<a href="${o.tracking_url}" target="_blank" rel="noopener">Track shipment →</a>`:''}</div>`:''}
      ${reviewed?'<span class="reviewed-pill">✓ Review submitted</span>':canReview?`<button class="button button-secondary rate-order-btn" type="button" data-order-id="${o.id}" data-order-number="${o.order_number}">Rate Product</button>`:''}
    </article>`;
  }

  async function loadDashboard(){
    const session=await api.getSession();
    if(!session){authPanel.hidden=false;dashboard.hidden=true;return;}
    authPanel.hidden=true;dashboard.hidden=false;
    const [profile,orders,reviews]=await Promise.all([api.getProfile(),api.getMyOrders(),api.getApprovedReviews()]);
    document.getElementById('accountName').textContent=profile?.full_name||'Customer';
    profileForm.full_name.value=profile?.full_name||'';
    profileForm.phone.value=profile?.phone||'';
    const reviewed=new Set((reviews||[]).filter(r=>r.order_id).map(r=>r.order_id));
    ordersEl.innerHTML=orders?.length?orders.map(o=>orderCard(o,reviewed.has(o.id))).join(''):'<div class="account-empty"><h3>No orders yet</h3><p>Your DeshiGram orders will appear here.</p><a class="button button-primary" href="products.html">Shop Products</a></div>';
    document.querySelectorAll('.rate-order-btn').forEach(btn=>btn.addEventListener('click',()=>openReview(btn.dataset.orderId,btn.dataset.orderNumber)));
  }

  loginForm?.addEventListener('submit',async e=>{
    e.preventDefault(); authStatus.textContent='Logging in…';
    try{await api.signInCustomer(Object.fromEntries(new FormData(loginForm).entries())); if(next){location.href=next;return;} await loadDashboard();}
    catch(err){authStatus.textContent=err.message||'Login failed';}
  });
  signupForm?.addEventListener('submit',async e=>{
    e.preventDefault(); const d=Object.fromEntries(new FormData(signupForm).entries());
    if(d.password!==d.confirm_password){authStatus.textContent='Passwords do not match.';return;}
    authStatus.textContent='Creating account…';
    try{const out=await api.signUpCustomer(d); if(!out?.session){authStatus.textContent='Account created, but automatic login is off. Disable Confirm email in Supabase Auth settings, then login.';return;} if(next){location.href=next;return;} await loadDashboard();}
    catch(err){authStatus.textContent=err.message||'Account could not be created';}
  });
  profileForm?.addEventListener('submit',async e=>{e.preventDefault();const s=document.getElementById('profileStatus');s.textContent='Saving…';try{await api.updateProfile(Object.fromEntries(new FormData(profileForm).entries()));s.textContent='Profile updated.';await loadDashboard();}catch(err){s.textContent=err.message||'Could not update profile';}});
  logoutBtn?.addEventListener('click',async()=>{await api.signOut();location.href='account.html';});

  const modal=document.getElementById('reviewModal');
  const reviewForm=document.getElementById('accountReviewForm');
  function openReview(id,num){reviewForm.order_id.value=id;document.getElementById('reviewOrderNumber').textContent=num;document.getElementById('accountReviewStatus').textContent='';modal.hidden=false;document.body.classList.add('account-modal-open');}
  function closeReview(){modal.hidden=true;document.body.classList.remove('account-modal-open');reviewForm.reset();}
  document.querySelectorAll('[data-close-review]').forEach(x=>x.addEventListener('click',closeReview));
  reviewForm?.addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(reviewForm).entries());const st=document.getElementById('accountReviewStatus');st.textContent='Submitting…';try{await api.submitOrderReview({orderId:d.order_id,rating:d.rating,review:d.review});api.track('review_submit',{rating:Number(d.rating),verified:true});st.textContent='Thank you. Your verified review is now live.';setTimeout(async()=>{closeReview();await loadDashboard();},900);}catch(err){st.textContent=err.message||'Could not submit review';}});

  showTab('login');
  await loadDashboard();
});
