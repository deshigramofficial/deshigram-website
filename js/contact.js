const contactForm = document.getElementById("contactForm");
const contactFormStatus = document.getElementById("contactFormStatus");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const whatsappMessage = [
      "Hello DeshiGram,",
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : null,
      `Subject: ${subject}`,
      "",
      `Message: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappUrl = `https://wa.me/919457831399?text=${encodeURIComponent(whatsappMessage)}`;

    if (contactFormStatus) {
      contactFormStatus.textContent = "Opening WhatsApp with your message…";
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  });
}
