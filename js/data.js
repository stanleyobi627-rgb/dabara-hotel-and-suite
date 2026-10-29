import { ROOMS as CATALOGUE, CATALOGUE_VERSION } from "./catalogue.js";

export { CATALOGUE };
export const ROOMS = CATALOGUE;
export { CATALOGUE_VERSION };

export const HOTEL = {
  name: "Dabara Hotel and Suites",
  short: "Dabara",
  tagline: "Calm, comfort and nightlife in the heart of Nnewi",
  about:
    "Dabara Hotel and Suites sits on the main thoroughfare in Inyaba, Nnewi, with 68 structured rooms built for both the business traveller and the family visiting for the weekend. The house keeps 24-hour power, secure card-key access, free Wi-Fi and free parking as standard, then adds what a long evening actually needs: an outdoor swimming pool, a hot tub, a fitness centre, a restaurant and bar, and a dedicated night club.",
  address: "Ozubulu Road, Inyaba, Nnewi 435101, Anambra State, Nigeria",
  city: "Nnewi",
  state: "Anambra State",
  country: "Nigeria",
  plusCode: "XWM2+7X Nnewi",
  phone: "0806 446 3317",
  phoneRaw: "+2348064463317",
  whatsapp: "2348064463317",
  email: "reservations@dabarahotelsuites.com",
  rating: 4.4,
  reviews: 248,
  rooms: 68,
  checkInTime: "2:00 PM",
  checkOutTime: "11:00 AM",
  currency: "₦",
  vatRate: 0.075,
  adminPasscode: "DABARA2026",
  landmarks: [
    "Nnewi Flyover Junction — 3 min drive",
    "Nnewi Main Market, Nkwo — 5 min drive",
    "Nnewi Bus Station, Ndiagu — 6 min drive",
    "Anambra State Secretariat — 10 min drive",
    "Onitsha — 20 min drive",
    "Enugu International Airport — 45 min drive",
  ],
};

export const AMENITIES = [
  { id: "wifi", label: "Free Wi-Fi" },
  { id: "ac", label: "Air conditioning" },
  { id: "tv", label: "Smart TV" },
  { id: "bath", label: "En-suite bathroom" },
  { id: "bathtub", label: "Bathtub" },
  { id: "minibar", label: "Mini bar" },
  { id: "coffee", label: "Coffee & tea" },
  { id: "workspace", label: "Work desk" },
  { id: "safe", label: "In-room safe" },
  { id: "laundry", label: "Laundry service" },
  { id: "breakfast", label: "Paid breakfast" },
  { id: "parking", label: "Free parking" },
    {
    id: "gym",
    name: "Dabara Fitness Centre",
    icon: "gym",
    price: 0,
    showPrice: false,
    duration: "24-hour access",
    image: "images/gym.jpg",
    description:
      "Our fitness centre is well-equipped with cardio machines, free weights and a stretching area, open around the clock so it fits around your schedule. Personal training can be arranged on request.",
    includes: ["24-hour access", "Cardio & free weights", "Stretching area", "Trainer on request"],
  },
      {
    id: "pool",
    name: "Outdoor Swimming Pool",
    icon: "pool",
    price: 0,
    showPrice: false,
    duration: "7:00 AM - 9:00 PM",
    image: "images/pool.jpg",
    description:
      "A well-maintained outdoor swimming pool in a quiet corner of the grounds, with shaded loungers and towels at the deck. Free for in-house guests, with day passes available at the front desk on weekends.",
    includes: ["Free for in-house guests", "Sun loungers & towels", "Poolside seating", "Weekend day passes"],
  },
  {
    id: "hottub",
    name: "Hot Tub",
    icon: "spa",
    price: 0,
    showPrice: false,
    duration: "10:00 AM - 10:00 PM",
    image: "images/hottub.jpg",
    description:
      "A heated hot tub set apart for a quiet, relaxing soak at the end of the day. Perfect for unwinding after a long day or for a private moment of relaxation.",
    includes: ["Heated hot tub", "Towels provided", "Relaxation area"],
  },
  {
    id: "restaurant",
    name: "Restaurant & Bar",
    icon: "restaurant",
    price: 0,
    showPrice: false,
    duration: "7:00 AM - 12:00 AM",
    image: "images/restaurant.jpg",
    description:
      "Our Restaurant serves freshly prepared local and continental dishes cooked to order. The Bar offers a wide selection of Nigerian spirits, wines, beers and mocktails in a relaxed setting. Room service is also available for guests who prefer to dine in the comfort of their rooms. A dedicated Night Club is also available on the premises for guests looking to unwind late into the night.",
    includes: ["Restaurant", "Bar", "Room service", "Night Club"],
  },
  { id: "club", label: "Night club" },
  { id: "events", label: "Event space" },
  { id: "roomservice", label: "Room service" },
  { id: "power", label: "24-hour power" },
  { id: "keycard", label: "Card-key access" },
  { id: "sofa", label: "Living area" },
  { id: "balcony", label: "Private balcony" },
  { id: "view", label: "City view" },
  { id: "kitchen", label: "Kitchenette" },
  { id: "family", label: "Family friendly" },
  { id: "accessible", label: "Accessible" },
];

