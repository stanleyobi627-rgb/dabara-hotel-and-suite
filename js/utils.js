import { HOTEL, EXTRAS, PROMOS } from "./data.js";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* ---------- dates ---------- */

export function todayISO() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return toISO(now);
}

export function toISO(date) {
  const d = new Date(date);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseISO(value) {
  if (!value) return null;
  const [y, m, d] = String(value).split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(value, days) {
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function nightsBetween(checkIn, checkOut) {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (!start || !end) return 0;
  const diff = Math.round((end - start) / 86400000);
  return diff > 0 ? diff : 0;
}

export function formatDate(value, style = "medium") {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!date) return "—";
  if (style === "short") {
    return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
  }
  if (style === "long") {
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  if (style === "day") {
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function isWeekend(value) {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!date) return false;
  const day = date.getDay();
  return day === 0 || day === 5 || day === 6;
}

export function setMinDate(input, value) {
  if (!input) return;
  const min = value || todayISO();
  input.min = min;
  input.value = min;
}

/* ---------- money ---------- */

export function naira(amount) {
  const value = Number(amount) || 0;
  return `${HOTEL.currency}${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function nairaPlain(amount) {
  return (Number(amount) || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

/* ---------- availability ---------- */

export function dateRangesOverlap(startA, endA, startB, endB) {
  const a1 = parseISO(startA);
  const a2 = parseISO(endA);
  const b1 = parseISO(startB);
  const b2 = parseISO(endB);
  if (!a1 || !a2 || !b1 || !b2) return false;
  return a1 < b2 && b1 < a2;
}

export function bookedUnits(roomId, checkIn, checkOut, allBookings) {
  const list = allBookings || [];
  return list
    .filter((b) => b.roomId === roomId)
    .filter((b) => b.status !== "cancelled")
    .filter((b) => dateRangesOverlap(checkIn, checkOut, b.checkIn, b.checkOut))
    .reduce((total, b) => total + (Number(b.quantity) || 1), 0);
}

export function availableUnits(room, checkIn, checkOut, allBookings) {
  const total = Number(room.units) || 0;
  const used = bookedUnits(room.id, checkIn, checkOut, allBookings);
  return Math.max(0, total - used);
}

/* ---------- pricing ---------- */

export function findPromo(code) {
  if (!code) return null;
  const clean = String(code).trim().toUpperCase();
  return PROMOS.find((p) => p.code === clean) || null;
}

export function extraById(id) {
  return EXTRAS.find((e) => e.id === id) || null;
}

export function calculateTotal({ room, checkIn, checkOut, quantity = 1, extras = [], promoCode = "" }) {
  const nights = nightsBetween(checkIn, checkOut);
  const rate = Number(room?.rate) || 0;
  const qty = Math.max(1, Number(quantity) || 1);
  const subtotal = rate * nights * qty;

  const extraLines = (extras || [])
    .map((id) => extraById(id))
    .filter(Boolean)
    .map((extra) => ({ ...extra, total: extra.price * (extra.id === "bed" ? nights * qty : qty) }));
  const extrasTotal = extraLines.reduce((sum, line) => sum + line.total, 0);

  const promo = findPromo(promoCode);
  let discount = 0;
  let promoLabel = "";
  if (promo) {
    if (promo.type === "percent") {
      discount = Math.round(((subtotal + extrasTotal) * promo.value) / 100);
    } else {
      discount = Math.min(promo.value, subtotal + extrasTotal);
    }
    promoLabel = promo.label;
  }

  const taxable = Math.max(0, subtotal + extrasTotal - discount);
  const vat = Math.round(taxable * HOTEL.vatRate);
  const total = taxable + vat;

  return {
    nights,
    rate,
    quantity: qty,
    subtotal,
    extraLines,
    extrasTotal,
    promo,
    promoLabel,
    discount,
    vat,
    vatRate: HOTEL.vatRate,
    total,
  };
}

/* ---------- ids & misc ---------- */

export function bookingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 3; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DAB-${out}${String(Date.now()).slice(-4)}`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function param(name) {
  const value = new URLSearchParams(window.location.search).get(name);
  return value ? decodeURIComponent(value) : "";
}

export function setParam(name, value, { replace = true } = {}) {
  const url = new URL(window.location.href);
  if (value === null || value === undefined || value === "") url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
}

export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function toast(message, kind = "info") {
  let host = qs("#toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  const item = document.createElement("div");
  item.className = `toast toast--${kind}`;
  item.setAttribute("role", "status");
  item.textContent = message;
  host.appendChild(item);
  window.setTimeout(() => {
    item.classList.add("is-leaving");
    window.setTimeout(() => item.remove(), 300);
  }, 3200);
}

export function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCSV(rows, headers) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const head = headers.map((h) => escape(h.label)).join(",");
  const body = rows.map((row) => headers.map((h) => escape(h.get(row))).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function calendarEvent({ title, description, location, start, end }) {
  const stamp = (value) => {
    const date = parseISO(value) || new Date(value);
    if (!date) return "";
    return `${date.getFullYear()}${`${date.getMonth() + 1}`.padStart(2, "0")}${`${date.getDate()}`.padStart(2, "0")}`;
  };
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dabara Hotel and Suite//Booking//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${stamp(start)}`,
    `DTEND;VALUE=DATE:${stamp(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function whatsappLink(message) {
  return `https://wa.me/${HOTEL.whatsapp}?text=${encodeURIComponent(message)}`;
}
