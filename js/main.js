import { getHotel } from "./hotel-store.js";

const HOTEL = getHotel();
import { icon, iconFilled } from "./icons.js";
import { theme, bookings } from "./storage.js";
import { qs, qsa } from "./utils.js";

const NAV = [
  { label: "Home", href: "index.html" },
  { label: "Rooms", href: "rooms.html" },
  { label: "Our Services", href: "services.html" },
  { label: "Reviews", href: "reviews.html" },
  { label: "Contact", href: "contact.html" },
  { label: "My Bookings", href: "my-bookings.html" },
];

function currentPage() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  return file === "" ? "index.html" : file;
}

function headerMarkup() {
  const page = currentPage();
  const links = NAV.map(
    (item) =>
      `<a href="${item.href}" class="${page === item.href ? "is-active" : ""}">${item.label}</a>`,
  ).join("");

  return `
    <div class="container site-header__inner">
      <a class="brand" href="index.html" aria-label="${HOTEL.name} home">
        <span class="brand__mark">D</span>
        <span>
          <span class="brand__name">Dabara</span>
          <span class="brand__sub">Hotel &amp; Suites</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="Primary">${links}</nav>
      <div class="header-actions">
        <button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">
          ${icon("sparkle")}
        </button>
        <a class="btn btn--sm hide-sm" href="booking.html">Book a room</a>
        <button class="icon-btn nav-toggle" id="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">${icon("menu")}</button>
      </div>
    </div>
    <div class="mobile-nav" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden="true">
      <div class="mobile-nav__panel">
        <div class="mobile-nav__head">
          <a class="brand" href="index.html">
            <span class="brand__mark">D</span>
            <span>
              <span class="brand__name">Dabara</span>
              <span class="brand__sub">Hotel &amp; Suites</span>
            </span>
          </a>
          <button class="icon-btn" id="nav-close" type="button" aria-label="Close menu">${icon("close")}</button>
        </div>
        <nav class="mobile-nav__links" aria-label="Mobile">
          ${NAV.map(
            (item) =>
              `<a href="${item.href}" class="${page === item.href ? "is-active" : ""}"><span>${item.label}</span><span class="mobile-nav__arrow">${icon("arrow")}</span></a>`,
          ).join("")}
        </nav>
        <div class="mobile-nav__foot">
          <a class="btn btn--lg mobile-nav__cta" href="booking.html">Book a room</a>
          <a class="mobile-nav__link-small" href="admin.html">Staff dashboard</a>
          <p class="mobile-nav__contact">
            Questions? <a href="tel:${HOTEL.phoneRaw}">${HOTEL.phone}</a>
          </p>
        </div>
      </div>
    </div>`;
}

