import { REVIEWS } from "./data.js";
import { escapeHtml, qs, toast } from "./utils.js";
import { iconFilled } from "./icons.js";

const GUEST_REVIEWS_KEY = "dabara_guest_reviews";

function loadGuestReviews() {
  try {
    const raw = localStorage.getItem(GUEST_REVIEWS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveGuestReview(review) {
  const list = loadGuestReviews();
  list.unshift(review);
  try {
    localStorage.setItem(GUEST_REVIEWS_KEY, JSON.stringify(list));
  } catch {}
}

function reviewCard(r) {
  const stars = Array.from({ length: Math.max(1, Number(r.rating) || 5) })
    .map(() => iconFilled("star"))
    .join("");
  return `
    <div class="review">
      <div class="review__head">
        <div class="avatar">${(r.name || "G").charAt(0).toUpperCase()}</div>
        <div class="grow">
          <b>${escapeHtml(r.name || "Guest")}</b>
          <span>${escapeHtml(r.role || "Guest stay")}</span>
        </div>
        <span class="rating">${stars}</span>
      </div>
      <p>“${escapeHtml(r.text || "")}”</p>
    </div>`;
}

function allReviews() {
  return [...loadGuestReviews(), ...REVIEWS];
}

function renderReviews() {
  const all = allReviews();

  const grid = qs("#all-reviews");
  if (grid) {
    grid.innerHTML = all.map(reviewCard).join("");
  }

  const count = qs("#reviews-count");
  if (count) {
    const average = all.length
      ? (all.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / all.length).toFixed(1)
      : "0.0";
    count.textContent = `${all.length} guest review${
      all.length === 1 ? "" : "s"
    } · ${average} out of 5 on average`;
  }
}

function initReviewForm() {
  const form = qs("#reviewForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = qs("#revName", form)?.value.trim() || "";
    const role = qs("#revRole", form)?.value.trim() || "";
    const rating = Number(qs("#revRating", form)?.value) || 5;
    const text = qs("#revText", form)?.value.trim() || "";

    if (!name || !role || !text) {
      toast("Please add your name, stay type and a short review.", "danger");
      return;
    }

    saveGuestReview({ name, role, rating, text, date: new Date().toISOString() });
    form.reset();
    renderReviews();

    const msg = qs("#reviewMsg");
    if (msg) {
      msg.innerHTML = `<p class="text-gold"><b>Thank you, ${escapeHtml(
        name,
      )}.</b> Your review is now showing at the top of the list.</p>`;
    }
    toast("Thanks! Your review has been posted.", "success");

    qs("#all-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

renderReviews();
initReviewForm();
