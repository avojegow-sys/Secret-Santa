const { redis, KEYS } = require("./_lib");

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const list = (v, n = 20) => (Array.isArray(v) ? v.slice(0, n).map((x) => clip(x, 60)).filter(Boolean) : []);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  const deadline = process.env.REGISTRATION_DEADLINE;
  if (deadline && Date.now() > Date.parse(deadline)) {
    return res.status(403).send("Регистрация уже закрыта.");
  }
  if ((await redis.hlen(KEYS.assign)) > 0) {
    return res.status(403).send("Жеребьёвка уже прошла, регистрация закрыта.");
  }

  const b = req.body || {};
  const name = clip(b.name, 100);
  const email = clip(b.email, 200).toLowerCase();
  if (!name) return res.status(400).send("Укажи имя.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).send("Проверь e-mail.");

  await redis.hset(KEYS.participants, {
    [email]: {
      name,
      email,
      kinds: list(b.kinds),
      allergies: list(b.allergies),
      allergy_other: clip(b.allergy_other, 300),
      likes: clip(b.likes, 1000),
      dislikes: clip(b.dislikes, 1000),
      comment: clip(b.comment, 1000),
      createdAt: new Date().toISOString(),
    },
  });
  res.status(200).json({ ok: true });
};
