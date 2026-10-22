import { ROOMS as BASE_ROOMS } from "./data.js";
import { admin } from "./storage.js";

/**
 * Every page reads the room catalogue through this module.
 *
 * If the staff dashboard has saved changes (admin.html -> Rooms), those changes
 * are used instead of the defaults in js/catalogue.js. That is what lets you
 * re-price the hotel from the dashboard and see it live across the site.
 */
export function getRooms() {
  const stored = admin.rooms();
  if (!stored || !Array.isArray(stored) || stored.length === 0) return BASE_ROOMS;
  return stored;
}

export function getRoom(id, fallbackIndex = 0) {
  const list = getRooms();
  return list.find((room) => room.id === id) || list[fallbackIndex] || list[0] || null;
}

export function getRoomTypes() {
  return [...new Set(getRooms().map((room) => room.type))];
}

export function totalUnits() {
  return getRooms().reduce((sum, room) => sum + (Number(room.units) || 0), 0);
}

export function totalReviews() {
  return getRooms().reduce((sum, room) => sum + (Number(room.reviews) || 0), 0);
}
