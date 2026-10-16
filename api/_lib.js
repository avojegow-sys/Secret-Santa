const crypto = require("crypto");
const { Redis } = require("@upstash/redis");
const nodemailer = require("nodemailer");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const KEYS = {
  participants: "santa:participants", // email -> анкета
  assign: "santa:assign", // email -> { number, targetEmail, targetNumber, sent }
};

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Полностью случайное распределение: каждый дарит одному человеку и получает ровно один подарок.
// Исключены подарок самому себе и взаимный обмен парами (A дарит B, а B дарит A).
// Номера выдаются отдельной случайной перестановкой, поэтому по номеру ничего не угадать.
function makePairs(emails) {
  const n = emails.length;
  if (n < 3) throw new Error("Нужно минимум 3 участника");

  const numbered = shuffle(emails);
  const numberOf = {};
  numbered.forEach((email, i) => { numberOf[email] = i + 1; });

  for (let attempt = 0; attempt < 100000; attempt++) {
    const targets = shuffle(emails);
    const target = {};
    emails.forEach((email, i) => { target[email] = targets[i]; });
    const ok = emails.every((g) => target[g] !== g && target[target[g]] !== g);
    if (!ok) continue;

    const result = {};
    emails.forEach((g) => {
      result[g] = { number: numberOf[g], targetEmail: target[g], targetNumber: numberOf[target[g]], sent: false };
    });
    return result;
  }
  throw new Error("Не удалось подобрать распределение");
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function transporter() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const FROM = () => process.env.MAIL_FROM || process.env.SMTP_USER;

function row(label, value) {
  if (!value || (Array.isArray(value) && !value.length)) return "";
  const text = Array.isArray(value) ? value.join(", ") : value;
  return `<tr><td style="padding:6px 12px 6px 0;color:#7a6446;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0">${esc(text)}</td></tr>`;
}

function assignmentMail(me, target, number, targetNumber) {
  const e = process.env;
  const allergies = [...(target.allergies || []), target.allergy_other].filter(Boolean);
  const info = [
    e.BUDGET && `Бюджет: ${e.BUDGET}`,
    e.GIFT_DEADLINE && `Сдать подарок до: ${e.GIFT_DEADLINE}`,
    e.PARTY_DATE && `Вручение подарков: ${e.PARTY_DATE}`,
  ].filter(Boolean);

  const html = `<!doctype html><html lang="ru"><body style="margin:0;background:#0d1240;padding:24px;font-family:Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#f1e0b3;border:4px solid #2a170c;padding:24px;color:#3a2414;line-height:1.5">
  <h1 style="margin:0 0 8px;font-size:22px;color:#9d1c2c">Тайный Санта: жеребьёвка прошла!</h1>
  <p style="margin:0 0 16px">Привет, ${esc(me.name)}! Вот твои номера.</p>
  <table style="width:100%;border-collapse:separate;border-spacing:8px"><tr>
    <td style="background:#fff8e0;border:3px solid #2a170c;text-align:center;padding:12px"><div style="font-size:12px;color:#7a6446">ТВОЙ НОМЕР</div><div style="font-size:32px;font-weight:bold">${number}</div></td>
    <td style="background:#d62839;color:#fff;border:3px solid #3a0f12;text-align:center;padding:12px"><div style="font-size:12px">ТЫ ДАРИШЬ НОМЕРУ</div><div style="font-size:32px;font-weight:bold">${targetNumber}</div></td>
  </tr></table>
  <h2 style="margin:20px 0 8px;font-size:16px;color:#9d1c2c">Анкета получателя</h2>
  <table style="width:100%;font-size:15px">
    ${row("Хочет", target.kinds)}
    ${row("Аллергии и ограничения", allergies)}
    ${row("Любит", target.likes)}
    ${row("Не дарить", target.dislikes)}
    ${row("Ещё", target.comment)}
  </table>
  <h2 style="margin:20px 0 8px;font-size:16px;color:#9d1c2c">Что дальше</h2>
  <ul style="margin:0;padding-left:20px">
    ${info.map((i) => `<li>${esc(i)}</li>`).join("")}
    <li>Упакуй подарок и напиши на нём <b>номер ${targetNumber}</b>. Имён на подарках быть не должно.</li>
    <li>Никому не говори, кому дарить ты.</li>
  </ul>
  <p style="margin:20px 0 0;color:#7a6446;font-size:13px">Если передумал участвовать, сообщи организатору как можно раньше.</p>
</div></body></html>`;

  const text = [
    `Привет, ${me.name}!`,
    `Твой номер: ${number}`,
    `Ты даришь подарок номеру: ${targetNumber}`,
    "",
    "Анкета получателя:",
    target.kinds?.length ? `Хочет: ${target.kinds.join(", ")}` : "",
    allergies.length ? `Аллергии и ограничения: ${allergies.join(", ")}` : "",
    target.likes ? `Любит: ${target.likes}` : "",
    target.dislikes ? `Не дарить: ${target.dislikes}` : "",
    target.comment ? `Ещё: ${target.comment}` : "",
    "",
    ...info,
    `Напиши на подарке номер ${targetNumber}.`,
  ].filter((l) => l !== "").join("\n");

  return { subject: "Тайный Санта: твой номер и номер получателя", html, text };
}

module.exports = { redis, KEYS, makePairs, assignmentMail, transporter, FROM, esc };
