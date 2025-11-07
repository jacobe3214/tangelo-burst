// ---------- UTILITIES ----------
const $ = (s, sc=document) => sc.querySelector(s);
const $$ = (s, sc=document) => [...sc.querySelectorAll(s)];
const fmt = n => Number(n).toFixed(2);

// ---------- PRELOADER ----------
window.addEventListener('load', () => {
  setTimeout(()=> $('#preloader').classList.add('hidden'), 350);
});

// ---------- YEAR ----------
$('#yr').textContent = new Date().getFullYear();

// ---------- PARTICLE BACKGROUND (citrus bubbles) ----------
(function particles(){
  const c = document.getElementById('citrusParticles');
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

// ---------- GSAP ANIMATIONS ----------
window.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  // Hero bottle subtle float + parallax on mouse
  const bottle = $('.bottle');
  gsap.to(bottle, { y: -8, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  window.addEventListener('mousemove', e => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 10;
    const ny = (e.clientY / window.innerHeight - 0.5) * 10;
    bottle.style.transform = `translate(${nx}px, ${ny}px)`;
  });

  // Section reveals
  $$('.section, .product, .card, .about__card, .story__wrap').forEach(el=>{
    gsap.from(el, {
      opacity: 0, y: 30, duration: .8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Splash behind bottle
  gsap.from('.splash', { opacity: 0, scale: .9, x: -20, duration: .9, ease: 'power2.out' });
});

// ---------- CAROUSEL ----------
const thumbs = $$('.thumb');
const img = $('#carouselImg');
const nameEl = $('#carouselName');
const priceEl = $('#carouselPrice');
const addMain = $('#carouselAdd');

let current = { sku: '300ml', name: 'Tangelo Burst 300ml Glass Bottle', price: 3.5, img: 'assets/bottle-300.png' };

function selectThumb(btn){
  thumbs.forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const sku = btn.dataset.sku;
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);
  const src = btn.dataset.img;
  current = { sku, name, price, img: src };

  // animate swap
  img.style.opacity = 0;
  setTimeout(()=>{ img.src = src; img.style.opacity = 1; }, 150);
  nameEl.textContent = name;
  priceEl.textContent = price.toFixed(2);
}
thumbs.forEach(btn => btn.addEventListener('click', ()=> selectThumb(btn)));
addMain.addEventListener('click', ()=>{
  cart.add({ ...current });
  $('#drawer').setAttribute('aria-hidden', 'false');
});

// ---------- CART ----------
const drawer = $('#drawer');
const scrim = $('#scrim');
const cartBtn = $('#cartBtn');
const closeDrawer = $('#closeDrawer');
cartBtn.addEventListener('click', ()=> drawer.setAttribute('aria-hidden','false'));
closeDrawer.addEventListener('click', ()=> drawer.setAttribute('aria-hidden','true'));
scrim.addEventListener('click', ()=> drawer.setAttribute('aria-hidden','true'));

const cart = {
  items: [], // {sku, name, price, qty, img}
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
    if(this.items.length===0){ el.innerHTML = `<p>Your cart is empty.</p>`; }
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
  }
};

// Bind “Add” buttons in grid
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

// Checkout demo
$('#checkoutBtn').addEventListener('click', ()=>{
  if(cart.items.length===0){ alert('Your cart is empty.'); return; }
  const lines = cart.items.map(i=>`${i.qty} × ${i.name} — $${fmt(i.price*i.qty)}`).join('\n');
  alert(`Order summary:\n\n${lines}\n\nTotal: $${fmt(cart.total())}\n\n(Checkout not implemented in demo)`);
});
