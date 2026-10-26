(()=>{
const e=id=>document.getElementById(id);
const close=()=>{e('checkoutDialog').hidden=true;e('checkoutOverlay').classList.remove('open')};
e('checkoutClose').onclick=close;e('checkoutOverlay').onclick=close;
e('checkoutEditAddress').onclick=()=>{close();e('locationBtn').click()};
document.addEventListener('keydown',x=>{if(x.key==='Escape')close()});
const money=n=>'₹'+Number(n).toFixed(2).replace(/\.00$/,'');
const parseMoney=s=>{const cleaned=String(s||'').replace(/,/g,'').replace(/[^0-9.]/g,'');return cleaned&&/^\d+(\.\d+)?$/.test(cleaned)?Number(cleaned):NaN};
async function getFees(){
 const url='https://kqkpbqpfnupjpthtpvdn.supabase.co/rest/v1/rpc/dg_now_public_fees';
 const key='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
 const response=await fetch(url,{method:'POST',headers:{'apikey':key,'Content-Type':'application/json'},body:'{}'});
 if(!response.ok)throw new Error('Pricing unavailable');
 const raw=await response.json();const data=Array.isArray(raw)?raw[0]:raw;
 const vals=['minimum_order_value','delivery_charge','platform_charge'].map(k=>Number(data?.[k]));
 if(vals.some(n=>!Number.isFinite(n)||n<0))throw new Error('Invalid pricing');
 return {minimum:vals[0],delivery:vals[1],platform:vals[2]};
}
e('reviewCheckout').onclick=async()=>{
 let cart={};try{cart=JSON.parse(localStorage.getItem('dg_now_cart_v2')||'{}')}catch(_){}
 const ids=Object.keys(cart).filter(id=>Number(cart[id])>0);
 let a={};try{a=JSON.parse(localStorage.getItem('dg_now_address_v1')||'{}')}catch(_){}
 e('checkoutAddress').textContent=a.House?[a.House,a.Street,a.City,a.Pin].filter(Boolean).join(', '):'No delivery address saved. Please add an address.';
 e('checkoutDialog').hidden=false;e('checkoutOverlay').classList.add('open');
 e('checkoutAvailability').textContent='COD ordering is currently OFF. No order or payment will be created.';
 if(!ids.length){e('checkoutSummary').textContent='Your cart is empty.';return;}
 e('checkoutSummary').textContent='Loading current charges…';
 const subtotal=parseMoney(e('subtotal')?.textContent);
 if(!Number.isFinite(subtotal)){e('checkoutSummary').textContent='Subtotal unavailable. Please refresh your cart.';return;}
 try{
  const fees=await getFees();const total=subtotal+fees.delivery+fees.platform;
  e('checkoutSummary').textContent='Items: '+ids.reduce((n,id)=>n+Number(cart[id]||0),0)+' | Subtotal: '+money(subtotal)+' | Delivery: '+money(fees.delivery)+' | Platform: '+money(fees.platform)+' | Total: '+money(total)+(subtotal<fees.minimum?' | Minimum order '+money(fees.minimum)+' (add '+money(fees.minimum-subtotal)+' more)':'')+'. Prices and stock are verified on the server before any future order.';
 }catch(_){e('checkoutSummary').textContent='Unable to load live charges. Please try again later. Ordering remains disabled.';}
};
})();