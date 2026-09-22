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
  const params=new URLSearchParams(location.search); const next=params.get('next') || ''; let recoveryMode=params.get('recovery')==='1' || location.hash.includes('type=recovery');
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
