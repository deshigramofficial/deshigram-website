import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const URL="https://kqkpbqpfnupjpthtpvdn.supabase.co",KEY="sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0",db=createClient(URL,KEY);
let state={stats:{},orders:[],sellers:[],seller_products:[],deshigram_products:[],fulfillment:[],payouts:[]},listTab="own";
const $=q=>document.querySelector(q), money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(v||0)), fmt=v=>v?new Date(v).toLocaleString("en-IN"):"—", lines=v=>String(v||"").split("\n").map(x=>x.trim()).filter(Boolean), dt=v=>v?new Date(v).toISOString().slice(0,16):"";
function imageUrl(kind,path){if(!path)return "";if(/^https?:\/\//i.test(path)||path.startsWith("images/")||path.startsWith("./")||path.startsWith("../"))return path;const bucket=kind==="deshigram"?"deshigram-products":"seller-products";return `${URL}/storage/v1/object/public/${bucket}/${path}`}
function paymentLabel(o){const m=String(o.payment_method||"").toLowerCase();if(m.includes("cod")||m.includes("cash"))return "COD";return o.payment_status==="paid"?"PAID":String(o.payment_status||"ONLINE").toUpperCase()}
const status=(el,msg,type="")=>{el.textContent=msg||"";el.className=`status ${type}`};
async function isAdmin(){const {data:{session}}=await db.auth.getSession();if(!session)return false;const {data,error}=await db.rpc("is_deshigram_admin");return !error&&data===true}
async function boot(){
  $("#adminApp").hidden=true; $("#loginPanel").hidden=true; $("#logoutBtn").hidden=true;
  if(await isAdmin()){showApp();await load()}else{$("#loginPanel").hidden=false}
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
async function load(){status($("#appStatus"),"Loading admin data…");const {data,error}=await db.rpc("admin_full_portal_data");if(error)return status($("#appStatus"),error.message,"error");state=data||state;renderAll();status($("#appStatus"),"");const target=location.hash.slice(1);if(document.querySelector(`.side-link[data-section="${target}"]`))goSection(target)}
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
function renderAll(){renderStats();renderDashboard();renderOrders();renderFulfillment();renderSellers();renderSellerListings();renderPayouts();renderProducts();renderListingManager();renderInventory();renderPayments();renderGrowth();renderReports()}
function renderStats(){
  const orders=state.orders||[];
  const active=orders.filter(o=>o.order_status!=="cancelled");
  const revenue=active.filter(o=>o.payment_status==="paid"||o.payment_method==="COD").reduce((a,o)=>a+Number(o.total_amount||0),0);
  const ready=(state.fulfillment||[]).filter(x=>x.fulfillment_status==="ready_for_pickup").length;
  const sellerReviews=(state.sellers||[]).filter(x=>["pending","under_review"].includes(x.verification_status)).length;
  const available=(state.fulfillment||[]).filter(x=>x.payout_status==="available").reduce((a,x)=>a+Number(x.seller_payout_unit||0)*Number(x.quantity||0),0);
  const arr=[["Orders",orders.length],["Revenue",money(revenue)],["Cancelled",orders.filter(o=>o.order_status==="cancelled").length],["Ready Pickup",ready],["Seller Reviews",sellerReviews],["Payout Available",money(available)]];
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
  (state.sellers||[]).filter(x=>["pending","under_review"].includes(x.verification_status)).slice(0,4).forEach(x=>a.push(`Seller review: <b>${x.business_name||x.full_name}</b>`));
  (state.seller_products||[]).filter(x=>x.status==="under_review").slice(0,4).forEach(x=>a.push(`Listing review: <b>${x.name}</b>`));
  (state.fulfillment||[]).filter(x=>x.fulfillment_status==="ready_for_pickup").slice(0,4).forEach(x=>a.push(`Pickup ready: <b>${x.order_number}</b> • ${x.product_name}`));
  $("#attention").innerHTML=`<div class="mini-list">${a.map(x=>`<div class="mini-row"><span>${x}</span></div>`).join("")||"Nothing urgent."}</div>`;
  const allListings=[...(state.deshigram_products||[]),...(state.seller_products||[])];
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
function ownCard(p){const low=Number(p.stock_quantity||0)<=Number(p.low_stock_threshold||5),imgs=p.image_paths||[],src=imageUrl("deshigram",imgs[0]);return `<article class="card"><span>${pill(p.status)}</span><div class="listing-card-top"><div class="listing-thumb-wrap">${src?`<img class="listing-thumb" src="${src}" alt="${p.name}" data-media-listing="deshigram:${p.id}">`:`<button class="listing-thumb" data-media-listing="deshigram:${p.id}">+ Photos</button>`}<span class="photo-count">${imgs.length} photo${imgs.length===1?"":"s"}</span></div><div><h3>${p.name}</h3><p>${p.net_quantity||""} • ${p.sku||"No SKU"}</p><p class="price">${money(p.selling_price)} <s>${money(p.mrp)}</s></p><p class="${low?"warn":""}">Stock ${p.stock_quantity}${low?" • Low stock":""}</p><p>${p.is_visible===false?"Hidden":"Visible"}</p></div></div><div class="actions"><button class="ghost" data-edit-product="${p.id}">Edit Product</button><button data-media-listing="deshigram:${p.id}">Photos</button><button data-clone-listing="${p.id}">Clone Listing</button><button data-merch-own="${p.id}" data-status="coming_soon">Coming Soon</button><button data-merch-own="${p.id}" data-status="live">Go Live</button></div></article>`}
function sellerCard(p){const imgs=p.image_paths||[],src=imageUrl("seller",imgs[0]);return `<article class="card"><span>${pill(p.status)}</span><div class="listing-card-top"><div class="listing-thumb-wrap">${src?`<img class="listing-thumb" src="${src}" alt="${p.name}" data-media-listing="seller:${p.id}">`:`<button class="listing-thumb" data-media-listing="seller:${p.id}">+ Photos</button>`}<span class="photo-count">${imgs.length} photo${imgs.length===1?"":"s"}</span></div><div><h3>${p.name}</h3><p>${p.seller_business_name||"Seller"} • ${p.category||""}</p><p class="price">${money(p.selling_price)} <s>${money(p.mrp)}</s></p><p>Stock ${p.stock_quantity}</p></div></div><div class="actions"><button class="ghost" data-edit-seller-listing="${p.id}">Review / Options</button><button data-media-listing="seller:${p.id}">Photos</button><button data-review-listing="${p.id}" data-status="live">Approve Live</button><button data-review-listing="${p.id}" data-status="changes_required">Changes</button></div></article>`}
function renderProducts(){const q=($("#productSearch").value||"").toLowerCase(),st=$("#productStatus").value;$("#productCards").innerHTML=(state.deshigram_products||[]).filter(x=>(!st||x.status===st)&&(!q||x.name.toLowerCase().includes(q))).map(ownCard).join("")||"<p>No products.</p>"}
function renderListingManager(){
 const q=($("#listingSearch").value||"").toLowerCase(),st=$("#listingStatus").value;
 $("#listingOwn").innerHTML=(state.deshigram_products||[]).filter(x=>(!st||x.status===st)&&(!q||x.name.toLowerCase().includes(q))).map(ownCard).join("")||"<p>No DeshiGram listings.</p>";
 $("#listingSeller").innerHTML=(state.seller_products||[]).filter(x=>(!st||x.status===st)&&(!q||`${x.name} ${x.seller_business_name||""}`.toLowerCase().includes(q))).map(sellerCard).join("")||"<p>No seller listings.</p>";
 $("#listingSellers").innerHTML=(state.sellers||[]).filter(x=>!q||`${x.full_name} ${x.business_name||""} ${x.phone||""}`.toLowerCase().includes(q)).map(x=>`<article class="card"><span>${pill(x.verification_status)}</span><h3>${x.business_name||x.full_name}</h3><p>${x.full_name} • ${x.phone}</p><p>${x.city||""}, ${x.state||""} • ${x.pincode||""}</p><p>FSSAI: ${x.fssai_number||"—"} • GST: ${x.gstin||"—"}</p><div class="actions"><button class="ghost" data-review-seller="${x.user_id}">Review Seller</button><button class="primary" data-settle="${x.user_id}" data-seller-name="${x.business_name||x.full_name}">Settlement</button></div></article>`).join("")||"<p>No sellers.</p>";
}
["ordersSearch","ordersStatus"].forEach(id=>$("#"+id).addEventListener("input",renderOrders));["sellerSearch","sellerStatus"].forEach(id=>$("#"+id).addEventListener("input",renderSellers));["sellerListingSearch","sellerListingStatus"].forEach(id=>$("#"+id).addEventListener("input",renderSellerListings));["payoutSearch","payoutStatus"].forEach(id=>$("#"+id).addEventListener("input",renderPayouts));["productSearch","productStatus"].forEach(id=>$("#"+id).addEventListener("input",renderProducts));["listingSearch","listingStatus"].forEach(id=>$("#"+id).addEventListener("input",renderListingManager));
document.querySelectorAll("[data-list-tab]").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll("[data-list-tab]").forEach(x=>x.classList.toggle("active",x===b));
 $("#listingOwn").hidden=b.dataset.listTab!=="own";
 $("#listingSeller").hidden=b.dataset.listTab!=="seller";
 $("#listingSellers").hidden=b.dataset.listTab!=="sellers";
}));
function fill(form,p){[...form.elements].forEach(el=>{if(!el.name)return;const v=p?.[el.name];if(el.type==="checkbox")el.checked=v!==false;else if(el.type==="datetime-local")el.value=dt(v);else if(Array.isArray(v))el.value=v.join("\n");else el.value=v??""})}
$("#newListingBtn")?.addEventListener("click",()=>$("#newProductBtn").click());
$("#newProductBtn").addEventListener("click",()=>{const f=$("#productForm");f.reset();f.id.value="";f.category.value="DeshiGram";f.status.value="draft";f.max_order_quantity.value=10;f.low_stock_threshold.value=5;f.is_visible.checked=true;f.cod_enabled.checked=true;f.online_payment_enabled.checked=true;$("#deleteProductBtn").hidden=true;$("#productDialogTitle").textContent="New Product";$("#productDialog").showModal()});
async function uploadImages(files){const paths=[];for(const file of files){const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-"),path=`admin/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${safe}`;const {error}=await db.storage.from("deshigram-products").upload(path,file,{contentType:file.type||"image/jpeg"});if(error)throw error;paths.push(path)}return paths}
$("#productForm").addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),out=$("#productFormStatus");try{status(out,"Saving…");let images=lines(fd.get("image_paths"));const files=[...$("#imageUpload").files];if(files.length)images=[...images,...await uploadImages(files)];const payload={name:fd.get("name"),slug:fd.get("slug"),sku:fd.get("sku"),category:fd.get("category"),net_quantity:fd.get("net_quantity"),mrp:Number(fd.get("mrp")||0),selling_price:Number(fd.get("selling_price")||0),stock_quantity:Number(fd.get("stock_quantity")||0),packed_weight_grams:Number(fd.get("packed_weight_grams")||0),max_order_quantity:Number(fd.get("max_order_quantity")||10),low_stock_threshold:Number(fd.get("low_stock_threshold")||5),status:fd.get("status"),coming_soon_date:fd.get("coming_soon_date")||null,sort_order:Number(fd.get("sort_order")||100),badge_text:fd.get("badge_text"),offer_type:fd.get("offer_type"),offer_value:Number(fd.get("offer_value")||0),offer_label:fd.get("offer_label"),offer_starts_at:fd.get("offer_starts_at")||null,offer_ends_at:fd.get("offer_ends_at")||null,is_visible:fd.get("is_visible")==="on",featured:fd.get("featured")==="on",cod_enabled:fd.get("cod_enabled")==="on",online_payment_enabled:fd.get("online_payment_enabled")==="on",short_description:fd.get("short_description"),description:fd.get("description"),ingredients:lines(fd.get("ingredients")),features:lines(fd.get("features")),usage_steps:lines(fd.get("usage_steps")),storage_instructions:fd.get("storage_instructions"),image_paths:images,seo_title:fd.get("seo_title"),seo_description:fd.get("seo_description")};const {error}=await db.rpc("admin_save_deshigram_product",{p_id:fd.get("id")||null,p_payload:payload});if(error)throw error;status(out,"Saved.","ok");setTimeout(()=>$("#productDialog").close(),250);await load()}catch(err){status(out,err.message,"error")}});
$("#deleteProductBtn").addEventListener("click",async()=>{const id=$("#productForm").id.value;if(!id||!confirm("Delete this product permanently?"))return;const {error}=await db.rpc("admin_delete_deshigram_product",{p_id:id});if(error)return status($("#productFormStatus"),error.message,"error");$("#productDialog").close();await load()});
async function merch(kind,id,payload){const {error}=await db.rpc("admin_update_listing_merchandising",{p_kind:kind,p_id:id,p_payload:payload});if(error)throw error;await load()}
async function reviewListing(id,statusValue,note="",payout=null){const {error}=await db.rpc("admin_review_seller_product",{p_product_id:id,p_status:statusValue,p_note:note||null,p_seller_payout:payout});if(error)throw error;await load()}



