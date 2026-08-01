document.addEventListener("DOMContentLoaded", () => {
  const cart = window.DESHIGRAM_CART;
  const itemsEl = document.getElementById("checkoutItems");
  const totalEl = document.getElementById("checkoutTotal");
  const form = document.getElementById("checkoutForm");
  const status = document.getElementById("checkoutStatus");
  const confirmButton = document.getElementById("confirmPaymentButton");
  const whatsappButton = document.getElementById("whatsappCheckoutButton");
  const copyUpiButton = document.getElementById("copyUpiButton");
  const openUpiAppButton = document.getElementById("openUpiAppButton");
  const upiId = "singh.abhinendra5@ybl";
  const receiverName = "Mr Abhinendra Singh";

  function render() {
    const items = cart.getCart();
    if (!items.length) {
      itemsEl.innerHTML = '<div class="checkout-empty"><p>Your cart is empty.</p><a href="index.html#products">Choose a pack</a></div>';
      confirmButton.disabled = true;
      whatsappButton.disabled = true;
      totalEl.textContent = "₹0";
      openUpiAppButton.href = "#";
      return;
    }

    itemsEl.innerHTML = items.map(item => `<article class="checkout-item"><img src="${item.image}" alt="${item.name}"><div><h3>${item.name}</h3><p>${item.weight} × ${item.quantity}</p></div><strong>₹${item.price * item.quantity}</strong></article>`).join("");
    const total = cart.getSubtotal();
    totalEl.textContent = `₹${total}`;
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(receiverName)}&am=${total}&cu=INR&tn=${encodeURIComponent("DeshiGram order payment")}`;
    openUpiAppButton.href = upiLink;
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

  copyUpiButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      copyUpiButton.textContent = "UPI ID Copied ✓";
      window.setTimeout(() => { copyUpiButton.textContent = "Copy UPI ID"; }, 1800);
    } catch {
      status.textContent = `UPI ID: ${upiId}`;
    }
  });

  whatsappButton.addEventListener("click", () => {
    const customer = customerData();
    const name = customer.name || "Not filled";
    const phone = customer.phone || "Not filled";
    const message = `Hello DeshiGram, mujhe order/payment me help chahiye.\n\n${orderLines().join("\n")}\n\nTotal: ₹${cart.getSubtotal()}\nName: ${name}\nPhone: ${phone}`;
    openWhatsapp(message);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!validForm()) return;

    const customer = customerData();
    const message = `Hello DeshiGram, maine UPI payment kar diya hai aur order confirm karna hai.\n\n${orderLines().join("\n")}\n\nTotal Paid: ₹${cart.getSubtotal()}\nUPI ID Paid To: ${upiId}\nTransaction ID / UTR: ${customer.transactionId}\n\nCustomer Details:\nName: ${customer.name}\nPhone: ${customer.phone}\nEmail: ${customer.email || "Not provided"}\nAddress: ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}\n\nMain payment screenshot WhatsApp par attach kar raha/rahi hoon.`;

    status.innerHTML = "WhatsApp khul raha hai. <strong>Payment screenshot manually attach karke message send karein.</strong>";
    openWhatsapp(message);
  });

  document.addEventListener("deshigram:cart-updated", render);
  render();
});
