document.addEventListener("DOMContentLoaded", () => {
  const cart = window.DESHIGRAM_CART;
  const itemsEl = document.getElementById("checkoutItems");
  const totalEl = document.getElementById("checkoutTotal");
  const form = document.getElementById("checkoutForm");
  const status = document.getElementById("checkoutStatus");
  const confirmButton = document.getElementById("confirmPaymentButton");
  const whatsappButton = document.getElementById("whatsappCheckoutButton");
  const upiPaymentBox = document.getElementById("upiPaymentBox");
  const transactionId = document.getElementById("transactionId");
  const transactionLabel = transactionId?.closest("label");
  const checkoutNotice = document.getElementById("checkoutNotice");
  const paymentRadios = [...document.querySelectorAll('input[name="paymentMethod"]')];
  const upiId = "singh.abhinendra5@ybl";
  const receiverName = "Mr Abhinendra Singh";

  function selectedPaymentMethod() {
    return form.querySelector('input[name="paymentMethod"]:checked')?.value || "cod";
  }

  function upiLink() {
    const total = cart.getSubtotal();
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(receiverName)}&am=${total}&cu=INR&tn=${encodeURIComponent("DeshiGram order payment")}`;
  }

  function updatePaymentUI({ openApp = false } = {}) {
    const isUpi = selectedPaymentMethod() === "upi";
    upiPaymentBox.hidden = !isUpi;
    if (transactionLabel) transactionLabel.hidden = !isUpi;
    transactionId.required = isUpi;
    confirmButton.textContent = isUpi ? "Confirm UPI Payment on WhatsApp" : "Confirm COD Order on WhatsApp";
    checkoutNotice.innerHTML = isUpi
      ? "<strong>Online Payment:</strong> UPI app me payment complete karke UTR number enter karein. Shipping charge aur courier serviceability WhatsApp confirmation ke samay batayi jayegi."
      : "<strong>Cash on Delivery:</strong> Order WhatsApp par confirm hoga. Shipping charge aur courier serviceability confirmation ke samay batayi jayegi.";
    status.textContent = "";

    if (isUpi && openApp && cart.getCart().length) {
      window.location.href = upiLink();
    }
  }

  function render() {
    const items = cart.getCart();
    if (!items.length) {
      itemsEl.innerHTML = '<div class="checkout-empty"><p>Your cart is empty.</p><a href="index.html#products">Choose a pack</a></div>';
      confirmButton.disabled = true;
      whatsappButton.disabled = true;
      totalEl.textContent = "₹0";
      return;
    }

    itemsEl.innerHTML = items.map(item => `<article class="checkout-item"><img src="${item.image}" alt="${item.name}"><div><h3>${item.name}</h3><p>${item.weight} × ${item.quantity}</p></div><strong>₹${item.price * item.quantity}</strong></article>`).join("");
    totalEl.textContent = `₹${cart.getSubtotal()}`;
  }

  function customerData() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function validForm() {
    if (!form.reportValidity()) return false;
    if (!cart.getCart().length) {
      status.textContent = "Your cart is empty.";
      return false;
    }
    return true;
  }

  function orderLines() {
    return cart.getCart().map(item => `• ${item.name} (${item.weight}) × ${item.quantity} = ₹${item.price * item.quantity}`);
  }

  function openWhatsapp(message) {
    window.open(`https://wa.me/919457831399?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  paymentRadios.forEach(radio => radio.addEventListener("change", () => updatePaymentUI({ openApp: radio.value === "upi" && radio.checked })));

  whatsappButton.addEventListener("click", () => {
    const customer = customerData();
    const message = `Hello DeshiGram, mujhe order/payment me help chahiye.\n\n${orderLines().join("\n")}\n\nTotal: ₹${cart.getSubtotal()}\nName: ${customer.name || "Not filled"}\nPhone: ${customer.phone || "Not filled"}`;
    openWhatsapp(message);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!validForm()) return;

    const customer = customerData();
    const isUpi = selectedPaymentMethod() === "upi";
    const paymentText = isUpi
      ? `Payment Method: Online UPI\nTotal Paid: ₹${cart.getSubtotal()}\nUPI ID Paid To: ${upiId}\nTransaction ID / UTR: ${customer.transactionId}`
      : `Payment Method: Cash on Delivery\nOrder Total: ₹${cart.getSubtotal()}`;
    const intro = isUpi
      ? "Hello DeshiGram, maine UPI payment kar diya hai aur order confirm karna hai."
      : "Hello DeshiGram, mujhe Cash on Delivery par order confirm karna hai.";

    const message = `${intro}\n\n${orderLines().join("\n")}\n\n${paymentText}\n\nCustomer Details:\nName: ${customer.name}\nPhone: ${customer.phone}\nEmail: ${customer.email || "Not provided"}\nAddress: ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}${isUpi ? "\n\nMain payment screenshot WhatsApp par attach kar raha/rahi hoon." : ""}`;

    status.innerHTML = isUpi
      ? "WhatsApp khul raha hai. <strong>Payment screenshot manually attach karke message send karein.</strong>"
      : "WhatsApp khul raha hai. Order details check karke message send karein.";
    openWhatsapp(message);
  });

  document.addEventListener("deshigram:cart-updated", render);
  updatePaymentUI();
  render();
});
