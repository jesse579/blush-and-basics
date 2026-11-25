import { supabase } from "./admin/supabase-config.js";

/* ===== EDIT THIS SECTION ===== */

const CONFIG = {
  brand: "CozyMax Initmates",
  announcement: "Welcome to CozyMax Intimates — Quality Comfort, Everyday Confidence.",
  whatsapp: "254705299563", // Country code, no leading 0, no spaces
  phone: "0705299563", email: "ngahujesse@gmail.com", location: "Ongata Rongai, Kenya",
  social: { Instagram: "https://www.instagram.com/cozymaxintimates", TikTok: "", Facebook: "" } // paste full URLs; empty ones are hidden
};
const CATS = [
  { id: "bras", name: "Women's Bras", cap: "Support with all-day comfort", g: "women", img:"assets/brasC.jpeg" },
  { id: "panties", name: "Panties & Briefs", cap: "Soft, breathable basics", g: "women", img:"assets/panties.avif" },
  { id: "sets", name: "Lingerie Sets", cap: "Matching sets for special days", g: "women", img:"assets/LS.webp" },
  { id: "boxers", name: "Men's Boxers", cap: "Relaxed, easy fit", g: "men" , img:"assets/boxers.jpeg" },
  { id: "vests", name: "Vests & Undershirts", cap: "Clean layers for every day", g: "men", img: "assets/vestsB.jpg"},
  { id: "socks", name: "Socks", cap: "Packs for work, sport and rest", g: "socks", img:"assets/socksA.jpeg" },
  { id: "mbriefs", name: "Men's Briefs", cap: "Classic cut, dependable fit", g: "men", img:"assets/bbrief.jpeg" },
  { id: "essentials", name: "Everyday Essentials", cap: "Simple pieces you reach for daily", g: "all" }
];
const W = ["32B","34B","36B","38B"], L = ["S","M","L","XL"], S = ["One size"];
// DEMO DATA: change names, prices (KSh), sizes, colors, tags. "old" = original price for sale items.
let PRODUCTS = [];
const FAQ = [
  ["How do I place an order?","Add items to your bag and tap Order via WhatsApp. The seller replies to confirm. (Owner: confirm this process.)"],
  ["How do I choose my size?","Pick a size on each product. Message us if you need help. (Owner: add a size guide.)"],
  ["Can I order directly through WhatsApp?","Yes. Use Buy on WhatsApp on any product, or send your bag."],
  ["Which payment methods do you accept?","Owner to confirm, for example M-Pesa or cash on delivery."],
  ["Do you offer delivery?","Owner to confirm areas and charges. We ask for delivery charges in every order message."],
  ["Can I exchange an item?","Owner to confirm the exchange policy."],
  ["How do I confirm product availability?","Every WhatsApp order asks the seller to confirm availability first."]
];
const TRUST = [["Comfort First","Everyday essentials designed for comfort."],["Quality Materials","Products selected for quality and durability."],["Affordable Prices","Stylish options for different budgets."],["Personal Service","Friendly assistance with orders through WhatsApp."]];
const REVIEWS = [["Sample customer A.","Sample review text: replace with real feedback.",5],["Sample customer B.","Sample review text: replace with real feedback.",5],["Sample customer C.","Sample review text: replace with real feedback.",4]];
/* ===== END EDIT SECTION ===== */

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const money = n => "KSh " + n.toLocaleString("en-KE");
const HEX = { Black:"#2b2a2a", Nude:"#d9b5a0", White:"#ffffff", Burgundy:"#6b1d3a", Grey:"#9a9a9a", Navy:"#223a5e", Blush:"#f0c4c4", Mixed:"#b08d57" };
const SHAPE = { bras:"M60 110q40 10 70 60-20 40-60 20-30-20-10-80zM240 110q-40 10-70 60 20 40 60 20 30-20 10-80z", panties:"M60 110h180q-10 80-90 130-80-50-90-130z", boxers:"M70 90h160l10 130h-80l-10-60-10 60H60z", vests:"M100 70q10 30 50 30t50-30l30 20-15 40v100H85V130L70 90z", socks:"M120 60h60v100l50 40q10 30-20 40-40 0-60-30-30-20-30-50z" };
SHAPE.sets = SHAPE.bras; SHAPE.mbriefs = SHAPE.panties; SHAPE.essentials = SHAPE.vests;
// Illustrated placeholder art (inline SVG). Replace with real photos via the "img" field on a product.
function art(cat, color = "Burgundy", bg = "#f6e1df") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="${bg}"/><circle cx="150" cy="150" r="118" fill="#fff" opacity=".55"/><path d="${SHAPE[cat]}" fill="${HEX[color] || "#6b1d3a"}" stroke="#2b2a2a" stroke-opacity=".25" stroke-width="3"/></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
const imgOf = (p, c) => p.img || art(p.cat, c || p.colors[0]);

