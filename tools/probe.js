/**
 * Quick console-error probe across every page.
 * Usage:  node tools/probe.js
 * Requires the site to be served on http://localhost:5173
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const PORT = 9333;
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

const PAGES = [
  "index.html",
  "rooms.html",
  "room.html?id=deluxe",
  "booking.html?room=deluxe",
  "my-bookings.html",
  "services.html",
  "contact.html",
  "admin.html",
];

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        this.handlers.forEach((h) => h(msg.method, msg.params));
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
  on(fn) {
    this.handlers.push(fn);
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
}

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=C:\\Users\\TOSHIBA\\AppData\\Local\\Temp\\opencode\\chrome-probe",
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
  throw new Error("Could not connect to Chrome");
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

const cdp = new CDP(ws);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Log.enable");

let errors = [];
cdp.on((method, params) => {
  if (method === "Runtime.exceptionThrown") {
    errors.push(`exception: ${params.exceptionDetails?.exception?.description || "unknown"}`);
  }
  if (method === "Runtime.consoleAPICalled" && params.type === "error") {
    errors.push(`console: ${params.args.map((a) => a.value || a.description).join(" ")}`);
  }
  if (method === "Log.entryAdded" && params.entry.level === "error") {
    errors.push(`log: ${params.entry.text} ${params.entry.url || ""}`);
  }
});

let failures = 0;

for (const page of PAGES) {
  errors = [];
  await cdp.send("Page.navigate", { url: `${BASE}/${page}` });
  await sleep(800);
  // force lazy-loaded images to resolve before checking them
  await cdp.evaluate("window.scrollTo(0, document.body.scrollHeight)");
  await sleep(900);
  await cdp.evaluate("window.scrollTo(0, 0)");
  await sleep(300);

  const summary = await cdp.evaluate(`(() => ({
    title: document.title,
    hasHeader: !!document.querySelector(".site-header .site-nav"),
    hasFooter: !!document.querySelector(".site-footer .footer-grid"),
    images: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute("src")),
    bodyText: document.body.innerText.length
  }))()`);
  const broken = errors.filter((e) => !/favicon/i.test(e));
  const isAdmin = page.startsWith("admin");
  const bad =
    broken.length > 0 ||
    summary.images.length > 0 ||
    (!isAdmin && (!summary.hasHeader || !summary.hasFooter));
  if (bad) failures += 1;
  console.log(`${bad ? "FAIL" : "PASS"}  ${page}`);
  console.log(`        title: ${summary.title}`);
  console.log(`        text:  ${summary.bodyText} chars`);
  if (summary.images.length) console.log(`        broken images: ${summary.images.join(", ")}`);
  broken.forEach((e) => console.log(`        ${e}`));
}

console.log(failures === 0 ? "\nAll pages clean.\n" : `\n${failures} page(s) with problems.\n`);
chrome.kill();
process.exit(failures === 0 ? 0 : 1);
