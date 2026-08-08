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
    const subject = String(formData.get("subject") || "General enquiry").trim();
    const message = String(formData.get("message") || "").trim();

    const body = [
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : null,
      `Subject: ${subject}`,
      "",
      `Message: ${message}`
    ].filter(Boolean).join("\n");

    const mailto = `mailto:deshigramofficial@gmail.com?subject=${encodeURIComponent(`DeshiGram Website Enquiry - ${subject}`)}&body=${encodeURIComponent(body)}`;

    if (contactFormStatus) {
      contactFormStatus.textContent = "Opening your email app to send the enquiry…";
    }
    window.location.href = mailto;
  });
}
