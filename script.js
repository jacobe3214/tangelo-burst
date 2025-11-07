document.getElementById("yr").textContent = new Date().getFullYear();

const buyBtn = document.getElementById("buyBtn");
buyBtn.addEventListener("click", () => {
  alert("🍊 Tangelo Burst added to cart!");
});
