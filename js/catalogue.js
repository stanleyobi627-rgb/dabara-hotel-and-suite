/**
 * ROOM CATALOGUE — the file to edit.
 *
 * This is the single place where room types, prices and availability live.
 * You can edit it by hand in any text editor, or from the staff dashboard
 * (admin.html) and then click "Copy js/catalogue.js" to paste the result
 * back in here.
 *
 * Dabara Hotel and Suites has three room categories:
 *   Deluxe                   40 rooms · ₦60,000 per night
 *   Premium Executive         8 rooms · ₦75,000 per night
 *   Dabara Executive Suite   20 rooms · ₦90,000 per night
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
export const CATALOGUE_VERSION = 2;

export const ROOMS = [
  {
    id: "deluxe",
    name: "Deluxe",
    type: "Deluxe",
    rate: 60000,
    size: 32,
    beds: "1 King bed",
    maxGuests: 2,
    units: 40,
    floor: 3,
    view: "Main road view",
    rating: 4.3,
    reviews: 146,
    tag: "Popular",
    amenities: ["wifi", "ac", "tv", "bath", "bathtub", "minibar", "coffee", "workspace", "safe", "laundry", "parking", "power", "keycard", "roomservice", "gym", "pool", "view"],
    image: "images/room-deluxe.svg",
    description:
      "The room most of our guests choose: a king bed, freestanding tub and a wide window over the Inyaba main road. Gym and outdoor pool access included, with free Wi-Fi and 24-hour power.",
  },
  {
    id: "presidential",
    name: "Premium Executive",
    type: "Premium Executive",
    rate: 75000,
    size: 95,
    beds: "2 King beds",
    maxGuests: 6,
    units: 8,
    floor: 5,
    view: "Panoramic city view",
    rating: 4.7,
    reviews: 29,
    tag: "Signature",
    amenities: ["wifi", "ac", "tv", "bath", "bathtub", "minibar", "coffee", "workspace", "safe", "laundry", "parking", "power", "keycard", "roomservice", "gym", "pool", "hottub", "restaurant", "club", "events", "sofa", "balcony", "kitchen", "view", "breakfast"],
    image: "images/room-presidential.svg",
    description:
      "Our top residence: two bedrooms, a private lounge, dining for eight and a grand terrace. Reserved for celebrations, VIP arrivals and long stays.",
  },
  {
    id: "executive",
    name: "Dabara Executive Suite",
    type: "Dabara Executive Suite",
    rate: 90000,
    size: 52,
    beds: "1 King bed + sofa bed",
    maxGuests: 4,
    units: 20,
    floor: 4,
    view: "City skyline",
    rating: 4.5,
    reviews: 73,
    tag: "Suite",
    amenities: ["wifi", "ac", "tv", "bath", "bathtub", "minibar", "coffee", "workspace", "safe", "laundry", "parking", "power", "keycard", "roomservice", "gym", "pool", "hottub", "restaurant", "sofa", "balcony", "view", "breakfast"],
    image: "images/room-executive.svg",
    description:
      "A separate living room, dining for four, a deep soaking tub and skyline views from the balcony. Our most requested suite for short business stays and anniversaries.",
  },
];