function footerMarkup() {
  const year = new Date().getFullYear();
  return `
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html">
            <span class="brand__mark">D</span>
            <span>
              <span class="brand__name">Dabara</span>
              <span class="brand__sub">Hotel &amp; Suites</span>
            </span>
          </a>
          <p>${HOTEL.about}</p>
          <div class="socials mt-2">
            <a href="https://wa.me/${HOTEL.whatsapp}" aria-label="WhatsApp" title="WhatsApp">${icon("chat")}</a>
            <a href="tel:${HOTEL.phoneRaw}" aria-label="Call us" title="Call us">${icon("phone")}</a>
            <a href="mailto:${HOTEL.email}" aria-label="Email us" title="Email us">${icon("mail")}</a>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${HOTEL.address} ${HOTEL.plusCode}`,
            )}" aria-label="Find us" title="Find us" rel="noopener">${icon("pin")}</a>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <ul class="footer-links">
            <li><a href="rooms.html">Rooms &amp; suites</a></li>
            <li><a href="services.html">Our Services</a></li>
            <li><a href="booking.html">Book a stay</a></li>
            <li><a href="my-bookings.html">My bookings</a></li>
            <li><a href="contact.html">Contact us</a></li>
          </ul>
        </div>
        <div>
          <h4>Guests</h4>
          <ul class="footer-links">
            <li><a href="contact.html#faq">FAQ</a></li>
            <li><a href="services.html#restaurant">Restaurant &amp; Bar</a></li>
            <li><a href="services.html#pool">Outdoor Swimming Pool</a></li>
            <li><a href="services.html#hottub">Hot Tub</a></li>
            <li><a href="services.html#gym">Fitness Centre</a></li>
            <li><a href="services.html#events">Events &amp; Banquets</a></li>
            <li><a href="contact.html#faq">Cancellation policy</a></li>
          </ul>
        </div>
        <div>
          <h4>Reach us</h4>
          <ul class="footer-links">
            <li>${HOTEL.address}</li>
            <li>Plus code ${HOTEL.plusCode}</li>
            <li><a href="tel:${HOTEL.phoneRaw}">${HOTEL.phone}</a></li>
            <li><a href="mailto:${HOTEL.email}">${HOTEL.email}</a></li>
            <li>Check-in ${HOTEL.checkInTime} · Check-out ${HOTEL.checkOutTime}</li>
            <li><a href="admin.html">Staff dashboard</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${year} ${HOTEL.name}. All rights reserved.</span>
        <span>${HOTEL.city}, ${HOTEL.state} · ${HOTEL.country}</span>
      </div>
    </div>`;
}

function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  const meta = qs('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", mode === "dark" ? "#0b1220" : "#faf7f1");
}

export function initChrome() {
  const header = qs("#site-header");
  const footer = qs("#site-footer");
  if (header) header.innerHTML = headerMarkup();
  if (footer) footer.innerHTML = footerMarkup();

  applyTheme(theme.get());

  const toggle = qs("#theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      theme.set(next);
      applyTheme(next);
    });
  }

  const nav = qs("#mobile-nav");
  const openBtn = qs("#nav-toggle");
  const closeBtn = qs("#nav-close");
  let lastFocus = null;

  // The sticky header's backdrop-filter creates a containing block, which would
  // trap this fixed-position menu inside the 74px header. Move it to <body>.
  if (nav && nav.parentElement !== document.body) {
    document.body.appendChild(nav);
  }

  const setNav = (open) => {
    if (!nav) return;
    nav.classList.toggle("is-open", open);
    nav.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("is-locked", open);
    if (openBtn) openBtn.setAttribute("aria-expanded", open ? "true" : "false");

    if (open) {
      lastFocus = openBtn || document.activeElement;
      closeBtn?.focus();
    } else {
      if (lastFocus instanceof HTMLElement && document.contains(lastFocus)) lastFocus.focus();
      lastFocus = null;
    }
  };

  if (openBtn) openBtn.addEventListener("click", () => setNav(true));
  if (closeBtn) closeBtn.addEventListener("click", () => setNav(false));
  if (nav) {
    qsa("a", nav).forEach((link) => link.addEventListener("click", () => setNav(false)));

    nav.addEventListener("click", (event) => {
      if (event.target === nav) setNav(false);
    });

    nav.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusables = qsa("a, button", nav).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("is-open")) setNav(false);
  });

  const headerEl = qs(".site-header");
  if (headerEl) {
    const onScroll = () => headerEl.classList.toggle("is-stuck", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
}

export function bookingCount() {
  return bookings.all().filter((b) => b.status !== "cancelled").length;
}

export function starRow(rating, count) {
  return `<span class="rating">${iconFilled("star")} ${rating.toFixed(1)}${
    count ? ` <small>(${count} reviews)</small>` : ""
  }</span>`;
}

export function amenityChips(ids, allAmenities, limit = 4) {
  const list = ids
    .map((id) => allAmenities.find((a) => a.id === id))
    .filter(Boolean)
    .slice(0, limit);
  return `<div class="chip-list">${list
    .map((a) => `<span class="chip">${icon(a.id)}${a.label}</span>`)
    .join("")}</div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  initChrome();
});