export const ROOM_TYPES = [...new Set(CATALOGUE.map((room) => room.type))];

export const SERVICES = [
  {
    id: "restaurant",
    name: "Restaurant & Bar",
    icon: "restaurant",
    price: 0,
    showPrice: false,
    duration: "7:00 AM - 12:00 AM",
    image: "images/restaurant.jpg",
    description:
      "Our Restaurant serves freshly prepared local and continental dishes cooked to order. The Bar offers a wide selection of Nigerian spirits, wines, beers and mocktails in a relaxed setting. Room service is also available for guests who prefer to dine in the comfort of their rooms. A dedicated Night Club is also available on the premises for guests looking to unwind late into the night.",
    includes: ["Restaurant", "Bar", "Room service", "Night Club"],
  },
    {
    id: "pool",
    name: "Outdoor Swimming Pool",
    icon: "pool",
    price: 0,
    showPrice: false,
    duration: "7:00 AM - 9:00 PM",
    image: "images/pool.jpg",
    description:
      "A well-maintained outdoor swimming pool in a quiet corner of the grounds, with shaded loungers and towels at the deck. Free for in-house guests, with day passes available at the front desk on weekends.",
    includes: ["Free for in-house guests", "Sun loungers & towels", "Poolside seating", "Weekend day passes"],
  },
  {
    id: "hottub",
    name: "Hot Tub",
    icon: "spa",
    price: 0,
    showPrice: false,
    duration: "10:00 AM - 10:00 PM",
    image: "images/hottub.jpg",
    description:
      "A heated hot tub set apart for a quiet, relaxing soak at the end of the day. Perfect for unwinding after a long day or for a private moment of relaxation.",
    includes: ["Heated hot tub", "Towels provided", "Relaxation area"],
  },
  {
    id: "gym",
    name: "Dabara Fitness Centre",
    icon: "gym",
    price: 0,
    showPrice: false,
    duration: "24-hour access",
    image: "images/gym.jpg",
    description:
      "Our fitness centre is well-equipped with cardio machines, free weights and a stretching area, open around the clock so it fits around your schedule. Personal training can be arranged on request.",
    includes: ["24-hour access", "Cardio & free weights", "Stretching area", "Trainer on request"],
  },
  {
    id: "events",
    name: "Events & Banquets",
    icon: "events",
    price: 150000,
    duration: "8:00 AM – 12:00 AM",
    image: "images/events.jpg",
    description:
      "Flexible event space that handles weddings, trainings, birthdays and the creative community gatherings the hotel is known for. With 68 rooms on site, groups can stay and celebrate without crossing the city.",
    includes: ["Banquet and conference layout", "Sound and projector", "Catering packages", "Group room rates"],
  },
  {
    id: "transfers",
    name: "Airport Transfers",
    icon: "plane",
    price: 45000,
    duration: "24-hour bookings",
    image: "images/airport.jpg",
    description:
      "Door-to-door pickup from Enugu International Airport, about 45 minutes from the hotel, in a branded sedan or executive SUV. Flight tracking and a meet-and-greet at arrivals are included.",
    includes: ["Enugu airport pick-up", "Flight tracking", "Meet & greet", "Executive SUV option"],
  },
];