/* ===== PRODUCT IMAGE GALLERY ===== */

let galleryProduct = null;
let galleryImages = [];
let galleryIndex = 0;
let touchStartX = 0;

function getProductImages(p) {
    const images = [
        p.img,
        ...(Array.isArray(p.images) ? p.images : [])
    ].filter(Boolean);

    return [...new Set(images)];
}

function createProductGallery() {
    if (document.querySelector("#productGallery")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div id="productGallery" class="product-gallery"
             aria-hidden="true">

            <button class="gallery-close" aria-label="Close gallery">
                &times;
            </button>

            <button class="gallery-prev" aria-label="Previous image">
                &#10094;
            </button>

            <div class="gallery-content">
                <img class="gallery-main" src="" alt="Product image">

                <div class="gallery-counter"></div>

                <div class="gallery-thumbnails"></div>
            </div>

            <button class="gallery-next" aria-label="Next image">
                &#10095;
            </button>
        </div>
    `);

    const gallery = document.querySelector("#productGallery");

    gallery.querySelector(".gallery-close").onclick = closeGallery;
    gallery.querySelector(".gallery-prev").onclick = () => changeGallery(-1);
    gallery.querySelector(".gallery-next").onclick = () => changeGallery(1);

    gallery.addEventListener("click", e => {
        if (e.target === gallery) closeGallery();
    });

    gallery.addEventListener("touchstart", e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    gallery.addEventListener("touchend", e => {
        const difference = e.changedTouches[0].screenX - touchStartX;

        if (Math.abs(difference) > 50) {
            changeGallery(difference < 0 ? 1 : -1);
        }
    }, { passive: true });
}

function openGallery(p) {
    galleryProduct = p;
    galleryImages = getProductImages(p);
    galleryIndex = 0;

    if (!galleryImages.length) return;

    createProductGallery();

    const gallery = document.querySelector("#productGallery");
    gallery.classList.add("open");
    gallery.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    updateGallery();
}

function updateGallery() {
    const gallery = document.querySelector("#productGallery");
    const main = gallery.querySelector(".gallery-main");
    const thumbnails = gallery.querySelector(".gallery-thumbnails");

    main.src = galleryImages[galleryIndex];
    main.alt = galleryProduct.name + " - Image " + (galleryIndex + 1);

    gallery.querySelector(".gallery-counter").textContent =
        `${galleryIndex + 1} / ${galleryImages.length}`;

    thumbnails.innerHTML = galleryImages.map((url, index) => `
        <button class="gallery-thumb ${index === galleryIndex ? "active" : ""}"
                aria-label="View image ${index + 1}"
                data-index="${index}">
            <img src="${url}" alt="">
        </button>
    `).join("");

    thumbnails.querySelectorAll("button").forEach(button => {
        button.onclick = () => {
            galleryIndex = Number(button.dataset.index);
            updateGallery();
        };
    });

    gallery.querySelector(".gallery-prev").hidden =
        galleryImages.length < 2;

    gallery.querySelector(".gallery-next").hidden =
        galleryImages.length < 2;
}

function changeGallery(direction) {
    if (galleryImages.length < 2) return;

    galleryIndex =
        (galleryIndex + direction + galleryImages.length)
        % galleryImages.length;

    updateGallery();
}

function closeGallery() {
    const gallery = document.querySelector("#productGallery");

    if (!gallery) return;

    gallery.classList.remove("open");
    gallery.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

document.addEventListener("keydown", e => {
    const gallery = document.querySelector("#productGallery.open");

    if (!gallery) return;

    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowRight") changeGallery(1);
    if (e.key === "ArrowLeft") changeGallery(-1);
});

const fallback = e => { e.onerror = null; e.src = art(e.dataset.cat || "panties"); };
const state = { q:"", cat:"", size:"", sort:"featured", group:"" };
let cart = []; try { cart = JSON.parse(localStorage.getItem("bb_cart")) || []; } catch (e) {}
const save = () => { try { localStorage.setItem("bb_cart", JSON.stringify(cart)); } catch (e) {} };
const waLink = t => `https://wa.me/${CONFIG.whatsapp}` + (t ? `?text=${encodeURIComponent(t)}` : "");


function card(p) {
  const c = document.createElement("article");
  c.className = "card";

  const inStock = Number(p.stock) > 0;
  const sizes = p.sizes || [];
  const colors = p.colors || [];
  const categoryName =
    CATS.find(x => x.id === p.cat)?.name || "Uncategorized";

  c.innerHTML = `
    <div class="im">
      <img src="${imgOf(p)}"
           alt="${p.name} in ${colors[0] || "available colour"}"
           width="300"
           height="300"
           loading="lazy"
           data-cat="${p.cat}">
    </div>

    ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}

    <button class="icon-btn heart"
            aria-label="Save ${p.name} to wishlist"
            aria-pressed="false">
      <svg viewBox="0 0 24 24">
        <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>
      </svg>
    </button>

    <div class="in">
      <span class="cl">${categoryName}</span>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>

      <div class="price">
        ${money(p.price)}
        ${p.old ? `<s>${money(p.old)}</s>` : ""}
      </div>

      <p class="stock-status">
        ${inStock ? `In Stock (${p.stock})` : "Out of Stock"}
      </p>

      <div class="opts">
        <select aria-label="Size for ${p.name}">
          ${sizes.map(s => `<option>${s}</option>`).join("")}
        </select>

        <select aria-label="Color for ${p.name}">
          ${colors.map(s => `<option>${s}</option>`).join("")}
        </select>
      </div>

      <div class="acts">
        <button class="btn add" ${inStock ? "" : "disabled"}>
          ${inStock ? "Add to Cart" : "Out of Stock"}
        </button>

        <button class="btn ghost buy">
          Ask About Availability
        </button>
      </div>
    </div>
  `;

  const img = c.querySelector(".im img");

  img.onerror = () => fallback(img);

  const imageContainer = c.querySelector(".im");

  imageContainer.style.cursor = "zoom-in";
  imageContainer.setAttribute("role", "button");
  imageContainer.setAttribute("tabindex", "0");
  imageContainer.setAttribute(
      "aria-label",
      `View images of ${p.name}`
  );

  imageContainer.onclick = () => openGallery(p);

  imageContainer.onkeydown = e => {
      if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openGallery(p);
      }
  };

  const [sz, co] = c.querySelectorAll("select");

  co.onchange = () => {
    img.src = imgOf(p, co.value);
  };

  if (inStock) {
    c.querySelector(".add").onclick = () =>
      addToCart(p, sz.value, co.value);
  }

  c.querySelector(".buy").onclick = () =>
    window.open(
      waLink(
        `Hello! I am interested in ${p.name}. Price: ${money(p.price)}. Size: ${sz.value}. Color: ${co.value}. Please confirm availability.`
      ),
      "_blank",
      "noopener"
    );

  const h = c.querySelector(".heart");

  h.onclick = () => {
    const on = h.classList.toggle("on");
    h.setAttribute("aria-pressed", on);
  };

  return c;
}

function filtered() {
  let list = PRODUCTS.filter(p => (!state.q || p.name.toLowerCase().includes(state.q.toLowerCase())) && (!state.cat || p.cat === state.cat) && (!state.size || p.sizes.includes(state.size)) &&
    (!state.group || state.group === "all" || (state.group === "offers" ? p.old : CATS.find(c => c.id === p.cat).g === state.group)));
  const s = state.sort;
  if (s === "lo") list.sort((a, b) => a.price - b.price); else if (s === "hi") list.sort((a, b) => b.price - a.price); else if (s === "new") list.sort((a, b) =>     new Date(b.created_at).getTime() -
    new Date(a.created_at).getTime());
  return list;
}
function render() {
  const list = filtered(), g = $("#grid"); g.replaceChildren(...list.map(card)); $("#empty").hidden = list.length > 0;
}
function setFilter(patch, scroll) { Object.assign(state, patch); $("#q").value = state.q; $("#cat").value = state.cat; $("#size").value = state.size; $("#sort").value = state.sort; render(); if (scroll) $("#shop").scrollIntoView(); }

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800); }
function addToCart(p, size, color) {
  const key = `${p.id}|${size}|${color}`, it = cart.find(i => i.key === key);
  it ? it.qty = Math.min(20, it.qty + 1) : cart.push({ key, id: p.id, size, color, qty: 1 });
  save(); drawCart(); toast(`${p.name} added to your bag`);
  const c = $("#count"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
}
function drawCart() {
  const body = $("#cartItems"); let total = 0, n = 0;
  body.replaceChildren(...cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id), sub = p.price * i.qty; total += sub; n += i.qty;
    const d = document.createElement("div"); d.className = "line";
    d.innerHTML = `<img src="${imgOf(p, i.color)}" alt="" width="64" height="64"><div><b>${p.name}</b><div class="cl">${i.size} / ${i.color} · ${money(p.price)} each</div><div class="q"><button aria-label="Decrease quantity">−</button><span>${i.qty}</span><button aria-label="Increase quantity">+</button><strong>${money(sub)}</strong><button class="rm">Remove</button></div></div>`;
    const [m, , pl, , rm] = d.querySelectorAll(".q > *");
    m.onclick = () => change(i.key, i.qty - 1); pl.onclick = () => change(i.key, i.qty + 1); rm.onclick = () => change(i.key, 0);
    return d;
  }));
  if (!cart.length) body.innerHTML = "<p class='empty'>Your bag is empty.</p>";
  $("#total").textContent = money(total); $("#count").textContent = n; $("#orderWa").disabled = !cart.length;
}
function change(key, q) { const i = cart.findIndex(x => x.key === key); if (q < 1) cart.splice(i, 1); else cart[i].qty = Math.min(20, q); save(); drawCart(); }
function openCart(o) { $("#drawer").classList.toggle("open", o); $("#drawer").setAttribute("aria-hidden", !o); $("#scrim").hidden = !o; if (o) $("#closeCart").focus(); else $("#cartBtn").focus(); }
$("#orderWa").onclick = () => {
  let total = 0;
  const lines = cart.map((i, n) => { const p = PRODUCTS.find(x => x.id === i.id); total += p.price * i.qty; return `${n + 1}. ${p.name} | Size: ${i.size} | Color: ${i.color} | Qty: ${i.qty} x ${money(p.price)} = ${money(p.price * i.qty)}`; });
  window.open(waLink(`Hello ${CONFIG.brand}! I would like to order:\n\n${lines.join("\n")}\n\nEstimated total: ${money(total)}\n\nPlease confirm availability and delivery charges.`), "_blank", "noopener");
};
$("#cartBtn").onclick = () => openCart(true); $("#closeCart").onclick = $("#continue").onclick = $("#scrim").onclick = () => openCart(false);
$("#clearCart").onclick = () => { cart = []; save(); drawCart(); };
document.addEventListener("keydown", e => { if (e.key === "Escape") { openCart(false); $("#nav").classList.remove("open"); } });

