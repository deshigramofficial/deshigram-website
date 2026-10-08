document.addEventListener('DOMContentLoaded', async () => {
  const cart = window.DESHIGRAM_CART;
  const integrations = window.DESHIGRAM_INTEGRATIONS;
  const session = await integrations.getSession();
  if (!session) { location.replace('account.html?next=checkout.html'); return; }

  const quick={};try{const r=await fetch('https://kqkpbqpfnupjpthtpvdn.supabase.co/rest/v1/d2c_quick_controls?select=key,enabled',{headers:{apikey:'sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0'}});if(r.ok)(await r.json()).forEach(x=>quick[x.key]=x.enabled)}catch(_){}
  const itemsEl = document.getElementById('checkoutItems');
  const mrpEl = document.getElementById('checkoutMrpTotal');
  const discountEl = document.getElementById('checkoutDiscount');
  const totalEl = document.getElementById('checkoutTotal');
  const deliveryEl = document.getElementById('checkoutDeliveryFee');
  const platformEl = document.getElementById('checkoutPlatformFee');
  const packagingEl = document.getElementById('checkoutPackagingFee');
  const processingEl = document.getElementById('checkoutProcessingFee');
  const form = document.getElementById('checkoutForm');
  const status = document.getElementById('checkoutStatus');
  const confirmButton = document.getElementById('confirmPaymentButton');
  const notice = document.getElementById('checkoutNotice');
  const payButton=document.getElementById('payWithUpiButton'); const upiBox=document.getElementById('upiPaymentBox'); const qrFallback=document.getElementById('upiQrFallback'); const transactionLabel=document.getElementById('transactionLabel'); const transactionInput=document.getElementById('transactionId');
  const upiId='BHARATPE09891189128@yesbankltd'; const receiverName='ABHINENDRA SINGH';

  const DELIVERY_FEE = 55;
  const PLATFORM_FEE = 10;
  const PACKAGING_FEE = 5;
  const PAYMENT_HANDLING_FEE = 5;
  const money = v => cart.money ? cart.money(v) : `₹${Number(v).toFixed(2)}`;

  const totals = () => {
    const items = cart.getCart();
    const product = cart.getSubtotal();
    const mrp = cart.getMrpTotal ? cart.getMrpTotal() : product;
    const discount = Math.max(0, mrp - product);
    const hasItems = items.length > 0;
    const logistics = hasItems ? DELIVERY_FEE : 0;
    const platform = hasItems ? PLATFORM_FEE : 0;
    const packaging = hasItems ? PACKAGING_FEE : 0;
    const payment = hasItems ? PAYMENT_HANDLING_FEE : 0;
    const extra = logistics + platform + packaging + payment;
    return { product, mrp, discount, logistics, platform, packaging, payment, extra, total: product + extra };
  };

  const paymentAllowed=method=>(method==='cod'?quick.cod!==false:quick.online_payment!==false)&&quick.accept_orders!==false;
  const methodInputs=()=>form.querySelectorAll('input[name="paymentMethod"]');
  const codAlert=document.createElement('p');codAlert.id='codUnavailableAlert';codAlert.setAttribute('role','alert');codAlert.style.cssText='display:none;color:#c62828;font-size:11px;font-weight:700;margin:3px 0 0;padding:0;border:0;background:transparent';codAlert.textContent='Currently unavailable';
  form.querySelector('.payment-method-card.active-cod span:last-child')?.append(codAlert);
  const flashCod=()=>{codAlert.style.display='block';codAlert.classList.remove('dg-cod-flash');void codAlert.offsetWidth;codAlert.classList.add('dg-cod-flash');};
  const refreshPaymentChoices=()=>{
    methodInputs().forEach(input=>{
      const allowed=paymentAllowed(input.value);
      input.disabled=!allowed;
      const card=input.closest('.payment-method-card');
      if(card){card.hidden=false;card.style.opacity=allowed?'1':'.55';card.style.cursor=allowed?'pointer':'not-allowed';card.setAttribute('aria-disabled',String(!allowed));}
    });
    const checked=form.querySelector('input[name="paymentMethod"]:checked');
    if(!checked||checked.disabled){if(checked)checked.checked=false;const first=[...methodInputs()].find(x=>!x.disabled);if(first)first.checked=true;}
    codAlert.style.display=quick.cod===false?'block':'none';
  };
  form.querySelector('.payment-method-card.active-cod')?.addEventListener('click',event=>{if(quick.cod===false){event.preventDefault();event.stopPropagation();flashCod();}});
  refreshPaymentChoices();
  const paymentMethod = () => form.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';
  const setStatus = (msg,type='') => {
    status.textContent = msg || '';
    status.classList.remove('is-error','is-success');
    if(type) status.classList.add(type==='error'?'is-error':'is-success');
  };

  function setPaymentUI(){
    const method=paymentMethod(); const online=method==='razorpay'; const manual=method==='bharatpe'; const upi=method==='upi';
    upiBox.hidden=!manual; transactionLabel.hidden=true; transactionInput.required=false; if(!manual){transactionInput.value='';qrFallback.hidden=true;}
    notice.innerHTML = online ? '<strong>Razorpay selected.</strong> Payment will be automatically verified.' : upi ? '<strong>One-click UPI selected.</strong> Secure UPI payment through Razorpay.' : manual ? '<strong>QR Payment selected.</strong> Automatic confirmation is unavailable. Please use verified online payment until QR orders are enabled.' : '<strong>Cash on Delivery selected.</strong> Pay when your parcel is delivered.';
    confirmButton.textContent = online ? 'Pay Securely' : upi ? 'Pay with UPI Securely' : manual ? 'QR Verification Required' : 'Place COD Order';
    form.querySelectorAll('.payment-method-card').forEach(card=>{
      card.classList.toggle('is-selected',card.querySelector('input')?.checked);
    });
  }

  function render(){
    const items=cart.getCart();
    if(!items.length){
      itemsEl.innerHTML='<div class="checkout-empty"><p>Your cart is empty.</p><a href="products.html">Choose a product</a></div>';
      confirmButton.disabled=true;
      mrpEl.textContent=discountEl.textContent=totalEl.textContent=money(0);
      if(deliveryEl)deliveryEl.textContent=money(0);
      if(platformEl)platformEl.textContent=money(0);
      if(packagingEl)packagingEl.textContent=money(0);
      if(processingEl)processingEl.textContent=money(0);
      return;
    }
    confirmButton.disabled=false;
    itemsEl.innerHTML=items.map(item=>{
      const discountLabel=Number(item.mrp)>Number(item.price)?'<small>Offer applied</small>':'';
      return `<article class="checkout-item"><img src="${item.image}" alt="${item.name}"><div><h3>${item.name}</h3><p>${item.weight||''}</p>${discountLabel}<div class="checkout-qty"><button type="button" data-checkout-minus="${item.id}" aria-label="Decrease quantity">−</button><b>${item.quantity}</b><button type="button" data-checkout-plus="${item.id}" aria-label="Increase quantity">+</button></div></div><strong>${money(item.price*item.quantity)}</strong></article>`;
    }).join('');
    itemsEl.querySelectorAll('[data-checkout-minus]').forEach(btn=>btn.addEventListener('click',()=>{
      const item=cart.getCart().find(x=>x.id===btn.dataset.checkoutMinus);
      if(item)cart.updateQuantity(item.id,item.quantity-1);
    }));
    itemsEl.querySelectorAll('[data-checkout-plus]').forEach(btn=>btn.addEventListener('click',()=>{
      const item=cart.getCart().find(x=>x.id===btn.dataset.checkoutPlus);
      if(item)cart.updateQuantity(item.id,item.quantity+1);
    }));
    const t=totals();
    mrpEl.textContent=money(t.mrp);
    discountEl.textContent=`− ${money(t.discount)}`;
    totalEl.textContent=money(t.total);
    if(deliveryEl)deliveryEl.textContent=money(t.logistics);
    if(platformEl)platformEl.textContent=money(t.platform);
    if(packagingEl)packagingEl.textContent=money(t.packaging);
    if(processingEl)processingEl.textContent=money(t.payment);
  }

  try{
    const profile=await integrations.getProfile();
    if(profile){form.name.value=profile.full_name||'';form.phone.value=profile.phone||'';}
  }catch(_){}

  const customerData=()=>Object.fromEntries(new FormData(form).entries());
  const orderItems=()=>cart.getCart().map(i=>({product_id:i.id,quantity:i.quantity}));
  const productSummary=()=>cart.getCart().map(i=>`${i.name} (${i.weight||''}) × ${i.quantity}`).join(' | ');
  const orderLines=()=>cart.getCart().map(i=>`• ${i.name} (${i.weight||''}) × ${i.quantity} = ${money(i.price*i.quantity)}`);
  const openWhatsapp=message=>window.open(`https://wa.me/919457831399?text=${encodeURIComponent(message)}`,'_blank','noopener');

  function validForm(){
    if(!form.reportValidity())return false;
    if(!cart.getCart().length){setStatus('Your cart is empty.','error');return false;}
    return true;
  }

  async function saveOrder(c, method, transactionId='', gatewayOrderId=''){
    const t=totals();
    const result=await integrations.placeOrder({p_customer_name:c.name,p_phone:c.phone,p_shipping_address:c.address,p_city:c.city,p_state:c.state,p_pincode:c.pincode,p_items:orderItems(),p_payment_method:method,p_gateway_order_id:gatewayOrderId||null,p_gateway_payment_id:transactionId||null});
    const row=Array.isArray(result)?result[0]:result;
    const orderNumber=row?.order_number||'Not generated';

    integrations.track('purchase',{
      transaction_id:transactionId||orderNumber,currency:'INR',value:Number(t.total.toFixed(2)),
      payment_method:method,items:cart.getCart().map(i=>({item_id:i.id,item_name:i.name,price:i.price,quantity:i.quantity}))
    });
    integrations.emailNotice('New DeshiGram Website Order',{
      Order_ID:orderNumber,Name:c.name,Phone:c.phone,Products:productSummary(),Total:money(t.total),
      Payment_Method:method,Transaction_ID:transactionId||'COD',Account_Link:'https://deshigram.in/account.html'
    });

    const feeLines=t.extra?`Delivery: ${money(t.logistics)}\nPlatform fee: ${money(t.platform)}\nPayment processing: ${money(t.payment)}`:'Delivery & platform charges: Included in listing price';
    const paymentLine=method==='COD' ? `Payment method: Cash on Delivery\nAmount to collect: ${money(t.total)}` : method==='UPI' ? `Payment method: One-click UPI\nUPI ID: ${upiId}\nUTR: ${transactionId}` : `Payment method: Razorpay\nPayment ID: ${transactionId}`;
    const msg=`Hello DeshiGram, I want to confirm my order.\n\nOrder ID: ${orderNumber}\n${orderLines().join('\n')}\n\nMRP total: ${money(t.mrp)}\nDiscount: -${money(t.discount)}\n${feeLines}\n${paymentLine}\n\nCustomer Details:\nName: ${c.name}\nPhone: ${c.phone}\nAddress: ${c.address}, ${c.city}, ${c.state} - ${c.pincode}`;

    status.classList.remove('is-error');status.classList.add('is-success');
    status.innerHTML=`<strong>Order placed: ${orderNumber}</strong><br>${method==='COD'?'Cash on Delivery selected.':'Payment verified successfully.'} <a href="account.html" data-direct-account>View order history</a>.`;
    openWhatsapp(msg);
    cart.clearCart();
    confirmButton.disabled=true;
  }

  async function startRazorpay(c){
    if(typeof window.Razorpay!=='function') throw new Error('Razorpay checkout script did not load. Check connection or browser blocking, then retry.');
    const client=integrations.getClient();
    const t=totals();
    setStatus('Opening secure payment…');
    const receipt=`DG-${Date.now()}`;
    const {data,error}=await client.functions.invoke('razorpay-payment',{
      body:{action:'create_order',items:orderItems(),receipt}
    });
    if(error) throw new Error(data?.error||error.context?.message||error.message||'Could not start Razorpay payment');
    if(data?.error) throw new Error(data.error);
    if(!data?.key_id||!data?.order_id||!data?.amount)throw new Error('Payment gateway returned incomplete order details. Please retry.');

    return new Promise((resolve,reject)=>{
      const rzp=new Razorpay({
        key:data.key_id,
        amount:data.amount,
        currency:data.currency||'INR',
        name:'DeshiGram',
        description:'DeshiGram order payment',
        order_id:data.order_id,
        prefill:{name:c.name||'',contact:c.phone||'',email:session.user.email||''},
        notes:{source:'deshigram.in'},
        theme:{color:'#0d4d35'},
        modal:{ondismiss:()=>reject(new Error('Payment cancelled. Your order was not placed.'))},
        handler:async response=>{
          try{
            setStatus('Verifying payment…');
            const {data:verify,error:verifyError}=await client.functions.invoke('razorpay-payment',{
              body:{
                action:'verify_payment',
                razorpay_order_id:response.razorpay_order_id,
                razorpay_payment_id:response.razorpay_payment_id,
                razorpay_signature:response.razorpay_signature
              }
            });
            if(verifyError) throw new Error(verifyError.message||'Payment verification failed');
            if(!verify?.verified) throw new Error(verify?.error||'Payment verification failed');
            resolve({
              paymentId:response.razorpay_payment_id,
              gatewayOrderId:response.razorpay_order_id
            });
          }catch(err){reject(err);}
        }
      });
      rzp.on('payment.failed',response=>{
        reject(new Error(response?.error?.description||'Payment failed. Please try again.'));
      });
      rzp.open();
    });
  }

  form.querySelectorAll('input[name="paymentMethod"]').forEach(r=>r.addEventListener('change',setPaymentUI));

  payButton?.addEventListener('click',()=>{setStatus('For secure UPI payment, choose Razorpay. UPI apps are supported there and payment is verified automatically.','error');const razor=form.querySelector('input[name="paymentMethod"][value="razorpay"]');if(razor&&!razor.disabled){razor.checked=true;setPaymentUI();}});

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!validForm())return;
    try{const response=await fetch('https://kqkpbqpfnupjpthtpvdn.supabase.co/rest/v1/d2c_quick_controls?select=key,enabled',{headers:{apikey:'sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0'},cache:'no-store'});if(!response.ok)throw new Error('Store availability could not be verified. Please retry.');(await response.json()).forEach(x=>quick[x.key]=x.enabled)}catch(err){setStatus(err.message||'Unable to verify checkout availability.','error');return;}
    refreshPaymentChoices();
    if(!paymentAllowed(paymentMethod())){setStatus('This payment method or new orders are currently unavailable.','error');return;}
    if(paymentMethod()==='bharatpe'){setStatus('QR payment needs a pending-verification order flow. Please choose Razorpay or One-click UPI. Do not send payment manually yet.','error');return;}
    const c=customerData();
    const method=paymentMethod();
    confirmButton.disabled=true;
    try{
      integrations.track('begin_checkout',{currency:'INR',value:totals().total,items:cart.getCart().map(i=>({item_id:i.id,item_name:i.name,price:i.price,quantity:i.quantity}))});
      if(method==='razorpay'){ const paid=await startRazorpay(c); setStatus('Saving your paid order…'); await saveOrder(c,'RAZORPAY',paid.paymentId,paid.gatewayOrderId); } else if(method==='upi'){ const paid=await startRazorpay(c); setStatus('Saving your verified UPI order…'); await saveOrder(c,'RAZORPAY',paid.paymentId,paid.gatewayOrderId); } else { setStatus('Placing your order…'); await saveOrder(c,'COD','',''); }
    }catch(err){
      console.error(err);
      setStatus(err.message||'Order could not be completed.','error');
      confirmButton.disabled=false;
    }
  });

  document.addEventListener('deshigram:cart-updated',render);
  render();
  setPaymentUI();
});
