import { HOTEL, AMENITIES, FAQ } from "./data.js";
import { getRoom, getRooms } from "./rooms-store.js";
import { bookings } from "./storage.js";
import {
  addDays,
  availableUnits,
  formatDate,
  nightsBetween,
  naira,
  param,
  qs,
  setParam,
  setMinDate,
  toast,
  todayISO,
} from "./utils.js";
import { icon } from "./icons.js";
import { amenityChips, starRow } from "./main.js";

let room = null;
const state = { checkIn: "", checkOut: "", guests: 2, quantity: 1 };

function galleryImages() {
  const list = [room.image];
  const extras = [
    `images/gallery-${room.id}-1.svg`,
    `images/gallery-${room.id}-2.svg`,
    `images/gallery-${room.id}-3.svg`,
  ];
  extras.forEach((src) => list.push(src));
  return list;
}

function renderHeader() {
  document.title = `${room.name} — ${HOTEL.name}`;
  qs("#crumb-name").textContent = room.name;
  qs("#room-name").textContent = room.name;
  qs("#room-summary").innerHTML = `${room.beds} · ${room.size} m² · ${room.view} · sleeps ${room.maxGuests} — ${room.description.slice(0, 120)}…`;
  qs("#detail-title").textContent = `About the ${room.name}`;
  qs("#detail-description").textContent = room.description;
  qs("#rate").textContent = naira(room.rate);
}

function renderGallery() {
  const images = galleryImages();
  const main = qs("#gallery-main");
  main.src = images[0];
  main.alt = `${room.name} — ${HOTEL.name}`;

  qs("#gallery-thumbs").innerHTML = images
    .map(
      (src, i) =>
        `<button type="button" data-src="${src}" class="${i === 0 ? "is-active" : ""}"><img src="${src}" alt="${room.name} view ${i + 1}" loading="lazy" /></button>`,
    )
    .join("");

  qs("#gallery-thumbs")
    .querySelectorAll("button")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        main.src = btn.dataset.src;
        qs("#gallery-thumbs")
          .querySelectorAll("button")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });
}

function renderSpecs() {
  const specs = [
    { icon: "bed", text: room.beds },
    { icon: "users", text: `Sleeps up to ${room.maxGuests} guests` },
    { icon: "workspace", text: `${room.size} m² of space` },
    { icon: "pin", text: `${room.view}, floor ${room.floor}` },
    { icon: "info", text: `${room.units} rooms of this type in the hotel` },
    { icon: "star", text: `${room.rating.toFixed(1)} from ${room.reviews} verified reviews` },
  ];
  qs("#spec-list").innerHTML = specs
    .map((s) => `<li>${icon(s.icon)}<span>${s.text}</span></li>`)
    .join("");
}

function renderAmenities() {
  qs("#amenity-grid").innerHTML = room.amenities
    .map((id) => {
      const item = AMENITIES.find((a) => a.id === id);
      return item ? `<div class="amenity">${icon(item.id)}<span>${item.label}</span></div>` : "";
    })
    .join("");
}

function renderFaq() {
  qs("#room-faq").innerHTML = FAQ.slice(0, 3)
    .map(
      (f) => `
      <details class="faq">
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>`,
    )
    .join("");
}

function renderRelated() {
  const related = getRooms()
    .filter((r) => r.id !== room.id)
    .sort((a, b) => Math.abs(a.rate - room.rate) - Math.abs(b.rate - room.rate))
    .slice(0, 3);

  qs("#related").innerHTML = `
    <div class="section__head">
      <span class="eyebrow">You might also like</span>
      <h2>Other rooms at ${HOTEL.short}</h2>
    </div>
    <div class="grid grid--3">
      ${related
        .map(
          (r) => `
        <article class="card">
          <a class="card__media" href="room.html?id=${r.id}">
            <img src="${r.image}" alt="${r.name}" loading="lazy" />
          </a>
          <div class="card__body">
            <h3 class="card__title">${r.name}</h3>
            ${starRow(r.rating, r.reviews)}
            ${amenityChips(r.amenities, AMENITIES, 3)}
            <div class="card__foot">
              <div class="price">${naira(r.rate)}<small>per night</small></div>
              <a class="btn btn--sm btn--ghost" href="room.html?id=${r.id}">View</a>
            </div>
          </div>
        </article>`,
        )
        .join("")}
    </div>`;
}

