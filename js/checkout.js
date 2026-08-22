document.addEventListener('DOMContentLoaded', async ()=>{
  const cart=window.DESHIGRAM_CART;
  const integrations=window.DESHIGRAM_INTEGRATIONS;
  const session=await integrations.getSession();
  if(!session){location.replace('account.html?next=checkout.html');return;}

  const itemsEl=document.getElementById('checkoutItems'),mrpEl=document.getElementById('checkoutMrpTotal'),discountEl=document.getElementById('checkoutDiscount'),totalEl=document.getElementById('checkoutTotal'),form=document.getElementById('checkoutForm'),status=document.getElementById('checkoutStatus'),confirmButton=document.getElementById('confirmPaymentButton'),payButton=document.getElementById('payWithUpiButton'),qrFallback=document.getElementById('upiQrFallback');
  const FEES={logistics:55,platform:10,packaging:5,payment:5},feeTotal=75;
  const upiId='singh.abhinendra5@ybl',receiverName='Mr Abhinendra Singh';
  const money=v=>cart.money?cart.money(v):`₹${Number(v).toFixed(2)}`;
  const totals=()=>{const product=cart.getSubtotal(),mrp=cart.getMrpTotal?cart.getMrpTotal():product/0.7,discount=mrp-product,total=product+feeTotal;return{product,mrp,discount,total};};
  const upiLink=()=>{const {total}=totals();return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(receiverName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('DeshiGram order payment')}`;};
  function render(){const items=cart.getCart();if(!items.length){itemsEl.innerHTML='<div class="checkout-empty"><p>Your cart is empty.</p><a href="products.html">Choose a pack</a></div>';confirmButton.disabled=true;payButton.disabled=true;mrpEl.textContent=discountEl.textContent=totalEl.textContent=money(0);return;}confirmButton.disabled=false;payButton.disabled=false;itemsEl.innerHTML=items.map(item=>`<article class="checkout-item"><img src="${item.image}" alt="${item.name}"><div><h3>${item.name}</h3><p>${item.weight} × ${item.quantity}</p><small>30% off MRP</small></div><strong>${money(item.price*item.quantity)}</strong></article>`).join('');const t=totals();mrpEl.textContent=money(t.mrp);discountEl.textContent=`− ${money(t.discount)}`;totalEl.textContent=money(t.total);}
  try{const profile=await integrations.getProfile();if(profile){form.name.value=profile.full_name||'';form.phone.value=profile.phone||'';}}catch(_){}
  const customerData=()=>Object.fromEntries(new FormData(form).entries());
  function validForm(){if(!form.reportValidity())return false;if(!cart.getCart().length){status.textContent='Your cart is empty.';return false;}return true;}
  const orderLines=()=>cart.getCart().map(item=>`• ${item.name} (${item.weight}) × ${item.quantity} = ${money(item.price*item.quantity)}`);
  const openWhatsapp=message=>window.open(`https://wa.me/919457831399?text=${encodeURIComponent(message)}`,'_blank','noopener');
  const quantityTotal=()=>cart.getCart().reduce((sum,item)=>sum+Number(item.quantity||0),0);
  const productSummary=()=>cart.getCart().map(item=>`${item.name} (${item.weight}) × ${item.quantity}`).join(' | ');

  payButton.addEventListener('click',()=>{if(!cart.getCart().length)return;integrations.track('begin_checkout',{currency:'INR',value:totals().total,items:cart.getCart().map(i=>({item_id:i.id,item_name:i.name,price:i.price,quantity:i.quantity}))});window.location.href=upiLink();setTimeout(()=>{qrFallback.hidden=false;},900);});

  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!validForm())return;
    const c=customerData(),t=totals();confirmButton.disabled=true;status.textContent='Saving your order to My Account…';
    let orderNumber='Not generated',saved=false;
    try{
      const marketplaceItems=cart.getCart().map(i=>({seller_product_id:i.seller_product_id||null,name:i.name,quantity:i.quantity,price:i.price,mrp:i.mrp}));
      const result=await integrations.placeMarketplaceOrder({p_customer_name:c.name,p_phone:c.phone,p_shipping_address:c.address,p_city:c.city,p_state:c.state,p_pincode:c.pincode,p_transaction_id:c.transactionId,p_items:marketplaceItems});
      const row=Array.isArray(result)?result[0]:result;if(row)orderNumber=row.order_number||orderNumber;saved=true;
      integrations.track('purchase',{transaction_id:c.transactionId||orderNumber,currency:'INR',value:Number(t.total.toFixed(2)),items:cart.getCart().map(i=>({item_id:i.id,item_name:i.name,price:i.price,quantity:i.quantity}))});
      integrations.emailNotice('New DeshiGram Website Order',{Order_ID:orderNumber,Name:c.name,Phone:c.phone,Products:productSummary(),Total:money(t.total),Transaction_ID:c.transactionId,Account_Link:'https://deshigram.in/account.html'});
    }catch(err){console.error(err);status.textContent=err.message||'Order could not be saved.';confirmButton.disabled=false;return;}
    const msg=`Hello DeshiGram, I have completed the UPI payment and want to confirm my order.\n\nOrder ID: ${orderNumber}\n${orderLines().join('\n')}\n\nMRP total: ${money(t.mrp)}\n30% discount: -${money(t.discount)}\nLogistics / delivery: ₹55.00\nPlatform handling: ₹10.00\nSecure packaging: ₹5.00\nPayment handling: ₹5.00\nTotal paid: ${money(t.total)}\nUPI ID: ${upiId}\nTransaction ID / UTR: ${c.transactionId}\n\nCustomer Details:\nName: ${c.name}\nPhone: ${c.phone}\nAddress: ${c.address}, ${c.city}, ${c.state} - ${c.pincode}\n\nThis order is linked to the customer's DeshiGram account for verified reviews.`;
    if(saved){
      status.innerHTML=`<strong>Order confirmed: ${orderNumber}</strong><br>Your order is saved in My Account. <a href="account.html">View order history</a>. Opening WhatsApp confirmation…`;
      openWhatsapp(msg);
      cart.clearCart();
      confirmButton.disabled=true;
      payButton.disabled=true;
    } else {
      status.textContent='Opening WhatsApp…';
      openWhatsapp(msg);
      confirmButton.disabled=false;
    }
  });
  document.addEventListener('deshigram:cart-updated',render);render();
});
