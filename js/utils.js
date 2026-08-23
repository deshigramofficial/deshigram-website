window.DESHIGRAM = {
  getQueryParameter(name) {
    const parameters = new URLSearchParams(window.location.search);
    return parameters.get(name);
  },

  getProductById(productId) {
    return window.PRODUCTS.find(
      (product) => product.id === productId
    );
  },

  formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  },

  createWhatsAppLink(message) {
    const phoneNumber = "919457831399";

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
  },

  setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  },

  showElement(selector) {
    const element = document.querySelector(selector);

    if (element) {
      element.hidden = false;
    }
  },

  hideElement(selector) {
    const element = document.querySelector(selector);

    if (element) {
      element.hidden = true;
    }
  },

  showToast(message) {
    const existingToast = document.querySelector(".website-toast");

    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "website-toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    window.requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    window.setTimeout(() => {
      toast.classList.remove("is-visible");

      window.setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2500);
  }
};