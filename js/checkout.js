document.addEventListener('DOMContentLoaded', async () => {
  const cart = window.DESHIGRAM_CART;
  const integrations = window.DESHIGRAM_INTEGRATIONS;
  const session = await integrations.getSession();
  if (!session) { location.replace('account.html?next=checkout.html'); return; }

  const itemsEl = document.getElementById('checkoutItems');
  const mrpEl = document.getElementById('checkoutMrpTotal');
  const discountEl = document.getElementById('checkoutDiscount');
  const totalEl = document.getElementById('checkoutTotal');
  const deliveryEl = document.getElementById('checkoutDeliveryFee');
  const platformEl = document.getElementById('checkoutPlatformFee');
  const processingEl = document.getElementById('checkoutProcessingFee');
  const form = document.getElementById('checkoutForm');
  const status = document.getElementById('checkoutStatus');
  const confirmButton = document.getElementById('confirmPaymentButton');
  const notice = document.getElementById('checkoutNotice');
  const payButton=document.getElementById('payWithUpiButton'); const upiBox=document.getElementById('upiPaymentBox'); const qrFallback=document.getElementById('upiQrFallback'); const transactionLabel=document.getElementById('transactionLabel'); const transactionInput=document.getElementById('transactionId');
  const upiId='BHARATPE09891189128@yesbankltd'; const receiverName='ABHINENDRA SINGH';

  const PLATFORM_FEE = 10;
  const PAYMENT_PROCESSING = 3;
  const money = v => cart.money ? cart.money(v) : `₹${Number(v).toFixed(2)}`;

  const logisticsForWeight = grams => {
    const g = Number(grams) || 0;
    if (g <= 0) return 0;
    return 80 + (Math.ceil(g / 500) - 1) * 30;
  };

  const totals = () => {
    const items = cart.getCart();
    const product = cart.getSubtotal();
    const mrp = cart.getMrpTotal ? cart.getMrpTotal() : product;
    const discount = Math.max(0, mrp - product);
    const ownItems = items.filter(item => !item.seller_product_id);
    const ownWeight = ownItems.reduce((sum,item)=>sum+(Number(item.packed_weight_grams)||0)*item.quantity,0);
    const logistics = logisticsForWeight(ownWeight);
    const platform = ownWeight > 0 ? PLATFORM_FEE : 0;
    const payment = ownWeight > 0 ? PAYMENT_PROCESSING : 0;
    const extra = logistics + platform + payment;
    return { product, mrp, discount, logistics, platform, payment, extra, total: product + extra };
  };

  const paymentMethod = () => form.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';
  const setStatus = (msg,type='') => {
    status.textContent = msg || '';
    status.classList.remove('is-error','is-success');
    if(type) status.classList.add(type==='error'?'is-error':'is-success');
  };

  function setPaymentUI(){
    const method=paymentMethod(); const online=method==='razorpay'; const manual=method==='upi';
    upiBox.hidden=!manual; transactionLabel.hidden=!manual; transactionInput.required=manual; if(!manual){transactionInput.value='';qrFallback.hidden=true;}
    notice.innerHTML = online ? '<strong>Razorpay selected.</strong> Payment will be automatically verified.' : manual ? '<strong>One-click UPI selected.</strong> Tap Pay via UPI, complete payment, then enter the UTR.' : '<strong>Cash on Delivery selected.</strong> Pay when your parcel is delivered.';
    confirmButton.textContent = online ? 'Pay Securely' : manual ? 'Confirm UPI Order' : 'Place COD Order';
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
      if(deliveryEl)deliveryEl.textContent='Included';
      if(platformEl)platformEl.textContent='Included';
      if(processingEl)processingEl.textContent='Included';
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
    if(deliveryEl)deliveryEl.textContent=t.logistics?money(t.logistics):'Included';
    if(platformEl)platformEl.textContent=t.platform?money(t.platform):'Included';
    if(processingEl)processingEl.textContent=t.payment?money(t.payment):'Included';
  }

  try{
    const profile=await integrations.getProfile();
    if(profile){form.name.value=profile.full_name||'';form.phone.value=profile.phone||'';}
  }catch(_){}

  const customerData=()=>Object.fromEntries(new FormData(form).entries());
  const marketplaceItems=()=>cart.getCart().map(i=>({
    seller_product_id:i.seller_product_id||null,
    name:i.name,quantity:i.quantity,price:i.price,mrp:i.mrp,
    weight_grams:Number(i.packed_weight_grams||0)
  }));
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
    const result=await integrations.placeMarketplaceOrder({
      p_customer_name:c.name,
      p_phone:c.phone,
      p_shipping_address:c.address,
      p_city:c.city,
      p_state:c.state,
      p_pincode:c.pincode,
      p_transaction_id:transactionId,
      p_items:marketplaceItems(),
      p_payment_method:method
    });
    const row=Array.isArray(result)?result[0]:result;
    const orderNumber=row?.order_number||'Not generated';

    if(method==='RAZORPAY' && gatewayOrderId && transactionId){
      const client=integrations.getClient();
      const {error}=await client.rpc('record_order_gateway_refs',{
        p_order_number:orderNumber,
        p_gateway_order_id:gatewayOrderId,
        p_gateway_payment_id:transactionId
      });
      if(error) console.warn('Gateway refs were not saved',error);
    }

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
    if(typeof window.Razorpay!=='function') throw new Error('Razorpay checkout did not load. Please refresh and try again.');
    const client=integrations.getClient();
    const t=totals();
    setStatus('Opening secure payment…');
    const receipt=`DG-${Date.now()}`;
    const {data,error}=await client.functions.invoke('razorpay-payment',{
      body:{action:'create_order',amount_paise:Math.round(t.total*100),receipt}
    });
    if(error) throw new Error(error.message||'Could not start Razorpay payment');
    if(data?.error) throw new Error(data.error);

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

  payButton?.addEventListener('click',()=>{ const t=totals(); const link=`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(receiverName)}&am=${t.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('DeshiGram order payment')}`; window.location.href=link; setTimeout(()=>{qrFallback.hidden=false},900); });

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!validForm())return;
    const c=customerData();
    const method=paymentMethod();
    confirmButton.disabled=true;
    try{
      integrations.track('begin_checkout',{currency:'INR',value:totals().total,items:cart.getCart().map(i=>({item_id:i.id,item_name:i.name,price:i.price,quantity:i.quantity}))});
      if(method==='razorpay'){ const paid=await startRazorpay(c); setStatus('Saving your paid order…'); await saveOrder(c,'RAZORPAY',paid.paymentId,paid.gatewayOrderId); } else if(method==='upi'){ if(!c.transactionId) throw new Error('Please enter the UPI transaction ID / UTR after payment.'); setStatus('Saving your UPI order…'); await saveOrder(c,'UPI',c.transactionId,''); } else { setStatus('Placing your order…'); await saveOrder(c,'COD','',''); }
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
