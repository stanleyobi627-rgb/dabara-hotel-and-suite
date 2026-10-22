/**
 * ROOM CATALOGUE — the file to edit.
 *
 * This is the single place where room types, prices and availability live.
 * You can edit it by hand in any text editor, or from the staff dashboard
 * (admin.html) and then click "Copy js/catalogue.js" to paste the result
 * back in here.
 *
 * Fields:
 *   id          unique code used in links (room.html?id=...)  — do not change once published
 *   name        guest-facing room name
 *   type        grouping used by the room filter
 *   rate        price per night in naira
 *   units       how many rooms of this type the hotel has
 *   size        floor area in square metres
 *   beds        bed arrangement
 *   maxGuests   maximum occupancy
 *   floor       which floor the room sits on
 *   view        what the window looks onto
 *   rating      guest score out of 5
 *   reviews     number of reviews behind that score
 *   tag         optional ribbon on the card ("Popular", "New"...)
 *   amenities   ids from the AMENITIES list in js/data.js
 *   image       illustration in the images folder
 *   description one or two sentences shown on the booking card
 */
export const ROOMS = [
  {
    id: "standard",
    name: "Standard Room",
    type: "Standard Room",
    rate: 38000,
    size: 24,
    beds: "1 Queen bed",
    maxGuests: 2,
    units: 18,
    floor: 2,
    view: "Courtyard view",
    rating: 4.2,
    reviews: 52,
    tag: "Best value",
    amenities: ["wifi", "ac", "tv", "bath", "minibar", "coffee", "workspace", "safe", "laundry", "parking", "power", "keycard", "roomservice"],
    image: "images/room-standard.svg",
    description:
      "A calm, well-kept room with a queen bed, rain shower and writing desk. Free Wi-Fi, 24-hour power and secure card-key access as standard.",
  },
  {
    id: "twin",
    name: "Standard Twin",
    type: "Standard Twin",
    rate: 42000,
    size: 24,
    beds: "2 Single beds",
    maxGuests: 2,
    units: 12,
    floor: 2,
    view: "Courtyard view",
    rating: 4.1,
    reviews: 31,
    tag: "",
    amenities: ["wifi", "ac", "tv", "bath", "minibar", "coffee", "safe", "laundry", "parking", "power", "keycard", "roomservice", "accessible"],
    image: "images/room-twin.svg",
    description:
      "Two comfortable single beds for colleagues or friends travelling together, with blackout curtains and a shared bathroom. Our most accessible room type.",
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    type: "Deluxe Room",
    rate: 60000,
    size: 32,
    beds: "1 King bed",
    maxGuests: 2,
    units: 14,
    floor: 3,
    view: "Main road view",
    rating: 4.4,
    reviews: 64,
    tag: "Popular",
    amenities: ["wifi", "ac", "tv", "bath", "bathtub", "minibar", "coffee", "workspace", "safe", "laundry", "parking", "power", "keycard", "roomservice", "gym", "pool", "view"],
    image: "images/room-deluxe.svg",
    description:
      "Our most requested room: a king bed, freestanding tub and a wide window over the Inyaba main road. Includes gym and outdoor pool access.",
  },
  {
    id: "garden",
    name: "Deluxe Garden View",
    type: "Deluxe Garden View",
    rate: 68000,
    size: 34,
    beds: "1 King bed + daybed",
    maxGuests: 3,
    units: 8,
    floor: 2,
    view: "Garden view",
    rating: 4.5,
    reviews: 38,
    tag: "New",
    amenities: ["wifi", "ac", "tv", "bath", "minibar", "coffee", "workspace", "safe", "laundry", "parking", "power", "keycard", "roomservice", "gym", "pool", "balcony", "view", "family"],
    image: "images/room-garden.svg",
    description:
      "Opens onto a private balcony above the garden — the quietest side of the hotel. Sleeps three with an extra daybed, and is the best choice for a relaxed weekend.",
  },
  {
    id: "family",
    name: "Family Suite",
    type: "Family Suite",
    rate: 85000,
    size: 46,
    beds: "2 King beds",
    maxGuests: 5,
    units: 5,
    floor: 3,
    view: "Garden view",
    rating: 4.4,
    reviews: 22,
    tag: "Family",
    amenities: ["wifi", "ac", "tv", "bath", "minibar", "coffee", "safe", "laundry", "parking", "power", "keycard", "roomservice", "gym", "pool", "restaurant", "sofa", "balcony", "kitchen", "family"],
    image: "images/room-family.svg",
    description:
      "Two bedrooms joined by a shared living room and a small kitchenette, so everyone has space. Built for families and for guests hosting visitors in Nnewi.",
  },
  {
    id: "executive",
    name: "Executive Suite",
    type: "Executive Suite",
    rate: 95000,
    size: 52,
    beds: "1 King bed + sofa bed",
    maxGuests: 4,
    units: 8,
    floor: 4,
    view: "City skyline",
    rating: 4.5,
    reviews: 26,
    tag: "Suite",
    amenities: ["wifi", "ac", "tv", "bath", "bathtub", "minibar", "coffee", "workspace", "safe", "laundry", "parking", "power", "keycard", "roomservice", "gym", "pool", "hottub", "restaurant", "sofa", "balcony", "view", "breakfast"],
    image: "images/room-executive.svg",
    description:
      "A separate living room, dining for four, a deep soaking tub and skyline views from the balcony. Our most requested suite for short business stays and anniversaries.",
  },
  {
    id: "presidential",
    name: "Presidential Suite",
    type: "Presidential Suite",
    rate: 180000,
    size: 95,
    beds: "2 King beds",
    maxGuests: 6,
    units: 3,
    floor: 5,
    view: "Panoramic city view",
    rating: 4.7,
    reviews: 15,
    tag: "Signature",
    amenities: ["wifi", "ac", "tv", "bath", "bathtub", "minibar", "coffee", "workspace", "safe", "laundry", "parking", "power", "keycard", "roomservice", "gym", "pool", "hottub", "restaurant", "club", "events", "sofa", "balcony", "kitchen", "view", "breakfast"],
    image: "images/room-presidential.svg",
    description:
      "Our signature residence: two bedrooms, a private lounge, dining for eight and a grand terrace. Reserved for celebrations, VIP arrivals and long stays.",
  },
];
