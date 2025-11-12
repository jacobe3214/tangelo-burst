const $ = (s, sc=document) => sc.querySelector(s);
const $$ = (s, sc=document) => [...sc.querySelectorAll(s)];
const fmt = n => Number(n).toFixed(2);

// Preloader
window.addEventListener('load', () => {
  setTimeout(()=> $('#preloader')?.classList.add('hidden'), 350);
});

// Year
$('#yr').textContent = new Date().getFullYear();

// Citrus particles background
(function particles(){
  const c = document.getElementById('citrusParticles');
  if(!c) return;
  const ctx = c.getContext('2d');
  function resize(){ c.width = c.offsetWidth; c.height = c.offsetHeight; }
  resize(); window.addEventListener('resize', resize);

  const drops = Array.from({length: 40}).map(()=> ({
    x: Math.random()*c.width,
    y: Math.random()*c.height,
    r: 3 + Math.random()*5,
    s: 0.3 + Math.random()*0.7
  }));

  function tick(){
    ctx.clearRect(0,0,c.width,c.height);
    drops.forEach(d=>{
      d.y -= d.s;
      if(d.y + d.r < 0){ d.y = c.height + d.r; d.x = Math.random()*c.width; }
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      g.addColorStop(0, 'rgba(255,170,60,.55)');
      g.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

// Smooth anchor scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    if(id && id.length>1 && document.querySelector(id)){
      e.preventDefault();
      const target = document.querySelector(id);
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top:y, behavior:'smooth' });
    }
  });
});

