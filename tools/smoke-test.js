/**
 * Headless smoke test for the booking logic.
 * Run with:  node tools/smoke-test.js
 *
 * The browser modules are imported directly; a tiny localStorage shim stands in
 * for the browser so the storage layer can be exercised too.
 */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { HOTEL, ROOMS, EXTRAS, PROMOS, AMENITIES } = await import("../js/data.js");
const { bookings, guest, enquiries } = await import("../js/storage.js");
const {
  addDays,
  availableUnits,
  bookingCode,
  calculateTotal,
  dateRangesOverlap,
  escapeHtml,
  findPromo,
  formatDate,
  nightsBetween,
  naira,
  todayISO,
  toCSV,
} = await import("../js/utils.js");

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
  }
}

console.log("\nDabara Hotel and Suites — smoke test\n");

/* data integrity */
check("3 room categories", ROOMS.length, 3);
check("68 total units", ROOMS.reduce((s, r) => s + r.units, 0), 68);
check("room ids unique", new Set(ROOMS.map((r) => r.id)).size, ROOMS.length);
check("room names", ROOMS.map((r) => r.name).join(" / "), "Deluxe / Premium Executive / Dabara Executive Suite");
check("every room has an image", ROOMS.every((r) => r.image.endsWith(".svg")), true);
check("every room has amenities", ROOMS.every((r) => r.amenities.length > 0), true);
check("promo codes unique", new Set(PROMOS.map((p) => p.code)).size, PROMOS.length);
check("extras priced", EXTRAS.every((e) => Number.isFinite(e.price)), true);
check("vat rate 7.5%", HOTEL.vatRate, 0.075);
check("hotel is in Nnewi", HOTEL.city, "Nnewi");
check("hotel name is plural", HOTEL.name, "Dabara Hotel and Suites");
check("guest rating 4.4", HOTEL.rating, 4.4);
check("248 reviews", HOTEL.reviews, 248);
check("68 rooms advertised", HOTEL.rooms, 68);
check("every room amenity exists in AMENITIES", ROOMS.every((r) => r.amenities.every((a) => AMENITIES.some((x) => x.id === a))), true);
check("no spa amenity", AMENITIES.some((a) => a.id === "spa"), false);
check("hot tub amenity present", AMENITIES.some((a) => a.id === "hottub"), true);
check("night club amenity present", AMENITIES.some((a) => a.id === "club"), true);
check("24-hour power amenity present", AMENITIES.some((a) => a.id === "power"), true);
check("card key amenity present", AMENITIES.some((a) => a.id === "keycard"), true);
check("room reviews total 248", ROOMS.reduce((s, r) => s + r.reviews, 0), 248);

/* dates */
const today = todayISO();
const tomorrow = addDays(today, 1);
const in5 = addDays(today, 5);
check("addDays advances one day", nightsBetween(today, tomorrow), 1);
check("nights between", nightsBetween(today, in5), 5);
check("reverse dates give 0 nights", nightsBetween(in5, today), 0);
check("same day gives 0 nights", nightsBetween(today, today), 0);
check("long date format", formatDate(today, "long").endsWith(String(new Date().getFullYear())), true);

/* overlap */
check("overlapping ranges", dateRangesOverlap(today, in5, addDays(today, 3), addDays(today, 6)), true);
check("adjacent ranges do not overlap", dateRangesOverlap(today, in5, in5, addDays(in5, 2)), false);
check("contained range overlaps", dateRangesOverlap(today, in5, addDays(today, 1), addDays(today, 2)), true);

/* pricing */
const deluxe = ROOMS.find((r) => r.id === "deluxe");
const base = calculateTotal({
  room: deluxe,
  checkIn: today,
  checkOut: in5,
  quantity: 1,
  extras: [],
  promoCode: "",
});
check("nights counted", base.nights, 5);
check("subtotal = rate x nights", base.subtotal, 60000 * 5);
check("vat = 7.5% of subtotal", base.vat, Math.round(60000 * 5 * 0.075));
check("total = subtotal + vat", base.total, base.subtotal + base.vat);
check("no discount without code", base.discount, 0);

