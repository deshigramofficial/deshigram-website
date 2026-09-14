(()=>{
  const URL='https://kqkpbqpfnupjpthtpvdn.supabase.co';
  const KEY='sb_publishable_AVVPm0Pr0KH-dfZozBKdBw_iGWIxqL0';
  let products=[];
  const fallback=()=>Array.isArray(window.PRODUCTS)?window.PRODUCTS.map(p=>({...p,slug:p.id,mrp:Number(p.oldPrice||p.mrp||0),selling_price:Number(p.price||p.selling_price||0),net_quantity:p.weight||p.net_quantity||'',packed_weight_grams:Number(p.packed_weight_grams||0),image_paths:p.images||[]})):[];
  const imageUrl=path=>{if(!path)return 'images/favicon.png';if(/^https?:\/\//i.test(path)||path.startsWith('images/'))return path;return `${URL}/storage/v1/object/public/deshigram-products/${path}`};
  const offerActive=p=>{
    if(!p||!p.offer_type||p.offer_type==='none'||Number(p.offer_value||0)<=0)return false;
    const now=Date.now(), start=p.offer_starts_at?new Date(p.offer_starts_at).getTime():null, end=p.offer_ends_at?new Date(p.offer_ends_at).getTime():null;
    return (!start||now>=start)&&(!end||now<=end);
  };
  const normalize=p=>{
    const base=Number(p.selling_price??p.price??0), mrp=Number(p.mrp??p.oldPrice??0);
    let effective=base;
    if(offerActive(p)){
      if(p.offer_type==='percent') effective=Math.max(0,base*(1-Number(p.offer_value||0)/100));
      if(p.offer_type==='flat') effective=Math.max(0,base-Number(p.offer_value||0));
    }
    const autoBadge=offerActive(p)?(p.offer_label||`${p.offer_value}${p.offer_type==='percent'?'%':'₹'} OFF`):'';
    return {id:p.slug||p.id,db_id:p.id,slug:p.slug||p.id,name:p.name,category:p.category||'DeshiGram',description:p.description||'',shortDescription:p.short_description||p.shortDescription||'',weight:p.net_quantity||p.weight||'',price:Number(effective.toFixed(2)),basePrice:base,oldPrice:mrp,mrp,packed_weight_grams:Number(p.packed_weight_grams||0),stock_quantity:Number(p.stock_quantity??100),images:(p.image_paths||p.images||[]).map(imageUrl),ingredients:p.ingredients||[],features:p.features||[],usage:p.usage_steps||p.usage||[],storage:p.storage_instructions||p.storage||'',status:p.status||'live',is_visible:p.is_visible!==false,featured:!!p.featured,badge:p.badge_text||autoBadge,coming_soon_date:p.coming_soon_date||'',offer_type:p.offer_type||'none',offer_value:Number(p.offer_value||0),offer_label:p.offer_label||'',max_order_quantity:Number(p.max_order_quantity||10),low_stock_threshold:Number(p.low_stock_threshold||5),cod_enabled:p.cod_enabled!==false,online_payment_enabled:p.online_payment_enabled!==false,seo_title:p.seo_title||'',seo_description:p.seo_description||''};
  };
  async function load(){
    try{const r=await fetch(`${URL}/rest/v1/deshigram_products?select=*&is_visible=eq.true&status=in.(live,coming_soon,out_of_stock)&order=featured.desc,sort_order.asc,created_at.asc`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});if(!r.ok)throw new Error('catalog');products=(await r.json()).map(normalize)}catch(_){products=fallback().map(normalize)}
    window.PRODUCTS=products;
    products.filter(p=>p.status==='live'&&p.stock_quantity>0).forEach(p=>window.DESHIGRAM_CART?.registerProduct({id:p.id,name:p.name,price:p.price,mrp:p.oldPrice,weight:p.weight,packed_weight_grams:p.packed_weight_grams,image:p.images[0]||'images/favicon.png',max_order_quantity:p.max_order_quantity,cod_enabled:p.cod_enabled,online_payment_enabled:p.online_payment_enabled}));
    document.dispatchEvent(new CustomEvent('deshigram:catalog',{detail:products}));
    return products;
  }
  function money(v){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(v||0))}
  function shortName(name){return String(name||'Product').replace(/^Dry Fruits Energy Powder\s*[—-]\s*/i,'')}
  function card(p,home=false){
    const coming=p.status==='coming_soon'; const out=p.status==='out_of_stock'||p.stock_quantity<=0;
    const imgs=[...(p.images||[])].filter((src,i,a)=>src && a.indexOf(src)===i).slice(0,3);
    const pictures=imgs.length?imgs:['images/favicon.png'];
    const desc=(p.shortDescription||p.description||'').replace(/30%/g,'40%');

    const slider=`<div class="dg-product-slider" data-product-slider data-current="0">
      <div class="dg-product-slider-frame">
        ${pictures.map((src,i)=>`<img class="dg-product-slide${i===0?' is-active':''}" src="${src}" alt="${p.name} image ${i+1}" loading="${i===0?'eager':'lazy'}">`).join('')}
        ${pictures.length>1?`<button type="button" class="dg-slider-arrow dg-slider-prev" data-slider-prev aria-label="Previous image">‹</button>
        <button type="button" class="dg-slider-arrow dg-slider-next" data-slider-next aria-label="Next image">›</button>`:''}
      </div>
      ${pictures.length>1?`<div class="dg-slider-dots">${pictures.map((_,i)=>`<button type="button" class="dg-slider-dot${i===0?' is-active':''}" data-slider-dot="${i}" aria-label="View image ${i+1}"></button>`).join('')}</div>`:''}
    </div>`;

    const save=Math.max(0,Number(p.oldPrice||0)-Number(p.price||0));

    return `<article class="${home?'dg-home-product-card':'dg-shop-card'}">
      ${p.badge?`<span class="dg-admin-badge">${p.badge}</span>`:''}
      ${coming?`<span class="dg-coming-badge">COMING SOON</span>`:''}
      ${slider}
      <div class="${home?'dg-home-product-copy':'dg-shop-body'}">
        <small>${p.weight}</small>
        <h${home?'3':'2'}>${shortName(p.name)}</h${home?'3':'2'}>
        ${home?'':`<p>${desc}</p>`}
        ${coming&&p.coming_soon_date?`<p class="dg-launch-date">Expected: ${new Date(p.coming_soon_date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>`:''}
        <div class="dg-price"><s>MRP ${money(p.oldPrice)}</s><strong>${money(p.price)}</strong></div>
        ${p.basePrice!==p.price?`<small class="dg-extra-offer">Offer price • was ${money(p.basePrice)}</small>`:''}
        ${home?'':`<small class="dg-offer-saving">You save ${money(save)}</small>`}
        <div class="dg-card-actions">
          <button class="button button-primary" data-add-to-cart="${p.id}" type="button" ${(out||coming)?'disabled':''}>${coming?'Coming Soon':out?'Out of Stock':'Add to Cart'}</button>
          <a class="button button-secondary" href="product/index.html?id=${encodeURIComponent(p.id)}">${home?'Details':'View Details'}</a>
        </div>
        ${home?'':`<div class="dg-card-details"><strong>Product Details</strong><p>${p.description||desc}</p><strong>How to Use</strong><p>${(p.usage||[]).join(' ')}</p></div>`}
      </div>
    </article>`}
  async function render(){const list=products.length?products:await load();document.querySelectorAll('[data-dg-catalog]').forEach(el=>{const limit=Number(el.dataset.limit||0);const rows=limit?list.slice(0,limit):list;el.innerHTML=rows.length?rows.map(p=>card(p,el.dataset.view==='home')).join(''):'<div class="account-empty"><h3>No products live yet</h3><p>Please check again soon.</p></div>'})}
  window.DESHIGRAM_CATALOG={load,render,get products(){return products},imageUrl,money};

  
  document.addEventListener('click',e=>{
    const slider=e.target.closest('[data-product-slider]');
    if(!slider)return;
    const slides=[...slider.querySelectorAll('.dg-product-slide')];
    const dots=[...slider.querySelectorAll('.dg-slider-dot')];
    if(slides.length<2)return;

    let current=Number(slider.dataset.current||0);
    const dot=e.target.closest('[data-slider-dot]');

    if(e.target.closest('[data-slider-prev]')) current=(current-1+slides.length)%slides.length;
    else if(e.target.closest('[data-slider-next]')) current=(current+1)%slides.length;
    else if(dot) current=Number(dot.dataset.sliderDot);
    else return;

    slider.dataset.current=String(current);
    slides.forEach((el,i)=>el.classList.toggle('is-active',i===current));
    dots.forEach((el,i)=>el.classList.toggle('is-active',i===current));
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load().then(render));else load().then(render);
})();