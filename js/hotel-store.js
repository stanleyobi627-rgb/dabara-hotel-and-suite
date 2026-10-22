/**
 * HOTEL DETAILS — the live view of the hotel's contact details.
 *
 * js/data.js holds the published defaults (address, phone, email, times).
 * The staff dashboard (admin.html -> Hotel info) can override them, and those
 * overrides are what every page shows — so the Get in touch page, the header
 * and the footer all stay in step with what the team last typed.
 */
import { HOTEL as DEFAULTS } from "./data.js";
import { admin } from "./storage.js";

export function getHotel() {
  const info = admin.hotelInfo() || {};
  const hotel = { ...DEFAULTS };

  ["phone", "email", "address", "checkInTime", "checkOutTime"].forEach((field) => {
    if (typeof info[field] === "string" && info[field].trim()) hotel[field] = info[field].trim();
  });

  /* Keep the dial-in and WhatsApp links in step with the phone number. */
  let digits = String(hotel.phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  if (digits) {
    hotel.phoneRaw = `+${digits}`;
    hotel.whatsapp = digits;
  }

  return hotel;
}