function renderInventory(){
 const rows=[...(state.deshigram_products||[]).map(x=>({...x,source:"DeshiGram"})),...(state.seller_products||[]).map(x=>({...x,source:x.seller_business_name||"Seller"}))];
 const total=rows.reduce((n,x)=>n+Number(x.stock_quantity||0),0),low=rows.filter(x=>Number(x.stock_quantity||0)<=Number(x.low_stock_threshold||5)).length,out=rows.filter(x=>Number(x.stock_quantity||0)===0).length;
 $("#inventoryStats").innerHTML=[["Total Units",total],["Listings",rows.length],["Low Stock",low],["Out of Stock",out]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 $("#inventoryTable").innerHTML=`<table class="data-table"><thead><tr><th>Listing</th><th>Source</th><th>SKU</th><th>Stock</th><th>Low-stock level</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.source}</td><td>${x.sku||"—"}</td><td>${x.stock_quantity??0}</td><td>${x.low_stock_threshold??5}</td><td>${pill(x.status)}</td></tr>`).join("")}</tbody></table>`;
}
function renderPayments(){
 const orders=state.orders||[],paid=orders.filter(o=>o.payment_status==="paid"),cod=orders.filter(o=>paymentLabel(o)==="COD"),online=orders.filter(o=>paymentLabel(o)!=="COD");
 const revenue=orders.filter(o=>o.order_status!=="cancelled"&&(o.payment_status==="paid"||paymentLabel(o)==="COD")).reduce((n,o)=>n+Number(o.total_amount||0),0);
 $("#paymentStats").innerHTML=[["Revenue",money(revenue)],["Paid",paid.length],["COD Orders",cod.length],["Online Orders",online.length]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 $("#paymentsTable").innerHTML=`<table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Amount</th><th>Order Status</th></tr></thead><tbody>${orders.map(o=>`<tr><td>${o.order_number}</td><td>${o.customer_name}</td><td><b>${paymentLabel(o)}</b></td><td>${money(o.total_amount)}</td><td>${pill(o.order_status)}</td></tr>`).join("")}</tbody></table>`;
 $("#paymentsPayouts").innerHTML=(state.payouts||[]).map(x=>`<article class="card"><span>${pill(x.status)}</span><h3>${x.seller_business_name||"Seller"}</h3><p>Net ${money(x.net_payout)} • ${x.reference||"No reference"}</p></article>`).join("")||"<p>No settlement records.</p>";
}
function renderGrowth(){
 const orders=state.orders||[],active=orders.filter(o=>o.order_status!=="cancelled"),revenue=active.filter(o=>o.payment_status==="paid"||paymentLabel(o)==="COD").reduce((n,o)=>n+Number(o.total_amount||0),0),aov=active.length?revenue/active.length:0,customers=new Set(orders.map(o=>o.phone).filter(Boolean)).size;
 $("#growthStats").innerHTML=[["Orders",orders.length],["Customers",customers],["Revenue",money(revenue)],["Avg Order",money(aov)]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 const statuses=["placed","confirmed","packed","shipped","delivered","cancelled"];
 $("#growthOrderMix").innerHTML=statuses.map(st=>`<div class="metric-row"><span>${st.replaceAll("_"," ")}</span><b>${orders.filter(o=>o.order_status===st).length}</b></div>`).join("");
 const all=[...(state.deshigram_products||[]),...(state.seller_products||[])];
 $("#growthCatalogue").innerHTML=[["Live",all.filter(x=>x.status==="live").length],["Coming soon",all.filter(x=>x.status==="coming_soon").length],["Low stock",all.filter(x=>Number(x.stock_quantity||0)<=Number(x.low_stock_threshold||5)).length],["Seller reviews",(state.sellers||[]).filter(x=>["pending","under_review"].includes(x.verification_status)).length]].map(([a,b])=>`<div class="metric-row"><span>${a}</span><b>${b}</b></div>`).join("");
}
function renderReports(){
 const orders=state.orders||[],cancelled=orders.filter(o=>o.order_status==="cancelled"),delivered=orders.filter(o=>o.order_status==="delivered"),ready=(state.fulfillment||[]).filter(x=>x.fulfillment_status==="ready_for_pickup");
 const revenue=orders.filter(o=>o.order_status!=="cancelled"&&(o.payment_status==="paid"||paymentLabel(o)==="COD")).reduce((n,o)=>n+Number(o.total_amount||0),0);
 $("#reportStats").innerHTML=[["Orders",orders.length],["Revenue",money(revenue)],["Delivered",delivered.length],["Cancelled",cancelled.length]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
 $("#reportSummary").innerHTML=`<div><small>Ready for pickup</small><b>${ready.length}</b></div><div><small>Seller accounts</small><b>${(state.sellers||[]).length}</b></div><div><small>DeshiGram listings</small><b>${(state.deshigram_products||[]).length}</b></div><div><small>Seller listings</small><b>${(state.seller_products||[]).length}</b></div>`;
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

document.addEventListener("click",async e=>{try{
  const closer=e.target.closest("[data-close-dialog]"); if(closer){document.getElementById(closer.dataset.closeDialog)?.close();return}
  const ml=e.target.closest("[data-media-listing]");if(ml){const [kind,id]=ml.dataset.mediaListing.split(":");openMedia(kind,id);return}
  const rm=e.target.closest("[data-remove-media]");if(rm){const [kind,id,idx]=rm.dataset.removeMedia.split(":");const arr=kind==="deshigram"?state.deshigram_products:state.seller_products,x=(arr||[]).find(v=>v.id===id),paths=[...(x.image_paths||[])];paths.splice(Number(idx),1);await saveImagePaths(kind,id,paths);await load();openMedia(kind,id);return}
  const cl=e.target.closest("[data-clone-listing]");if(cl){const x=(state.deshigram_products||[]).find(v=>v.id===cl.dataset.cloneListing);if(!x)return;const payload={...x,slug:`${x.slug}-copy-${Date.now().toString().slice(-6)}`,name:`${x.name} — Copy`,status:"draft",is_visible:false};delete payload.id;const {error}=await db.rpc("admin_save_deshigram_product",{p_id:null,p_payload:payload});if(error)throw error;await load();alert("Listing cloned as Draft + Hidden. Edit karke Go Live karein.");return}
  const oo=e.target.closest("[data-open-order]"); if(oo){e.stopPropagation();openOrder(oo.dataset.openOrder);return}
  const co=e.target.closest("[data-cancel-order]"); if(co){e.stopPropagation();if(confirm("Cancel this order?")){await updateOrder(co.dataset.cancelOrder,"cancelled",null)}return}
  const sf=e.target.closest("[data-save-fulfill]"); if(sf){const row=e.target.closest("[data-fulfill-row]");const {error}=await db.rpc("admin_update_fulfillment_item",{p_item_id:sf.dataset.saveFulfill,p_status:row.querySelector("[data-f-status]").value,p_courier:row.querySelector("[data-f-courier]").value||null,p_tracking_id:row.querySelector("[data-f-tracking]").value||null});if(error)throw error;await load();openOrder(currentOrderId);return}
  const ep=e.target.closest("[data-edit-product]");if(ep){const p=state.deshigram_products.find(x=>x.id===ep.dataset.editProduct);fill($("#productForm"),p);$("#productDialogTitle").textContent=p.name;$("#deleteProductBtn").hidden=false;$("#productDialog").showModal();return}const es=e.target.closest("[data-edit-seller-listing]");if(es){const p=state.seller_products.find(x=>x.id===es.dataset.editSellerListing);fill($("#sellerForm"),p);$("#sellerTitle").textContent=p.name;$("#sellerDialog").showModal();return}const mo=e.target.closest("[data-merch-own]");if(mo){await merch("deshigram",mo.dataset.merchOwn,{status:mo.dataset.status,is_visible:true});return}const rl=e.target.closest("[data-review-listing]");if(rl){await reviewListing(rl.dataset.reviewListing,rl.dataset.status);return}const fs=e.target.closest("[data-fulfill]");if(fs){const x=state.fulfillment.find(v=>v.id===fs.dataset.fulfill);$("#fulfillmentForm").item_id.value=x.id;$("#fulfillmentForm").status.value=x.fulfillment_status||"pending";$("#fulfillmentForm").courier.value=x.courier_name||"";$("#fulfillmentForm").tracking_id.value=x.tracking_id||"";$("#fulfillmentTitle").textContent=`${x.order_number} • ${x.product_name}`;$("#fulfillmentDialog").showModal();return}const rs=e.target.closest("[data-review-seller]");if(rs){const x=state.sellers.find(v=>v.user_id===rs.dataset.reviewSeller);$("#sellerReviewForm").seller_id.value=x.user_id;$("#sellerReviewForm").status.value=x.verification_status||"under_review";$("#sellerReviewForm").note.value=x.verification_note||"";$("#sellerReviewTitle").textContent=x.business_name||x.full_name;$("#sellerReviewDialog").showModal();return}const st=e.target.closest("[data-settle]");if(st){$("#settlementForm").seller_id.value=st.dataset.settle;$("#settlementTitle").textContent=`Settle • ${st.dataset.sellerName}`;$("#settlementDialog").showModal();return}}catch(err){status($("#appStatus"),err.message,"error")}});


$("#uploadListingMedia").addEventListener("click",async()=>{if(!currentMedia)return;const files=[...$("#listingMediaFiles").files];if(!files.length)return status($("#listingMediaStatus"),"Photos select karein.","error");try{status($("#listingMediaStatus"),`Uploading ${files.length} photo(s)…`);const arr=currentMedia.kind==="deshigram"?state.deshigram_products:state.seller_products,x=(arr||[]).find(v=>v.id===currentMedia.id),paths=[...(x.image_paths||[])],bucket=currentMedia.kind==="deshigram"?"deshigram-products":"seller-products";for(const file of files){if(!file.type.startsWith("image/"))continue;const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-");const path=`admin/${currentMedia.id}/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${safe}`;const {error}=await db.storage.from(bucket).upload(path,file,{contentType:file.type||"image/jpeg"});if(error)throw error;paths.push(path)}await saveImagePaths(currentMedia.kind,currentMedia.id,paths);await load();openMedia(currentMedia.kind,currentMedia.id);status($("#listingMediaStatus"),"Photos uploaded. Live gallery data updated.","ok")}catch(err){status($("#listingMediaStatus"),err.message,"error")}});

$("#saveOrderStatus").addEventListener("click",async()=>{try{status($("#orderDetailStatus"),"Saving…");await updateOrder(currentOrderId,$("#detailOrderStatus").value,$("#detailPaymentStatus").value);status($("#orderDetailStatus"),"Saved.","ok");openOrder(currentOrderId)}catch(err){status($("#orderDetailStatus"),err.message,"error")}});
$("#cancelOrderBtn").addEventListener("click",async()=>{if(!currentOrderId||!confirm("Cancel this order?"))return;try{await updateOrder(currentOrderId,"cancelled",$("#detailPaymentStatus").value);$("#orderDetailDialog").close();}catch(err){status($("#orderDetailStatus"),err.message,"error")}});

$("#fulfillmentForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await db.rpc("admin_update_fulfillment_item",{p_item_id:f.get("item_id"),p_status:f.get("status"),p_courier:f.get("courier")||null,p_tracking_id:f.get("tracking_id")||null});if(error)return status($("#fulfillmentFormStatus"),error.message,"error");$("#fulfillmentDialog").close();await load()});
$("#sellerReviewForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await db.rpc("admin_review_seller",{p_seller_id:f.get("seller_id"),p_status:f.get("status"),p_note:f.get("note")||null});if(error)return status($("#sellerReviewStatus"),error.message,"error");$("#sellerReviewDialog").close();await load()});
$("#settlementForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {data,error}=await db.rpc("admin_settle_seller_available",{p_seller_id:f.get("seller_id"),p_reference:f.get("reference")});if(error)return status($("#settlementStatus"),error.message,"error");status($("#settlementStatus"),`Settlement saved: ${JSON.stringify(data)}`,"ok");setTimeout(()=>$("#settlementDialog").close(),600);await load()});
$("#sellerForm").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),out=$("#sellerFormStatus"),id=fd.get("id");try{status(out,"Saving…");await reviewListing(id,fd.get("status"),fd.get("review_note"),fd.get("seller_payout")===""?null:Number(fd.get("seller_payout")));await merch("seller",id,{status:fd.get("status"),coming_soon_date:fd.get("coming_soon_date")||null,badge_text:fd.get("badge_text"),offer_type:fd.get("offer_type"),offer_value:Number(fd.get("offer_value")||0),offer_label:fd.get("offer_label"),offer_starts_at:fd.get("offer_starts_at")||null,offer_ends_at:fd.get("offer_ends_at")||null,max_order_quantity:Number(fd.get("max_order_quantity")||10),low_stock_threshold:Number(fd.get("low_stock_threshold")||5),is_visible:fd.get("is_visible")==="on",featured:fd.get("featured")==="on",cod_enabled:fd.get("cod_enabled")==="on",online_payment_enabled:fd.get("online_payment_enabled")==="on"});status(out,"Saved.","ok");$("#sellerDialog").close();await load()}catch(err){status(out,err.message,"error")}});
boot();
