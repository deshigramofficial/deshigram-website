import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const URL="https://kqkpbqpfnupjpthtpvdn.supabase.co",KEY="sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0",db=createClient(URL,KEY);
let state={stats:{},orders:[],sellers:[],seller_products:[],deshigram_products:[],fulfillment:[],payouts:[],reviews:[]},listTab="own";
const websiteListingRefs=[
 {id:"website-panch-poshan-100g",_websiteReference:true,slug:"panch-poshan-100g",sku:"DG-PPSP-100G-P1",name:"Panch Poshan Seed Powder — Pack of 1",category:"DeshiGram",selling_price:159.40,mrp:0,net_quantity:"100 g × 1",status:"live",is_visible:true,image_paths:["images/panch-poshan-100g.png","images/products/panch-poshan/01-ingredients.png","images/products/panch-poshan/02-nutrients.png","images/products/panch-poshan/03-how-to-use.png","images/products/panch-poshan/04-product-details.png"],short_description:"Panch Poshan Seed Powder — blend of five seeds.",ingredients:["Flax","Pumpkin","Watermelon","Chia","Sesame"],features:["100% Veg","Blend of Five Seeds"],stock_quantity:0},
 {id:"website-panch-poshan-pack-2",_websiteReference:true,slug:"panch-poshan-pack-2",sku:"DG-PPSP-100G-P2",name:"Panch Poshan Seed Powder — Pack of 2",category:"DeshiGram",selling_price:308.80,mrp:0,net_quantity:"100 g × 2",status:"live",is_visible:true,image_paths:["images/panch-poshan-pack-2.png","images/products/panch-poshan/01-ingredients.png","images/products/panch-poshan/02-nutrients.png","images/products/panch-poshan/03-how-to-use.png","images/products/panch-poshan/04-product-details.png"],short_description:"Pack of 2.",ingredients:["Flax","Pumpkin","Watermelon","Chia","Sesame"],features:["100% Veg","Pack of 2"],stock_quantity:0},
 {id:"website-panch-poshan-pack-3",_websiteReference:true,slug:"panch-poshan-pack-3",sku:"DG-PPSP-100G-P3",name:"Panch Poshan Seed Powder — Pack of 3",category:"DeshiGram",selling_price:458.20,mrp:0,net_quantity:"100 g × 3",status:"live",is_visible:true,image_paths:["images/panch-poshan-pack-3.png","images/products/panch-poshan/01-ingredients.png","images/products/panch-poshan/02-nutrients.png","images/products/panch-poshan/03-how-to-use.png","images/products/panch-poshan/04-product-details.png"],short_description:"Pack of 3.",ingredients:["Flax","Pumpkin","Watermelon","Chia","Sesame"],features:["100% Veg","Pack of 3"],stock_quantity:0}
];
function adminListings(){const live=state.deshigram_products||[],slugs=new Set(live.map(x=>x.slug));return [...live,...websiteListingRefs.filter(x=>!slugs.has(x.slug))]}
const $=q=>document.querySelector(q), money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(v||0)), fmt=v=>v?new Date(v).toLocaleString("en-IN"):"—", lines=v=>String(v||"").split("\n").map(x=>x.trim()).filter(Boolean), dt=v=>v?new Date(v).toISOString().slice(0,16):"";
function imageUrl(kind,path){if(!path)return "";if(/^https?:\/\//i.test(path)||path.startsWith("images/")||path.startsWith("./")||path.startsWith("../"))return path;const bucket=kind==="deshigram"?"deshigram-products":"seller-products";return `${URL}/storage/v1/object/public/${bucket}/${path}`}
function paymentLabel(o){const m=String(o.payment_method||"").toLowerCase();if(m.includes("cod")||m.includes("cash"))return "COD";return o.payment_status==="paid"?"PAID":String(o.payment_status||"ONLINE").toUpperCase()}
const status=(el,msg,type="")=>{el.textContent=msg||"";el.className=`status ${type}`};
async function isAdmin(){
 const {data:{session},error:sessionError}=await db.auth.getSession();if(sessionError||!session)return false;
 const {data,error}=await db.rpc("is_deshigram_admin");return !error&&data===true;
}
async function restoreAdminSession(){
 let {data:{session}}=await db.auth.getSession();if(!session)return false;
 if(await isAdmin())return true;
 const refreshed=await db.auth.refreshSession();session=refreshed.data?.session||null;
 return !!session&&await isAdmin();
}
async function boot(){
  $("#adminApp").hidden=true; $("#loginPanel").hidden=true; $("#logoutBtn").hidden=true;
  try{if(await restoreAdminSession()){showApp();await load();return}}catch(e){console.warn("Admin session restore failed",e)}
  $("#loginPanel").hidden=false;
}
function showApp(){$("#loginPanel").hidden=true;$("#adminApp").hidden=false;$("#logoutBtn").hidden=false}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();status($("#loginStatus"),"Signing in…");const f=new FormData(e.currentTarget);const {error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});if(error)return status($("#loginStatus"),error.message,"error");if(!(await isAdmin())){await db.auth.signOut();return status($("#loginStatus"),"Not authorized for DeshiGram Admin.","error")}showApp();await load()});

$("#forgotPasswordBtn")?.addEventListener("click",()=>{
  $("#forgotEmail").value=document.querySelector('#loginForm [name="email"]')?.value||"";
  status($("#forgotStatus"),"");$("#forgotPasswordDialog").showModal();
});
document.querySelectorAll("[data-close-auth]").forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.closeAuth)?.close()));
$("#forgotPasswordForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const email=$("#forgotEmail").value.trim();status($("#forgotStatus"),"Sending reset link…");
  const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:"https://deshigram.in/admin.html?recovery=1"});
  if(error)status($("#forgotStatus"),error.message,"error");else status($("#forgotStatus"),"Reset link sent. Please check your email.","ok");
});
db.auth.onAuthStateChange((event)=>{
  if(event==="PASSWORD_RECOVERY"){ $("#loginPanel").hidden=false; $("#adminApp").hidden=true; setTimeout(()=>$("#newPasswordDialog")?.showModal(),0); }
});
$("#newPasswordForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const a=$("#newPassword").value,b=$("#confirmNewPassword").value;
  if(a.length<8)return status($("#newPasswordStatus"),"Use at least 8 characters.","error");
  if(a!==b)return status($("#newPasswordStatus"),"Passwords do not match.","error");
  status($("#newPasswordStatus"),"Updating password…");const {error}=await db.auth.updateUser({password:a});
  if(error)return status($("#newPasswordStatus"),error.message,"error");
  status($("#newPasswordStatus"),"Password updated successfully. You can continue securely.","ok");
  setTimeout(()=>{ $("#newPasswordDialog").close(); history.replaceState(null,"","/admin.html"); showApp(); load(); },900);
});

