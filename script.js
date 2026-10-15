// Настройки события — поменяй под себя
const EVENT = {
  registrationUntil: "до 22 декабря",
  budget: "до 1 500 ₽",
  party: "на корпоративе",
};

// Адрес бэкенда. Пока пусто — форма работает в демо-режиме (данные не отправляются).
const API_URL = "";

// Пиксельный Санта: r — шапка, w — борода, s — лицо, k — глаза, n — нос
const SANTA = [
  "...rrrrr...",
  "..rrrrrrw..",
  ".rrrrrrrrw.",
  "wwwwwwwwwww",
  ".wsssssssw.",
  ".wsksssksw.",
  ".wsssnsssw.",
  "wwwwwwwwwww",
  "wwwwwwwwwww",
  ".wwwwwwwww.",
  "..wwwwwww..",
];
const SANTA_COLORS = { r: "#d62839", w: "#f4f4ff", s: "#f2b48a", k: "#1a1a2e", n: "#e08a6a" };
const santaSvg = `<svg viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">${SANTA.map((row, y) =>
  [...row].map((c, x) => (c === "." ? "" : `<rect x="${x}" y="${y}" width="1" height="1" fill="${SANTA_COLORS[c]}"/>`)).join("")
).join("")}</svg>`;
document.querySelectorAll(".santa").forEach((el) => { el.innerHTML = santaSvg; });

document.getElementById("fact-reg").textContent = EVENT.registrationUntil;
document.getElementById("fact-budget").textContent = EVENT.budget;
document.getElementById("fact-party").textContent = EVENT.party;

const form = document.getElementById("form");
const statusEl = document.getElementById("status");
const success = document.getElementById("success");

function collect() {
  const fd = new FormData(form);
  return {
    name: fd.get("name").trim(),
    email: fd.get("email").trim(),
    kinds: fd.getAll("kind"),
    allergies: fd.getAll("allergy"),
    allergy_other: fd.get("allergy_other").trim(),
    likes: fd.get("likes").trim(),
    dislikes: fd.get("dislikes").trim(),
    comment: fd.get("comment").trim(),
  };
}

function fail(msg, field) {
  statusEl.textContent = msg;
  statusEl.className = "status err";
  if (field) { field.classList.add("invalid"); field.focus(); }
}

form.addEventListener("input", (e) => e.target.classList.remove("invalid"));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  statusEl.className = "status";
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));

  const data = collect();
  if (!data.name) return fail("Укажи имя и фамилию.", form.elements.name);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) return fail("Проверь e-mail.", form.elements.email);
  if (!form.elements.consent.checked) return fail("Нужно согласие с правилами.");

  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    if (API_URL) {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.text()) || "Ошибка сервера");
    } else {
      console.info("Демо-режим, анкета:", data);
    }
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    fail("Не получилось отправить: " + err.message);
  } finally {
    btn.disabled = false;
  }
});
