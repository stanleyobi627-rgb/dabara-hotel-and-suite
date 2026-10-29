import { EXTRAS } from "./data.js";
import { getHotel } from "./hotel-store.js";

const HOTEL = getHotel();
import { getRoom, getRooms } from "./rooms-store.js";
import { bookings, guest } from "./storage.js";
import {
  addDays,
  availableUnits,
  bookingCode,
  calculateTotal,
  calendarEvent,
  downloadFile,
  escapeHtml,
  findPromo,
  formatDate,
  nightsBetween,
  naira,
  param,
  qs,
  qsa,
  setMinDate,
  toast,
  todayISO,
  whatsappLink,
} from "./utils.js";
import { icon } from "./icons.js";
import { starRow } from "./main.js";

const state = {
  roomId: "",
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  quantity: 1,
  extras: [],
  promoCode: "",
  payment: "transfer",
  step: 1,
  booking: null,
};

function room() {
  return getRoom(state.roomId);
}

function totals() {
  return calculateTotal({
    room: room(),
    checkIn: state.checkIn,
    checkOut: state.checkOut,
    quantity: state.quantity,
    extras: state.extras,
    promoCode: state.promoCode,
  });
}

/* ---------- render ---------- */

function renderRoomOptions() {
  const select = qs("#roomSelect");
  select.innerHTML = getRooms().map(
    (r) => `<option value="${r.id}">${r.name} — ${naira(r.rate)} per night</option>`,
  ).join("");
  select.value = state.roomId;
}

function renderRoomHint() {
  const r = room();
  const left = availableUnits(r, state.checkIn, state.checkOut, bookings.all());
  qs("#roomHint").innerHTML = `${r.beds} · ${r.size} m² · sleeps ${r.maxGuests} · ${
    left > 0 ? `<span class="text-success">${left} available</span>` : '<span class="text-danger">Sold out for these dates</span>'
  }`;
}

function renderExtras() {
  qs("#extras-list").innerHTML = EXTRAS.map(
    (e) => `
    <label class="check mb-2">
      <input type="checkbox" data-extra="${e.id}" ${state.extras.includes(e.id) ? "checked" : ""} />
      <span class="check__body">
        <b>${e.name} — ${naira(e.price)}</b>
        <span>${e.note}</span>
      </span>
    </label>`,
  ).join("");

  qsa("[data-extra]").forEach((box) => {
    box.addEventListener("change", () => {
      const id = box.dataset.extra;
      if (box.checked) {
        if (!state.extras.includes(id)) state.extras.push(id);
      } else {
        state.extras = state.extras.filter((x) => x !== id);
      }
      renderSummary();
      renderRoomHint();
    });
  });
}

function renderSummary() {
  const r = room();
  const t = totals();
  const nights = t.nights;

  const rows = [
    { label: `${naira(t.rate)} × ${nights} night${nights === 1 ? "" : "s"} × ${t.quantity} room${t.quantity > 1 ? "s" : ""}`, value: naira(t.subtotal) },
  ];

  t.extraLines.forEach((line) => {
    rows.push({ label: line.name, value: naira(line.total) });
  });

  let html = `
    <div class="row row--between mb-2" style="align-items:flex-start">
      <div>
        <b style="font-family:var(--serif);font-size:1.1rem">${r.name}</b>
        <div class="text-xs muted">${r.beds} · ${r.size} m²</div>
      </div>
      ${starRow(r.rating)}
    </div>
    <div class="summary__row"><span>Check in</span><strong>${formatDate(state.checkIn, "short")}</strong></div>
    <div class="summary__row"><span>Check out</span><strong>${formatDate(state.checkOut, "short")}</strong></div>
    <div class="summary__row"><span>Guests</span><strong>${state.adults} adult${state.adults > 1 ? "s" : ""}${
    state.children ? `, ${state.children} child${state.children > 1 ? "ren" : ""}` : ""
  }</strong></div>
    <div class="summary__row"><span>Nights</span><strong>${nights}</strong></div>
    <hr class="divider" style="margin:12px 0" />`;

  rows.forEach((row) => {
    html += `<div class="summary__row"><span>${row.label}</span><strong>${row.value}</strong></div>`;
  });

  if (t.discount > 0) {
    html += `<div class="summary__row is-discount"><span>Promo ${t.promo.code}</span><strong>−${naira(t.discount)}</strong></div>`;
  }

  html += `<div class="summary__row"><span>VAT (${Math.round(t.vatRate * 100)}%)</span><strong>${naira(t.vat)}</strong></div>`;
  html += `<div class="summary__row is-total"><span>Total</span><strong>${naira(t.total)}</strong></div>`;
  html += `<p class="text-xs muted mt-2 mb-0">Charged in Nigerian naira. Free cancellation up to 48 hours before check-in.</p>`;

  qs("#summaryBody").innerHTML = html;
}

