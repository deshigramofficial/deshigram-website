(()=>{
  const URL='https://kqkpbqpfnupjpthtpvdn.supabase.co';
  const KEY='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
  let products=[];
  const fallback=()=>Array.isArray(window.PRODUCTS)?window.PRODUCTS.map(p=>({...p,slug:p.id,mrp:Number(p.oldPrice||p.mrp||0),selling_price:Number(p.price||p.selling_price||0),net_quantity:p.weight||p.net_quantity||'',packed_weight_grams:Number(p.packed_weight_grams||0),image_paths:p.images||[]})):[];
  const imageUrl=path=>{if(!path)return 'images/favicon.png';if(/^https?:\/\//i.test(path)||path.startsWith('images/'))return path;return `${URL}/storage/v1/object/public/deshigram-products/${path}`};
  const normalize=p=>({id:p.slug||p.id,db_id:p.id,slug:p.slug||p.id,name:p.name,category:p.category||'DeshiGram',description:p.description||'',shortDescription:p.short_description||p.shortDescription||'',weight:p.net_quantity||p.weight||'',price:Number(p.selling_price??p.price??0),oldPrice:Number(p.mrp??p.oldPrice??0),mrp:Number(p.mrp??p.oldPrice??0),packed_weight_grams:Number(p.packed_weight_grams||0),stock_quantity:Number(p.stock_quantity??100),images:(p.image_paths||p.images||[]).map(imageUrl),ingredients:p.ingredients||[],features:p.features||[],usage:p.usage_steps||p.usage||[],storage:p.storage_instructions||p.storage||'',status:p.status||'live'});
  async function load(){
    try{const r=await fetch(`${URL}/rest/v1/deshigram_products?select=*&status=eq.live&order=sort_order.asc,created_at.asc`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});if(!r.ok)throw new Error('catalog');products=(await r.json()).map(normalize)}catch(_){products=fallback().map(normalize)}
    window.PRODUCTS=products;
    products.forEach(p=>window.DESHIGRAM_CART?.registerProduct({id:p.id,name:p.name,price:p.price,mrp:p.oldPrice,weight:p.weight,packed_weight_grams:p.packed_weight_grams,image:p.images[0]||'images/favicon.png'}));
    document.dispatchEvent(new CustomEvent('deshigram:catalog',{detail:products}));
    return products;
  }
  function money(v){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(v||0))}
  function shortName(name){return String(name||'Product').replace(/^Dry Fruits Energy Powder\s*[—-]\s*/i,'')}
  function card(p,home=false){const out=p.stock_quantity<=0;return `<article class="${home?'dg-home-product-card':'dg-shop-card'}"><span class="dg-sale-badge">DESHIGRAM</span><div class="${home?'dg-home-product-image':'dg-shop-image'}"><img src="${p.images[0]||'images/favicon.png'}" alt="${p.name}"></div><div class="${home?'dg-home-product-copy':'dg-shop-body'}"><small>${p.weight}</small><h${home?'3':'2'}>${shortName(p.name)}</h${home?'3':'2'}>${home?'':`<p>${p.shortDescription||p.description}</p>`}<div class="dg-price"><s>${money(p.oldPrice)}</s><strong>${money(p.price)}</strong></div><div class="dg-card-actions"><button class="button button-primary" data-add-to-cart="${p.id}" type="button" ${out?'disabled':''}>${out?'Out of Stock':'Add to Cart'}</button><a class="button button-secondary" href="product/index.html?id=${encodeURIComponent(p.id)}">${home?'Details':'View Details'}</a></div></div></article>`}
  async function render(){const list=products.length?products:await load();document.querySelectorAll('[data-dg-catalog]').forEach(el=>{const limit=Number(el.dataset.limit||0);const rows=limit?list.slice(0,limit):list;el.innerHTML=rows.length?rows.map(p=>card(p,el.dataset.view==='home')).join(''):'<div class="account-empty"><h3>No products live yet</h3><p>Please check again soon.</p></div>'})}
  window.DESHIGRAM_CATALOG={load,render,get products(){return products},imageUrl,money};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load().then(render));else load().then(render);
})();