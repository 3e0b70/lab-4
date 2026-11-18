"use strict";

// Данные направлений используются каталогом, картой и прайсом.
const destinations = [
  {
    id: "skye",
    name: "Остров Скай",
    country: "Шотландия",
    description: "Туманное озеро и скалистые вершины, где земля кажется вылепленной из дыма.",
    type: "Горный массив",
    duration: "5 дней",
    group: "4–8 человек",
    price: 54900,
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    coords: [57.2, -6.2]
  },
  {
    id: "madeira",
    name: "Мадейра",
    country: "Португалия",
    description: "Лавовые холмы, вечнозелёные леса и облака, скользящие вдоль скал.",
    type: "Лесные долины",
    duration: "4 дня",
    group: "4–8 человек",
    price: 47900,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    coords: [32.6667, -16.9]
  },
  {
    id: "zhangjiajie",
    name: "Чжанцзяцзе",
    country: "Китай",
    description: "Столбы из песчаника и густая прозрачная мгла над глубокими каньонами.",
    type: "Каменные пики",
    duration: "6 дней",
    group: "4–8 человек",
    price: 62900,
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
    coords: [29.125, 110.478]
  },
  {
    id: "milford-sound",
    name: "Милфорд-Саунд",
    country: "Новая Зеландия",
    description: "Серые воды, влажный воздух и почти бесконечные стены из зелёных скал.",
    type: "Фьорд",
    duration: "5 дней",
    group: "4–8 человек",
    price: 65900,
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80",
    coords: [-44.6, 167.9]
  },
  {
    id: "monteverde",
    name: "Монтеверде",
    country: "Коста-Рика",
    description: "Серые облака оборачиваются вокруг редких лесов и влажных троп.",
    type: "Влажный лес",
    duration: "5 дней",
    group: "4–8 человек",
    price: 58900,
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    coords: [10.3, -84.8]
  },
  {
    id: "black-forest",
    name: "Шварцвальд",
    country: "Германия",
    description: "Мох на деревьях, тёмная вода и туман, который поднимается из долин.",
    type: "Лесная долина",
    duration: "4 дня",
    group: "4–8 человек",
    price: 45900,
    image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80",
    coords: [47.8, 8.2]
  }
];

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);
}

function destinationCard(destination) {
  return `
    <article class="destination" id="destination-${destination.id}">
      <div class="destination-image">
        <img src="${destination.image}" alt="" loading="lazy">
        <span class="intro-caption">Атмосферная иллюстрация</span>
      </div>
      <div class="destination-body">
        <div class="destination-meta">
          <span>${destination.country}</span>
          <span>${destination.type}</span>
        </div>
        <h3>${destination.name}</h3>
        <p>${destination.description}</p>
        <div class="destination-details">
          <span>Продолжительность</span>
          <span>${destination.duration}</span>
          <span>Группа</span>
          <span>${destination.group}</span>
        </div>
        <div class="destination-footer">
          <div class="destination-price"><small>От</small> ${formatPrice(destination.price)}</div>
          <button class="button secondary map-button" type="button" data-destination-id="${destination.id}" aria-label="На карте — ${destination.name}">На карте</button>
        </div>
        <div class="map-feedback" role="status"></div>
      </div>
    </article>
  `;
}

function renderCatalog() {
  const grid = document.querySelector("#destination-grid");
  grid.innerHTML = destinations.map(destinationCard).join("");
}

function renderPrice() {
  const list = document.querySelector("#price-list");
  list.innerHTML = destinations.map(destination => `
    <div class="price-row">
      <div>
        <strong>${destination.name}</strong>
        <small>${destination.country} · ${destination.duration}</small>
      </div>
      <span>${destination.type}</span>
      <em>от ${formatPrice(destination.price)} / чел.</em>
    </div>
  `).join("");
}

const mapCanvas = document.querySelector("#map-canvas");
const mapStatus = document.querySelector("#map-status");
let map;
let mapReady = false;
const mapMarkers = [];

function mapError(message) {
  mapReady = false;
  mapCanvas.parentElement.hidden = true;
  mapStatus.textContent = message;
  mapStatus.classList.add("is-visible");
}

function keepMapPopupInFrame(popup) {
  if (!popup || !popup.isOpen()) return;

  L.setOptions(popup, { offset: L.point(0, 7) });
  popup.update();
  const element = popup.getElement();
  const frame = mapCanvas.getBoundingClientRect();
  const card = element.getBoundingClientRect();
  const x = Math.max(frame.left + 12 - card.left, Math.min(0, frame.right - 12 - card.right));
  const y = Math.max(frame.top + 12 - card.top, Math.min(0, frame.bottom - 12 - card.bottom));

  element.classList.toggle("is-constrained", x !== 0 || y !== 0);
  L.setOptions(popup, { offset: L.point(x, 7 + y) });
  popup.update();
}