export const EXTRAS = [
  { id: "breakfast", name: "Breakfast buffet", price: 15000, note: "Per stay, per room" },
  { id: "pickup", name: "Airport pickup", price: 45000, note: "One way, from Enugu" },
  { id: "late", name: "Late checkout (6 PM)", price: 10000, note: "Subject to availability" },
  { id: "bed", name: "Extra bed", price: 12000, note: "Per night" },
  {
    id: "hottub",
    name: "Hot Tub",
    icon: "spa",
    price: 0,
    showPrice: false,
    duration: "10:00 AM - 10:00 PM",
    image: "images/hottub.jpg",
    description:
      "A heated hot tub set apart for a quiet, relaxing soak at the end of the day. Perfect for unwinding after a long day or for a private moment of relaxation.",
    includes: ["Heated hot tub", "Towels provided", "Relaxation area"],
  },
  { id: "tour", name: "Nnewi city tour", price: 18000, note: "3 hours, per group" },
];

export const PROMOS = [
  { code: "DABARA10", type: "percent", value: 10, label: "10% off your stay" },
  { code: "WELCOME", type: "fixed", value: 20000, label: "₦20,000 off" },
  { code: "STAY3", type: "fixed", value: 30000, label: "₦30,000 off" },
];

export const REVIEWS = [
  {
    name: "Chinedu O.",
    role: "Business traveller",
    rating: 5,
    text: "The Dabara Executive Suite is the most comfortable room I have booked in Nnewi. The 24-hour power and the card-key system make a long working week easy, and the gym is open whenever you need it.",
  },
  {
    name: "Amaka E.",
    role: "Family stay",
    rating: 5,
    text: "We booked the Premium Executive for a visit to Onitsha. Enough space for the whole family, and the outdoor pool plus the hot tub kept the children busy all afternoon. The staff are genuinely warm.",
  },
  {
    name: "Ibrahim S.",
    role: "Weekend guest",
    rating: 4,
    text: "Quiet, spotless and the bed was genuinely comfortable. Airport pickup was on time. The night club is loud on a Saturday but the rooms stay silent, which is exactly how it should work.",
  },
  {
    name: "Grace N.",
    role: "Event host",
    rating: 5,
    text: "We hosted a birthday dinner in the event space. The parking is free and roomy, the food came out well, and having the night club downstairs meant nobody had to drive home.",
  },
  {
    name: "Tobi A.",
    role: "Long stay",
    rating: 5,
    text: "Stayed six weeks while working on a project in Nnewi. Laundry, the kitchenette and reliable Wi-Fi made it feel like home. Best value in town for a long stay.",
  },
  {
    name: "Ngozi U.",
    role: "Couples’ getaway",
    rating: 5,
    text: "We took the Premium Executive for our anniversary and it was worth every naira. The private lounge and the terrace with the view of Nnewi at night is the kind of thing you remember. The hot tub was the best part.",
  },
  {
    name: "Emeka I.",
    role: "Conference guest",
    rating: 4,
    text: "Came in for a two-day conference and booked the Dabara Executive Suite. The work desk, the Wi-Fi and the 24-hour power made the presentations painless, and the restaurant downstairs meant I never had to leave the building.",
  },
  {
    name: "Blessing M.",
    role: "Solo traveller",
    rating: 5,
    text: "A clean, quiet Deluxe room for the night I was in Nnewi for a wedding. The bed was excellent, the bathroom had a proper hot shower, and the free parking took the stress out of arriving late.",
  },
  {
    name: "Obinna K.",
    role: "Repeat guest",
    rating: 5,
    text: "This is my third stay at Dabara. Same welcome at reception, same clean room, same warm breakfast. The staff know me by name now, which is why I keep coming back instead of trying somewhere new.",
  },
  {
    name: "Ifeoma D.",
    role: "Event host",
    rating: 4,
    text: "We hosted a birthday dinner for sixty people. The event space handled it, the food arrived on time and the staff kept the bar topped up without being asked. Only wish the parking filled up faster.",
  },
];