function renderSteps() {
  qsa("#steps .step").forEach((el) => {
    const value = Number(el.dataset.step);
    el.classList.toggle("is-active", value === state.step);
    el.classList.toggle("is-done", value < state.step);
  });
  qsa("[data-panel]").forEach((panel) => {
    panel.hidden = Number(panel.dataset.panel) !== state.step;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goTo(step) {
  state.step = step;
  renderSteps();
  renderSummary();
}

/* ---------- availability ---------- */

function checkAvailability({ silent = false } = {}) {
  const r = room();
  const left = availableUnits(r, state.checkIn, state.checkOut, bookings.all());
  if (left < 1) {
    if (!silent) toast("This room is sold out for the selected dates.", "danger");
    return false;
  }
  if (left < state.quantity) {
    if (!silent) toast(`Only ${left} room(s) left for these dates.`, "warn");
    return false;
  }
  return true;
}

/* ---------- steps ---------- */

function initStep1() {
  const checkIn = qs("#checkIn");
  const checkOut = qs("#checkOut");

  state.checkIn = param("checkIn") || todayISO();
  state.checkOut = param("checkOut") || addDays(state.checkIn, 1);
  state.roomId = getRooms().some((r) => r.id === param("room")) ? param("room") : "deluxe";
  state.adults = Number(param("guests")) || 2;
  state.quantity = Number(param("quantity")) || 1;
  if (nightsBetween(state.checkIn, state.checkOut) < 1) {
    state.checkOut = addDays(state.checkIn, 1);
  }

  renderRoomOptions();

  setMinDate(checkIn, todayISO());
  checkIn.value = state.checkIn;
  checkOut.value = state.checkOut;
  checkIn.addEventListener("change", () => {
    state.checkIn = checkIn.value;
    const next = addDays(state.checkIn, 1);
    checkOut.min = next;
    if (checkOut.value <= state.checkIn) checkOut.value = next;
    state.checkOut = checkOut.value;
    renderSummary();
    renderRoomHint();
  });
  checkOut.addEventListener("change", () => {
    state.checkOut = checkOut.value;
    renderSummary();
    renderRoomHint();
  });

  qs("#roomSelect").addEventListener("change", (event) => {
    state.roomId = event.target.value;
    const r = room();
    if (state.adults > r.maxGuests) {
      state.adults = r.maxGuests;
      qs("#adults").value = String(r.maxGuests);
    }
    renderSummary();
    renderRoomHint();
  });

  qs("#adults").addEventListener("change", (event) => {
    state.adults = Number(event.target.value);
    renderSummary();
  });

  qs("#children").addEventListener("change", (event) => {
    state.children = Number(event.target.value);
    renderSummary();
  });

  qs("#quantity").addEventListener("change", (event) => {
    state.quantity = Number(event.target.value);
    renderSummary();
    renderRoomHint();
  });

  qs("#applyPromo").addEventListener("click", () => {
    const code = qs("#promoCode").value.trim().toUpperCase();
    const promo = findPromo(code);
    const message = qs("#promoMessage");
    if (!code) {
      message.innerHTML = `<span class="alert alert--warn">Enter a promotion code first.</span>`;
      return;
    }
    if (!promo) {
      message.innerHTML = `<span class="alert alert--danger">Code <b>${escapeHtml(code)}</b> is not valid.</span>`;
      state.promoCode = "";
    } else {
      state.promoCode = promo.code;
      message.innerHTML = `<span class="alert alert--success">${escapeHtml(promo.code)} applied — ${escapeHtml(
        promo.label,
      )}.</span>`;
    }
    renderSummary();
  });

  qs("#toStep2").addEventListener("click", () => {
    if (nightsBetween(state.checkIn, state.checkOut) < 1) {
      toast("Check-out must be after check-in.", "danger");
      return;
    }
    if (!checkAvailability()) return;
    goTo(2);
  });

  renderExtras();
  renderSummary();
  renderRoomHint();
}

function initStep2() {
  const saved = guest.get();
  if (saved) {
    qs("#firstName").value = saved.firstName || "";
    qs("#lastName").value = saved.lastName || "";
    qs("#email").value = saved.email || "";
    qs("#phone").value = saved.phone || "";
  }

  qs("#toStep3").addEventListener("click", () => {
    const form = qs("#guestForm");
    if (!form.reportValidity()) return;
    if (!qs("#terms").checked) {
      toast("Please accept the booking terms to continue.", "warn");
      return;
    }
    guest.save({
      firstName: qs("#firstName").value.trim(),
      lastName: qs("#lastName").value.trim(),
      email: qs("#email").value.trim(),
      phone: qs("#phone").value.trim(),
    });
    goTo(3);
  });
}

function initStep3() {
  qs("#demo-icon").innerHTML = icon("shield");

  qsa('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", (event) => {
      state.payment = event.target.value;
    });
  });

  qs("#confirmBooking").addEventListener("click", () => {
    if (!checkAvailability()) return;
    const booking = createBooking();
    bookings.add(booking);
    state.booking = booking;

    /* Open WhatsApp inside the click gesture so browsers allow the popup.
       The confirmation screen keeps a button as a fallback if it is blocked. */
    let waWindow = null;
    try {
      waWindow = window.open(whatsappBookingUrl(booking), "_blank");
      if (waWindow) waWindow.opener = null;
    } catch {
      waWindow = null;
    }

    renderConfirmation(booking);
    goTo(4);
    toast(
      waWindow
        ? "Reservation saved — press Send in WhatsApp to confirm it with the front desk."
        : "Reservation saved. Tap “Send booking on WhatsApp” to notify the front desk.",
      waWindow ? "success" : "warn",
    );
  });
}