$("#logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();location.reload()});
async function load(){status($("#appStatus"),"Loading admin data…");const {data,error}=await db.rpc("admin_full_portal_data");if(error)return status($("#appStatus"),error.message,"error");state=data||state;await loadReviews(false);renderAll();status($("#appStatus"),"");const target=location.hash.slice(1);if(document.querySelector(`.side-link[data-section="${target}"]`))goSection(target)}
$("#refreshAll").addEventListener("click",load);
function goSection(name){
 const b=document.querySelector(`.side-link[data-section="${name}"]`); if(!b)return;
 document.querySelectorAll(".side-link").forEach(x=>x.classList.toggle("active",x===b));
 document.querySelectorAll(".section-panel").forEach(x=>x.classList.toggle("active",x.dataset.panel===name));
 $("#sectionTitle").textContent=name==="dashboard"?"Home":b.textContent.trim();
 history.replaceState(null,"",`#${name}`);
}
document.querySelectorAll(".side-link").forEach(b=>b.addEventListener("click",()=>goSection(b.dataset.section)));
document.addEventListener("click",e=>{const j=e.target.closest("[data-jump]");if(j)goSection(j.dataset.jump)});
const pill=v=>`<span class="pill ${v||""}">${String(v||"unknown").replaceAll("_"," ")}</span>`;
function renderAll(){renderStats();renderDashboard();renderOrders();renderFulfillment();renderProducts();renderListingManager();renderInventory();renderPayments();renderCustomers();renderReviews();renderGrowth();renderReports()}
function renderStats(){
  const orders=state.orders||[];
  const active=orders.filter(o=>o.order_status!=="cancelled");
  const revenue=active.filter(o=>o.payment_status==="paid"||o.payment_method==="COD").reduce((a,o)=>a+Number(o.total_amount||0),0);
  const ready=(state.fulfillment||[]).filter(x=>x.fulfillment_status==="ready_for_pickup").length;
  const listings=(state.deshigram_products||[]),live=listings.filter(x=>x.status==="live"&&x.is_visible!==false).length,low=listings.filter(x=>Number(x.stock_quantity||0)<=Number(x.low_stock_threshold||5)).length;
  const arr=[["Orders",orders.length],["Revenue",money(revenue)],["Cancelled",orders.filter(o=>o.order_status==="cancelled").length],["Ready Pickup",ready],["Live Listings",live],["Low Stock",low]];
  $("#stats").innerHTML=arr.map(([a,b])=>`<div class="stat"><strong>${b??0}</strong><span>${a}</span></div>`).join("")
}
function renderDashboard(){
  const orders=(state.orders||[]).slice(0,8);
  $("#recentOrders").innerHTML=orders.map(o=>{
    const items=(state.fulfillment||[]).filter(x=>x.order_id===o.id);
    const f=items.length?items.map(x=>x.fulfillment_status).join(", "):"—";
    return `<div class="dashboard-order ${o.order_status==="cancelled"?"cancelled-row":""}">
      <span><b>${o.order_number}</b><br><small>${o.customer_name} • ${new Date(o.created_at).toLocaleDateString("en-IN")}</small></span>
      <span>${money(o.total_amount)}</span>
      <span><small>Fulfillment</small><br>${f.replaceAll("_"," ")}</span>
      <span class="actions"><button class="ghost" data-open-order="${o.id}">Details / Fulfill</button>${o.order_status!=="cancelled"&&o.order_status!=="delivered"?`<button class="danger" data-cancel-order="${o.id}">Cancel</button>`:""}</span>
    </div>`
  }).join("")||"No orders yet.";
  const a=[];
  (state.deshigram_products||[]).filter(x=>Number(x.stock_quantity||0)<=Number(x.low_stock_threshold||5)).slice(0,4).forEach(x=>a.push(`Low stock: <b>${x.name}</b> • ${x.stock_quantity||0} units`));
  (state.fulfillment||[]).filter(x=>x.fulfillment_status==="ready_for_pickup").slice(0,4).forEach(x=>a.push(`Pickup ready: <b>${x.order_number}</b> • ${x.product_name}`));
  $("#attention").innerHTML=`<div class="mini-list">${a.map(x=>`<div class="mini-row"><span>${x}</span></div>`).join("")||"Nothing urgent."}</div>`;
  const allListings=[...(state.deshigram_products||[])];
  const activeOrders=(state.orders||[]).filter(o=>o.order_status!=="cancelled");
  $("#homeLiveListings").textContent=allListings.filter(x=>x.status==="live"&&x.is_visible!==false).length;
  $("#homeInventoryUnits").textContent=allListings.reduce((n,x)=>n+Number(x.stock_quantity||0),0);
  $("#homePaidRevenue").textContent=money(activeOrders.filter(o=>o.payment_status==="paid"||paymentLabel(o)==="COD").reduce((n,o)=>n+Number(o.total_amount||0),0));
  $("#homeCustomers").textContent=new Set((state.orders||[]).map(o=>o.phone).filter(Boolean)).size;
}
function renderOrders(){
  const q=($("#ordersSearch").value||"").toLowerCase(),st=$("#ordersStatus").value;
  const rows=(state.orders||[]).filter(o=>(!st||o.order_status===st)&&(!q||`${o.order_number} ${o.customer_name} ${o.phone} ${o.product_name}`.toLowerCase().includes(q)));
  $("#ordersTable").innerHTML=`<table class="data-table"><thead><tr><th>Order / Date</th><th>Customer</th><th>Products</th><th>Payment</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(o=>`<tr class="click-row ${o.order_status==="cancelled"?"cancelled-row":""}" data-open-order="${o.id}"><td><b>${o.order_number}</b><br><small>${fmt(o.created_at)}</small></td><td>${o.customer_name}<br>${o.phone}</td><td>${o.product_name||""}</td><td><span class="payment-single">${paymentLabel(o)}</span></td><td>${money(o.total_amount)}</td><td>${pill(o.order_status)}</td><td><button class="ghost" data-open-order="${o.id}">Details</button>${o.order_status!=="cancelled"&&o.order_status!=="delivered"?` <button class="danger" data-cancel-order="${o.id}">Cancel</button>`:""}</td></tr>`).join("")}</tbody></table>`
}
function renderFulfillment(){
 const q=($("#fulfillmentSearch")?.value||"").toLowerCase(),st=$("#fulfillmentStatus")?.value||"";
 const rows=(state.fulfillment||[]).filter(x=>(!st||x.fulfillment_status===st)&&(!q||`${x.order_number} ${x.product_name} ${x.courier_name||""} ${x.tracking_id||""}`.toLowerCase().includes(q)));
 $("#fulfillmentTable").innerHTML=`<table class="data-table"><thead><tr><th>Order</th><th>Product</th><th>Seller</th><th>Status</th><th>Courier</th><th>Tracking</th><th>Action</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x.order_number||"—"}</b></td><td>${x.product_name||"—"} × ${x.quantity||1}</td><td>${x.seller_business_name||"DeshiGram"}</td><td>${pill(x.fulfillment_status)}</td><td>${x.courier_name||"—"}</td><td>${x.tracking_id||"—"}</td><td><button class="ghost" data-fulfill="${x.id}">Update</button></td></tr>`).join("")}</tbody></table>`;
}
function renderSellers(){const q=($("#sellerSearch").value||"").toLowerCase(),st=$("#sellerStatus").value;const rows=(state.sellers||[]).filter(x=>(!st||x.verification_status===st)&&(!q||`${x.full_name} ${x.business_name||""} ${x.phone}`.toLowerCase().includes(q)));$("#sellerCards").innerHTML=rows.map(x=>`<article class="card"><span>${pill(x.verification_status)}</span><h3>${x.business_name||x.full_name}</h3><p>${x.full_name} • ${x.phone}</p><p>${x.city||""}, ${x.state||""} • ${x.pincode||""}</p><p>FSSAI: ${x.fssai_number||"—"} • GST: ${x.gstin||"—"}</p><div class="actions"><button class="ghost" data-review-seller="${x.user_id}">Review Seller</button><button class="primary" data-settle="${x.user_id}" data-seller-name="${x.business_name||x.full_name}">Settle Available</button></div></article>`).join("")||"<p>No sellers.</p>"}
function renderSellerListings(){const q=($("#sellerListingSearch").value||"").toLowerCase(),st=$("#sellerListingStatus").value;const rows=(state.seller_products||[]).filter(x=>(!st||x.status===st)&&(!q||`${x.name} ${x.seller_business_name||""}`.toLowerCase().includes(q)));$("#sellerListingCards").innerHTML=rows.map(sellerCard).join("")||"<p>No seller listings.</p>"}
function renderPayouts(){const q=($("#payoutSearch").value||"").toLowerCase(),st=$("#payoutStatus").value;const rows=(state.payouts||[]).filter(x=>(!st||x.status===st)&&(!q||`${x.seller_business_name||""} ${x.reference||""}`.toLowerCase().includes(q)));$("#payoutCards").innerHTML=rows.map(x=>`<article class="card"><span>${pill(x.status)}</span><h3>${x.seller_business_name}</h3><p>${x.period_start||""} → ${x.period_end||""}</p><p>Gross ${money(x.gross_sales)} • Deductions ${money(x.deductions)}</p><p class="price">Net ${money(x.net_payout)}</p><p>Ref: ${x.reference||"—"} • ${fmt(x.paid_at)}</p></article>`).join("")||"<p>No payout records.</p>"}
function ownCard(p){if(p._websiteReference){const imgs=p.image_paths||[],src=imageUrl("deshigram",imgs[0]);return `<article class="card"><span class="pill">website reference</span><div class="listing-card-top"><div class="listing-thumb-wrap">${src?`<img class="listing-thumb" src="${src}" alt="${p.name}">`:""}</div><div><h3>${p.name}</h3><p>${p.net_quantity||""} • ${p.sku||""}</p><p class="price">${money(p.selling_price)}</p><p>Current website fallback listing • not yet stored in Admin database</p></div></div><div class="actions"><button class="ghost" data-connect-product="${p.id}">Connect / Edit Listing</button></div></article>`}const low=Number(p.stock_quantity||0)<=Number(p.low_stock_threshold||5),imgs=p.image_paths||[],src=imageUrl("deshigram",imgs[0]);return `<article class="card"><span>${pill(p.status)}</span><div class="listing-card-top"><div class="listing-thumb-wrap">${src?`<img class="listing-thumb" src="${src}" alt="${p.name}" data-media-listing="deshigram:${p.id}">`:`<button class="listing-thumb" data-media-listing="deshigram:${p.id}">+ Photos</button>`}<span class="photo-count">${imgs.length} photo${imgs.length===1?"":"s"}</span></div><div><h3>${p.name}</h3><p>${p.net_quantity||""} • ${p.sku||"No SKU"}</p><p class="price">${money(p.selling_price)} <s>${money(p.mrp)}</s></p><p class="${low?"warn":""}">Stock ${p.stock_quantity}${low?" • Low stock":""}</p><p>${p.is_visible===false?"Hidden":"Visible"}</p></div></div><div class="actions"><button class="ghost" data-edit-product="${p.id}">Edit Product</button><button data-media-listing="deshigram:${p.id}">Photos</button><button data-clone-listing="${p.id}">Clone Listing</button><button data-merch-own="${p.id}" data-status="coming_soon">Coming Soon</button><button data-merch-own="${p.id}" data-status="live">Go Live</button></div></article>`}
function sellerCard(p){const imgs=p.image_paths||[],src=imageUrl("seller",imgs[0]);return `<article class="card"><span>${pill(p.status)}</span><div class="listing-card-top"><div class="listing-thumb-wrap">${src?`<img class="listing-thumb" src="${src}" alt="${p.name}" data-media-listing="seller:${p.id}">`:`<button class="listing-thumb" data-media-listing="seller:${p.id}">+ Photos</button>`}<span class="photo-count">${imgs.length} photo${imgs.length===1?"":"s"}</span></div><div><h3>${p.name}</h3><p>${p.seller_business_name||"Seller"} • ${p.category||""}</p><p class="price">${money(p.selling_price)} <s>${money(p.mrp)}</s></p><p>Stock ${p.stock_quantity}</p></div></div><div class="actions"><button class="ghost" data-edit-seller-listing="${p.id}">Review / Options</button><button data-media-listing="seller:${p.id}">Photos</button><button data-review-listing="${p.id}" data-status="live">Approve Live</button><button data-review-listing="${p.id}" data-status="changes_required">Changes</button></div></article>`}
function renderProducts(){const q=($("#productSearch").value||"").toLowerCase(),st=$("#productStatus").value;$("#productCards").innerHTML=adminListings().filter(x=>(!st||x.status===st)&&(!q||x.name.toLowerCase().includes(q))).map(ownCard).join("")||"<p>No products.</p>"}
function renderListingManager(){
 const q=($("#listingSearch").value||"").toLowerCase(),st=$("#listingStatus").value;
 $("#listingOwn").innerHTML=adminListings().filter(x=>(!st||x.status===st)&&(!q||x.name.toLowerCase().includes(q))).map(ownCard).join("")||"<p>No DeshiGram listings.</p>";
 const sellerListings=$("#listingSeller");if(sellerListings)sellerListings.innerHTML=(state.seller_products||[]).filter(x=>(!st||x.status===st)&&(!q||`${x.name} ${x.seller_business_name||""}`.toLowerCase().includes(q))).map(sellerCard).join("")||"<p>No seller listings.</p>";
 const sellers=$("#listingSellers");if(sellers)sellers.innerHTML=(state.sellers||[]).filter(x=>!q||`${x.full_name} ${x.business_name||""} ${x.phone||""}`.toLowerCase().includes(q)).map(x=>`<article class="card"><span>${pill(x.verification_status)}</span><h3>${x.business_name||x.full_name}</h3><p>${x.full_name} • ${x.phone}</p><p>${x.city||""}, ${x.state||""} • ${x.pincode||""}</p><p>FSSAI: ${x.fssai_number||"—"} • GST: ${x.gstin||"—"}</p><div class="actions"><button class="ghost" data-review-seller="${x.user_id}">Review Seller</button><button class="primary" data-settle="${x.user_id}" data-seller-name="${x.business_name||x.full_name}">Settlement</button></div></article>`).join("")||"<p>No sellers.</p>";
}
["ordersSearch","ordersStatus"].forEach(id=>$("#"+id)?.addEventListener("input",renderOrders));["sellerSearch","sellerStatus"].forEach(id=>$("#"+id)?.addEventListener("input",renderSellers));["sellerListingSearch","sellerListingStatus"].forEach(id=>$("#"+id)?.addEventListener("input",renderSellerListings));["payoutSearch","payoutStatus"].forEach(id=>$("#"+id)?.addEventListener("input",renderPayouts));["productSearch","productStatus"].forEach(id=>$("#"+id)?.addEventListener("input",renderProducts));["listingSearch","listingStatus"].forEach(id=>$("#"+id)?.addEventListener("input",renderListingManager));
["customerSearch","customerSort"].forEach(id=>$("#"+id)?.addEventListener("input",renderCustomers));
["reviewSearch","reviewStatus"].forEach(id=>$("#"+id)?.addEventListener("input",renderReviews));
$("#reloadReviews")?.addEventListener("click",()=>loadReviews(true));
document.querySelectorAll("[data-list-tab]").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll("[data-list-tab]").forEach(x=>x.classList.toggle("active",x===b));
 $("#listingOwn").hidden=b.dataset.listTab!=="own";
 const sellerListings=$("#listingSeller");if(sellerListings)sellerListings.hidden=b.dataset.listTab!=="seller";
 const sellers=$("#listingSellers");if(sellers)sellers.hidden=b.dataset.listTab!=="sellers";
}));
function fill(form,p){[...form.elements].forEach(el=>{if(!el.name)return;const v=p?.[el.name];if(el.type==="checkbox")el.checked=v!==false;else if(el.type==="datetime-local")el.value=dt(v);else if(Array.isArray(v))el.value=v.join("\n");else el.value=v??""})}

const detailFields=["brand","product_type","dietary_preference","spice_level","flavour","weight","key_features","unit","ingredients","allergen_information","fssai_license","nutrition_information","cuisine_type","packaging_type","storage_instruction","processing_type","specialty","disclaimer","customer_care","seller_details","manufacturer_marketer","country_of_origin","shelf_life"];
async function loadProductDetailsIntoForm(slug){
 const f=$("#productForm");detailFields.forEach(k=>{const e=f.elements["detail_"+k];if(e)e.value=k==="brand"?"DeshiGram":""});
 if(!slug)return;const {data}=await db.from("product_details").select("*").eq("product_key",slug).maybeSingle();if(!data)return;
 detailFields.forEach(k=>{const e=f.elements["detail_"+k];if(e)e.value=data[k]||""});
}
async function saveProductDetailsFromForm(fd){
 const key=String(fd.get("slug")||"").trim();if(!key)return;
 const payload={product_key:key,updated_at:new Date().toISOString()};detailFields.forEach(k=>payload[k]=String(fd.get("detail_"+k)||"").trim()||null);
 const {error}=await db.from("product_details").upsert(payload,{onConflict:"product_key"});if(error)throw error;
}

$("#newProductBtn")?.addEventListener("click",()=>{const f=$("#productForm");f.reset();loadProductDetailsIntoForm("");f.id.value="";f.category.value="DeshiGram";f.status.value="draft";f.max_order_quantity.value=10;f.low_stock_threshold.value=5;f.is_visible.checked=true;f.cod_enabled.checked=true;f.online_payment_enabled.checked=true;$("#deleteProductBtn").hidden=true;$("#productDialogTitle").textContent="New Product";$("#productDialog").showModal()});
async function uploadImages(files){const paths=[];for(const file of files){const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-"),path=`admin/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${safe}`;const {error}=await db.storage.from("deshigram-products").upload(path,file,{contentType:file.type||"image/jpeg"});if(error)throw error;paths.push(path)}return paths}
$("#productForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),out=$("#productFormStatus");try{status(out,"Saving…");let images=lines(fd.get("image_paths"));const files=[...$("#imageUpload").files];if(files.length)images=[...images,...await uploadImages(files)];const payload={name:fd.get("name"),slug:fd.get("slug"),sku:fd.get("sku"),category:fd.get("category"),net_quantity:fd.get("net_quantity"),mrp:Number(fd.get("mrp")||0),selling_price:Number(fd.get("selling_price")||0),stock_quantity:Number(fd.get("stock_quantity")||0),packed_weight_grams:Number(fd.get("packed_weight_grams")||0),max_order_quantity:Number(fd.get("max_order_quantity")||10),low_stock_threshold:Number(fd.get("low_stock_threshold")||5),status:fd.get("status"),coming_soon_date:fd.get("coming_soon_date")||null,sort_order:Number(fd.get("sort_order")||100),badge_text:fd.get("badge_text"),offer_type:fd.get("offer_type"),offer_value:Number(fd.get("offer_value")||0),offer_label:fd.get("offer_label"),offer_starts_at:fd.get("offer_starts_at")||null,offer_ends_at:fd.get("offer_ends_at")||null,is_visible:fd.get("is_visible")==="on",featured:fd.get("featured")==="on",cod_enabled:fd.get("cod_enabled")==="on",online_payment_enabled:fd.get("online_payment_enabled")==="on",short_description:fd.get("short_description"),description:fd.get("description"),ingredients:lines(fd.get("ingredients")),features:lines(fd.get("features")),usage_steps:lines(fd.get("usage_steps")),storage_instructions:fd.get("storage_instructions"),image_paths:images,seo_title:fd.get("seo_title"),seo_description:fd.get("seo_description")};const {error}=await db.rpc("admin_save_deshigram_product",{p_id:fd.get("id")||null,p_payload:payload});if(error)throw error;await saveProductDetailsFromForm(fd);status(out,"Saved.","ok");setTimeout(()=>$("#productDialog").close(),250);await load()}catch(err){status(out,err.message,"error")}});
$("#deleteProductBtn")?.addEventListener("click",async()=>{const id=$("#productForm").id.value;if(!id||!confirm("Delete this product permanently?"))return;const {error}=await db.rpc("admin_delete_deshigram_product",{p_id:id});if(error)return status($("#productFormStatus"),error.message,"error");$("#productDialog").close();await load()});
async function merch(kind,id,payload){const {error}=await db.rpc("admin_update_listing_merchandising",{p_kind:kind,p_id:id,p_payload:payload});if(error)throw error;await load()}
async function reviewListing(id,statusValue,note="",payout=null){const {error}=await db.rpc("admin_review_seller_product",{p_product_id:id,p_status:statusValue,p_note:note||null,p_seller_payout:payout});if(error)throw error;await load()}



function renderInventory(){
 const rows=[...(state.deshigram_products||[]).map(x=>({...x,source:"DeshiGram"}))];
 const total=rows.reduce((n,x)=>n+Number(x.stock_quantity||0),0),low=rows.filter(x=>Number(x.stock_quantity||0)<=Number(x.low_stock_threshold||5)).length,out=rows.filter(x=>Number(x.stock_quantity||0)===0).length;
 $("#inventoryStats").innerHTML=[["Total Units",total],["Listings",rows.length],["Low Stock",low],["Out of Stock",out]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 $("#inventoryTable").innerHTML=`<table class="data-table"><thead><tr><th>Listing</th><th>Source</th><th>SKU</th><th>Stock</th><th>Low-stock level</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.source}</td><td>${x.sku||"—"}</td><td>${x.stock_quantity??0}</td><td>${x.low_stock_threshold??5}</td><td>${pill(x.status)}</td></tr>`).join("")}</tbody></table>`;
}
function renderPayments(){
 const orders=state.orders||[],paid=orders.filter(o=>o.payment_status==="paid"),cod=orders.filter(o=>paymentLabel(o)==="COD"),online=orders.filter(o=>paymentLabel(o)!=="COD");
 const revenue=orders.filter(o=>o.order_status!=="cancelled"&&(o.payment_status==="paid"||paymentLabel(o)==="COD")).reduce((n,o)=>n+Number(o.total_amount||0),0);
 $("#paymentStats").innerHTML=[["Revenue",money(revenue)],["Paid",paid.length],["COD Orders",cod.length],["Online Orders",online.length]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 $("#paymentsTable").innerHTML=`<table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Amount</th><th>Order Status</th></tr></thead><tbody>${orders.map(o=>`<tr><td>${o.order_number}</td><td>${o.customer_name}</td><td><b>${paymentLabel(o)}</b></td><td>${money(o.total_amount)}</td><td>${pill(o.order_status)}</td></tr>`).join("")}</tbody></table>`;
 const payouts=$("#paymentsPayouts");if(payouts)payouts.innerHTML=(state.payouts||[]).map(x=>`<article class="card"><span>${pill(x.status)}</span><h3>${x.seller_business_name||"Seller"}</h3><p>Net ${money(x.net_payout)} • ${x.reference||"No reference"}</p></article>`).join("")||"<p>No settlement records.</p>";
}

function customerRows(){
 const map=new Map();
 for(const o of state.orders||[]){const key=(o.phone||o.customer_email||o.email||o.customer_name||"unknown").toLowerCase();let x=map.get(key);if(!x)x={name:o.customer_name||"Customer",phone:o.phone||"",email:o.customer_email||o.email||"",orders:0,spend:0,last:null};x.orders++;if(o.order_status!=="cancelled")x.spend+=Number(o.total_amount||0);const d=new Date(o.created_at||0);if(!x.last||d>x.last)x.last=d;map.set(key,x)}
 return [...map.values()];
}
function renderCustomers(){
 const box=$("#customersTable");if(!box)return;const q=($("#customerSearch")?.value||"").toLowerCase(),sort=$("#customerSort")?.value||"recent";let rows=customerRows().filter(x=>!q||`${x.name} ${x.phone} ${x.email}`.toLowerCase().includes(q));
 rows.sort((a,b)=>sort==="orders"?b.orders-a.orders:sort==="spend"?b.spend-a.spend:(b.last||0)-(a.last||0));
 const repeat=rows.filter(x=>x.orders>1).length,total=rows.reduce((n,x)=>n+x.spend,0);$("#customerStats").innerHTML=[["Customers",rows.length],["Repeat Customers",repeat],["Orders",rows.reduce((n,x)=>n+x.orders,0)],["Recorded Spend",money(total)]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 box.innerHTML=`<table class="data-table"><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Orders</th><th>Spend</th><th>Last Order</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.phone||"—"}</td><td>${x.email||"—"}</td><td>${x.orders}</td><td>${money(x.spend)}</td><td>${x.last?fmt(x.last):"—"}</td></tr>`).join("")}</tbody></table>`;
}
async function loadReviews(render=true){
 const {data,error}=await db.from("reviews").select("id,order_id,name,rating,review,verified,status,created_at").order("created_at",{ascending:false}).limit(500);
 if(error){status($("#reviewAdminStatus"),error.message,"error");state.reviews=[]}else{state.reviews=data||[];status($("#reviewAdminStatus"),"")}
 if(render)renderReviews();
}
function renderReviews(){
 const box=$("#reviewsTable");if(!box)return;const q=($("#reviewSearch")?.value||"").toLowerCase(),st=$("#reviewStatus")?.value||"";const rows=(state.reviews||[]).filter(x=>(!st||x.status===st)&&(!q||`${x.name} ${x.review}`.toLowerCase().includes(q)));
 const avg=rows.length?(rows.reduce((n,x)=>n+Number(x.rating||0),0)/rows.length).toFixed(1):"0.0";$("#reviewStats").innerHTML=[["Reviews",rows.length],["Pending",rows.filter(x=>x.status==="pending").length],["Approved",rows.filter(x=>x.status==="approved").length],["Avg Rating",avg]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 box.innerHTML=`<table class="data-table"><thead><tr><th>Customer</th><th>Rating</th><th>Review</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x.name||"Customer"}</b>${x.verified?"<br><small>Verified</small>":""}</td><td>${"★".repeat(Math.max(0,Math.min(5,Number(x.rating||0))))}</td><td>${x.review||""}</td><td>${pill(x.status||"pending")}</td><td>${fmt(x.created_at)}</td><td><button class="ghost" data-review-status="${x.id}:approved">Approve</button> <button class="danger" data-review-status="${x.id}:rejected">Reject</button></td></tr>`).join("")}</tbody></table>`;
}
function renderGrowth(){
 const orders=state.orders||[],active=orders.filter(o=>o.order_status!=="cancelled"),revenue=active.filter(o=>o.payment_status==="paid"||paymentLabel(o)==="COD").reduce((n,o)=>n+Number(o.total_amount||0),0),aov=active.length?revenue/active.length:0,customers=new Set(orders.map(o=>o.phone).filter(Boolean)).size;
 $("#growthStats").innerHTML=[["Orders",orders.length],["Customers",customers],["Revenue",money(revenue)],["Avg Order",money(aov)]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 const statuses=["placed","confirmed","packed","shipped","delivered","cancelled"];
 $("#growthOrderMix").innerHTML=statuses.map(st=>`<div class="metric-row"><span>${st.replaceAll("_"," ")}</span><b>${orders.filter(o=>o.order_status===st).length}</b></div>`).join("");
 const all=[...(state.deshigram_products||[])];
 $("#growthCatalogue").innerHTML=[["Live",all.filter(x=>x.status==="live").length],["Coming soon",all.filter(x=>x.status==="coming_soon").length],["Low stock",all.filter(x=>Number(x.stock_quantity||0)<=Number(x.low_stock_threshold||5)).length],["Visible",all.filter(x=>x.is_visible!==false).length]].map(([a,b])=>`<div class="metric-row"><span>${a}</span><b>${b}</b></div>`).join("");
}
function renderReports(){
 const orders=state.orders||[],cancelled=orders.filter(o=>o.order_status==="cancelled"),delivered=orders.filter(o=>o.order_status==="delivered"),ready=(state.fulfillment||[]).filter(x=>x.fulfillment_status==="ready_for_pickup");
 const revenue=orders.filter(o=>o.order_status!=="cancelled"&&(o.payment_status==="paid"||paymentLabel(o)==="COD")).reduce((n,o)=>n+Number(o.total_amount||0),0);
 $("#reportStats").innerHTML=[["Orders",orders.length],["Revenue",money(revenue)],["Delivered",delivered.length],["Cancelled",cancelled.length]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 $("#reportSummary").innerHTML=`<div><small>Ready for pickup</small><b>${ready.length}</b></div><div><small>DeshiGram listings</small><b>${(state.deshigram_products||[]).length}</b></div><div><small>Live listings</small><b>${(state.deshigram_products||[]).filter(x=>x.status==="live"&&x.is_visible!==false).length}</b></div><div><small>Low stock</small><b>${(state.deshigram_products||[]).filter(x=>Number(x.stock_quantity||0)<=Number(x.low_stock_threshold||5)).length}</b></div>`;
}
function exportOrdersCsv(){
 const cols=["order_number","created_at","customer_name","phone","product_name","payment_method","payment_status","total_amount","order_status"];
 const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;
 const csv=[cols.join(","),...(state.orders||[]).map(o=>cols.map(k=>esc(o[k])).join(","))].join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`deshigram-orders-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
}
$("#exportOrdersCsv")?.addEventListener("click",exportOrdersCsv);
["fulfillmentSearch","fulfillmentStatus"].forEach(id=>$("#"+id)?.addEventListener("input",renderFulfillment));

let currentMedia=null;
function openMedia(kind,id){const arr=kind==="deshigram"?state.deshigram_products:state.seller_products,x=(arr||[]).find(v=>v.id===id);if(!x)return;currentMedia={kind,id};$("#listingMediaTitle").textContent=x.name;$("#listingMediaGallery").innerHTML=(x.image_paths||[]).map((p,i)=>`<div class="media-admin-item"><img src="${imageUrl(kind,p)}"><button type="button" data-remove-media="${kind}:${id}:${i}">×</button></div>`).join("")||"<p>No photos yet.</p>";$("#listingMediaFiles").value="";status($("#listingMediaStatus"),"");$("#listingMediaDialog").showModal()}
async function saveImagePaths(kind,id,paths){if(kind==="deshigram"){const x=(state.deshigram_products||[]).find(v=>v.id===id);const payload={...x,image_paths:paths};const {error}=await db.rpc("admin_save_deshigram_product",{p_id:id,p_payload:payload});if(error)throw error}else{const {error}=await db.rpc("admin_update_listing_merchandising",{p_kind:"seller",p_id:id,p_payload:{image_paths:paths}});if(error)throw error}}

let currentOrderId=null;
function openOrder(id){
  const o=(state.orders||[]).find(x=>x.id===id); if(!o)return;
  currentOrderId=id;
  $("#orderDetailTitle").textContent=o.order_number;
  $("#detailOrderStatus").value=o.order_status||"placed";
  $("#detailPaymentStatus").value=o.payment_status||"pending";
  $("#orderDetailSummary").innerHTML=[
    ["Date",fmt(o.created_at)],["Customer",`${o.customer_name} • ${o.phone}`],["Address",`${o.shipping_address||""}, ${o.city||""}, ${o.state||""} - ${o.pincode||""}`],
    ["Products",o.product_name||"—"],["Payment",`${o.payment_method||"—"} • ${o.payment_status||"—"}`],["Total",money(o.total_amount)]
  ].map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join("");
  const items=(state.fulfillment||[]).filter(x=>x.order_id===id);
  $("#orderFulfillmentItems").innerHTML=items.length?items.map(x=>`<div class="fulfill-row" data-fulfill-row="${x.id}">
    <div class="item-name"><b>${x.product_name}</b><small>Qty ${x.quantity} • ${x.seller_business_name||"DeshiGram"}</small></div>
    <label>Status<select data-f-status>
      ${["new","accepted","ready_for_pickup","picked_up","shipped","delivered","cancelled"].map(v=>`<option value="${v}" ${x.fulfillment_status===v?"selected":""}>${v.replaceAll("_"," ")}</option>`).join("")}
    </select></label>
    <label>Courier<input data-f-courier value="${x.courier_name||""}"></label>
    <label>Tracking<input data-f-tracking value="${x.tracking_id||""}"></label>
    <button class="primary" type="button" data-save-fulfill="${x.id}">Save</button>
  </div>`).join(""):"<p>No fulfillment items linked to this order.</p>";
  status($("#orderDetailStatus"),"");
  $("#orderDetailDialog").showModal();
}
async function updateOrder(id,orderStatus,paymentStatus=null){
  const {error}=await db.rpc("admin_update_order_status",{p_order_id:id,p_order_status:orderStatus,p_payment_status:paymentStatus});
  if(error)throw error; await load();
}

document.addEventListener("click",async e=>{try{const cp=e.target.closest("[data-connect-product]");if(cp){const p=websiteListingRefs.find(x=>x.id===cp.dataset.connectProduct);if(!p)return;const f=$("#productForm");f.reset();fill(f,p);f.id.value="";f.stock_quantity.value=0;$("#deleteProductBtn").hidden=true;$("#productDialogTitle").textContent=p.name+" — Connect to Admin";status($("#productFormStatus"),"Set the real stock/MRP if needed, then Save Product. Nothing is written until you press Save.");$("#productDialog").showModal();return}const rv=e.target.closest("[data-review-status]");if(rv){const [id,next]=rv.dataset.reviewStatus.split(":");const {error}=await db.from("reviews").update({status:next}).eq("id",id);if(error)throw error;await loadReviews(true);return}
  const closer=e.target.closest("[data-close-dialog]"); if(closer){document.getElementById(closer.dataset.closeDialog)?.close();return}
  const ml=e.target.closest("[data-media-listing]");if(ml){const [kind,id]=ml.dataset.mediaListing.split(":");openMedia(kind,id);return}
  const rm=e.target.closest("[data-remove-media]");if(rm){const [kind,id,idx]=rm.dataset.removeMedia.split(":");const arr=kind==="deshigram"?state.deshigram_products:state.seller_products,x=(arr||[]).find(v=>v.id===id),paths=[...(x.image_paths||[])];paths.splice(Number(idx),1);await saveImagePaths(kind,id,paths);await load();openMedia(kind,id);return}
  const cl=e.target.closest("[data-clone-listing]");if(cl){const x=(state.deshigram_products||[]).find(v=>v.id===cl.dataset.cloneListing);if(!x)return;const payload={...x,slug:`${x.slug}-copy-${Date.now().toString().slice(-6)}`,name:`${x.name} — Copy`,status:"draft",is_visible:false};delete payload.id;const {error}=await db.rpc("admin_save_deshigram_product",{p_id:null,p_payload:payload});if(error)throw error;await load();alert("Listing cloned as Draft + Hidden. Edit karke Go Live karein.");return}
  const oo=e.target.closest("[data-open-order]"); if(oo){e.stopPropagation();openOrder(oo.dataset.openOrder);return}
  const co=e.target.closest("[data-cancel-order]"); if(co){e.stopPropagation();if(confirm("Cancel this order?")){await updateOrder(co.dataset.cancelOrder,"cancelled",null)}return}
  const sf=e.target.closest("[data-save-fulfill]"); if(sf){const row=e.target.closest("[data-fulfill-row]");const {error}=await db.rpc("admin_update_fulfillment_item",{p_item_id:sf.dataset.saveFulfill,p_status:row.querySelector("[data-f-status]").value,p_courier:row.querySelector("[data-f-courier]").value||null,p_tracking_id:row.querySelector("[data-f-tracking]").value||null});if(error)throw error;await load();openOrder(currentOrderId);return}
  const ep=e.target.closest("[data-edit-product]");if(ep){const p=state.deshigram_products.find(x=>x.id===ep.dataset.editProduct);fill($("#productForm"),p);await loadProductDetailsIntoForm(p.slug);$("#productDialogTitle").textContent=p.name;$("#deleteProductBtn").hidden=false;$("#productDialog").showModal();return}const es=e.target.closest("[data-edit-seller-listing]");if(es){const p=state.seller_products.find(x=>x.id===es.dataset.editSellerListing);fill($("#sellerForm"),p);$("#sellerTitle").textContent=p.name;$("#sellerDialog").showModal();return}const mo=e.target.closest("[data-merch-own]");if(mo){await merch("deshigram",mo.dataset.merchOwn,{status:mo.dataset.status,is_visible:true});return}const rl=e.target.closest("[data-review-listing]");if(rl){await reviewListing(rl.dataset.reviewListing,rl.dataset.status);return}const fs=e.target.closest("[data-fulfill]");if(fs){const x=state.fulfillment.find(v=>v.id===fs.dataset.fulfill);$("#fulfillmentForm").item_id.value=x.id;$("#fulfillmentForm").status.value=x.fulfillment_status||"pending";$("#fulfillmentForm").courier.value=x.courier_name||"";$("#fulfillmentForm").tracking_id.value=x.tracking_id||"";$("#fulfillmentTitle").textContent=`${x.order_number} • ${x.product_name}`;$("#fulfillmentDialog").showModal();return}const rs=e.target.closest("[data-review-seller]");if(rs){const x=state.sellers.find(v=>v.user_id===rs.dataset.reviewSeller);$("#sellerReviewForm").seller_id.value=x.user_id;$("#sellerReviewForm").status.value=x.verification_status||"under_review";$("#sellerReviewForm").note.value=x.verification_note||"";$("#sellerReviewTitle").textContent=x.business_name||x.full_name;$("#sellerReviewDialog").showModal();return}const st=e.target.closest("[data-settle]");if(st){$("#settlementForm").seller_id.value=st.dataset.settle;$("#settlementTitle").textContent=`Settle • ${st.dataset.sellerName}`;$("#settlementDialog").showModal();return}}catch(err){status($("#appStatus"),err.message,"error")}});


$("#uploadListingMedia")?.addEventListener("click",async()=>{if(!currentMedia)return;const files=[...$("#listingMediaFiles").files];if(!files.length)return status($("#listingMediaStatus"),"Photos select karein.","error");try{status($("#listingMediaStatus"),`Uploading ${files.length} photo(s)…`);const arr=currentMedia.kind==="deshigram"?state.deshigram_products:state.seller_products,x=(arr||[]).find(v=>v.id===currentMedia.id),paths=[...(x.image_paths||[])],bucket=currentMedia.kind==="deshigram"?"deshigram-products":"seller-products";for(const file of files){if(!file.type.startsWith("image/"))continue;const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-");const path=`admin/${currentMedia.id}/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${safe}`;const {error}=await db.storage.from(bucket).upload(path,file,{contentType:file.type||"image/jpeg"});if(error)throw error;paths.push(path)}await saveImagePaths(currentMedia.kind,currentMedia.id,paths);await load();openMedia(currentMedia.kind,currentMedia.id);status($("#listingMediaStatus"),"Photos uploaded. Live gallery data updated.","ok")}catch(err){status($("#listingMediaStatus"),err.message,"error")}});

$("#saveOrderStatus")?.addEventListener("click",async()=>{try{status($("#orderDetailStatus"),"Saving…");await updateOrder(currentOrderId,$("#detailOrderStatus").value,$("#detailPaymentStatus").value);status($("#orderDetailStatus"),"Saved.","ok");openOrder(currentOrderId)}catch(err){status($("#orderDetailStatus"),err.message,"error")}});
$("#cancelOrderBtn")?.addEventListener("click",async()=>{if(!currentOrderId||!confirm("Cancel this order?"))return;try{await updateOrder(currentOrderId,"cancelled",$("#detailPaymentStatus").value);$("#orderDetailDialog").close();}catch(err){status($("#orderDetailStatus"),err.message,"error")}});

$("#fulfillmentForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await db.rpc("admin_update_fulfillment_item",{p_item_id:f.get("item_id"),p_status:f.get("status"),p_courier:f.get("courier")||null,p_tracking_id:f.get("tracking_id")||null});if(error)return status($("#fulfillmentFormStatus"),error.message,"error");$("#fulfillmentDialog").close();await load()});
$("#sellerReviewForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await db.rpc("admin_review_seller",{p_seller_id:f.get("seller_id"),p_status:f.get("status"),p_note:f.get("note")||null});if(error)return status($("#sellerReviewStatus"),error.message,"error");$("#sellerReviewDialog").close();await load()});
$("#settlementForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {data,error}=await db.rpc("admin_settle_seller_available",{p_seller_id:f.get("seller_id"),p_reference:f.get("reference")});if(error)return status($("#settlementStatus"),error.message,"error");status($("#settlementStatus"),`Settlement saved: ${JSON.stringify(data)}`,"ok");setTimeout(()=>$("#settlementDialog").close(),600);await load()});
$("#sellerForm")?.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),out=$("#sellerFormStatus"),id=fd.get("id");try{status(out,"Saving…");await reviewListing(id,fd.get("status"),fd.get("review_note"),fd.get("seller_payout")===""?null:Number(fd.get("seller_payout")));await merch("seller",id,{status:fd.get("status"),coming_soon_date:fd.get("coming_soon_date")||null,badge_text:fd.get("badge_text"),offer_type:fd.get("offer_type"),offer_value:Number(fd.get("offer_value")||0),offer_label:fd.get("offer_label"),offer_starts_at:fd.get("offer_starts_at")||null,offer_ends_at:fd.get("offer_ends_at")||null,max_order_quantity:Number(fd.get("max_order_quantity")||10),low_stock_threshold:Number(fd.get("low_stock_threshold")||5),is_visible:fd.get("is_visible")==="on",featured:fd.get("featured")==="on",cod_enabled:fd.get("cod_enabled")==="on",online_payment_enabled:fd.get("online_payment_enabled")==="on"});status(out,"Saved.","ok");$("#sellerDialog").close();await load()}catch(err){status(out,err.message,"error")}});
boot();

// Open the existing product creation dialog from Listing Manager.
$("#newListingBtn")?.addEventListener("click",()=>$("#newProductBtn")?.click());
