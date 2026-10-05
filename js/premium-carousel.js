
document.addEventListener("DOMContentLoaded",()=>{
  const root=document.querySelector("[data-premium-carousel]");
  if(!root) return;
  const slides=[...root.querySelectorAll(".premium-slide")];
  const dots=[...root.querySelectorAll(".premium-dots button")];
  let i=0,timer=null;
  const show=n=>{
    i=(n+slides.length)%slides.length;
    slides.forEach((s,x)=>s.classList.toggle("is-active",x===i));
    dots.forEach((d,x)=>d.classList.toggle("is-active",x===i));
  };
  const start=()=>{clearInterval(timer);timer=setInterval(()=>show(i+1),4500)};
  root.querySelector(".next").addEventListener("click",()=>{show(i+1);start()});
  root.querySelector(".prev").addEventListener("click",()=>{show(i-1);start()});
  dots.forEach((d,x)=>d.addEventListener("click",()=>{show(x);start()}));
  root.addEventListener("mouseenter",()=>clearInterval(timer));
  root.addEventListener("mouseleave",start);
  let sx=0;
  root.addEventListener("touchstart",e=>sx=e.touches[0].clientX,{passive:true});
  root.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>45){show(i+(dx<0?1:-1));start()}},{passive:true});
  start();
});
