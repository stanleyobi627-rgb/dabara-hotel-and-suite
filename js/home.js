import { HOTEL, ROOMS, SERVICES, REVIEWS, FAQ, AMENITIES } from "./data.js";
import { bookings } from "./storage.js";
import {
  addDays,
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
    title: "Fast Wi-Fi everywhere",
    text: "Fibre internet in every room and all public areas, so your calls and uploads never drop.",
  },
  {
    icon: "pool",
    title: "Rooftop pool & terrace",
    text: "A heated 12-metre pool overlooking Awka, with shaded cabanas and a poolside bar.",
  },
  {
    icon: "spa",
    title: "Spa & wellness",
    text: "Deep tissue, hot stone and body polish treatments in two calm, private rooms.",
  },
  {
    icon: "restaurant",
    title: "Local kitchen",
    text: "Iroko Restaurant serves Anambra classics alongside continental favourites, until 11 PM.",
  },
  {
    icon: "shield",
    title: "Safe & secure",
    text: "Guarded parking, CCTV, 24-hour front desk and in-room safes for your valuables.",
  },
  {
    icon: "plane",
    title: "Airport transfers",
    text: "Door-to-door pickup from Enugu International Airport, tracked and on time.",
  },
  {
    icon: "conference",
    title: "Meetings & events",
    text: "A 120-seat conference hall with hybrid meeting kit and full catering packages.",
  },
  {
    icon: "car",
    title: "Free parking",
    text: "Complimentary guarded parking for 40 vehicles, with valet on request for suites.",
  },
];

function renderStats() {
  const totalUnits = ROOMS.reduce((sum, room) => sum + room.units, 0);
  const reviewCount = ROOMS.reduce((sum, room) => sum + room.reviews, 0);
  const stats = [
    { value: totalUnits, label: "Rooms & suites" },
    { value: "4.7", label: "Average guest rating" },
    { value: reviewCount.toLocaleString("en-NG"), label: "Verified reviews" },
    { value: "2 hrs", label: "Free cancellation" },
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
  const picks = ["deluxe", "executive", "standard"].map((id) => ROOMS.find((r) => r.id === id));
  qs("#featured-rooms").innerHTML = picks.map(roomCard).join("");
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

function renderReviews() {
  qs("#review-grid").innerHTML = REVIEWS.slice(0, 3)
    .map(
      (r) => `
      <div class="review">
        <div class="review__head">
          <div class="avatar">${r.name.charAt(0)}</div>
          <div class="grow">
            <b>${r.name}</b>
            <span>${r.role}</span>
          </div>
          <span class="rating">${Array.from({ length: r.rating })
            .map(() => iconFilled("star"))
            .join("")}</span>
        </div>
        <p>“${r.text}”</p>
      </div>`,
    )
    .join("");
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
    const available = ROOMS.filter(
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

  const year = new Date().getFullYear();
  qsa("[data-year]").forEach((el) => {
    el.textContent = String(year);
  });
});