// Init page content
$$("[data-brand]").forEach(e => e.textContent = CONFIG.brand); $("#announce").textContent = CONFIG.announcement;
$$("[data-wa]").forEach(a => a.href = waLink("Hello! I need help choosing.")); $("#yr").textContent = new Date().getFullYear();
$("#fPhone").textContent = CONFIG.phone; $("#fMail").textContent = CONFIG.email; $("#fLoc").textContent = CONFIG.location;
$("#social").innerHTML = Object.entries(CONFIG.social).filter(([, u]) => u).map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a> `).join("");

// HOMEPAGE HERO IMAGE SLIDER

const heroImages = [
  "assets/img/1.jpeg",
  "assets/img/2.jpeg",
  "assets/img/3.jpeg",
  "assets/img/4.jpeg",
  "assets/img/5.jpeg",
  "assets/img/6.jpeg",
  "assets/img/7.jpeg",
  "assets/img/8.jpeg"
];


// BLUSH & BASICS - SMOOTH HERO IMAGE SLIDER


const hero = $("#heroImg");
const slide1 = $("#heroSlide1");
const slide2 = $("#heroSlide2");
const dotsContainer = $("#heroDots");

let currentHero = 0;
let activeSlide = 1;
let heroTimer;

// Display an image and fade between the two layers
function showHero(index) {
  currentHero = (index + heroImages.length) % heroImages.length;

  const nextSlide = activeSlide === 1 ? slide2 : slide1;
  const currentSlide = activeSlide === 1 ? slide1 : slide2;

  nextSlide.style.backgroundImage =
    `url("${heroImages[currentHero]}")`;

  nextSlide.classList.add("active");
  currentSlide.classList.remove("active");

  activeSlide = activeSlide === 1 ? 2 : 1;

  [...dotsContainer.children].forEach((dot, i) => {
    dot.classList.toggle("active", i === currentHero);
  });
}

// Create navigation dots
heroImages.forEach((image, index) => {
  const dot = document.createElement("button");

  dot.className = "hero-dot";
  dot.setAttribute("aria-label", `Show image ${index + 1}`);

  dot.addEventListener("click", () => {
    showHero(index);
    restartHeroTimer();
  });

  dotsContainer.appendChild(dot);
});

// Navigation
function nextHero() {
  showHero(currentHero + 1);
}

function previousHero() {
  showHero(currentHero - 1);
}

// Automatic rotation every five seconds
function restartHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(nextHero, 5000);
}

// Pause slideshow when visitor hovers over banner
hero.addEventListener("mouseenter", () => {
  clearInterval(heroTimer);
});

// Resume slideshow when visitor moves away
hero.addEventListener("mouseleave", () => {
  restartHeroTimer();
});


// Arrow buttons
$("#heroNext").addEventListener("click", () => {
  nextHero();
  restartHeroTimer();
});

$("#heroPrev").addEventListener("click", () => {
  previousHero();
  restartHeroTimer();
});

// Start the slider
showHero(0);
restartHeroTimer();


async function loadCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, gender, image_url, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Could not load categories:", error.message);
  } else if (data && data.length > 0) {
    const oldCategories = new Map(
      CATS.map(category => [category.id, category])
    );

    const databaseCategories = data.map(row => {
      const previous = oldCategories.get(row.id) || {};

      return {
        ...previous,
        id: row.id,
        name: row.name,
        cap: previous.cap || "Explore our collection",
        g: row.id === "socks"
          ? "socks"
          : (row.gender || previous.g || "all"),
        img: row.image_url || previous.img || ""
      };
    });

    CATS.splice(0, CATS.length, ...databaseCategories);
  }

  // Display categories
  $("#catGrid").innerHTML = "";

  $("#catGrid").append(...CATS.map(c => {
    const b = document.createElement("button");
    b.className = "cat";

    b.innerHTML = `
      <img
        src="${c.img || art(c.id, PRODUCTS.find(p => p.cat === c.id)?.colors[0])}"
        alt="${c.name}"
        width="300"
        height="300"
        loading="lazy"
      >
      <div>
        <b>${c.name}</b>
        <small>${c.cap}</small>
        <span>Shop Now</span>
      </div>
    `;

    b.onclick = () => setFilter({
      cat: c.id,
      group: "",
      q: "",
      size: ""
    }, true);

    return b;
  }));

  // Populate category filter
  $("#cat").innerHTML =
    `<option value="">All categories</option>` +
    CATS.map(c =>
      `<option value="${c.id}">${c.name}</option>`
    ).join("");
}

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      category_id,
      gender,
      description,
      price,
      compare_at_price,
      sizes,
      colors,
      image_url,
      images,
      stock,
      is_active,
      is_best_seller,
      tag,
      created_at
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load products:", error.message);
    toast("Products could not be loaded. Please refresh the page.");
    return;
  }

  PRODUCTS = (data || []).map(row => ({
    id: row.id,
    name: row.name,
    cat: row.category_id,
    gender: row.gender,
    price: Number(row.price),
    old: row.compare_at_price == null
      ? null
      : Number(row.compare_at_price),
    sizes: row.sizes || [],
    colors: row.colors || [],
    tag: row.tag,
    best: row.is_best_seller ? 1 : 0,
    desc: row.description || "",
    img: row.image_url || "",
    images: row.images || [],
    stock: row.stock,
    created_at: row.created_at
  }));
}

await loadCategories();
await loadProducts();



$("#bestGrid").append(...PRODUCTS.filter(p => p.best).map(card));
$("#cat").innerHTML = `<option value="">All categories</option>` + CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
$("#size").innerHTML += [...new Set(PRODUCTS.flatMap(p => p.sizes))].map(s => `<option>${s}</option>`).join("");
$("#trust").innerHTML = TRUST.map(t => `<div><svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .7-4.4 4.2 1.1 6L12 16.5 6.7 19.5l1.1-6L3.4 9.3l6-.7z"/></svg><b>${t[0]}</b>${t[1]}</div>`).join("");
$("#reviews").innerHTML = REVIEWS.map(r => `<blockquote><span aria-label="${r[2]} out of 5 stars">${"★".repeat(r[2])}${"☆".repeat(5 - r[2])}</span><p>${r[1]}</p><cite>${r[0]}</cite></blockquote>`).join("");
$("#faq").innerHTML = FAQ.map(f => `<details><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join("");
$("#q").oninput = e => setFilter({ q: e.target.value }); $("#cat").onchange = e => setFilter({ cat: e.target.value, group: "" });
$("#size").onchange = e => setFilter({ size: e.target.value }); $("#sort").onchange = e => setFilter({ sort: e.target.value });
$("#clear").onclick = () => setFilter({ q:"", cat:"", size:"", sort:"featured", group:"" });
$$("[data-group]").forEach(a => a.addEventListener("click", () => { setFilter({ group: a.dataset.group, cat: "", q: "", size: "" }); $("#nav").classList.remove("open"); }));
$$("#nav a").forEach(a => a.addEventListener("click", () => { $("#nav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded", false); }));
$("#menuBtn").onclick = () => { const o = $("#nav").classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded", o); };
render(); drawCart();
