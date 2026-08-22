(() => {
  const SUPABASE_URL = 'https://kqkpbqpfnupjpthtpvdn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
  const REST = `${SUPABASE_URL}/rest/v1`;
  let client = null;

  function getClient(){
    if (client) return client;
    if (window.supabase?.createClient) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
      });
      window.DG_SUPABASE = client;
    }
    return client;
  }

  async function authToken(){
    const c=getClient();
    if(!c) return SUPABASE_KEY;
    try{
      const {data}=await c.auth.getSession();
      return data?.session?.access_token || SUPABASE_KEY;
    }catch(_){ return SUPABASE_KEY; }
  }

  async function api(path, options = {}) {
    const token = await authToken();
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const response = await fetch(`${REST}${path}`, { ...options, headers });
    const text = await response.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }
    if (!response.ok) throw new Error(data?.message || data?.hint || `Request failed (${response.status})`);
    return data;
  }

  const normalizePhone = value => String(value||'').replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'').slice(-10);
  const phoneEmail = value => `${normalizePhone(value)}@customer.deshigram.in`;

  async function signUpCustomer({name,phone,email,password}){
    const c=getClient();
    if(!c) throw new Error('Account service did not load');
    const cleanPhone=normalizePhone(phone);
    const cleanEmail=String(email||'').trim().toLowerCase();
    if(cleanPhone.length!==10) throw new Error('Enter a valid 10-digit mobile number');
    if(!cleanEmail || !cleanEmail.includes('@')) throw new Error('Enter a valid email address');
    const {data,error}=await c.auth.signUp({
      email:cleanEmail, password,
      options:{ data:{ full_name:String(name||'').trim(), phone:cleanPhone } }
    });
    if(error) throw error;
    return data;
  }

  async function signInCustomer({identifier,phone,password}){
    const c=getClient();
    if(!c) throw new Error('Account service did not load');
    const raw=String(identifier||phone||'').trim();
    const loginEmail=raw.includes('@')?raw.toLowerCase():phoneEmail(normalizePhone(raw));
    const {data,error}=await c.auth.signInWithPassword({email:loginEmail,password});
    if(error) throw error;
    return data;
  }
  async function sendPasswordReset(email){
    const c=getClient(); if(!c) throw new Error('Account service did not load');
    const clean=String(email||'').trim().toLowerCase();
    if(!clean.includes('@')) throw new Error('Enter your registered email address');
    const redirectTo=`${location.origin}${location.pathname}?recovery=1`;
    const {error}=await c.auth.resetPasswordForEmail(clean,{redirectTo});
    if(error) throw error;
    return true;
  }
  async function updatePassword(password){
    const c=getClient(); if(!c) throw new Error('Account service did not load');
    if(String(password||'').length<6) throw new Error('Password must be at least 6 characters');
    const {error}=await c.auth.updateUser({password});
    if(error) throw error;
    return true;
  }
  async function signOut(){ const c=getClient(); if(c) await c.auth.signOut(); }
  async function getSession(){ const c=getClient(); if(!c) return null; const {data}=await c.auth.getSession(); return data?.session||null; }
  async function requireSession(next='account.html'){
    const s=await getSession();
    if(s) return s;
    location.href=`account.html?next=${encodeURIComponent(next)}`;
    return null;
  }

  async function getProfile(){
    const s=await getSession(); if(!s) return null;
    const rows=await api(`/customer_profiles?select=user_id,full_name,phone,created_at&user_id=eq.${encodeURIComponent(s.user.id)}&limit=1`);
    return rows?.[0]||null;
  }
  async function updateProfile({full_name,phone}){
    const s=await getSession(); if(!s) throw new Error('Please login');
    return api(`/customer_profiles?user_id=eq.${encodeURIComponent(s.user.id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({full_name:String(full_name||'').trim(),phone:normalizePhone(phone),updated_at:new Date().toISOString()})});
  }
  async function getMyOrders(){
    const s=await getSession(); if(!s) return [];
    return api(`/orders?select=id,order_number,product_name,quantity,total_amount,payment_status,order_status,courier_name,awb_code,tracking_url,created_at&user_id=eq.${encodeURIComponent(s.user.id)}&order=created_at.desc`);
  }
  async function getApprovedReviews(){ return api('/reviews?select=id,order_id,name,rating,review,verified,created_at&status=eq.approved&order=created_at.desc&limit=100'); }
  async function submitOrderReview({orderId,rating,review}){
    return api('/rpc/submit_order_review',{method:'POST',body:JSON.stringify({p_order_id:orderId,p_rating:Number(rating),p_review:review})});
  }
  async function placeOrder(payload){ return api('/rpc/place_order',{method:'POST',body:JSON.stringify(payload)}); }
  async function placeMarketplaceOrder(payload){ return api('/rpc/place_marketplace_order',{method:'POST',body:JSON.stringify(payload)}); }

  function track(eventName, params = {}) { if (typeof window.gtag === 'function') window.gtag('event', eventName, params); }
  async function emailNotice(subject, fields = {}) {
    try { await fetch('https://formsubmit.co/ajax/deshigramofficial@gmail.com',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_subject:subject,_captcha:'false',...fields})}); } catch (_) {}
  }
  function getVisitorKey(){ let key=localStorage.getItem('dg_visitor_key'); if(!key){key=(crypto.randomUUID?crypto.randomUUID():`dg-${Date.now()}-${Math.random().toString(36).slice(2)}`);localStorage.setItem('dg_visitor_key',key);} return key; }
  async function trackSiteVisit(){ if(location.pathname.endsWith('admin.html')) return; try{await api('/rpc/track_site_visit',{method:'POST',body:JSON.stringify({p_visitor_key:getVisitorKey(),p_path:location.pathname+location.search,p_referrer:document.referrer||''})});}catch(_){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',trackSiteVisit); else trackSiteVisit();
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}

  window.DESHIGRAM_INTEGRATIONS={
    getClient,getSession,requireSession,signUpCustomer,signInCustomer,signOut,getProfile,updateProfile,getMyOrders,
    getApprovedReviews,submitOrderReview,placeOrder,placeMarketplaceOrder,sendPasswordReset,updatePassword,track,emailNotice,normalizePhone
  };
})();
