document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(window.location.search).get("id") || "pack-1";
  const product = window.PRODUCTS.find(item => item.id === id);
  const error = document.getElementById("productError");
  if (!product) { error.hidden = false; return; }
  document.getElementById("productDetailPage").hidden = false;
  document.getElementById("productInformation").hidden = false;
  document.title = `${product.name} | DeshiGram`;
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set("breadcrumbName", product.name); set("productCategory", product.category); set("productName", product.name); set("productShortDescription", product.shortDescription); set("productPrice", `₹${product.price}`); set("productOldPrice", `₹${product.oldPrice}`); set("productWeight", product.weight); set("descriptionHeading", product.name); set("productDescription", product.description); set("productStorage", product.storage);
  document.getElementById("productFeatures").innerHTML = product.features.map(x => `<div class="dynamic-feature-item"><span>✓</span><p>${x}</p></div>`).join("");
  document.getElementById("productIngredients").innerHTML = product.ingredients.map(x => `<li>${x}</li>`).join("");
  document.getElementById("productUsage").innerHTML = product.usage.map((x,i) => `<article><span>${String(i+1).padStart(2,"0")}</span><p>${x}</p></article>`).join("");
  const main = document.getElementById("mainProductImage"); const thumbs = document.getElementById("productThumbnails"); main.src = product.images[0]; main.alt = product.name;
  product.images.forEach((src,i) => { const b=document.createElement("button"); b.type="button"; b.className=`dynamic-thumbnail${i===0?" active":""}`; b.innerHTML=`<img src="${src}" alt="${product.name} image ${i+1}">`; b.addEventListener("click",()=>{main.src=src; thumbs.querySelectorAll("button").forEach(x=>x.classList.remove("active")); b.classList.add("active")}); thumbs.appendChild(b); });
  document.getElementById("addProductToCart").dataset.addToCart = product.id;
  document.getElementById("productWhatsAppButton").href = `https://wa.me/919457831399?text=${encodeURIComponent(`Hello DeshiGram, I want to know more about ${product.name}.`)}`;
  document.querySelectorAll(".dynamic-tab").forEach(tab => tab.addEventListener("click",()=>{ document.querySelectorAll(".dynamic-tab,.dynamic-panel").forEach(el=>el.classList.remove("active")); tab.classList.add("active"); document.getElementById(tab.dataset.tabTarget).classList.add("active"); }));
});