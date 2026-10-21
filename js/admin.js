import { HOTEL, ROOMS } from "./data.js";
import { admin, bookings, enquiries, KEYS, remove, theme } from "./storage.js";
import {
  availableUnits,
  downloadFile,
  escapeHtml,
  formatDate,
  naira,
  qs,
  qsa,
  toast,
  toCSV,
} from "./utils.js";
import { icon } from "./icons.js";

const TABS = {
  overview: ["Overview", "Live snapshot of bookings, revenue and occupancy"],
  bookings: ["Bookings", "Manage, update and export every reservation"],
  rooms: ["Rooms", "Adjust rates, unit counts and room photography"],
  enquiries: ["Enquiries", "Messages sent from the contact page"],
  settings: ["Hotel information", "Phone, email, address and check-in times"],
};

const STATUS_OPTIONS = ["confirmed", "pending", "checked-in", "checked-out", "cancelled"];

/* ---------- helpers ---------- */

function currentRooms() {
  const stored = admin.rooms();
  if (!stored) return ROOMS.map((r) => ({ ...r }));
  return stored;
}

function effectiveHotel() {
  const info = admin.hotelInfo();
  return { ...HOTEL, ...(info || {}) };
}

function statusBadge(status) {
  return `<span class="badge badge--${status}">${escapeHtml(status)}</span>`;
}

/* ---------- views ---------- */

