import { HOTEL, ROOMS, ROOM_TYPES, AMENITIES } from "./data.js";
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

const POLICIES = [
  {
    icon: "clock",
    title: "Check-in & check-out",
    text: `Check-in from ${HOTEL.checkInTime}, check-out by ${HOTEL.checkOutTime}. Early check-in and late check-out can be added to your booking and confirmed subject to availability.`,
  },
  {
    icon: "users",
    title: "Occupancy & extras",
    text: "Each booking includes the number of guests shown. Additional guests above the room limit can be arranged with the front desk, and extra beds are subject to availability.",
  },
  {
    icon: "shield",
    title: "Cancellation",
    text: "Free cancellation up to 48 hours before check-in. Inside 48 hours one night is charged, except for Presidential Suite bookings which are non-refundable.",
  },
  {
    icon: "coffee",
    title: "Breakfast & dining",
    text: "Breakfast is included with the Deluxe and above. Restaurant charges are settled at the property, and in-room dining is available around the clock.",
  },
];

const state = {
  checkIn: "",
  checkOut: "",
  guests: 2,
  type: "all",
  price: "any",
  availableOnly: true,
};

function readStateFromUrl() {
  const today = todayISO();
  state.checkIn = param("checkIn") || today;
  state.checkOut = param("checkOut") || addDays(state.checkIn, 1);
  state.guests = Number(param("guests")) || 2;
  state.type = ROOM_TYPES.includes(param("type")) ? param("type") : "all";
  state.price = param("price") || "any";
  if (nightsBetween(state.checkIn, state.checkOut) < 1) {
    state.checkOut = addDays(state.checkIn, 1);
  }
}

function writeStateToUrl() {
  setParam("checkIn", state.checkIn);
  setParam("checkOut", state.checkOut);
  setParam("guests", String(state.guests));
  setParam("type", state.type);
  setParam("price", state.price);
}

function readStateFromForm() {
  state.checkIn = qs("#checkIn").value;
  state.checkOut = qs("#checkOut").value;
  state.guests = Number(qs("#guests").value);
  state.type = qs("#type").value;
  state.price = qs("#price").value;
  state.availableOnly = qs("#availableOnly").checked;
}

function fillForm() {
  const typeSelect = qs("#type");
  if (!typeSelect.dataset.filled) {
    ROOM_TYPES.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      typeSelect.appendChild(option);
    });
    typeSelect.dataset.filled = "true";
  }

  qs("#checkIn").value = state.checkIn;
  qs("#checkOut").value = state.checkOut;
  qs("#guests").value = String(state.guests);
  qs("#type").value = state.type;
  qs("#price").value = state.price;
}

function filteredRooms() {
  const all = bookings.all();
  return ROOMS.filter((room) => {
    if (state.type !== "all" && room.type !== state.type) return false;
    if (state.price !== "any" && room.rate > Number(state.price)) return false;
    if (room.maxGuests < state.guests) return false;
    if (state.availableOnly) {
      const left = availableUnits(room, state.checkIn, state.checkOut, all);
      if (left < 1) return false;
    }
    return true;
  });
}

function roomCard(room) {
  const all = bookings.all();
  const left = availableUnits(room, state.checkIn, state.checkOut, all);
  const nights = nightsBetween(state.checkIn, state.checkOut);
  const total = room.rate * nights;

  return `
    <article class="card">
      <a class="card__media" href="room.html?id=${room.id}&checkIn=${state.checkIn}&checkOut=${state.checkOut}&guests=${state.guests}" aria-label="${room.name}">
        ${room.tag ? `<span class="card__tag">${room.tag}</span>` : ""}
        <img src="${room.image}" alt="${room.name} at ${HOTEL.name}" loading="lazy" />
      </a>
      <div class="card__body">
        <h3 class="card__title">${room.name}</h3>
        ${starRow(room.rating, room.reviews)}
        <div class="card__meta">
          <span>${icon("users")} Up to ${room.maxGuests}</span>
          <span>${icon("workspace")} ${room.size} m²</span>
          <span>${icon("bed")} ${room.beds}</span>
          <span>${icon("pin")} ${room.view}</span>
        </div>
        <p class="text-sm muted mb-0">${room.description}</p>
        ${amenityChips(room.amenities, AMENITIES, 4)}
        <div class="card__meta" style="font-size:.8rem">
          <span class="${left > 0 ? "text-success" : "text-danger"}" style="font-weight:600">
            ${icon("info")} ${left > 0 ? `${left} of ${room.units} left` : "Sold out for these dates"}
          </span>
        </div>
        <div class="card__foot">
          <div class="price">${naira(room.rate)}<small>${nights} night${nights > 1 ? "s" : ""} · ${naira(total)} total</small></div>
          <a class="btn btn--sm ${left > 0 ? "" : "is-disabled"}" href="room.html?id=${room.id}&checkIn=${state.checkIn}&checkOut=${state.checkOut}&guests=${state.guests}">Book</a>
        </div>
      </div>
    </article>`;
}

function render() {
  const list = filteredRooms();
  const grid = qs("#room-grid");
  const empty = qs("#no-results");

  if (list.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
    qs("#empty-icon").innerHTML = icon("search");
  } else {
    grid.innerHTML = list.map(roomCard).join("");
    empty.hidden = true;
  }

  const nights = nightsBetween(state.checkIn, state.checkOut);
  qs("#result-count").innerHTML = `${list.length} room type${list.length === 1 ? "" : "s"} · ${formatDate(
    state.checkIn,
    "short",
  )} → ${formatDate(state.checkOut, "short")} · ${nights} night${nights > 1 ? "s" : ""}`;
}

function renderPolicies() {
  qs("#policy-grid").innerHTML = POLICIES.map(
    (p) => `
      <div class="feature">
        <div class="feature__icon">${icon(p.icon)}</div>
        <h3>${p.title}</h3>
        <p>${p.text}</p>
      </div>`,
  ).join("");
}

function init() {
  readStateFromUrl();
  fillForm();

  const checkIn = qs("#checkIn");
  const checkOut = qs("#checkOut");
  setMinDate(checkIn, todayISO());
  setMinDate(checkOut, addDays(todayISO(), 1));
  checkIn.addEventListener("change", () => {
    const next = addDays(checkIn.value, 1);
    checkOut.min = next;
    if (!checkOut.value || checkOut.value <= checkIn.value) checkOut.value = next;
  });

  const form = qs("#filter-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    readStateFromForm();
    if (nightsBetween(state.checkIn, state.checkOut) < 1) {
      toast("Check-out must be after check-in.", "danger");
      return;
    }
    writeStateToUrl();
    render();
  });

  qs("#reset-filters").addEventListener("click", () => {
    state.type = "all";
    state.price = "any";
    state.guests = 2;
    state.availableOnly = true;
    fillForm();
    readStateFromForm();
    writeStateToUrl();
    render();
    toast("Filters reset.");
  });

  renderPolicies();
  render();
}

document.addEventListener("DOMContentLoaded", init);
