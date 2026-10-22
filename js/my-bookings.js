import { getHotel } from "./hotel-store.js";

const HOTEL = getHotel();
import { bookings } from "./storage.js";
import {
  calendarEvent,
  downloadFile,
  escapeHtml,
  formatDate,
  naira,
  qs,
  toast,
  whatsappLink,
} from "./utils.js";
import { icon } from "./icons.js";

const STATUS_LABELS = {
  confirmed: "Confirmed",
  pending: "Pending payment",
  "checked-in": "Checked in",
  "checked-out": "Checked out",
  cancelled: "Cancelled",
};

function statusBadge(status) {
  return `<span class="badge badge--${status}">${escapeHtml(STATUS_LABELS[status] || status)}</span>`;
}

function paymentLabel(booking) {
  if (booking.paymentStatus === "paid") return "Paid";
  if (booking.paymentMethod === "transfer") return "Awaiting transfer";
  if (booking.paymentMethod === "property") return "Pay on arrival";
  return "Pay on arrival";
}

function renderPills(list) {
  const upcoming = list.filter(
    (b) => b.status !== "cancelled" && b.checkOut >= new Date().toISOString().slice(0, 10),
  ).length;
  const cancelled = list.filter((b) => b.status === "cancelled").length;
  const spent = list
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

  const pills = [
    { label: `${upcoming} upcoming`, cls: "text-success" },
    { label: `${list.length - cancelled} active`, cls: "" },
    { label: `${cancelled} cancelled`, cls: "muted" },
    { label: `${naira(spent)} booked`, cls: "text-gold" },
  ];

  qs("#summary-pills").innerHTML = pills
    .map((p) => `<span class="chip ${p.cls}">${p.label}</span>`)
    .join("");
}

function bookingCard(booking) {
  const nights = booking.nights || 1;
  return `
    <article class="panel" data-booking="${escapeHtml(booking.id)}">
      <div class="row row--between" style="align-items:flex-start; gap:18px">
        <div class="row" style="align-items:flex-start; flex:1 1 320px">
          <div style="width:120px; border-radius:14px; overflow:hidden; flex:none; border:1px solid var(--line)">
            <img src="${booking.roomImage || "images/room-deluxe.svg"}" alt="${escapeHtml(
    booking.roomName,
  )}" style="width:100%; aspect-ratio:4/3; object-fit:cover" />
          </div>
          <div class="grow">
            <div class="row" style="gap:10px">
              <h3 class="panel__title" style="margin:0">${escapeHtml(booking.roomName)}</h3>
              ${statusBadge(booking.status)}
            </div>
            <p class="text-sm muted" style="margin:4px 0 10px">
              ${formatDate(booking.checkIn, "long")} → ${formatDate(booking.checkOut, "long")} ·
              ${nights} night${nights > 1 ? "s" : ""} · ${booking.adults} guest${
    booking.adults > 1 ? "s" : ""
  }${booking.quantity > 1 ? ` · ${booking.quantity} rooms` : ""}
            </p>
            <div class="chip-list">
              <span class="chip">${icon("key")} ${escapeHtml(booking.code)}</span>
              <span class="chip">${icon("wallet")} ${paymentLabel(booking)}</span>
              <span class="chip">${icon("users")} ${escapeHtml(booking.firstName)} ${escapeHtml(
    booking.lastName,
  )}</span>
            </div>
          </div>
        </div>
        <div style="text-align:right">
          <div class="price">${naira(booking.total)}</div>
          <div class="text-xs muted">incl. VAT</div>
        </div>
      </div>

      <hr class="divider" />

      <div class="row row--between">
        <div class="row">
          <button class="btn btn--sm btn--ghost" type="button" data-action="print" data-id="${escapeHtml(
            booking.id,
          )}">${icon("printer")} Print</button>
          <button class="btn btn--sm btn--ghost" type="button" data-action="ics" data-id="${escapeHtml(
            booking.id,
          )}">${icon("calendar")} Calendar</button>
          <a class="btn btn--sm btn--ghost" href="${whatsappLink(
            `Hello ${HOTEL.short}, I want to check on my booking ${booking.code} (${booking.roomName}).`,
          )}" target="_blank" rel="noopener">${icon("chat")} WhatsApp</a>
        </div>
        <div class="row">
          <a class="btn btn--sm btn--ghost" href="booking.html?room=${escapeHtml(
            booking.roomId,
          )}&checkIn=${escapeHtml(booking.checkIn)}&checkOut=${escapeHtml(booking.checkOut)}">Book again</a>
          ${
            booking.status === "cancelled"
              ? `<button class="btn btn--sm btn--ghost" type="button" data-action="reopen" data-id="${escapeHtml(
                  booking.id,
                )}">Restore</button>`
              : `<button class="btn btn--sm btn--danger" type="button" data-action="cancel" data-id="${escapeHtml(
                  booking.id,
                )}">Cancel</button>`
          }
        </div>
      </div>
    </article>`;
}

function render() {
  const list = bookings.all();
  const container = qs("#booking-list");
  const empty = qs("#empty-state");

  if (list.length === 0) {
    container.innerHTML = "";
    empty.hidden = false;
    qs("#empty-icon").innerHTML = icon("calendar");
    renderPills([]);
    return;
  }

  empty.hidden = true;
  container.innerHTML = list.map(bookingCard).join("");
  renderPills(list);
}

function handleAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  const booking = bookings.get(id);
  if (!booking) return;

  if (button.dataset.action === "print") {
    window.print();
    return;
  }

  if (button.dataset.action === "ics") {
    const ics = calendarEvent({
      title: `${HOTEL.name} — ${booking.roomName}`,
      description: `Booking ${booking.code}\nTotal: ${naira(booking.total)}`,
      location: HOTEL.address,
      start: booking.checkIn,
      end: booking.checkOut,
    });
    downloadFile(`${booking.code}.ics`, ics, "text/calendar");
    toast("Calendar file downloaded.");
    return;
  }

  if (button.dataset.action === "cancel") {
    const hours = (new Date(booking.checkIn) - Date.now()) / 3600000;
    if (hours < 48) {
      const ok = window.confirm(
        "This booking is inside the free cancellation window. One night will be charged. Continue?",
      );
      if (!ok) return;
    } else if (!window.confirm(`Cancel booking ${booking.code}?`)) {
      return;
    }
    bookings.update(id, { status: "cancelled" });
    render();
    toast(`Booking ${booking.code} cancelled.`, "warn");
    return;
  }

  if (button.dataset.action === "reopen") {
    bookings.update(id, { status: "confirmed" });
    render();
    toast(`Booking ${booking.code} restored.`, "success");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  qs("#booking-list").addEventListener("click", handleAction);
});