function createBooking() {
  const t = totals();
  const r = room();
  /* No payment is taken online. Transfers are arranged on WhatsApp and
     property payments are settled at the desk, so every booking starts unpaid. */
  const paymentStatus = "pending";
  return {
    id: `bk_${Date.now()}`,
    code: bookingCode(),
    createdAt: new Date().toISOString(),
    roomId: r.id,
    roomName: r.name,
    roomImage: r.image,
    checkIn: state.checkIn,
    checkOut: state.checkOut,
    nights: t.nights,
    adults: state.adults,
    children: state.children,
    quantity: state.quantity,
    rate: t.rate,
    subtotal: t.subtotal,
    extras: t.extraLines.map((e) => ({ id: e.id, name: e.name, total: e.total })),
    extrasTotal: t.extrasTotal,
    promoCode: t.promo ? t.promo.code : "",
    discount: t.discount,
    vat: t.vat,
    total: t.total,
    currency: HOTEL.currency,
    firstName: qs("#firstName").value.trim(),
    lastName: qs("#lastName").value.trim(),
    email: qs("#email").value.trim(),
    phone: qs("#phone").value.trim(),
    arrival: qs("#arrival").value,
    occasion: qs("#occasion").value,
    requests: qs("#requests").value.trim(),
    paymentMethod: state.payment,
    paymentStatus,
    status: "confirmed",
    source: "website",
  };
}

function paymentLabelFor(method) {
  return (
    {
      transfer: "Bank transfer (arranged on WhatsApp)",
      property: "Pay at property",
    }[method] || "Pay at property"
  );
}

