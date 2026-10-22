import { CATALOGUE_VERSION } from "./catalogue.js";

const PREFIX = "dabara_";

export const KEYS = {
  bookings: `${PREFIX}bookings`,
  guest: `${PREFIX}guest`,
  favourites: `${PREFIX}favourites`,
  theme: `${PREFIX}theme`,
  adminRooms: `${PREFIX}admin_rooms`,
  adminRoomsVersion: `${PREFIX}admin_rooms_version`,
  hotelInfo: `${PREFIX}hotel_info`,
  enquiries: `${PREFIX}enquiries`,
  session: `${PREFIX}session`,
};

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const bookings = {
  all() {
    const list = read(KEYS.bookings, []);
    return Array.isArray(list) ? list : [];
  },
  save(list) {
    return write(KEYS.bookings, list);
  },
  add(booking) {
    const list = bookings.all();
    list.unshift(booking);
    bookings.save(list);
    return booking;
  },
  update(id, changes) {
    const list = bookings.all();
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...changes };
    bookings.save(list);
    return list[index];
  },
  remove(id) {
    const list = bookings.all().filter((b) => b.id !== id);
    bookings.save(list);
  },
  get(id) {
    return bookings.all().find((b) => b.id === id) || null;
  },
};

export const guest = {
  get() {
    return read(KEYS.guest, null);
  },
  save(details) {
    return write(KEYS.guest, details);
  },
};

export const favourites = {
  all() {
    const list = read(KEYS.favourites, []);
    return Array.isArray(list) ? list : [];
  },
  toggle(roomId) {
    const list = favourites.all();
    const index = list.indexOf(roomId);
    if (index === -1) list.push(roomId);
    else list.splice(index, 1);
    write(KEYS.favourites, list);
    return list.includes(roomId);
  },
  has(roomId) {
    return favourites.all().includes(roomId);
  },
};

export const theme = {
  get() {
    return read(KEYS.theme, "light");
  },
  set(value) {
    return write(KEYS.theme, value);
  },
};

export const admin = {
  rooms() {
    const list = read(KEYS.adminRooms, null);
    if (!Array.isArray(list)) return null;
    /* Ignore dashboard edits saved against an older catalogue — the room
       types they refer to may no longer exist. */
    const version = read(KEYS.adminRoomsVersion, 1);
    if (version !== CATALOGUE_VERSION) return null;
    return list;
  },
  saveRooms(list) {
    write(KEYS.adminRoomsVersion, CATALOGUE_VERSION);
    return write(KEYS.adminRooms, list);
  },
  hotelInfo() {
    return read(KEYS.hotelInfo, null);
  },
  saveHotelInfo(info) {
    return write(KEYS.hotelInfo, info);
  },
  session() {
    return read(KEYS.session, false);
  },
  signIn() {
    return write(KEYS.session, true);
  },
  signOut() {
    return remove(KEYS.session);
  },
};

export const enquiries = {
  all() {
    const list = read(KEYS.enquiries, []);
    return Array.isArray(list) ? list : [];
  },
  add(item) {
    const list = enquiries.all();
    list.unshift(item);
    write(KEYS.enquiries, list);
    return item;
  },
};