export const FAQ = [
  {
    q: "What are the check-in and check-out times?",
    a: `Check-in is from ${HOTEL.checkInTime} and check-out is by ${HOTEL.checkOutTime}. Early check-in and late check-out can be requested on the booking form and are confirmed subject to availability.`,
  },
  {
    q: "Do you accept card payments?",
    a: "Yes. You can pay by bank transfer or by card, cash or POS at the property when you arrive. This website does not take payment or card details — after you book, send the details to our front desk on WhatsApp and we will share the transfer account details or take payment at check-in.",
  },
  {
    q: "Is breakfast included in the room rate?",
    a: "Breakfast is a paid extra at the hotel. Add the breakfast buffet to your booking for ₦15,000 per stay, per room, and it will be waiting when you come down in the morning.",
  },
  {
    q: "Is there parking at the hotel?",
    a: "Yes. Parking is free and on site, with room for both cars and buses, which matters when you are hosting an event. Valet can be arranged for suites and group arrivals.",
  },
  {
    q: "Is there power and how do I get into my room?",
    a: "The hotel runs on a 24-hour power supply with backup, so outages do not interrupt your stay. Rooms are opened with a secure card key issued at reception, and each key can be replaced at the front desk at any hour.",
  },
  {
    q: "Can I cancel or change my booking?",
    a: "Free cancellation up to 48 hours before check-in — you can cancel or change your stay from the My Bookings page, or contact the front desk on " + HOTEL.phone + ".",
  },
  {
    q: "Do you offer airport transfers?",
    a: "Yes. We pick up from Enugu International Airport, about 45 minutes away, for ₦45,000 one way. Add it to your booking or arrange it at least 12 hours before arrival.",
  },
  {
    q: "What is around the hotel?",
    a: "The hotel stands on the main thoroughfare in Inyaba, minutes from the Nnewi flyover junction, Nkwo main market and the Nnewi bus station. Onitsha is 20 minutes away and Enugu International Airport is about 45 minutes by road.",
  },
  {
    q: "Is Wi-Fi really free?",
    a: "Yes. Fibre Wi-Fi is free throughout the hotel — in every room, the restaurant, the bar and all public areas. It is strong enough for video calls and uploading photos, and the front desk can help if you have trouble connecting.",
  },
  {
    q: "Can I use the pool, gym and hot tub?",
    a: "All three are free for in-house guests. The pool is open from 7:00 AM to 9:00 PM, the fitness centre is open 24 hours, and the hot tub is available from 10:00 AM to 10:00 PM. Towels are provided at the pool deck and in the gym.",
  },
  {
    q: "Do you host weddings, conferences and events?",
    a: "Yes. We have flexible event space for weddings, trainings, birthdays, conferences and corporate retreats, with sound, a projector and catering packages available. With 68 rooms on site, your guests can stay and celebrate in one place. Send an enquiry from the Contact page or call the front desk to check dates.",
  },
  {
    q: "Are children welcome, and can you add an extra bed?",
    a: "Children are welcome at Dabara. An extra bed can be added to most rooms for ₦12,000 per night, subject to the room's capacity. Mention it when you book or ask at reception on arrival.",
  },
  {
    q: "Is smoking allowed in the rooms?",
    a: "All rooms are non-smoking for the comfort of every guest. Smoking is permitted only in the designated outdoor areas — please ask the front desk where those are.",
  },
  {
    q: "Do you allow pets?",
    a: "Pets are not allowed at the hotel, with the exception of registered assistance dogs. If you are travelling with an assistance dog, let us know before arrival so we can prepare a suitable room.",
  },
];