function renderOverview() {
  const list = bookings.all();
  const today = new Date().toISOString().slice(0, 10);
  const active = list.filter((b) => b.status !== "cancelled");
  const upcoming = active.filter((b) => b.checkIn >= today);
  const inHouse = active.filter((b) => b.checkIn <= today && b.checkOut > today);
  const revenue = active.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  const totalUnits = currentRooms().reduce((sum, r) => sum + (Number(r.units) || 0), 0);
  const occupiedUnits = active
    .filter((b) => b.checkIn <= today && b.checkOut > today)
    .reduce((sum, b) => sum + (Number(b.quantity) || 1), 0);
  const occupancy = totalUnits ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const stats = [
    { label: "Total bookings", value: list.length, cls: "" },
    { label: "Upcoming arrivals", value: upcoming.length, cls: "stat--accent" },
    { label: "In house tonight", value: inHouse.length, cls: "" },
    { label: "Occupancy tonight", value: `${occupancy}%`, cls: "stat--success" },
    { label: "Revenue booked", value: naira(revenue), cls: "" },
    { label: "Average booking", value: naira(active.length ? Math.round(revenue / active.length) : 0), cls: "" },
    { label: "Total units", value: totalUnits, cls: "" },
    { label: "Pending payment", value: active.filter((b) => b.paymentStatus !== "paid").length, cls: "stat--accent" },
  ];

  qs("#statGrid").innerHTML = stats
    .map(
      (s) => `
      <div class="stat ${s.cls}">
        <span>${s.label}</span>
        <b>${s.value}</b>
      </div>`,
    )
    .join("");

  const recent = list.slice(0, 6);
  qs("#recentTable").innerHTML = recent.length
    ? `<table class="data">
        <thead><tr><th>Code</th><th>Guest</th><th>Room</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          ${recent
            .map(
              (b) => `<tr>
                <td class="no-wrap">${escapeHtml(b.code)}</td>
                <td>${escapeHtml(b.firstName)} ${escapeHtml(b.lastName)}</td>
                <td>${escapeHtml(b.roomName)}</td>
                <td class="no-wrap">${formatDate(b.checkIn, "short")} → ${formatDate(b.checkOut, "short")}</td>
                <td class="no-wrap">${naira(b.total)}</td>
                <td>${statusBadge(b.status)}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>`
    : `<div class="empty" style="border:0"><p class="mb-0">No bookings yet.</p></div>`;

  const today2 = new Date().toISOString().slice(0, 10);
  const occupancyRows = currentRooms().map((room) => {
    const left = availableUnits(room, today2, addOne(today2), list);
    const used = (Number(room.units) || 0) - left;
    const pct = room.units ? Math.round((used / room.units) * 100) : 0;
    return { room, used, left, pct };
  });

  qs("#occupancyTable").innerHTML = `
    <table class="data">
      <thead><tr><th>Room type</th><th>Units</th><th>Occupied</th><th>Availability</th></tr></thead>
      <tbody>
        ${occupancyRows
          .map(
            (r) => `<tr>
              <td>${escapeHtml(r.room.name)}</td>
              <td>${r.room.units}</td>
              <td>${r.used}</td>
              <td>
                <div class="row" style="gap:8px; flex-wrap:nowrap">
                  <div style="flex:1; height:8px; border-radius:99px; background:var(--surface-2); overflow:hidden">
                    <div style="width:${r.pct}%; height:100%; background:var(--accent)"></div>
                  </div>
                  <span class="text-xs muted no-wrap">${r.pct}%</span>
                </div>
              </td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
}

function addOne(iso) {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function filteredBookings() {
  const status = qs("#statusFilter").value;
  const term = qs("#searchBookings").value.trim().toLowerCase();
  return bookings.all().filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (!term) return true;
    return [b.code, b.firstName, b.lastName, b.roomName, b.email]
      .join(" ")
      .toLowerCase()
      .includes(term);
  });
}

function renderBookings() {
  const list = filteredBookings();
  const container = qs("#bookingsTable");

  if (list.length === 0) {
    container.innerHTML = `<div class="empty" style="border:0"><p class="mb-0">No bookings match this filter.</p></div>`;
    return;
  }

  container.innerHTML = `
    <table class="data">
      <thead>
        <tr>
          <th>Code</th><th>Guest</th><th>Room</th><th>Dates</th><th>Guests</th>
          <th>Total</th><th>Payment</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map(
            (b) => `<tr>
              <td class="no-wrap"><b>${escapeHtml(b.code)}</b><br /><span class="text-xs muted">${escapeHtml(
              b.email,
            )}</span></td>
              <td>${escapeHtml(b.firstName)} ${escapeHtml(b.lastName)}<br /><span class="text-xs muted">${escapeHtml(
                b.phone,
              )}</span></td>
              <td>${escapeHtml(b.roomName)}<br /><span class="text-xs muted">${b.quantity} room${
              b.quantity > 1 ? "s" : ""
            }</span></td>
              <td class="no-wrap">${formatDate(b.checkIn, "short")}<br /><span class="text-xs muted">→ ${formatDate(
              b.checkOut,
              "short",
            )}</span></td>
              <td>${b.adults}${
              b.children ? `+${b.children}` : ""
            }</td>
              <td class="no-wrap">${naira(b.total)}</td>
              <td><span class="badge badge--${b.paymentStatus === "paid" ? "paid" : "pending"}">${
              b.paymentStatus === "paid" ? "Paid" : "Unpaid"
            }</span></td>
              <td>
                <select class="select" data-status-for="${escapeHtml(b.id)}" style="padding:6px 26px 6px 8px; font-size:.8rem">
                  ${STATUS_OPTIONS.map(
                    (s) => `<option value="${s}" ${b.status === s ? "selected" : ""}>${s}</option>`,
                  ).join("")}
                </select>
              </td>
              <td>
                <div class="row" style="gap:6px; flex-wrap:nowrap">
                  <a class="btn btn--sm btn--ghost" href="booking.html?room=${escapeHtml(
                    b.roomId,
                  )}&checkIn=${escapeHtml(b.checkIn)}&checkOut=${escapeHtml(b.checkOut)}">Re-book</a>
                  <button class="btn btn--sm btn--danger" type="button" data-delete="${escapeHtml(
                    b.id,
                  )}">Delete</button>
                </div>
              </td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;

  qsa("[data-status-for]").forEach((select) => {
    select.addEventListener("change", () => {
      bookings.update(select.dataset.statusFor, { status: select.value });
      toast(`Booking ${select.dataset.statusFor} set to ${select.value}.`, "success");
      renderOverview();
    });
  });

  qsa("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("Delete this booking permanently?")) return;
      bookings.remove(button.dataset.delete);
      toast("Booking deleted.");
      renderBookings();
      renderOverview();
    });
  });
}

function renderRooms() {
  const list = currentRooms();

  qs("#roomsGrid").innerHTML = list
    .map(
      (r) => `
      <div class="panel" data-room="${escapeHtml(r.id)}">
        <div class="row" style="align-items:flex-start; gap:16px; flex-wrap:nowrap">
          <div style="width:120px; flex:none; border-radius:12px; overflow:hidden; border:1px solid var(--line)">
            <img src="${r.image}" alt="${escapeHtml(r.name)}" style="width:100%; aspect-ratio:4/3; object-fit:cover" />
          </div>
          <div class="grow">
            <b style="font-family:var(--serif);font-size:1.1rem">${escapeHtml(r.name)}</b>
            <div class="text-xs muted">${escapeHtml(r.type)} · ${r.size} m² · sleeps ${r.maxGuests}</div>
          </div>
          <span class="price" style="font-size:1.2rem">${naira(r.rate)}</span>
        </div>

        <hr class="divider" />

        <div class="field-row">
          <label class="field">
            <span class="field__label">Nightly rate (₦)</span>
            <input class="input" type="number" min="0" step="1000" data-rate="${escapeHtml(r.id)}" value="${r.rate}" />
          </label>
          <label class="field">
            <span class="field__label">Units available</span>
            <input class="input" type="number" min="0" max="50" data-units="${escapeHtml(r.id)}" value="${r.units}" />
          </label>
        </div>

        <label class="field">
          <span class="field__label">Room photo</span>
          <input class="input" type="file" accept="image/*" data-photo="${escapeHtml(r.id)}" />
          <span class="field__hint">PNG or JPG under 1 MB. Saved in this browser as a data URL.</span>
        </label>

        <div class="row row--end">
          <button class="btn btn--sm" type="button" data-save-room="${escapeHtml(r.id)}">Save changes</button>
        </div>
      </div>`,
    )
    .join("");

  qsa("[data-save-room]").forEach((button) => {
    button.addEventListener("click", () => saveRoom(button.dataset.saveRoom));
  });

  qsa("[data-photo]").forEach((input) => {
    input.addEventListener("change", () => handlePhoto(input));
  });
}

function saveRoom(id) {
  const list = currentRooms();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return;

  const rate = Number(qs(`[data-rate="${id}"]`).value);
  const units = Number(qs(`[data-units="${id}"]`).value);
  list[index] = { ...list[index], rate: Math.max(0, rate), units: Math.max(0, units) };

  const photo = qs(`[data-photo="${id}"]`).dataset.newImage;
  if (photo) list[index].image = photo;

  admin.saveRooms(list);
  toast(`${list[index].name} updated.`, "success");
  renderRooms();
  renderOverview();
}

function handlePhoto(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    toast("Photo must be under 1 MB.", "danger");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    input.dataset.newImage = reader.result;
    const image = input.closest(".panel").querySelector("img");
    if (image) image.src = reader.result;
    toast("Photo loaded — remember to save the room.");
  };
  reader.readAsDataURL(file);
}

function renderEnquiries() {
  const list = enquiries.all();
  const container = qs("#enquiriesTable");
  if (list.length === 0) {
    container.innerHTML = `<div class="empty" style="border:0"><p class="mb-0">No enquiries yet.</p></div>`;
    return;
  }
  container.innerHTML = `
    <table class="data">
      <thead><tr><th>Received</th><th>Name</th><th>Contact</th><th>Topic</th><th>Message</th><th>Actions</th></tr></thead>
      <tbody>
        ${list
          .map(
            (e) => `<tr>
              <td class="no-wrap">${new Date(e.createdAt).toLocaleString()}</td>
              <td>${escapeHtml(e.name)}</td>
              <td>${escapeHtml(e.phone)}<br /><span class="text-xs muted">${escapeHtml(e.email)}</span></td>
              <td>${escapeHtml(e.topic)}</td>
              <td style="max-width:320px">${escapeHtml(e.message)}</td>
              <td>
                <div class="row" style="gap:6px; flex-wrap:nowrap">
                  <a class="btn btn--sm btn--ghost" href="https://wa.me/2347041482947?text=${encodeURIComponent(
                    `Hello ${e.name}, thank you for your enquiry about ${e.topic}.`,
                  )}" target="_blank" rel="noopener">Reply</a>
                  <button class="btn btn--sm btn--danger" type="button" data-delete-enquiry="${escapeHtml(
                    e.id,
                  )}">Delete</button>
                </div>
              </td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;

  qsa("[data-delete-enquiry]").forEach((button) => {
    button.addEventListener("click", () => {
      const list2 = enquiries.all().filter((e) => e.id !== button.dataset.deleteEnquiry);
      window.localStorage.setItem(KEYS.enquiries, JSON.stringify(list2));
      toast("Enquiry deleted.");
      renderEnquiries();
    });
  });
}

function renderSettings() {
  const info = effectiveHotel();
  qs("#infoPhone").value = info.phone;
  qs("#infoEmail").value = info.email;
  qs("#infoAddress").value = info.address;
  qs("#infoCheckIn").value = info.checkInTime;
  qs("#infoCheckOut").value = info.checkOutTime;
}

/* ---------- tabs ---------- */

function showTab(name) {
  qsa("[data-view]").forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
  qsa(".navlink[data-tab]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.tab === name);
  });
  qs("#tabTitle").textContent = TABS[name][0];
  qs("#tabSubtitle").textContent = TABS[name][1];

  if (name === "overview") renderOverview();
  if (name === "bookings") renderBookings();
  if (name === "rooms") renderRooms();
  if (name === "enquiries") renderEnquiries();
  if (name === "settings") renderSettings();
}

/* ---------- export ---------- */

function bookingHeaders() {
  return [
    { label: "Code", get: (b) => b.code },
    { label: "Created", get: (b) => b.createdAt },
    { label: "Room", get: (b) => b.roomName },
    { label: "Check in", get: (b) => b.checkIn },
    { label: "Check out", get: (b) => b.checkOut },
    { label: "Nights", get: (b) => b.nights },
    { label: "Adults", get: (b) => b.adults },
    { label: "Children", get: (b) => b.children },
    { label: "Quantity", get: (b) => b.quantity },
    { label: "First name", get: (b) => b.firstName },
    { label: "Last name", get: (b) => b.lastName },
    { label: "Email", get: (b) => b.email },
    { label: "Phone", get: (b) => b.phone },
    { label: "Subtotal", get: (b) => b.subtotal },
    { label: "Extras", get: (b) => b.extrasTotal },
    { label: "Discount", get: (b) => b.discount },
    { label: "VAT", get: (b) => b.vat },
    { label: "Total", get: (b) => b.total },
    { label: "Payment method", get: (b) => b.paymentMethod },
    { label: "Payment status", get: (b) => b.paymentStatus },
    { label: "Status", get: (b) => b.status },
  ];
}

function exportBookingsCsv() {
  const list = bookings.all();
  if (list.length === 0) {
    toast("No bookings to export.", "warn");
    return;
  }
  downloadFile(
    `dabara-bookings-${new Date().toISOString().slice(0, 10)}.csv`,
    toCSV(list, bookingHeaders()),
    "text/csv",
  );
  toast("Bookings exported.");
}

/* ---------- auth ---------- */

function initAuth() {
  const login = qs("#loginScreen");
  const dashboard = qs("#dashboard");

  const signedIn = admin.session();
  if (signedIn) {
    login.hidden = true;
    dashboard.hidden = false;
    showTab("overview");
  } else {
    login.hidden = false;
    dashboard.hidden = true;
  }

  qs("#signIn").addEventListener("click", () => {
    const value = qs("#passcode").value.trim();
    if (value === HOTEL.adminPasscode) {
      admin.signIn();
      login.hidden = true;
      dashboard.hidden = false;
      qs("#passcode").value = "";
      showTab("overview");
      toast("Welcome back.", "success");
    } else {
      qs("#loginError").innerHTML = `<div class="alert alert--danger mb-2">${icon(
        "shield",
      )}<span>That passcode is not correct. Try again.</span></div>`;
    }
  });

  qs("#passcode").addEventListener("keydown", (event) => {
    if (event.key === "Enter") qs("#signIn").click();
  });

  qs("#signOut").addEventListener("click", () => {
    admin.signOut();
    window.location.reload();
  });
}

/* ---------- init ---------- */

function initThemeButton() {
  const button = qs("#adminTheme");
  const paint = () => {
    button.innerHTML = icon("sparkle");
  };
  paint();
  button.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    theme.set(next);
    document.documentElement.setAttribute("data-theme", next);
  });
}

function init() {
  initAuth();
  initThemeButton();

  qsa(".navlink[data-tab]").forEach((link) => {
    link.addEventListener("click", () => showTab(link.dataset.tab));
  });

  qs("#statusFilter").addEventListener("change", renderBookings);
  qs("#searchBookings").addEventListener("input", renderBookings);
  qs("#exportBookings").addEventListener("click", exportBookingsCsv);
  qs("#exportAll").addEventListener("click", exportBookingsCsv);

  qs("#resetRooms").addEventListener("click", () => {
    if (!window.confirm("Reset all room rates, counts and photos to defaults?")) return;
    remove(KEYS.adminRooms);
    renderRooms();
    renderOverview();
    toast("Rooms reset to defaults.");
  });

  qs("#infoForm").addEventListener("submit", (event) => {
    event.preventDefault();
    admin.saveHotelInfo({
      phone: qs("#infoPhone").value.trim(),
      email: qs("#infoEmail").value.trim(),
      address: qs("#infoAddress").value.trim(),
      checkInTime: qs("#infoCheckIn").value.trim(),
      checkOutTime: qs("#infoCheckOut").value.trim(),
    });
    toast("Hotel information saved.", "success");
  });

  qs("#clearData").addEventListener("click", () => {
    if (!window.confirm("This removes every booking, enquiry and room change. Continue?")) return;
    [KEYS.bookings, KEYS.enquiries, KEYS.adminRooms, KEYS.hotelInfo, KEYS.guest, KEYS.favourites].forEach(
      (key) => remove(key),
    );
    toast("All local data cleared.");
    showTab("overview");
  });
}

document.addEventListener("DOMContentLoaded", init);