const withExtras = calculateTotal({
  room: deluxe,
  checkIn: today,
  checkOut: in5,
  quantity: 1,
  extras: ["breakfast", "hottub"],
  promoCode: "",
});
check("extras added once per stay", withExtras.extrasTotal, 15000 + 20000);
check("vat applies to extras too", withExtras.vat, Math.round((withExtras.subtotal + 35000) * 0.075));

const withExtraBed = calculateTotal({
  room: deluxe,
  checkIn: today,
  checkOut: in5,
  quantity: 1,
  extras: ["bed"],
  promoCode: "",
});
check("extra bed charged per night", withExtraBed.extrasTotal, 12000 * 5);

const percent = calculateTotal({
  room: deluxe,
  checkIn: today,
  checkOut: in5,
  quantity: 1,
  extras: [],
  promoCode: "dabara10",
});
check("percent promo applies 10%", percent.discount, Math.round((60000 * 5) * 0.1));
check("promo code is case insensitive", percent.promo.code, "DABARA10");

const fixed = calculateTotal({
  room: deluxe,
  checkIn: today,
  checkOut: in5,
  quantity: 1,
  extras: [],
  promoCode: "WELCOME",
});
check("fixed promo applies 20000", fixed.discount, 20000);
check("total never goes negative", fixed.total > 0, true);
check("unknown promo ignored", findPromo("NOPE"), null);
check("multi room multiplies subtotal", calculateTotal({ room: deluxe, checkIn: today, checkOut: tomorrow, quantity: 2, extras: [] }).subtotal, 60000 * 2);

/* availability */
const standard = ROOMS.find((r) => r.id === "deluxe");
check("all units free initially", availableUnits(standard, today, in5, []), standard.units);

const fakeBookings = [
  { id: "1", roomId: "deluxe", checkIn: today, checkOut: addDays(today, 2), quantity: 2, status: "confirmed" },
  { id: "2", roomId: "deluxe", checkIn: addDays(today, 3), checkOut: addDays(today, 4), quantity: 1, status: "confirmed" },
  { id: "3", roomId: "deluxe", checkIn: today, checkOut: in5, quantity: 5, status: "cancelled" },
];
check("overlapping bookings reduce availability", availableUnits(standard, today, addDays(today, 2), fakeBookings), standard.units - 2);
check("cancelled bookings are ignored", availableUnits(standard, today, addDays(today, 2), fakeBookings), standard.units - 2);
check("availability never goes negative", availableUnits(standard, today, in5, fakeBookings.filter((b) => b.status === "confirmed").concat([{ roomId: "deluxe", checkIn: today, checkOut: in5, quantity: 99, status: "confirmed" }])), 0);

/* storage */
const sample = {
  id: "bk_1",
  code: bookingCode(),
  roomId: "deluxe",
  roomName: "Deluxe",
  checkIn: today,
  checkOut: in5,
  total: 1000,
  status: "confirmed",
};
bookings.add(sample);
check("booking saved", bookings.all().length, 1);
check("booking retrievable by id", bookings.get("bk_1").roomName, "Deluxe");
bookings.update("bk_1", { status: "cancelled" });
check("booking updated", bookings.get("bk_1").status, "cancelled");
check("cancelled booking still listed", bookings.all().length, 1);
bookings.remove("bk_1");
check("booking deleted", bookings.all().length, 0);

guest.save({ firstName: "Ada", email: "ada@example.com" });
check("guest profile saved", guest.get().firstName, "Ada");
enquiries.add({ id: "e1", name: "Ada", topic: "Wedding" });
check("enquiry stored", enquiries.all().length, 1);

/* formatting */
check("naira formatting", naira(60000), "₦60,000");
check("naira handles decimals", naira(0), "₦0");
check("html escaping", escapeHtml("<b>hi</b>"), "&lt;b&gt;hi&lt;/b&gt;");
check("booking code format", /^DAB-[A-Z]{3}\d{4}$/.test(bookingCode()), true);
check("csv has header and row", toCSV([{ a: 1 }], [{ label: "A", get: (r) => r.a }]).split("\n").length, 2);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
