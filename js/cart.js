(() => {
  const STORAGE_KEY = "deshigram_cart_v3";
  const catalog = {
    "pack-1": { id: "pack-1", name: "Pack of 1", price: 139.30, mrp: 199, weight: "100g × 1", image: "images/pack-1.webp" },
    "pack-2": { id: "pack-2", name: "Pack of 2", price: 265.30, mrp: 379, weight: "100g × 2", image: "images/pack-2.webp" },
    "pack-3": { id: "pack-3", name: "Pack of 3", price: 384.30, mrp: 549, weight: "100g × 3", image: "images/pack-3.webp" }
  };
  const money = value => `₹${Number(value).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  function getCart(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");}catch{return[];}}
  function saveCart(cart){localStorage.setItem(STORAGE_KEY,JSON.stringify(cart));renderCart();document.dispatchEvent(new CustomEvent("deshigram:cart-updated",{detail:cart}));}
  function add(id,quantity=1){const product=catalog[id];if(!product)return;const cart=getCart();const existing=cart.find(item=>item.id===id);if(existing)existing.quantity+=quantity;else cart.push({...product,quantity});saveCart(cart);openDrawer();}
  function update(id,quantity){const cart=getCart();const item=cart.find(row=>row.id===id);if(!item)return;if(quantity<=0)return remove(id);item.quantity=Math.min(10,quantity);saveCart(cart);}
  function remove(id){saveCart(getCart().filter(item=>item.id!==id));}
  function clear(){saveCart([]);}
  function subtotal(){return getCart().reduce((sum,item)=>sum+Number(item.price)*item.quantity,0);}
  function mrpTotal(){return getCart().reduce((sum,item)=>sum+Number(item.mrp)*item.quantity,0);}
  function count(){return getCart().reduce((sum,item)=>sum+item.quantity,0);}
  function asset(path){const inProduct=window.location.pathname.includes("/product/");if(inProduct&&!document.querySelector('base[href="../"]'))return `../${path}`;return path;}
  function injectCartUI(){if(document.getElementById("cartDrawer"))return;document.body.insertAdjacentHTML("beforeend",`
    <button class="cart-float-button" id="cartFloatButton" aria-label="Open shopping cart"><span aria-hidden="true">🛒</span><b data-cart-count>0</b></button>
    <div class="cart-overlay" id="cartOverlay" hidden></div>
    <aside class="cart-drawer" id="cartDrawer" aria-label="Shopping cart" aria-hidden="true">
      <div class="cart-drawer-header"><div><small>Your order</small><h2>Shopping Cart</h2></div><button id="cartClose" aria-label="Close cart">×</button></div>
      <div class="cart-items" id="cartItems"></div>
      <div class="cart-empty" id="cartEmpty"><span>🛍️</span><h3>Your cart is empty</h3><p>Choose a pack to continue.</p></div>
      <div class="cart-summary" id="cartSummary"><div><span>Product total</span><strong id="cartSubtotal">₹0.00</strong></div><small>Delivery and payment fees are shown only at checkout.</small><a class="button button-primary" id="cartCheckoutLink" href="checkout.html">Proceed to Checkout</a><button class="cart-clear-button" id="cartClear" type="button">Clear cart</button></div>
    </aside>`);
    document.getElementById("cartFloatButton").addEventListener("click",openDrawer);document.getElementById("cartClose").addEventListener("click",closeDrawer);document.getElementById("cartOverlay").addEventListener("click",closeDrawer);document.getElementById("cartClear").addEventListener("click",clear);document.getElementById("cartCheckoutLink").href=asset("checkout.html");}
  function openDrawer(){const drawer=document.getElementById("cartDrawer"),overlay=document.getElementById("cartOverlay");if(!drawer||!overlay)return;drawer.classList.add("open");drawer.setAttribute("aria-hidden","false");overlay.hidden=false;document.body.classList.add("cart-open");}
  function closeDrawer(){const drawer=document.getElementById("cartDrawer"),overlay=document.getElementById("cartOverlay");if(!drawer||!overlay)return;drawer.classList.remove("open");drawer.setAttribute("aria-hidden","true");overlay.hidden=true;document.body.classList.remove("cart-open");}
  function renderCart(){const items=getCart();document.querySelectorAll("[data-cart-count]").forEach(el=>{el.textContent=count();el.hidden=count()===0;});const container=document.getElementById("cartItems");if(!container)return;const empty=document.getElementById("cartEmpty"),summary=document.getElementById("cartSummary");empty.hidden=items.length>0;summary.hidden=items.length===0;container.innerHTML=items.map(item=>`<article class="cart-item"><img src="${asset(item.image)}" alt="${item.name}"><div class="cart-item-info"><h3>${item.name}</h3><p>${item.weight}</p><strong>${money(item.price)}</strong><small class="cart-mrp">MRP ${money(item.mrp)} • 30% off</small><div class="cart-quantity"><button data-cart-minus="${item.id}">−</button><span>${item.quantity}</span><button data-cart-plus="${item.id}">+</button></div></div><button class="cart-remove" data-cart-remove="${item.id}" aria-label="Remove ${item.name}">×</button></article>`).join("");document.getElementById("cartSubtotal").textContent=money(subtotal());container.querySelectorAll("[data-cart-minus]").forEach(btn=>btn.addEventListener("click",()=>{const item=getCart().find(row=>row.id===btn.dataset.cartMinus);update(btn.dataset.cartMinus,item.quantity-1);}));container.querySelectorAll("[data-cart-plus]").forEach(btn=>btn.addEventListener("click",()=>{const item=getCart().find(row=>row.id===btn.dataset.cartPlus);update(btn.dataset.cartPlus,item.quantity+1);}));container.querySelectorAll("[data-cart-remove]").forEach(btn=>btn.addEventListener("click",()=>remove(btn.dataset.cartRemove)));}
  document.addEventListener("click",event=>{const button=event.target.closest("[data-add-to-cart]");if(!button)return;event.preventDefault();add(button.dataset.addToCart,Number(button.dataset.quantity||1));const original=button.textContent;button.textContent="Added ✓";setTimeout(()=>button.textContent=original,1000);});
  window.DESHIGRAM_CART={getCart,saveCart,addProduct:add,updateQuantity:update,removeProduct:remove,clearCart:clear,getSubtotal:subtotal,getMrpTotal:mrpTotal,getItemCount:count,openDrawer,closeDrawer,catalog,money};document.addEventListener("DOMContentLoaded",()=>{injectCartUI();renderCart();});
})();