// GSAP niceties
window.addEventListener('DOMContentLoaded', () => {
  if(!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  const bottle = $('.bottle');
  if(bottle){
    gsap.to(bottle, { y: -8, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }

  $$('.section, .product, .card, .about__card, .story__wrap').forEach(el=>{
    gsap.from(el, {
      opacity: 0, y: 30, duration: .8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  if($('.splash')){
    gsap.from('.splash', { opacity: 0, scale: .94, x: -20, duration: .9, ease: 'power2.out' });
  }
});

// Cart drawer
const drawer = $('#drawer');
const scrim = $('#scrim');
$('#cartBtn').addEventListener('click', ()=> drawer.setAttribute('aria-hidden','false'));
$('#closeDrawer').addEventListener('click', ()=> drawer.setAttribute('aria-hidden','true'));
scrim.addEventListener('click', ()=> drawer.setAttribute('aria-hidden','true'));

const cart = {
  items: [],
  add(p){
    const f = this.items.find(i=>i.sku===p.sku);
    if(f) f.qty++; else this.items.push({...p, qty:1});
    this.render();
  },
  remove(sku){ this.items = this.items.filter(i=>i.sku!==sku); this.render(); },
  inc(sku){ const it=this.items.find(i=>i.sku===sku); if(it){ it.qty++; this.render(); } },
  dec(sku){ const it=this.items.find(i=>i.sku===sku); if(it){ it.qty=Math.max(1,it.qty-1); this.render(); } },
  total(){ return this.items.reduce((t,i)=> t+i.price*i.qty, 0); },
  count(){ return this.items.reduce((t,i)=> t+i.qty, 0); },
  render(){
    const el = $('#cartItems');
    el.innerHTML = '';
    if(this.items.length===0){ el.innerHTML = '<p>Your cart is empty.</p>'; }
    else{
      this.items.forEach(i=>{
        const row = document.createElement('div');
        row.className = 'cartRow';
        row.innerHTML = `
          <img src="${i.img}" alt="${i.name}">
          <div>
            <h4>${i.name}</h4>
            <div class="qty">
              <button data-act="dec" data-sku="${i.sku}">−</button>
              <span>${i.qty}</span>
              <button data-act="inc" data-sku="${i.sku}">+</button>
              <button data-act="del" data-sku="${i.sku}" style="margin-left:8px;">Remove</button>
            </div>
          </div>
          <div>$${fmt(i.price*i.qty)}</div>
        `;
        el.appendChild(row);
      });
    }
    $('#cartTotal').textContent = fmt(this.total());
    $('#cartCount').textContent = this.count();
    el.querySelectorAll('button').forEach(b=>{
      const a=b.dataset.act, s=b.dataset.sku;
      b.addEventListener('click', ()=>{
        if(a==='inc') this.inc(s);
        if(a==='dec') this.dec(s);
        if(a==='del') this.remove(s);
      });
    });
    persist();
  }
};

// Persist cart
const CART_KEY = 'tangelo-burst-cart-v1';
try{
  const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  if(saved.length){ cart.items = saved; cart.render(); } else { cart.render(); }
}catch{ cart.render(); }
function persist(){ try{ localStorage.setItem(CART_KEY, JSON.stringify(cart.items)); }catch{} }

// Bind add buttons
$$('.add').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const card = btn.closest('.product');
    const p = {
      sku: btn.dataset.sku,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      img: card.querySelector('img')?.getAttribute('src') || ''
    };
    cart.add(p);
    drawer.setAttribute('aria-hidden','false');
  });
});

// Main selector carousel
const thumbs = $$('.thumb');
const img = $('#carouselImg');
const nameEl = $('#carouselName');
const priceEl = $('#carouselPrice');
const addMain = $('#carouselAdd');

let current = { sku: '300ml', name: 'Tangelo Burst 300ml Glass Bottle', price: 3.5, img: 'assets/bottle-300.png' };

function selectThumb(btn){
  thumbs.forEach(t=>{
    t.classList.remove('active');
    t.setAttribute('aria-selected','false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected','true');

  const sku = btn.dataset.sku;
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);
  const src = btn.dataset.img;
  current = { sku, name, price, img: src };

  img.style.opacity = 0;
  setTimeout(()=>{ img.src = src; img.style.opacity = 1; }, 150);
  nameEl.textContent = name;
  priceEl.textContent = price.toFixed(2);
}
thumbs.forEach(btn => btn.addEventListener('click', ()=> selectThumb(btn)));
addMain.addEventListener('click', ()=>{
  cart.add({ ...current });
  drawer.setAttribute('aria-hidden','false');
});

// Horizontal rail arrows
const rail = document.getElementById('productRail');
const railLeft = document.getElementById('railLeft');
const railRight = document.getElementById('railRight');
if(rail && railLeft && railRight){
  const scrollAmount = () => rail.clientWidth * 0.9;
  railRight.addEventListener('click', ()=> rail.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));
  railLeft.addEventListener('click', ()=> rail.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
}

// Checkout modal
const checkout = $('#checkout');
const checkoutScrim = $('#checkoutScrim');
const closeCheckout = $('#closeCheckout');
const placeOrderBtn = $('#placeOrder');
const summaryItems = $('#summaryItems');
const sumSubtotal = $('#sumSubtotal');
const sumShipping = $('#sumShipping');
const sumPromo = $('#sumPromo');
const promoLine = $('#promoLine');
const sumTotal = $('#sumTotal');
const applyPromoBtn = $('#applyPromo');
const checkoutForm = $('#checkoutForm');

let promoValue = 0;
let shipCost = 5.0;

function openCheckout(){
  summaryItems.innerHTML = '';
  cart.items.forEach(i=>{
    const row = document.createElement('div');
    row.className = 'summaryItem';
    row.innerHTML = `
      <img src="${i.img}" alt="${i.name}">
      <div>
        <h5>${i.name}</h5>
        <div class="muted">${i.qty} × $${fmt(i.price)}</div>
      </div>
      <div>$${fmt(i.qty * i.price)}</div>
    `;
    summaryItems.appendChild(row);
  });

  const shipSel = (new FormData(checkoutForm).get('ship')) || 'standard';
  shipCost = shipSel === 'pickup' ? 0 : 5;

  const subtotal = cart.total();
  sumSubtotal.textContent = fmt(subtotal);
  sumShipping.textContent = fmt(shipCost);
  if(promoValue>0){
    promoLine.style.display = '';
    sumPromo.textContent = fmt(promoValue);
  } else {
    promoLine.style.display = 'none';
  }
  sumTotal.textContent = fmt(Math.max(0, subtotal + shipCost - promoValue));

  checkout.setAttribute('aria-hidden','false');
}
function closeCheckoutModal(){ checkout.setAttribute('aria-hidden','true'); }
closeCheckout.addEventListener('click', closeCheckoutModal);
checkoutScrim.addEventListener('click', closeCheckoutModal);

$('#checkoutBtn').addEventListener('click', ()=>{
  if(cart.items.length===0){ alert('Your cart is empty.'); return; }
  drawer.setAttribute('aria-hidden','true');
  openCheckout();
});

checkoutForm.addEventListener('change', (e)=>{
  if(e.target.name==='ship'){ openCheckout(); }
});

// Promo codes: BURST10 / PACK5
applyPromoBtn.addEventListener('click', ()=>{
  const code = (checkoutForm.promo.value || '').trim().toUpperCase();
  promoValue = 0;
  if(code === 'BURST10') promoValue = 10;
  else if(code === 'PACK5') promoValue = 5;
  else if(code) { alert('Promo code not valid'); }
  openCheckout();
});

// Card formatting
checkoutForm.cardNum.addEventListener('input', e=>{
  let v = e.target.value.replace(/\D/g,'').slice(0,16);
  e.target.value = v.replace(/(\d{4})(?=\d)/g,'$1 ');
});
checkoutForm.exp.addEventListener('input', e=>{
  let v = e.target.value.replace(/\D/g,'').slice(0,4);
  if(v.length>=3) v = v.slice(0,2)+'/'+v.slice(2);
  e.target.value = v;
});

// Place order (demo)
placeOrderBtn.addEventListener('click', ()=>{
  const req = ['firstName','lastName','email','addr1','city','region','postcode','cardName','cardNum','exp','cvc'];
  for(const k of req){
    const v = checkoutForm[k]?.value?.trim();
    if(!v){ alert('Please complete all required fields.'); return; }
  }
  const lines = cart.items.map(i=>`${i.qty} × ${i.name} — $${fmt(i.qty*i.price)}`).join('\n');
  const total = Math.max(0, cart.total()+shipCost-promoValue);
  alert(`✅ Order placed!\n\n${lines}\n\nSubtotal: $${fmt(cart.total())}\nShipping: $${fmt(shipCost)}\nPromo: -$${fmt(promoValue)}\nTotal: $${fmt(total)}\n\n(Checkout is a demo — no payment processed.)`);
  cart.items = [];
  cart.render();
  closeCheckoutModal();
});

