import { SERVICES, REVIEWS, FAQ, AMENITIES } from "./data.js";
import { getHotel } from "./hotel-store.js";

const HOTEL = getHotel();
import { getRooms, totalReviews, totalUnits } from "./rooms-store.js";
import { bookings } from "./storage.js";

const GUEST_REVIEWS_KEY = "dabara_guest_reviews";
import {
  addDays,
  escapeHtml,
  formatDate,
  nightsBetween,
  naira,
  qsa,
  qs,
  setMinDate,
  toast,
  todayISO,
} from "./utils.js";
import { icon, iconFilled } from "./icons.js";
import { amenityChips, starRow } from "./main.js";

const FEATURES = [
  {
    icon: "wifi",
    title: "Free Wi-Fi throughout",
    text: "Fibre internet in every room and all public areas, so your calls and uploads never drop.",
  },
  {
    icon: "pool",
    title: "Outdoor swimming pool",
    text: "A well-kept pool in a quiet corner of the grounds, with shaded loungers and towels on the deck.",
  },
  {
    icon: "hottub",
    title: "Hot tub",
    text: "A heated hot tub set apart from the pool for a quiet soak after a long day in Nnewi.",
  },
  {
    icon: "gym",
    title: "Fitness centre",
    text: "Cardio, free weights and a stretching area, open 24 hours so it fits around your working day.",
  },
  {
    icon: "restaurant",
    title: "Restaurant, bar & night club",
    text: "Local and continental dishes, a full bar, and a dedicated night club on the same premises.",
  },
  {
    icon: "power",
    title: "24-hour power",
    text: "Power runs around the clock with backup, so an outage never interrupts your stay or your work.",
  },
  {
    icon: "keycard",
    title: "Card-key security",
    text: "Every room is opened with a secure card key issued at reception, with safes in each room.",
  },
  {
    icon: "parking",
    title: "Free parking",
    text: "Complimentary on-site parking for cars and buses, with valet on request for suites and events.",
  },
];

function renderStats() {
  const stats = [
    { value: totalUnits(), label: "Rooms & suites" },
    { value: HOTEL.rating.toFixed(1), label: "Average guest rating" },
    { value: totalReviews().toLocaleString("en-NG"), label: "Verified reviews" },
    { value: "24 hrs", label: "Power & front desk" },
  ];
  qs("#hero-stats").innerHTML = stats
    .map((s) => `<div class="hero__stat"><b>${s.value}</b><span>${s.label}</span></div>`)
    .join("");
}

function renderFeatures() {
  qs("#feature-grid").innerHTML = FEATURES.map(
    (f) => `
      <div class="feature">
        <div class="feature__icon">${icon(f.icon)}</div>
        <h3>${f.title}</h3>
        <p>${f.text}</p>
      </div>`,
  ).join("");
}

function roomCard(room) {
  return `
    <article class="card">
      <a class="card__media" href="room.html?id=${room.id}" aria-label="${room.name}">
        ${room.tag ? `<span class="card__tag">${room.tag}</span>` : ""}
        <img src="${room.image}" alt="${room.name} at ${HOTEL.name}" loading="lazy" />
      </a>
      <div class="card__body">
        <h3 class="card__title">${room.name}</h3>
        ${starRow(room.rating, room.reviews)}
        <div class="card__meta">
          <span>${icon("users")} Up to ${room.maxGuests} guests</span>
          <span>${icon("workspace")} ${room.size} m²</span>
          <span>${icon("bed")} ${room.beds}</span>
        </div>
        <p class="text-sm muted mb-0">${room.description.slice(0, 96)}…</p>
        ${amenityChips(room.amenities, AMENITIES, 3)}
        <div class="card__foot">
          <div class="price">${naira(room.rate)}<small>per night</small></div>
          <a class="btn btn--sm" href="room.html?id=${room.id}">View room</a>
        </div>
      </div>
    </article>`;
}

function renderFeaturedRooms() {
  const picks = ["deluxe", "presidential", "executive"].map((id) => getRooms().find((r) => r.id === id));
  qs("#featured-rooms").innerHTML = picks.filter(Boolean).map(roomCard).join("");
}

function renderServices() {
  const picks = SERVICES.slice(0, 4);
  qs("#service-preview").innerHTML = picks
    .map(
      (s) => `
      <div class="service">
        <div class="service__media"><img src="${s.image}" alt="${s.name}" loading="lazy" /></div>
        <div>
          <h3>${s.name}</h3>
          <p>${s.description}</p>
          <div class="row">
            <span class="text-sm muted">${icon("clock")} ${s.duration}</span>
            <span class="text-sm text-gold" style="font-weight: 600">${
              s.price ? `${naira(s.price)} from` : "Complimentary"
            }</span>
          </div>
        </div>
      </div>`,
    )
    .join("");
}

