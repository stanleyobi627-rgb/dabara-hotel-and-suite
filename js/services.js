import { SERVICES, EXTRAS } from "./data.js";
import { naira, qs } from "./utils.js";
import { icon } from "./icons.js";

const EVENTS = [
  {
    icon: "gift",
    title: "Weddings & receptions",
    text: "Full reception planning for up to 300 guests — decor, catering, MC, and a bridal suite on the night.",
  },
  {
    icon: "conference",
    title: "Corporate retreats",
    text: "Half-day or full-day packages with break-out rooms, stationery, lunch and a coffee station.",
  },
  {
    icon: "users",
    title: "Private dining",
    text: "The rooftop terrace seats fourteen for dinner, with a set menu from the Iroko kitchen.",
  },
];

const INCLUDED = [
  { icon: "wifi", title: "Fibre Wi-Fi", text: "High-speed internet in every room and public area." },
  { icon: "parking", title: "Free parking", text: "Guarded on-site parking for 40 vehicles, valet on request." },
  { icon: "shield", title: "24-hour security", text: "CCTV coverage, night security and safe boxes in every room." },
  { icon: "laundry", title: "Laundry service", text: "Same-day washing and pressing, charged per kilogram." },
];

function serviceCard(service) {
  return `
    <article class="panel" id="${service.id}" style="scroll-margin-top:100px">
      <div class="row" style="align-items:flex-start; gap:18px; flex-wrap:nowrap">
        <div style="width:150px; flex:none; border-radius:16px; overflow:hidden; border:1px solid var(--line)">
          <img src="${service.image}" alt="${service.name}" style="width:100%; aspect-ratio:1; object-fit:cover" loading="lazy" />
        </div>
        <div class="grow">
          <div class="row row--between" style="align-items:flex-start">
            <h2 class="panel__title" style="margin:0">${service.name}</h2>
            <span class="badge">${service.price ? `from ${naira(service.price)}` : "Complimentary"}</span>
          </div>
          <p class="text-sm muted" style="margin:6px 0 10px">${service.duration}</p>
          <p>${service.description}</p>
          <ul class="service__includes">
            ${service.includes.map((i) => `<li>${icon("check")}<span>${i}</span></li>`).join("")}
          </ul>
          <a class="link-arrow" href="contact.html">Enquire about this service ${icon("arrow")}</a>
        </div>
      </div>
    </article>`;
}

function renderServices() {
  qs("#services-grid").innerHTML = SERVICES.map(serviceCard).join("");
}

function renderExtras() {
  qs("#extras-grid").innerHTML = EXTRAS.map(
    (e) => `
    <div class="feature">
      <div class="feature__icon">${icon("sparkle")}</div>
      <h3>${e.name}</h3>
      <p class="text-sm muted">${e.note}</p>
      <div class="price mt-2" style="font-size:1.3rem">${naira(e.price)}</div>
    </div>`,
  ).join("");
}

function renderEvents() {
  qs("#events-grid").innerHTML = EVENTS.map(
    (e) => `
    <div class="feature">
      <div class="feature__icon">${icon(e.icon)}</div>
      <h3>${e.title}</h3>
      <p>${e.text}</p>
    </div>`,
  ).join("");
}

function renderIncluded() {
  qs("#included-grid").innerHTML = INCLUDED.map(
    (i) => `
    <div class="feature">
      <div class="feature__icon">${icon(i.icon)}</div>
      <h3>${i.title}</h3>
      <p>${i.text}</p>
    </div>`,
  ).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderServices();
  renderExtras();
  renderEvents();
  renderIncluded();
});
