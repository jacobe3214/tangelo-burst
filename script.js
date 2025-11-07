// Year
document.getElementById("yr").textContent = new Date().getFullYear();

// IntersectionObserver for reveal-on-scroll
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add("is-visible"); }
  });
},{threshold:.18});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));

// Drawer (cart)
const drawer = document.getElementById("drawer");
const scrim = document.getElementById("scrim");
const cartBtn = document.getElementById("cartBtn");
const closeDrawer = document.getElementById("closeDrawer");
cartBtn.addEventListener("click", ()=> drawer.setAttribute("aria-hidden","false"));
closeDrawer.addEventListener("click", ()=> drawer.setAttribute("aria-hidden","true"));
scrim.addEventListener("click", ()=> drawer.setAttribute("aria-hidden","true"));

// Cart state
const cart = {
  items: [], // {sku, name, price, qty, img}
  add(p){ 
    const found = this.items.find(i=>i.sku===p.sku);
    if(found){ found.qty += 1; }
    else { this.items.push({...p, qty:1}); }
    this.render();
  },
  remove(sku){ this.items = this.items.filter(i=>i.sku!==sku); this.render(); },
  inc(sku){ const it=this.items.find(i=>i.sku===sku); if(it){ it.qty++; this.render(); } },
  dec(sku){ const it=this.items.find(i=>i.sku===sku); if(it){ it.qty=Math.max(1,it.qty-1); this.render(); } },
  total(){ return this.items.reduce((t,i)=> t + i.price*i.qty, 0); },
  count(){ return this.items.reduce((t,i)=> t + i.qty, 0); },
  render(){
    const el = document.getElementById("cartItems");
    el.innerHTML = "";
    if(this.items.length===0){
      el.innerHTML = `<p>Your cart is empty.</p>`;
    } else {
      this.items.forEach(i=>{
        const row = document.createElement("div");
        row.className = "cartRow";
        row.innerHTML = `
          <img src="${i.img}" alt="${i.name}">
          <div>
            <h4>${i.name}</h4>
            <div class="qty">
              <button aria-label="Decrease" data-act="dec" data-sku="${i.sku}">−</button>
              <span>${i.qty}</span>
              <button aria-label="Increase" data-act="inc" data-sku="${i.sku}">+</button>
              <button aria-label="Remove" data-act="del" data-sku="${i.sku}" style="margin-left:8px;">Remove</button>
            </div>
          </div>
          <div>$${(i.price*i.qty).toFixed(2)}</div>
        `;
        el.appendChild(row);
      });
    }
    document.getElementById("cartTotal").textContent = this.total().toFixed(2);
    document.getElementById("cartCount").textContent = this.count();
    el.querySelectorAll("button").forEach(btn=>{
      const act = btn.dataset.act, sku = btn.dataset.sku;
      btn.addEventListener("click", ()=>{
        if(act==="inc") this.inc(sku);
        if(act==="dec") this.dec(sku);
        if(act==="del") this.remove(sku);
      });
    });
  }
};

// Bind add buttons
document.querySelectorAll(".add").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const sku = btn.dataset.sku;
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    // find matching image in the product card
    const card = btn.closest(".product");
    const img = card.querySelector("img")?.getAttribute("src") || "";
    cart.add({sku,name,price,img});
    // open drawer on first add
    drawer.setAttribute("aria-hidden","false");
  });
});

// Checkout
document.getElementById("checkoutBtn").addEventListener("click", ()=>{
  if(cart.items.length===0){ alert("Your cart is empty."); return; }
  const lines = cart.items.map(i=>`${i.qty} × ${i.name} — $${(i.price*i.qty).toFixed(2)}`).join("\n");
  alert(`Order summary:\n\n${lines}\n\nTotal: $${cart.total().toFixed(2)}\n\n(Checkout flow not implemented in demo)`);
});

// Small bottle parallax on scroll
const bottle = document.querySelector(".bottle");
window.addEventListener("scroll", ()=>{
  const y = Math.min(20, window.scrollY * 0.05);
  bottle.style.transform = `translateY(${8 - y}px)`;
});