function loadGuestReviews() {
  try {
    const raw = localStorage.getItem(GUEST_REVIEWS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveGuestReview(review) {
  const list = loadGuestReviews();
  list.unshift(review);
  try {
    localStorage.setItem(GUEST_REVIEWS_KEY, JSON.stringify(list));
  } catch {}
}

function reviewCard(r) {
  const stars = Array.from({ length: Math.max(1, Number(r.rating) || 5) })
    .map(() => iconFilled("star"))
    .join("");
  return `
      <div class="review">
        <div class="review__head">
          <div class="avatar">${(r.name || "G").charAt(0).toUpperCase()}</div>
          <div class="grow">
            <b>${escapeHtml(r.name || "Guest")}</b>
            <span>${escapeHtml(r.role || "Guest stay")}</span>
          </div>
          <span class="rating">${stars}</span>
        </div>
        <p>“${escapeHtml(r.text || "")}”</p>
      </div>`;
}

function allReviews() {
  return [...loadGuestReviews(), ...REVIEWS];
}

function renderReviews() {
  const all = allReviews();

  const grid = qs("#review-grid");
  if (grid) {
    grid.innerHTML = all.slice(0, 12).map(reviewCard).join("");
  }

  const homeGrid = qs("#home-reviews-grid");
  if (homeGrid) {
    homeGrid.innerHTML = all.slice(0, 6).map(reviewCard).join("");
  }
}

function initReviewForm() {
  const form = qs("#reviewForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = qs("#revName", form)?.value.trim() || "";
    const role = qs("#revRole", form)?.value.trim() || "";
    const rating = Number(qs("#revRating", form)?.value) || 5;
    const text = qs("#revText", form)?.value.trim() || "";

    if (!name || !role || !text) {
      toast("Please add your name, stay type and a short review.", "danger");
      return;
    }

    saveGuestReview({ name, role, rating, text, date: new Date().toISOString() });
    form.reset();
    renderReviews();

    const msg = qs("#reviewMsg");
    if (msg) {
      msg.innerHTML = `<p class="text-gold"><b>Thank you, ${escapeHtml(
        name,
      )}.</b> Your review is now showing in the list above.</p>`;
    }
    toast("Thanks! Your review has been posted.", "success");

    const target = qs("#review-grid") || qs("#home-reviews-grid");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderFaq() {
  qs("#faq-list").innerHTML = FAQ.map(
    (f) => `
      <details class="faq">
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>`,
  ).join("");
}

function initSearch() {
  const form = qs("#search-form");
  if (!form) return;
  const checkIn = qs("#checkIn");
  const checkOut = qs("#checkOut");

  const today = todayISO();
  setMinDate(checkIn, today);
  setMinDate(checkOut, addDays(today, 1));
  checkIn.addEventListener("change", () => {
    const next = addDays(checkIn.value, 1);
    checkOut.min = next;
    if (!checkOut.value || checkOut.value <= checkIn.value) checkOut.value = next;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nights = nightsBetween(checkIn.value, checkOut.value);
    if (nights < 1) {
      toast("Check-out must be after check-in.", "danger");
      return;
    }
    const guests = Number(qs("#guests").value);
    const available = getRooms().filter(
      (room) => room.maxGuests >= guests && room.units > 0,
    ).length;
    const url = new URL("rooms.html", window.location.href);
    url.searchParams.set("checkIn", checkIn.value);
    url.searchParams.set("checkOut", checkOut.value);
    url.searchParams.set("guests", String(guests));
    window.location.href = url.toString();
    toast(`${available} room types available for ${nights} night${nights > 1 ? "s" : ""}.`);
  });
}

function initBadge() {
  const badge = qs("#hero-badge");
  if (!badge) return;
  const pending = bookings.all().filter((b) => b.status === "pending").length;
  if (pending > 0) {
    badge.innerHTML = `${icon("clock")} You have ${pending} pending reservation${pending > 1 ? "s" : ""}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  renderFeatures();
  renderFeaturedRooms();
  renderServices();
  renderReviews();
  renderFaq();
  initSearch();
  initBadge();
  initReviewForm();

  const year = new Date().getFullYear();
  qsa("[data-year]").forEach((el) => {
    el.textContent = String(year);
  });
});
