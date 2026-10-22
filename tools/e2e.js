/**
 * End-to-end browser test.
 *
 * Launches headless Chrome with the DevTools Protocol, drives the real pages
 * (booking flow, my bookings, admin dashboard) and asserts on what the DOM
 * actually contains.
 *
 * Usage:  node tools/e2e.js
 * Requires the site to be served on http://localhost:5173
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const PORT = 9222;
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(
      `  FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`,
    );
  }
}

function checkTrue(label, actual) {
  check(label, Boolean(actual), true);
}

/* ---------- devtools plumbing ---------- */

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        const handlers = this.events.get(msg.method) || [];
        handlers.forEach((h) => h(msg.params));
      }
    });
  }

  send(method, params = {}) {
    this.id += 1;
    const id = this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 20000);
    });
  }

  on(method, handler) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method).push(handler);
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || "evaluate failed");
    }
    return result.result.value;
  }

  async goto(url) {
    const loaded = new Promise((resolve) => this.on("Page.loadEventFired", resolve));
    await this.send("Page.navigate", { url });
    await loaded;
    await sleep(600);
  }
}

async function connect() {
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=C:\\Users\\TOSHIBA\\AppData\\Local\\Temp\\opencode\\chrome-e2e",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let target = null;
  for (let i = 0; i < 40; i += 1) {
    await sleep(300);
    try {
      const res = await fetch(`http://localhost:${PORT}/json/new?${encodeURIComponent(BASE)}`, {
        method: "PUT",
      });
      if (res.ok) {
        target = await res.json();
        break;
      }
    } catch {
      /* chrome not up yet */
    }
  }
  if (!target) {
    chrome.kill();
    throw new Error("Could not connect to Chrome DevTools");
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  cdp.on("Page.javascriptDialogOpening", () => {
    cdp.send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
  });
  return { cdp, chrome };
}

/* ---------- test run ---------- */

const { cdp, chrome } = await connect();

console.log("\nDabara Hotel and Suites — end-to-end browser test\n");

/* 0. start from a clean browser state */
await cdp.goto(`${BASE}/index.html`);
await cdp.evaluate("localStorage.clear()");
await cdp.goto(`${BASE}/index.html`);

/* 1. home page renders */
check("home: feature grid populated", await cdp.evaluate('document.querySelectorAll("#feature-grid .feature").length'), 8);
check("home: rooms preview populated", await cdp.evaluate('document.querySelectorAll("#featured-rooms .card").length'), 3);
checkTrue("home: header injected", await cdp.evaluate('!!document.querySelector(".site-nav a")'));
checkTrue("home: footer injected", await cdp.evaluate('!!document.querySelector(".site-footer .brand")'));
check(
  "home: search bar defaults to today",
  await cdp.evaluate('document.querySelector("#checkIn").value === new Date().toISOString().slice(0,10)'),
  true,
);
checkTrue(
  "home: hero badge shows the real rating",
  await cdp.evaluate('document.querySelector("#hero-badge").textContent.includes("4.4") && document.querySelector("#hero-badge").textContent.includes("Nnewi")'),
);
checkTrue(
  "home: 68 rooms advertised",
  await cdp.evaluate('[...document.querySelectorAll(".hero__stat b")].some(b => b.textContent.trim() === "68")'),
);
checkTrue(
  "home: footer shows the Nnewi address",
  await cdp.evaluate('document.querySelector(".site-footer").textContent.includes("Ozubulu Road")'),
);
checkTrue(
  "home: footer shows the real phone number",
  await cdp.evaluate('document.querySelector(".site-footer").textContent.includes("0806 446 3317")'),
);

/* 2. rooms page filtering */
await cdp.goto(`${BASE}/rooms.html`);
check("rooms: all 3 categories listed", await cdp.evaluate('document.querySelectorAll("#room-grid .card").length'), 3);
await cdp.evaluate(`
  (() => {
    const sel = document.querySelector("#price");
    sel.value = "70000";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#filter-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  })()
`);
await sleep(400);
check("rooms: price filter applies", await cdp.evaluate('document.querySelectorAll("#room-grid .card").length'), 1);
checkTrue("rooms: url reflects filters", await cdp.evaluate('location.search.includes("price=70000")'));

/* 3. booking flow */
await cdp.goto(`${BASE}/booking.html?room=executive`);
check("booking: step 1 visible", await cdp.evaluate('!document.querySelector("[data-panel=\\"1\\"]").hidden'), true);
check("booking: executive selected", await cdp.evaluate('document.querySelector("#roomSelect").value'), "executive");
checkTrue("booking: summary shows a total", await cdp.evaluate('document.querySelector(".summary__row.is-total strong").textContent.includes("\\u20A6")'));

await cdp.evaluate(`
  (() => {
    const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); };
    const today = new Date();
    const in3 = new Date(); in3.setDate(in3.getDate() + 3);
    const fmt = (d) => d.toISOString().slice(0, 10);
    set("#checkIn", fmt(today));
    set("#checkOut", fmt(in3));
    document.querySelector("#quantity").value = "2";
    document.querySelector("#quantity").dispatchEvent(new Event("change", { bubbles: true }));
  })()
`);
await sleep(300);
const subtotalText = await cdp.evaluate(
  '[...document.querySelectorAll(".summary__row strong")].map(e=>e.textContent).find(t=>t.includes("\\u20A6"))',
);
check("booking: 2 rooms x 3 nights priced", subtotalText, "₦540,000");

await cdp.evaluate(`
  (() => {
    document.querySelector("#promoCode").value = "dabara10";
    document.querySelector("#applyPromo").click();
  })()
`);
await sleep(300);
checkTrue("booking: promo applied", await cdp.evaluate('document.querySelector("#promoMessage").textContent.includes("DABARA10")'));
checkTrue("booking: discount row present", await cdp.evaluate('!!document.querySelector(".summary__row.is-discount")'));

await cdp.evaluate('document.querySelector("#toStep2").click()');
await sleep(300);
check("booking: advanced to step 2", await cdp.evaluate('!document.querySelector("[data-panel=\\"2\\"]").hidden'), true);
check("booking: step 2 marked active", await cdp.evaluate('document.querySelector(".step[data-step=\\"2\\"]").classList.contains("is-active")'), true);

await cdp.evaluate(`
  (() => {
    document.querySelector("#firstName").value = "Ada";
    document.querySelector("#lastName").value = "Nwosu";
    document.querySelector("#email").value = "ada@example.com";
    document.querySelector("#phone").value = "+2348000000000";
    document.querySelector("#terms").checked = true;
    document.querySelector("#toStep3").click();
  })()
`);
await sleep(300);
check("booking: advanced to step 3", await cdp.evaluate('!document.querySelector("[data-panel=\\"3\\"]").hidden'), true);

await cdp.evaluate('document.querySelector("#confirmBooking").click()');
await sleep(400);
check("booking: advanced to step 4", await cdp.evaluate('!document.querySelector("[data-panel=\\"4\\"]").hidden'), true);
const code = await cdp.evaluate('document.querySelector(".confirm-code")?.textContent || ""');
checkTrue("booking: confirmation code generated", /^DAB-[A-Z]{3}\d{4}$/.test(code));
checkTrue("booking: guest name shown", await cdp.evaluate('document.querySelector("#confirmCard").textContent.includes("Ada")'));
check("booking: one booking stored", await cdp.evaluate('JSON.parse(localStorage.getItem("dabara_bookings") || "[]").length'), 1);
const stored = await cdp.evaluate('JSON.parse(localStorage.getItem("dabara_bookings"))[0]');
check("booking: 2 rooms recorded", stored.quantity, 2);
check("booking: 3 nights recorded", stored.nights, 3);
check("booking: total recorded", stored.total, Math.round((540000 - 54000) * 1.075));
check("booking: promo recorded", stored.promoCode, "DABARA10");
check("booking: guest recorded", stored.firstName, "Ada");

/* 4. my bookings page shows the booking */
await cdp.goto(`${BASE}/my-bookings.html`);
check("mybookings: one card rendered", await cdp.evaluate('document.querySelectorAll("[data-booking]").length'), 1);
checkTrue("mybookings: code visible", await cdp.evaluate('document.querySelector("[data-booking]").textContent.includes("Ada")'));
checkTrue("mybookings: whatsapp link built", await cdp.evaluate('!!document.querySelector("a[href*=\\"wa.me\\"]")'));
await cdp.evaluate('document.querySelector("[data-action=\\"cancel\\"]").click()');
await sleep(300);
check("mybookings: cancel updates status", await cdp.evaluate('JSON.parse(localStorage.getItem("dabara_bookings"))[0].status'), "cancelled");

/* 5. availability reacts to the booking */
await cdp.goto(`${BASE}/rooms.html`);
await cdp.evaluate(`
  (() => {
    const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); };
    const fmt = (d) => d.toISOString().slice(0, 10);
    const today = new Date(); const in5 = new Date(); in5.setDate(in5.getDate() + 5);
    set("#checkIn", fmt(today)); set("#checkOut", fmt(in5));
    document.querySelector("#filter-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  })()
`);
await sleep(400);
check("rooms: cancelled booking frees the unit again", await cdp.evaluate('document.querySelectorAll("#room-grid .card").length'), 3);

/* 6. admin dashboard */
await cdp.goto(`${BASE}/admin.html`);
check("admin: login screen shown", await cdp.evaluate('!document.querySelector("#loginScreen").hidden'), true);
check("admin: dashboard hidden", await cdp.evaluate('document.querySelector("#dashboard").hidden'), true);
await cdp.evaluate(`
  (() => {
    document.querySelector("#passcode").value = "wrong-code";
    document.querySelector("#signIn").click();
  })()
`);
await sleep(200);
checkTrue("admin: wrong passcode rejected", await cdp.evaluate('document.querySelector("#loginError").textContent.includes("not correct")'));
await cdp.evaluate(`
  (() => {
    document.querySelector("#passcode").value = "DABARA2026";
    document.querySelector("#signIn").click();
  })()
`);
await sleep(400);
check("admin: dashboard visible after sign in", await cdp.evaluate('document.querySelector("#dashboard").hidden'), false);
check("admin: stat cards rendered", await cdp.evaluate('document.querySelectorAll("#statGrid .stat").length'), 8);
await cdp.evaluate('document.querySelector("[data-tab=\\"bookings\\"]").click()');
await sleep(300);
check("admin: bookings table rendered", await cdp.evaluate('document.querySelectorAll("#bookingsTable tbody tr").length'), 1);
await cdp.evaluate('document.querySelector("[data-tab=\\"rooms\\"]").click()');
await sleep(300);
check("admin: room cards rendered", await cdp.evaluate('document.querySelectorAll("#roomsGrid [data-room]").length'), 3);
check(
  "admin: room summary totals 68 rooms",
  await cdp.evaluate('document.querySelector("#roomsSummary").textContent.includes("68")'),
  true,
);

/* 6b. the dashboard can re-price the hotel and the public site follows */
await cdp.evaluate(`
  (() => {
    const panel = document.querySelector('[data-room="deluxe"]');
    panel.querySelector('[data-f="rate"]').value = "41000";
    panel.querySelector('[data-save-room="deluxe"]').click();
  })()
`);
await sleep(400);
check(
  "admin: edited rate stored in the browser",
  await cdp.evaluate('JSON.parse(localStorage.getItem("dabara_admin_rooms"))[0].rate'),
  41000,
);
await cdp.goto(`${BASE}/rooms.html`);
checkTrue(
  "rooms: edited rate shows on the public site",
  await cdp.evaluate('document.querySelector("#room-grid .card .price").textContent.includes("41,000")'),
);

/* 6c. add a room type, then reset back to defaults */
await cdp.goto(`${BASE}/admin.html`);
await cdp.evaluate('document.querySelector("[data-tab=\\"rooms\\"]").click()');
await sleep(300);
await cdp.evaluate('document.querySelector("#addRoom").click()');
await sleep(400);
check("admin: room type added", await cdp.evaluate('document.querySelectorAll("#roomsGrid [data-room]").length'), 4);
await cdp.evaluate('document.querySelector("#resetRooms").click()');
await sleep(400);
check("admin: reset restores 3 room categories", await cdp.evaluate('document.querySelectorAll("#roomsGrid [data-room]").length'), 3);
check(
  "admin: reset restores the default rate",
  await cdp.evaluate('JSON.parse(localStorage.getItem("dabara_admin_rooms") || "null") === null'),
  true,
);
await cdp.evaluate('document.querySelector("[data-tab=\\"settings\\"]").click()');
await sleep(300);
check("admin: settings pre-filled", await cdp.evaluate('document.querySelector("#infoPhone").value.length > 0'), true);

/* 6d. the dashboard email edit reaches the public pages */
await cdp.evaluate(`
  (() => {
    document.querySelector("#infoEmail").value = "frontdesk@dabara.test";
    document.querySelector("#infoPhone").value = "+234 806 000 1111";
    document.querySelector("#infoForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  })()
`);
await sleep(300);
await cdp.goto(`${BASE}/contact.html`);
await sleep(400);
checkTrue(
  "contact: dashboard email shows on the get in touch page",
  await cdp.evaluate('document.querySelector("#contact-cards").textContent.includes("frontdesk@dabara.test")'),
);
checkTrue(
  "contact: mailto uses the dashboard email",
  await cdp.evaluate('document.querySelector("#contact-cards a[href^=\\"mailto:\\"]").getAttribute("href").includes("frontdesk@dabara.test")'),
);
checkTrue(
  "footer: dashboard email shows in the footer",
  await cdp.evaluate('document.querySelector(".site-footer").textContent.includes("frontdesk@dabara.test")'),
);
checkTrue(
  "contact: dashboard phone is dialled as a number",
  await cdp.evaluate('document.querySelector("#contact-cards a[href^=\\"tel:\\"]").getAttribute("href") === "tel:+2348060001111"'),
);
await cdp.goto(`${BASE}/admin.html`);
await sleep(300);
await cdp.evaluate('document.querySelector("[data-tab=\\"settings\\"]").click()');
await sleep(300);
await cdp.evaluate('document.querySelector("#resetInfo").click()');
await sleep(300);
checkTrue(
  "admin: reset restores the published email",
  await cdp.evaluate('document.querySelector("#infoEmail").value !== "frontdesk@dabara.test"'),
);

/* 7. theme toggle */
await cdp.goto(`${BASE}/index.html`);
await cdp.evaluate('document.querySelector("#theme-toggle").click()');
await sleep(200);
check("theme: dark mode applied", await cdp.evaluate('document.documentElement.getAttribute("data-theme")'), "dark");
await cdp.evaluate('document.querySelector("#theme-toggle").click()');
await sleep(200);
check("theme: light mode restored", await cdp.evaluate('document.documentElement.getAttribute("data-theme")'), "light");

/* 8. contact form */
await cdp.goto(`${BASE}/contact.html`);
await cdp.evaluate(`
  (() => {
    document.querySelector("#name").value = "Ada Nwosu";
    document.querySelector("#phone").value = "+2348000000000";
    document.querySelector("#email").value = "ada@example.com";
    document.querySelector("#message").value = "I need 5 rooms for a wedding in December.";
    document.querySelector("#enquiryForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  })()
`);
await sleep(300);
check("contact: enquiry stored", await cdp.evaluate('JSON.parse(localStorage.getItem("dabara_enquiries") || "[]").length'), 1);
checkTrue("contact: confirmation shown", await cdp.evaluate('document.querySelector("#enquiryResult").textContent.includes("Ada")'));

console.log(`\n${passed} passed, ${failed} failed\n`);

chrome.kill();
process.exit(failed === 0 ? 0 : 1);