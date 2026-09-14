import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const URL="https://kqkpbqpfnupjpthtpvdn.supabase.co";
const KEY="sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0";
const db=createClient(URL,KEY);
let data={deshigram:[],seller:[]}, activeTab="own";

const $=q=>document.querySelector(q);
const money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(v||0));
const lines=v=>String(v||"").split("\n").map(x=>x.trim()).filter(Boolean);
const dtLocal=v=>v?new Date(v).toISOString().slice(0,16):"";
const imgUrl=(path,bucket="deshigram-products")=>{
  if(!path)return "favicon.png";
  if(/^https?:\/\//i.test(path)||path.startsWith("images/"))return path;
  return `${URL}/storage/v1/object/public/${bucket}/${path}`;
};
const setStatus=(el,msg,type="")=>{el.textContent=msg||"";el.className=`status ${type}`};

async function sessionCheck(){
  const {data:{session}}=await db.auth.getSession();
  if(!session)return false;
  const {data:ok,error}=await db.rpc("is_deshigram_admin");
  return !error&&ok===true;
}
async function boot(){
  if(await sessionCheck()){showApp();await load()}else $("#loginPanel").hidden=false;
}
function showApp(){
  $("#loginPanel").hidden=true;$("#adminApp").hidden=false;$("#logoutBtn").hidden=false;
}
$("#loginForm").addEventListener("submit",async e=>{
  e.preventDefault();setStatus($("#loginStatus"),"Signing in…");
  const f=new FormData(e.currentTarget);
  const {error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
  if(error)return setStatus($("#loginStatus"),error.message,"error");
  if(!(await sessionCheck())){await db.auth.signOut();return setStatus($("#loginStatus"),"This account is not authorized for DeshiGram Admin.","error")}
  showApp();await load();
});
$("#logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();location.reload()});

async function load(){
  setStatus($("#appStatus"),"Loading listings…");
  const {data:r,error}=await db.rpc("admin_listing_manager");
  if(error)return setStatus($("#appStatus"),error.message,"error");
  data=r||{deshigram:[],seller:[]}; render(); setStatus($("#appStatus"),"");
}
function stats(){
  const all=[...(data.deshigram||[]),...(data.seller||[])];
  const values=[
    ["Total",all.length],["Live",all.filter(x=>x.status==="live").length],
    ["Coming Soon",all.filter(x=>x.status==="coming_soon").length],
    ["Under Review",all.filter(x=>x.status==="under_review").length],
    ["Low Stock",all.filter(x=>Number(x.stock_quantity||0)<=Number(x.low_stock_threshold||5)).length]
  ];
  $("#stats").innerHTML=values.map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
}
function filtered(list){
  const q=$("#searchInput").value.toLowerCase().trim(), st=$("#statusFilter").value;
  return list.filter(x=>(!st||x.status===st)&&(!q||`${x.name} ${x.category||""} ${x.seller_business_name||""}`.toLowerCase().includes(q)));
}
function ownCard(p){
  const image=imgUrl((p.image_paths||[])[0]);
  const low=Number(p.stock_quantity||0)<=Number(p.low_stock_threshold||5);
  return `<article class="listing-card ${p.is_visible===false?"hidden-item":""}">
    ${p.featured?'<span class="featured-star">★</span>':""}<img src="${image}" alt="">
    <div><span class="pill ${p.status}">${p.status}</span><h3>${p.name}</h3><p>${p.net_quantity||""} • ${p.sku||"No SKU"}</p><p class="price">${money(p.selling_price)} <s>${money(p.mrp)}</s></p><p class="${low?"low":""}">Stock: ${p.stock_quantity} ${low?"• Low stock":""}</p>${p.badge_text?`<p>Badge: ${p.badge_text}</p>`:""}</div>
    <div class="actions"><button data-edit-own="${p.id}">Edit all options</button><button data-quick="${p.id}" data-kind="deshigram" data-status="live">Go Live</button><button data-quick="${p.id}" data-kind="deshigram" data-status="coming_soon">Coming Soon</button><button data-quick="${p.id}" data-kind="deshigram" data-status="hidden">Hide</button></div>
  </article>`;
}
function sellerCard(p){
  const image=imgUrl((p.image_paths||[])[0],"seller-products");
  const low=Number(p.stock_quantity||0)<=Number(p.low_stock_threshold||5);
  return `<article class="listing-card ${p.is_visible===false?"hidden-item":""}">
    ${p.featured?'<span class="featured-star">★</span>':""}<img src="${image}" alt="">
    <div><span class="pill ${p.status}">${p.status}</span><h3>${p.name}</h3><p>${p.seller_business_name||"Seller"} • ${p.category||""}</p><p class="price">${money(p.selling_price)} <s>${money(p.mrp)}</s></p><p class="${low?"low":""}">Stock: ${p.stock_quantity} • Payout ${money(p.seller_payout||p.bank_settlement||0)}</p></div>
    <div class="actions"><button data-edit-seller="${p.id}">Review / Options</button><button data-review="${p.id}" data-status="live">Approve Live</button><button data-review="${p.id}" data-status="coming_soon">Coming Soon</button><button data-review="${p.id}" data-status="changes_required">Changes</button></div>
  </article>`;
}
function render(){
  stats();
  $("#ownPanel").innerHTML=filtered(data.deshigram||[]).map(ownCard).join("")||"<p>No products found.</p>";
  $("#sellerPanel").innerHTML=filtered(data.seller||[]).map(sellerCard).join("")||"<p>No seller listings found.</p>";
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
  activeTab=b.dataset.tab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
  $("#ownPanel").hidden=activeTab!=="own";$("#sellerPanel").hidden=activeTab!=="seller";
}));
$("#searchInput").addEventListener("input",render);$("#statusFilter").addEventListener("change",render);$("#refreshBtn").addEventListener("click",load);

function fill(form,p){
  [...form.elements].forEach(el=>{
    if(!el.name)return;
    const v=p?.[el.name];
    if(el.type==="checkbox")el.checked=v!==false;
    else if(el.type==="datetime-local")el.value=dtLocal(v);
    else if(Array.isArray(v))el.value=v.join("\n");
    else el.value=v??"";
  });
}
$("#newProductBtn").addEventListener("click",()=>{const f=$("#productForm");f.reset();f.id.value="";f.category.value="DeshiGram";f.status.value="draft";f.max_order_quantity.value=10;f.low_stock_threshold.value=5;f.is_visible.checked=true;f.cod_enabled.checked=true;f.online_payment_enabled.checked=true;$("#deleteProductBtn").hidden=true;$("#productDialogTitle").textContent="New Product";$("#productDialog").showModal()});
document.addEventListener("click",async e=>{
  const own=e.target.closest("[data-edit-own]"); if(own){const p=data.deshigram.find(x=>x.id===own.dataset.editOwn);fill($("#productForm"),p);$("#productDialogTitle").textContent=p.name;$("#deleteProductBtn").hidden=false;$("#productDialog").showModal();return}
  const seller=e.target.closest("[data-edit-seller]"); if(seller){const p=data.seller.find(x=>x.id===seller.dataset.editSeller);fill($("#sellerForm"),p);$("#sellerTitle").textContent=p.name;$("#sellerDialog").showModal();return}
  const quick=e.target.closest("[data-quick]"); if(quick){await updateMerch(quick.dataset.kind,quick.dataset.quick,{status:quick.dataset.status,is_visible:quick.dataset.status!=="hidden"});return}
  const review=e.target.closest("[data-review]"); if(review){await reviewSeller(review.dataset.review,review.dataset.status,"");return}
});
async function uploadImages(files){
  const paths=[];
  for(const file of files){
    const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-");
    const path=`admin/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${safe}`;
    const {error}=await db.storage.from("deshigram-products").upload(path,file,{upsert:false,contentType:file.type||"image/jpeg"});
    if(error)throw error; paths.push(path);
  }
  return paths;
}
$("#productForm").addEventListener("submit",async e=>{
  e.preventDefault(); const f=e.currentTarget, fd=new FormData(f), status=$("#productFormStatus");
  try{
    setStatus(status,"Saving…");
    let imagePaths=lines(fd.get("image_paths"));
    const files=[...$("#imageUpload").files]; if(files.length)imagePaths=[...imagePaths,...await uploadImages(files)];
    const payload={
      name:fd.get("name"),slug:fd.get("slug"),sku:fd.get("sku"),category:fd.get("category"),net_quantity:fd.get("net_quantity"),
      mrp:Number(fd.get("mrp")||0),selling_price:Number(fd.get("selling_price")||0),stock_quantity:Number(fd.get("stock_quantity")||0),
      packed_weight_grams:Number(fd.get("packed_weight_grams")||0),max_order_quantity:Number(fd.get("max_order_quantity")||10),low_stock_threshold:Number(fd.get("low_stock_threshold")||5),
      status:fd.get("status"),coming_soon_date:fd.get("coming_soon_date")||null,sort_order:Number(fd.get("sort_order")||100),badge_text:fd.get("badge_text"),
      offer_type:fd.get("offer_type"),offer_value:Number(fd.get("offer_value")||0),offer_label:fd.get("offer_label"),offer_starts_at:fd.get("offer_starts_at")||null,offer_ends_at:fd.get("offer_ends_at")||null,
      is_visible:fd.get("is_visible")==="on",featured:fd.get("featured")==="on",cod_enabled:fd.get("cod_enabled")==="on",online_payment_enabled:fd.get("online_payment_enabled")==="on",
      short_description:fd.get("short_description"),description:fd.get("description"),ingredients:lines(fd.get("ingredients")),features:lines(fd.get("features")),usage_steps:lines(fd.get("usage_steps")),
      storage_instructions:fd.get("storage_instructions"),image_paths:imagePaths,seo_title:fd.get("seo_title"),seo_description:fd.get("seo_description")
    };
    const id=fd.get("id")||null; const {error}=await db.rpc("admin_save_deshigram_product",{p_id:id||null,p_payload:payload}); if(error)throw error;
    setStatus(status,"Saved.","ok");setTimeout(()=>$("#productDialog").close(),350);await load();
  }catch(err){setStatus(status,err.message,"error")}
});
$("#deleteProductBtn").addEventListener("click",async()=>{
  const id=$("#productForm").id.value;if(!id||!confirm("Delete this product permanently?"))return;
  const {error}=await db.rpc("admin_delete_deshigram_product",{p_id:id});if(error)return setStatus($("#productFormStatus"),error.message,"error");
  $("#productDialog").close();await load();
});
async function updateMerch(kind,id,payload){
  setStatus($("#appStatus"),"Updating…");const {error}=await db.rpc("admin_update_listing_merchandising",{p_kind:kind,p_id:id,p_payload:payload});
  if(error)return setStatus($("#appStatus"),error.message,"error");await load();
}
async function reviewSeller(id,status,note,payout=null){
  setStatus($("#appStatus"),"Updating seller listing…");
  const {error}=await db.rpc("admin_review_seller_product",{p_product_id:id,p_status:status,p_note:note||null,p_seller_payout:payout});
  if(error)return setStatus($("#appStatus"),error.message,"error");await load();
}
$("#sellerForm").addEventListener("submit",async e=>{
  e.preventDefault();const fd=new FormData(e.currentTarget), id=fd.get("id"), status=$("#sellerFormStatus");
  try{
    setStatus(status,"Saving…");
    await reviewSeller(id,fd.get("status"),fd.get("review_note"),fd.get("seller_payout")===""?null:Number(fd.get("seller_payout")));
    const merch={
      status:fd.get("status"),coming_soon_date:fd.get("coming_soon_date")||null,badge_text:fd.get("badge_text"),
      offer_type:fd.get("offer_type"),offer_value:Number(fd.get("offer_value")||0),offer_label:fd.get("offer_label"),
      offer_starts_at:fd.get("offer_starts_at")||null,offer_ends_at:fd.get("offer_ends_at")||null,
      max_order_quantity:Number(fd.get("max_order_quantity")||10),low_stock_threshold:Number(fd.get("low_stock_threshold")||5),
      is_visible:fd.get("is_visible")==="on",featured:fd.get("featured")==="on",cod_enabled:fd.get("cod_enabled")==="on",online_payment_enabled:fd.get("online_payment_enabled")==="on"
    };
    const {error}=await db.rpc("admin_update_listing_merchandising",{p_kind:"seller",p_id:id,p_payload:merch});if(error)throw error;
    setStatus(status,"Saved.","ok");setTimeout(()=>$("#sellerDialog").close(),350);await load();
  }catch(err){setStatus(status,err.message,"error")}
});
boot();
