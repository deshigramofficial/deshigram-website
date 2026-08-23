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
  const payButton = document.getElementById('payWithUpiButton');
  const qrFallback = document.getElementById('upiQrFallback');
  const upiBox = document.getElementById('upiPaymentBox');
  const transactionLabel = document.getElementById('transactionLabel');
  const transactionInput = document.getElementById('transactionId');
  const notice = document.getElementById('checkoutNotice');

  const PLATFORM_FEE = 10;
  const PAYMENT_PROCESSING = 3;
  const upiId = 'singh.abhinendra5@ybl';
  const receiverName = 'Mr Abhinendra Singh';
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

    // Seller partner Listing Price already includes logistics/platform/processing.
    // Only DeshiGram-owned catalog items receive checkout-level charges.
    const ownItems = items.filter(item => !item.seller_product_id);
    const ownWeight = ownItems.reduce(
      (sum, item) => sum + (Number(item.packed_weight_grams) || 0) * item.quantity,
      0
    );
    const logistics = logisticsForWeight(ownWeight);
    const platform = ownWeight > 0 ? PLATFORM_FEE : 0;
    const payment = ownWeight > 0 ? PAYMENT_PROCESSING : 0;
    const extra = logistics + platform + payment;

    return { product, mrp, discount, logistics, platform, payment, extra, total: product + extra };
  };

  const paymentMethod = () => form.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';
  const setCheckoutStatus = (msg, type = '') => {
    status.textContent = msg || '';
    status.classList.remove('is-error', 'is-success');
    if (type) status.classList.add(type === 'error' ? 'is-error' : 'is-success');
  };
  const upiLink = () => {
    const { total } = totals();
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(receiverName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('DeshiGram order payment')}`;
  };

  function setPaymentUI() {
    const isUpi = paymentMethod() === 'upi';
    upiBox.hidden = !isUpi;
    transactionLabel.hidden = !isUpi;
    transactionInput.required = isUpi;
    if (!isUpi) {
      transactionInput.value = '';
      qrFallback.hidden = true;
      notice.innerHTML = '<strong>Cash on Delivery selected.</strong> Pay the order amount when your parcel is delivered.';
      confirmButton.textContent = 'Place COD Order';
    } else {
      notice.innerHTML = '<strong>UPI selected.</strong> Complete payment, enter the UTR number, then confirm your order.';
      confirmButton.textContent = 'Confirm UPI Order';
    }
    form.querySelectorAll('.payment-method-card').forEach(card => {
      card.classList.toggle('is-selected', card.querySelector('input')?.checked);
    });
  }

  function render() {
    const items = cart.getCart();
    if (!items.length) {
      itemsEl.innerHTML = '<div class="checkout-empty"><p>Your cart is empty.</p><a href="products.html">Choose a product</a></div>';
      confirmButton.disabled = true;
      payButton.disabled = true;
      mrpEl.textContent = discountEl.textContent = totalEl.textContent = money(0);
      if (deliveryEl) deliveryEl.textContent = 'Included';
      if (platformEl) platformEl.textContent = 'Included';
      if (processingEl) processingEl.textContent = 'Included';
      return;
    }

    confirmButton.disabled = false;
    payButton.disabled = false;
    itemsEl.innerHTML = items.map(item => {
      const discountLabel = Number(item.mrp) > Number(item.price) ? '<small>Offer applied</small>' : '';
      return `<article class="checkout-item"><img src="${item.image}" alt="${item.name}"><div><h3>${item.name}</h3><p>${item.weight || ''}</p>${discountLabel}<div class="checkout-qty"><button type="button" data-checkout-minus="${item.id}" aria-label="Decrease quantity">−</button><b>${item.quantity}</b><button type="button" data-checkout-plus="${item.id}" aria-label="Increase quantity">+</button></div></div><strong>${money(item.price * item.quantity)}</strong></article>`;
    }).join('');

    itemsEl.querySelectorAll('[data-checkout-minus]').forEach(btn => btn.addEventListener('click', () => {
      const item = cart.getCart().find(x => x.id === btn.dataset.checkoutMinus);
      if (item) cart.updateQuantity(item.id, item.quantity - 1);
    }));
    itemsEl.querySelectorAll('[data-checkout-plus]').forEach(btn => btn.addEventListener('click', () => {
      const item = cart.getCart().find(x => x.id === btn.dataset.checkoutPlus);
      if (item) cart.updateQuantity(item.id, item.quantity + 1);
    }));

    const t = totals();
    mrpEl.textContent = money(t.mrp);
    discountEl.textContent = `− ${money(t.discount)}`;
    totalEl.textContent = money(t.total);
    if (deliveryEl) deliveryEl.textContent = t.logistics ? money(t.logistics) : 'Included';
    if (platformEl) platformEl.textContent = t.platform ? money(t.platform) : 'Included';
    if (processingEl) processingEl.textContent = t.payment ? money(t.payment) : 'Included';
  }

  try {
    const profile = await integrations.getProfile();
    if (profile) {
      form.name.value = profile.full_name || '';
      form.phone.value = profile.phone || '';
    }
  } catch (_) {}

  const customerData = () => Object.fromEntries(new FormData(form).entries());
  function validForm() {
    if (!form.reportValidity()) return false;
    if (!cart.getCart().length) { setCheckoutStatus('Your cart is empty.', 'error'); return false; }
    return true;
  }
  const orderLines = () => cart.getCart().map(item => `• ${item.name} (${item.weight || ''}) × ${item.quantity} = ${money(item.price * item.quantity)}`);
  const openWhatsapp = message => window.open(`https://wa.me/919457831399?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  const productSummary = () => cart.getCart().map(item => `${item.name} (${item.weight || ''}) × ${item.quantity}`).join(' | ');

  form.querySelectorAll('input[name="paymentMethod"]').forEach(radio => radio.addEventListener('change', setPaymentUI));
  payButton.addEventListener('click', () => {
    if (!cart.getCart().length) return;
    integrations.track('begin_checkout', { currency: 'INR', value: totals().total, items: cart.getCart().map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })) });
    window.location.href = upiLink();
    setTimeout(() => { qrFallback.hidden = false; }, 900);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validForm()) return;

    const c = customerData();
    const t = totals();
    const method = paymentMethod();
    confirmButton.disabled = true;
    setCheckoutStatus('Placing your order…');
    let orderNumber = 'Not generated';

    try {
      const marketplaceItems = cart.getCart().map(i => ({
        seller_product_id: i.seller_product_id || null,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        mrp: i.mrp,
        weight_grams: Number(i.packed_weight_grams || 0)
      }));
      const result = await integrations.placeMarketplaceOrder({
        p_customer_name: c.name,
        p_phone: c.phone,
        p_shipping_address: c.address,
        p_city: c.city,
        p_state: c.state,
        p_pincode: c.pincode,
        p_transaction_id: method === 'upi' ? (c.transactionId || '') : '',
        p_items: marketplaceItems,
        p_payment_method: method.toUpperCase()
      });
      const row = Array.isArray(result) ? result[0] : result;
      if (row) orderNumber = row.order_number || orderNumber;

      integrations.track('purchase', { transaction_id: method === 'upi' ? (c.transactionId || orderNumber) : orderNumber, currency: 'INR', value: Number(t.total.toFixed(2)), payment_method: method.toUpperCase(), items: cart.getCart().map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })) });
      integrations.emailNotice('New DeshiGram Website Order', { Order_ID: orderNumber, Name: c.name, Phone: c.phone, Products: productSummary(), Total: money(t.total), Payment_Method: method.toUpperCase(), Transaction_ID: method === 'upi' ? (c.transactionId || '') : 'COD', Account_Link: 'https://deshigram.in/account.html' });
    } catch (err) {
      console.error(err);
      setCheckoutStatus(err.message || 'Order could not be saved.', 'error');
      confirmButton.disabled = false;
      return;
    }

    const paymentLine = method === 'cod'
      ? `Payment method: Cash on Delivery\nAmount to collect: ${money(t.total)}`
      : `Payment method: UPI\nTotal paid: ${money(t.total)}\nUPI ID: ${upiId}\nTransaction ID / UTR: ${c.transactionId}`;
    const feeLines = t.extra
      ? `Delivery: ${money(t.logistics)}\nPlatform fee: ${money(t.platform)}\nPayment processing: ${money(t.payment)}`
      : 'Delivery & platform charges: Included in listing price';
    const msg = `Hello DeshiGram, I want to confirm my order.\n\nOrder ID: ${orderNumber}\n${orderLines().join('\n')}\n\nMRP total: ${money(t.mrp)}\nDiscount: -${money(t.discount)}\n${feeLines}\n${paymentLine}\n\nCustomer Details:\nName: ${c.name}\nPhone: ${c.phone}\nAddress: ${c.address}, ${c.city}, ${c.state} - ${c.pincode}`;

    status.classList.remove('is-error');
    status.classList.add('is-success');
    status.innerHTML = `<strong>Order placed: ${orderNumber}</strong><br>${method === 'cod' ? 'Cash on Delivery selected.' : 'UPI payment recorded.'} <a href="account.html" data-direct-account>View order history</a>.`;
    openWhatsapp(msg);
    cart.clearCart();
    confirmButton.disabled = true;
    payButton.disabled = true;
  });

  document.addEventListener('deshigram:cart-updated', render);
  render();
  setPaymentUI();
});