function initMap() {
  if (!window.L || !mapCanvas) return;

  const bounds = destinations.map(destination => destination.coords);

  map = L.map(mapCanvas, {
    dragging: !matchMedia("(pointer: coarse)").matches,
    touchZoom: false,
    scrollWheelZoom: false,
    zoomAnimation: false,
    fadeAnimation: false,
    zoomSnap: 0.25
  }).fitBounds(bounds, { padding: [50, 50], animate: false });

  const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    noWrap: true
  }).addTo(map);

  tiles.on("load", () => {
    const images = [...mapCanvas.querySelectorAll(".leaflet-tile")];
    if (images.length && images.every(img => !img.naturalWidth)) {
      mapError("Карта временно недоступна. Каталог и цены доступны.");
    }
  });
  const touch = document.querySelector("#touch");
  touch.hidden = !matchMedia("(pointer: coarse)").matches;
  touch.onclick = () => {
    const enabled = mapCanvas.classList.toggle("active");
    touch.setAttribute("aria-pressed", String(enabled));
    map.dragging[enabled ? "enable" : "disable"]();
    map.touchZoom[enabled ? "enable" : "disable"]();
  };
  document.querySelector("#overview").onclick = () => {
    map.closePopup();
    map.fitBounds(bounds, { padding: [24, 24], animate: false });
  };
  map.on("popupopen", event => keepMapPopupInFrame(event.popup));

  destinations.forEach((destination) => {
    const marker = L.marker(destination.coords, { title: destination.name, alt: destination.name, autoPanOnFocus: false }).addTo(map);
    const popupContent = `
      <article class="map-popup">
        <h3>${destination.name}</h3>
        <p>${destination.country}</p>
        <p>${destination.duration} · ${destination.type}</p>
        <p>от ${formatPrice(destination.price)} / чел.</p>
      </article>
    `;
    marker.bindPopup(popupContent, { autoPan: false });
    marker.destinationId = destination.id;
    mapMarkers.push(marker);
  });

  mapReady = true;

  const mapResizeObserver = new ResizeObserver(() => {
    if (!mapReady) return;
    map.invalidateSize({ pan: false });
    if (!mapMarkers.some(marker => marker.isPopupOpen())) map.fitBounds(bounds, { padding: [50, 50], animate: false });
    const openMarker = mapMarkers.find(marker => marker.isPopupOpen());
    if (openMarker) keepMapPopupInFrame(openMarker.getPopup());
  });
  mapResizeObserver.observe(mapCanvas);
}

function openDestinationOnMap(destinationId) {
  const destination = destinations.find(item => item.id === destinationId);
  if (!destination || !mapReady || !map) {
    document.querySelector("#destination-" + destinationId + " .map-feedback").textContent =
      "Карта временно недоступна. Цена указана в карточке.";
    return;
  }
  const marker = mapMarkers.find(item => item.destinationId === destinationId);
  if (marker) {
    mapCanvas.parentElement.scrollIntoView();
    map.setView(destination.coords, 8, { animate: false });
    marker.openPopup();
    mapCanvas.focus({ preventScroll: true });
  }

}

function bindMapButtons() {
  document.querySelectorAll(".map-button").forEach(button => {
    button.addEventListener("click", () => openDestinationOnMap(button.dataset.destinationId));
  });
}

function initHeader() {
  const header = document.querySelector("#site-header");
  const nav = document.querySelector("#main-nav");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = nav.querySelectorAll("a");

  function setHeaderState() {
    const isPastHero = window.scrollY >= window.innerHeight * 0.5;
    header.classList.toggle("has-background", isPastHero);
  }

  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.contains("is-open");
    nav.classList.toggle("is-open", !isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navLinks.forEach(link => link.addEventListener("click", closeMenu));
  matchMedia("(max-width: 980px)").addEventListener("change", closeMenu);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeMenu();
      toggle.focus();
    }
  });
}

function initFog() {
  const edge = document.querySelector(".fog");
  const clouds = [...edge.querySelectorAll(".cloud")];
  const visibility = new IntersectionObserver(([entry]) => {
    edge.classList.toggle("in-view", entry.isIntersecting);
  });
  visibility.observe(edge.querySelector(".fog-window"));
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let frame;
  function paint() {
    frame = null;
    const progress = Math.max(0, Math.min(1, 1 - edge.getBoundingClientRect().top / innerHeight));
    clouds.forEach((cloud, i) => {
      cloud.style.transform = motion.matches ? "" :
        "translate3d(" + progress * (i - 1) * 5 + "%," + -progress * (24 + i * 16) + "%,0)";
      cloud.style.opacity = motion.matches ? "" :
        .46 * (1 - progress) ** (1 + i * .25);
    });
  }
  function schedule() {
    if (!frame && !motion.matches) frame = requestAnimationFrame(paint);
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  motion.addEventListener("change", paint);
  paint();
}

function initPage() {
  renderCatalog();
  renderPrice();
  bindMapButtons();
  initHeader();
  initFog();
  document.querySelectorAll("figure img, .destination-image img").forEach(img => {
    function fallback() {
      img.hidden = true;
      img.parentElement.querySelector(".intro-caption").textContent = "Фотография недоступна";
    }
    img.addEventListener("error", fallback);
    if (img.complete && !img.naturalWidth) fallback();
  });

  if (window.L) {
    try {
      initMap();
      if (getComputedStyle(mapCanvas.querySelector(".leaflet-pane")).position !== "absolute") {
        mapError("Оформление карты не загрузилось. Каталог и цены доступны.");
      }
    } catch {
      mapError("Карта не загрузилась. Каталог и цены доступны.");
    }
  } else {
    mapError("Карта не загрузилась: проверьте подключение к интернету. Каталог и цены доступны.");
  }
}

initPage();