function whatsappBookingMessage(booking) {
  const guestName = `${booking.firstName} ${booking.lastName}`.trim();
  const guests = [`${booking.adults} adult${booking.adults > 1 ? "s" : ""}`];
  if (booking.children) guests.push(`${booking.children} child${booking.children > 1 ? "ren" : ""}`);
  const extras = (booking.extras || []).map((extra) => extra.name).filter(Boolean);
  const promo = booking.promoCode
    ? `${booking.promoCode}${booking.discount ? ` (−${naira(booking.discount)})` : ""}`
    : "";

  const lines = [
    `Hello ${HOTEL.short}, I just booked on your website and would like to confirm.`,
    "",
    `Reference: ${booking.code}`,
    `Guest: ${guestName}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    `Room: ${booking.roomName}`,
    `Rooms: ${booking.quantity}`,
    `Check-in: ${formatDate(booking.checkIn, "long")} (from ${HOTEL.checkInTime})`,
    `Check-out: ${formatDate(booking.checkOut, "long")} (by ${HOTEL.checkOutTime})`,
    `Nights: ${booking.nights}`,
    `Guests: ${guests.join(", ")}`,
    `Extras: ${extras.length ? extras.join(", ") : "None"}`,
    promo ? `Promo: ${promo}` : null,
    `Total: ${naira(booking.total)}`,
    booking.paymentMethod === "transfer"
      ? "Payment: Bank transfer — please send the account details."
      : "Payment: Pay at property",
  ].filter((line) => line !== null);
  if (booking.arrival) lines.push(`Arrival: ${booking.arrival}`);
  if (booking.occasion) lines.push(`Occasion: ${booking.occasion}`);
  if (booking.requests) lines.push(`Requests: ${booking.requests}`);
  lines.push("", "Please confirm my booking. Thank you!");
  return lines.join("\n");
}

function whatsappBookingUrl(booking) {
  return whatsappLink(whatsappBookingMessage(booking));
}

function renderConfirmation(booking) {
  const r = room();
  const waUrl = whatsappBookingUrl(booking);

  qs("#confirmCard").innerHTML = `
    <div class="confirm-card__icon">${icon("check")}</div>
    <h2>Your reservation is saved</h2>
    <p class="muted">Now send these details to our front desk on WhatsApp so we can confirm your
    arrival time and hold your room. Your reference is <b>${escapeHtml(booking.code)}</b>.</p>
    <div class="confirm-code">${escapeHtml(booking.code)}</div>

    <div class="summary text-left" style="text-align:left; max-width:520px; margin-inline:auto">
      <div class="summary__row"><span>Guest</span><strong>${escapeHtml(booking.firstName)} ${escapeHtml(
    booking.lastName,
  )}</strong></div>
      <div class="summary__row"><span>Room</span><strong>${escapeHtml(booking.roomName)}</strong></div>
      <div class="summary__row"><span>Check in</span><strong>${formatDate(booking.checkIn, "long")}</strong></div>
      <div class="summary__row"><span>Check out</span><strong>${formatDate(booking.checkOut, "long")}</strong></div>
      <div class="summary__row"><span>Nights</span><strong>${booking.nights}</strong></div>
      <div class="summary__row"><span>Guests</span><strong>${booking.adults} adult${
    booking.adults > 1 ? "s" : ""
  }${booking.children ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}</strong></div>
      <div class="summary__row"><span>Total</span><strong>${naira(booking.total)}</strong></div>
      <div class="summary__row"><span>Payment</span><strong>${escapeHtml(paymentLabelFor(booking.paymentMethod))}</strong></div>
    </div>

    <p class="text-sm muted mt-3" style="max-width:520px; margin-inline:auto">
      ${
        booking.paymentMethod === "transfer"
          ? "Our front desk will send the account details in the WhatsApp chat. Your room is held once payment is confirmed."
          : "You can pay by cash, POS or transfer at the front desk when you arrive. We will hold the room for you."
      }
    </p>

    <div class="row" style="justify-content:center; margin-top:24px">
      <a class="btn btn--sm btn--accent" id="waBtn" href="${escapeHtml(waUrl)}" target="_blank" rel="noopener">${icon("chat")} Send booking on WhatsApp</a>
      <button class="btn btn--sm btn--ghost" type="button" id="printBtn">${icon("printer")} Print receipt</button>
      <button class="btn btn--sm btn--ghost" type="button" id="icsBtn">${icon("calendar")} Add to calendar</button>
    </div>
    <p class="text-xs muted mt-3">
      If WhatsApp did not open automatically, tap <b>Send booking on WhatsApp</b> above. Prefer to call?
      <a href="tel:${HOTEL.phoneRaw}">${HOTEL.phone}</a>
    </p>
    <p class="text-xs muted mt-3">
      Reference <b>${escapeHtml(booking.code)}</b> · ${escapeHtml(r.type)} · ${HOTEL.phone}
    </p>`;

  qs("#printBtn").addEventListener("click", () => window.print());

  qs("#icsBtn").addEventListener("click", () => {
    const ics = calendarEvent({
      title: `${HOTEL.name} — ${booking.roomName}`,
      description: `Booking ${booking.code}\nTotal: ${naira(booking.total)}\nCheck-in ${HOTEL.checkInTime}, check-out ${HOTEL.checkOutTime}`,
      location: HOTEL.address,
      start: booking.checkIn,
      end: booking.checkOut,
    });
    downloadFile(`${booking.code}.ics`, ics, "text/calendar");
  });
}

function initBackButtons() {
  qsa("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => goTo(Number(btn.dataset.back)));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initStep1();
  initStep2();
  initStep3();
  initBackButtons();
  renderSteps();
  renderSummary();
});