function fillGuests() {
  const select = qs("#guests");
  for (let i = 1; i <= room.maxGuests; i += 1) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `${i} guest${i > 1 ? "s" : ""}`;
    select.appendChild(option);
  }
}

function updateEstimate() {
  const nights = nightsBetween(state.checkIn, state.checkOut);
  const left = availableUnits(room, state.checkIn, state.checkOut, bookings.all());
  const total = room.rate * nights * state.quantity;
  const btn = qs("#reserve-btn");

  qs("#estimate").innerHTML = `
    <div class="summary__row"><span>${naira(room.rate)} × ${nights} night${
    nights === 1 ? "" : "s"
  } × ${state.quantity} room${state.quantity > 1 ? "s" : ""}</span><strong>${naira(total)}</strong></div>
    <div class="summary__row"><span>${formatDate(state.checkIn, "short")} → ${formatDate(
    state.checkOut,
    "short",
  )}</span><span class="${left > 0 ? "text-success" : "text-danger"}">${
    left > 0 ? `${left} available` : "Sold out"
  }</span></div>
    <div class="summary__row is-total"><span>Estimated total</span><strong>${naira(total)}</strong></div>`;

  if (nights < 1) {
    btn.disabled = true;
    btn.textContent = "Choose valid dates";
  } else if (left < state.quantity) {
    btn.disabled = true;
    btn.textContent = left > 0 ? `Only ${left} left` : "Sold out for these dates";
  } else {
    btn.disabled = false;
    btn.textContent = "Continue to booking";
  }
}

function initForm() {
  const checkIn = qs("#checkIn");
  const checkOut = qs("#checkOut");
  const guests = qs("#guests");
  const quantity = qs("#quantity");

  state.checkIn = param("checkIn") || todayISO();
  state.checkOut = param("checkOut") || addDays(state.checkIn, 1);
  state.guests = Number(param("guests")) || 2;
  if (nightsBetween(state.checkIn, state.checkOut) < 1) {
    state.checkOut = addDays(state.checkIn, 1);
  }

  setMinDate(checkIn, todayISO());
  checkIn.value = state.checkIn;
  checkOut.value = state.checkOut;
  guests.value = String(Math.min(state.guests, room.maxGuests));
  state.guests = Number(guests.value);
  quantity.value = "1";

  checkIn.addEventListener("change", () => {
    state.checkIn = checkIn.value;
    const next = addDays(state.checkIn, 1);
    checkOut.min = next;
    if (!checkOut.value || checkOut.value <= state.checkIn) checkOut.value = next;
    state.checkOut = checkOut.value;
    updateEstimate();
  });

  checkOut.addEventListener("change", () => {
    state.checkOut = checkOut.value;
    updateEstimate();
  });

  guests.addEventListener("change", () => {
    state.guests = Number(guests.value);
    updateEstimate();
  });

  quantity.addEventListener("change", () => {
    state.quantity = Number(quantity.value);
    updateEstimate();
  });

  qs("#reserve-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (nightsBetween(state.checkIn, state.checkOut) < 1) {
      toast("Check-out must be after check-in.", "danger");
      return;
    }
    const left = availableUnits(room, state.checkIn, state.checkOut, bookings.all());
    if (left < state.quantity) {
      toast(left > 0 ? `Only ${left} room(s) left for these dates.` : "This room is sold out.", "danger");
      return;
    }
    const url = new URL("booking.html", window.location.href);
    url.searchParams.set("room", room.id);
    url.searchParams.set("checkIn", state.checkIn);
    url.searchParams.set("checkOut", state.checkOut);
    url.searchParams.set("guests", String(state.guests));
    url.searchParams.set("quantity", String(state.quantity));
    window.location.href = url.toString();
  });

  updateEstimate();
}

function init() {
  room = getRoom(param("id") || "deluxe");
  setParam("id", room.id);

  renderHeader();
  renderGallery();
  renderSpecs();
  renderAmenities();
  renderFaq();
  renderRelated();
  fillGuests();
  initForm();
}

document.addEventListener("DOMContentLoaded", init);
