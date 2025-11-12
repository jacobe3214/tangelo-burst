const $  = (s, sc=document) => sc.querySelector(s);
const $$ = (s, sc=document) => [...sc.querySelectorAll(s)];
const fmt = n => Number(n).toFixed(2);

// PRELOADER
window.addEventListener('load', () => {
  setTimeout(() => $('#preloader')?.classList.add('hidden'), 300);
});

// YEAR
$('#yr').textContent = new Date().getFullYear();

// PARTICLE BG (subtle)
(function particles(){
  const c = document.getElementById('citrusParticles');
  if(!c) return;
  const ctx = c.getContext('2d');

  function resize(){
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const dots = Array.from({length: 30}).map(()=>({
    x: Math.random()*c.width,
    y: Math.random()*c.height,
    r: 3+Math.random()*4,
    s: .2+.5*Math.random()
  }));

  function tick(){
    ctx.clearRect(0,0,c.width,c.height);
    dots.forEach(d=>{
      d.y -= d.s;
      if(d.y + d.r < 0){
        d.y = c.height + d.r;
        d.x = Math.random()*c.width;
      }
      const grad = ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r);
      grad.addColorStop(0,'rgba(255,170,80,.45)');
      grad.addColorStop(1,'rgba(255,170,80,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

// VIEW / TAB SYSTEM
const views   = $$('.view');
const navTabs = $$('.nav__tab');

function showView(name){
  views.forEach(v => v.classList.toggle('view--active', v.dataset.view === name));
  navTabs.forEach(btn => {
    if(!btn.dataset.view) return;
    btn.classList.toggle('nav__tab--active', btn.dataset.view === name);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navTabs.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const view = btn.dataset.view;
    if(view) showView(view);
  });
});

// Hero buttons reuse data-view too
$$('.ctaRow .btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const v = btn.dataset.view;
    if(v) showView(v);
  });
});

// DROPDOWN
const dropToggle = $('#productsToggle');
const dropMenu   = $('#productsMenu');

if(dropToggle && dropMenu){
  dropToggle.addEventListener('click', ()=>{
    const open = !dropMenu.classList.contains('open');
    dropMenu.classList.toggle('open', open);
    dropToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', e=>{
    if(!dropMenu.contains(e.target) && !dropToggle.contains(e.target)){
      dropMenu.classList.remove('open');
      dropToggle.setAttribute('aria-expanded','false');
    }
  });

  $$('.nav__dropItem').forEach(item=>{
    item.addEventListener('click', ()=>{
      const sku = item.dataset.product;
      showView('products');
      selectProductBySku(sku);
      dropMenu.classList.remove('open');
      dropToggle.setAttribute('aria-expanded','false');
    });
  });
}

// GSAP animations
window.addEventListener('DOMContentLoaded', () => {
  if(!window.gsap) return;

  const bottle = $('.hero__bottle');
  if(bottle){
    gsap.to(bottle,{y:-8,duration:2,repeat:-1,yoyo:true,ease:'sine.inOut'});
  }

  gsap.from('.hero__copy',{opacity:0,y:20,duration:.7,ease:'power2.out'});
  gsap.from('.hero__visual',{opacity:0,y:20,duration:.7,delay:.1,ease:'power2.out'});
});

// CART
const drawer = $('#drawer');
const scrim  = $('#scrim');

$('#cartBtn').addEventListener('click', ()=> drawer.setAttribute('aria-hidden','false'));
$('#closeDrawer').addEventListener('click', ()=> drawer.setAttribute('aria-hidden','true'));
scrim.addEventListener('click', ()=> drawer.setAttribute('aria-hidden','true'));

const cart = {
  items: [],
  add(p){
    const found = this.items.find(i=>i.sku===p.sku);
    if(found) found.qty++;
    else this.items.push({...p, qty:1});
    this.render();
  },
  inc(sku){ const i=this.items.find(x=>x.sku===sku); if(i){ i.qty++; this.render(); } },
  dec(sku){ const i=this.items.find(x=>x.sku===sku); if(i){ i.qty=Math.max(1,i.qty-1); this.render(); } },
  remove(sku){ this.items = this.items.filter(i=>i.sku!==sku); this.render(); },
  total(){ return this.items.reduce((t,i)=>t+i.price*i.qty,0); },
  count(){ return this.items.reduce((t,i)=>t+i.qty,0); },
  render(){
    const cBody = $('#cartItems');
    cBody.innerHTML = '';

    if(this.items.length === 0){
      cBody.innerHTML = '<p>Your cart is empty.</p>';
    } else {
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
              <button data-act="del" data-sku="${i.sku}" style="margin-left:6px;">Remove</button>
            </div>
          </div>
          <div>$${fmt(i.price * i.qty)}</div>
        `;
        cBody.appendChild(row);
      });
    }

    $('#cartTotal').textContent  = fmt(this.total());
    $('#cartCount').textContent  = this.count();

    cBody.querySelectorAll('button').forEach(btn=>{
      const act = btn.dataset.act;
      const sku = btn.dataset.sku;
      btn.addEventListener('click', ()=>{
        if(act === 'inc') this.inc(sku);
        if(act === 'dec') this.dec(sku);
        if(act === 'del') this.remove(sku);
      });
    });

    persistCart();
  }
};

// Persist cart
const CART_KEY = 'tangelo-burst-cart-v1';
try{
  const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  cart.items = Array.isArray(saved) ? saved : [];
}catch{
  cart.items = [];
}
cart.render();

function persistCart(){
  try{ localStorage.setItem(CART_KEY, JSON.stringify(cart.items)); }catch{}
}

// Bind product add buttons
function bindAddButtons(){
  $$('.add').forEach(btn=>{
    btn.onclick = ()=>{
      const card = btn.closest('.product');
      const product = {
        sku: btn.dataset.sku,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        img: card.querySelector('img')?.src || ''
      };
      cart.add(product);
      drawer.setAttribute('aria-hidden','false');
    };
  });
}
bindAddButtons();

// PRODUCT SELECTOR
const sizeChips   = $$('.sizeChip');
const selImg      = $('#carouselImg');
const selName     = $('#carouselName');
const selPrice    = $('#carouselPrice');
const selAddBtn   = $('#carouselAdd');

let currentProduct = {
  sku: '300ml',
  name: 'Tangelo Burst 300ml Glass Bottle',
  price: 3.5,
  img: 'assets/bottle-300.png'
};

function setSelectorFromChip(chip){
  sizeChips.forEach(c=>{
    c.classList.toggle('sizeChip--active', c === chip);
    c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
  });

  const sku   = chip.dataset.sku;
  const name  = chip.dataset.name;
  const price = parseFloat(chip.dataset.price);
  const img   = chip.dataset.img;

  currentProduct = { sku, name, price, img };

  selImg.style.opacity = 0;
  setTimeout(()=>{
    selImg.src = img;
    selImg.style.opacity = 1;
  }, 120);

  selName.textContent  = name;
  selPrice.textContent = price.toFixed(2);
}

sizeChips.forEach(chip=>{
  chip.addEventListener('click', ()=> setSelectorFromChip(chip));
});

selAddBtn.addEventListener('click', ()=>{
  cart.add({...currentProduct});
  drawer.setAttribute('aria-hidden','false');
});

function selectProductBySku(sku){
  const chip = sizeChips.find(c=>c.dataset.sku === sku);
  if(chip) setSelectorFromChip(chip);

  const card = $(`.product[data-product-card="${sku}"]`);
  if(card){
    card.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
  }
}

// HORIZONTAL RAIL
const rail     = $('#productRail');
const railLeft = $('#railLeft');
const railRight= $('#railRight');
if(rail && railLeft && railRight){
  const amt = () => rail.clientWidth * 0.9;
  railRight.addEventListener('click', ()=> rail.scrollBy({left: amt(), behavior:'smooth'}));
  railLeft.addEventListener('click', ()=> rail.scrollBy({left:-amt(), behavior:'smooth'}));
}

// CHECKOUT
const checkout        = $('#checkout');
const checkoutScrim   = $('#checkoutScrim');
const closeCheckout   = $('#closeCheckout');
const checkoutForm    = $('#checkoutForm');
const summaryItems    = $('#summaryItems');
const sumSubtotal     = $('#sumSubtotal');
const sumShipping     = $('#sumShipping');
const sumPromo        = $('#sumPromo');
const sumTotal        = $('#sumTotal');
const promoLine       = $('#promoLine');
const applyPromoBtn   = $('#applyPromo');
const placeOrderBtn   = $('#placeOrder');

let promoValue = 0;
let shipping   = 5;

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
      <div>$${fmt(i.price * i.qty)}</div>
    `;
    summaryItems.appendChild(row);
  });

  const shipChoice = (new FormData(checkoutForm).get('ship')) || 'standard';
  shipping = shipChoice === 'pickup' ? 0 : 5;

  const subtotal = cart.total();
  sumSubtotal.textContent = fmt(subtotal);
  sumShipping.textContent = fmt(shipping);

  if(promoValue > 0){
    promoLine.style.display = '';
    sumPromo.textContent = fmt(promoValue);
  } else {
    promoLine.style.display = 'none';
  }

  sumTotal.textContent = fmt(Math.max(0, subtotal + shipping - promoValue));

  checkout.setAttribute('aria-hidden','false');
}

function closeCheckoutModal(){
  checkout.setAttribute('aria-hidden','true');
}

$('#checkoutBtn').addEventListener('click', ()=>{
  if(cart.items.length === 0){
    alert('Your cart is empty.');
    return;
  }
  drawer.setAttribute('aria-hidden','true');
  openCheckout();
});

closeCheckout.addEventListener('click', closeCheckoutModal);
checkoutScrim.addEventListener('click', closeCheckoutModal);

checkoutForm.addEventListener('change', e=>{
  if(e.target.name === 'ship') openCheckout();
});

// Promo codes: BURST10 / PACK5
applyPromoBtn.addEventListener('click', ()=>{
  const code = (checkoutForm.promo.value || '').trim().toUpperCase();
  promoValue = 0;
  if(code === 'BURST10') promoValue = 10;
  else if(code === 'PACK5') promoValue = 5;
  else if(code) alert('Promo code not valid for this demo.');
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
  const required = ['firstName','lastName','email','addr1','city','region','postcode','cardName','cardNum','exp','cvc'];
  for(const k of required){
    const val = checkoutForm[k]?.value?.trim();
    if(!val){ alert('Please fill in all required fields.'); return; }
  }
  const total = Math.max(0, cart.total()+shipping-promoValue);
  alert(
    `✅ Order placed (demo)\n\n` +
    `Items: ${cart.count()}\n` +
    `Total: $${fmt(total)}\n\n` +
    `No real payment is taken.`
  );
  cart.items = [];
  cart.render();
  closeCheckoutModal();
});
