import { FAQ } from "./data.js";
import { getHotel } from "./hotel-store.js";

const HOTEL = getHotel();
import { enquiries } from "./storage.js";
import { escapeHtml, qs, toast } from "./utils.js";
import { icon } from "./icons.js";

const CARDS = [
  {
    icon: "phone",
    title: "Call the front desk",
    body: HOTEL.phone,
    href: `tel:${HOTEL.phoneRaw}`,
    cta: "Call now",
  },
  {
    icon: "chat",
    title: "WhatsApp us",
    body: "Fastest way to reach us — usually answered within minutes.",
    href: `https://wa.me/${HOTEL.whatsapp}`,
    cta: "Open WhatsApp",
  },
  {
    icon: "mail",
    title: "Email reservations",
    body: HOTEL.email,
    href: `mailto:${HOTEL.email}`,
    cta: "Send an email",
  },
];

function renderCards() {
  qs("#contact-cards").innerHTML = CARDS.map(
    (c) => `
    <div class="contact-card">
      <div class="contact-card__icon">${icon(c.icon)}</div>
      <div class="grow">
        <b>${c.title}</b>
        <p>${escapeHtml(c.body)}</p>
      </div>
      <a class="btn btn--sm btn--ghost" href="${c.href}" target="_blank" rel="noopener">${c.cta}</a>
    </div>`,
  ).join("");
}

function renderDetails() {
  qs("#address-list").innerHTML = `
    <li>${icon("pin")}<span>${HOTEL.address}<br />Plus code ${HOTEL.plusCode}</span></li>
    <li>${icon("clock")}<span>Front desk open 24 hours<br />Check-in ${HOTEL.checkInTime} · Check-out ${HOTEL.checkOutTime}</span></li>
    <li>${icon("phone")}<span><a href="tel:${HOTEL.phoneRaw}">${HOTEL.phone}</a></span></li>
    <li>${icon("mail")}<span><a href="mailto:${HOTEL.email}">${HOTEL.email}</a></span></li>`;

  qs("#landmark-list").innerHTML = HOTEL.landmarks
    .map((l) => `<li>${icon("check")}<span>${l}</span></li>`)
    .join("");

  qs("#map-title").textContent = HOTEL.name;
  qs("#map-address").textContent = HOTEL.address;
  qs("#map-link").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${HOTEL.address} ${HOTEL.plusCode}`,
  )}`;
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

function initForm() {
  const form = qs("#enquiryForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const item = enquiries.add({
      id: `enq_${Date.now()}`,
      name: qs("#name").value.trim(),
      phone: qs("#phone").value.trim(),
      email: qs("#email").value.trim(),
      topic: qs("#topic").value,
      message: qs("#message").value.trim(),
      createdAt: new Date().toISOString(),
      status: "new",
    });

    qs("#enquiryResult").innerHTML = `
      <div class="alert alert--success">
        ${icon("check")}
        <span><b>Thank you, ${escapeHtml(item.name.split(" ")[0])}.</b> Your enquiry about
        “${escapeHtml(item.topic)}” has been received. Our team will reach you on
        ${escapeHtml(item.phone)} within the day.</span>
      </div>`;

    form.reset();
    toast("Enquiry sent. We will be in touch shortly.", "success");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCards();
  renderDetails();
  renderFaq();
  initForm();
});
