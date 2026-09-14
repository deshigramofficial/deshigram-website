document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(window.location.search).get("id") || "pack-1";
  const product = window.PRODUCTS.find(item => item.id === id);
  const error = document.getElementById("productError");
  if (!product) { error.hidden = false; return; }
  document.getElementById("productDetailPage").hidden = false;
  document.getElementById("productInformation").hidden = false;
  document.title = `${product.name} | DeshiGram`;
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  const money = v => `₹${Number(v).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`; set("breadcrumbName", product.name); set("productCategory", product.category); set("productName", product.name); set("productShortDescription", product.shortDescription); set("productPrice", money(product.price)); set("productOldPrice", `MRP ${money(product.oldPrice)}`); set("productWeight", product.weight); set("descriptionHeading", product.name); set("productDescription", product.description); set("productStorage", product.storage);
  document.getElementById("productFeatures").innerHTML = product.features.map(x => `<div class="dynamic-feature-item"><span>✓</span><p>${x}</p></div>`).join("");
  document.getElementById("productIngredients").innerHTML = product.ingredients.map(x => `<li>${x}</li>`).join("");
  document.getElementById("productUsage").innerHTML = product.usage.map((x,i) => `<article><span>${String(i+1).padStart(2,"0")}</span><p>${x}</p></article>`).join("");
  const main = document.getElementById("mainProductImage"); const thumbs = document.getElementById("productThumbnails"); main.src = product.images[0]; main.alt = product.name;
  product.images.forEach((src,i) => { const b=document.createElement("button"); b.type="button"; b.className=`dynamic-thumbnail${i===0?" active":""}`; b.innerHTML=`<img src="${src}" alt="${product.name} image ${i+1}">`; b.addEventListener("click",()=>{main.src=src; thumbs.querySelectorAll("button").forEach(x=>x.classList.remove("active")); b.classList.add("active")}); thumbs.appendChild(b); });
  const add=document.getElementById("addProductToCart");
  const buy=document.getElementById("buyProductNow");
  const unavailable=product.status==="coming_soon"||product.status==="out_of_stock"||product.stock_quantity<=0;
  if(add){
    add.dataset.addToCart=product.id;
    add.disabled=unavailable;
    add.textContent=product.status==="coming_soon"?"Coming Soon":unavailable?"Out of Stock":"Add to Cart";
  }
  if(buy){
    buy.disabled=unavailable;
    buy.textContent=product.status==="coming_soon"?"Coming Soon":unavailable?"Out of Stock":"Buy Now";
    if(!unavailable) buy.addEventListener("click",()=>{ window.DESHIGRAM_CART?.addToCart(product.id,1); window.location.href="../checkout.html"; });
  }
  const hero=document.querySelector(".dynamic-product-info")||document.getElementById("productDetailPage");
  if(hero&&(product.badge||product.status==="coming_soon")){
    const note=document.createElement("div"); note.className="dg-product-status-note";
    note.textContent=product.status==="coming_soon"?(product.coming_soon_date?`Coming Soon • Expected ${new Date(product.coming_soon_date+"T00:00:00").toLocaleDateString("en-IN")}`:"Coming Soon"):(product.badge||"");
    hero.prepend(note);
  }
  document.querySelectorAll(".dynamic-tab").forEach(tab => tab.addEventListener("click",()=>{ document.querySelectorAll(".dynamic-tab,.dynamic-panel").forEach(el=>el.classList.remove("active")); tab.classList.add("active"); document.getElementById(tab.dataset.tabTarget).classList.add("active"); }));
});