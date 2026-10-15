const crypto = require("crypto");
const { redis, KEYS, makePairs, assignmentMail, transporter, FROM } = require("./_lib");

function authorized(req) {
  const given = Buffer.from(String(req.headers["x-admin-token"] || ""));
  const want = Buffer.from(String(process.env.ADMIN_TOKEN || ""));
  return want.length > 0 && given.length === want.length && crypto.timingSafeEqual(given, want);
}

async function load() {
  const participants = (await redis.hgetall(KEYS.participants)) || {};
  const assign = (await redis.hgetall(KEYS.assign)) || {};
  return { participants, assign };
}

async function sendPending(participants, assign) {
  const t = transporter();
  let sent = 0;
  const errors = [];
  for (const [email, a] of Object.entries(assign)) {
    if (a.sent) continue;
    const me = participants[email];
    const target = participants[a.targetEmail];
    try {
      const mail = assignmentMail(me, target, a.number, a.targetNumber);
      await t.sendMail({ from: FROM(), to: email, ...mail });
      await redis.hset(KEYS.assign, { [email]: { ...a, sent: true } });
      sent++;
    } catch (err) {
      errors.push({ email, error: String(err.message || err) });
    }
  }
  return { sent, errors };
}

module.exports = async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ error: "Неверный пароль" });

  try {
    const { participants, assign } = await load();

    if (req.method === "GET") {
      const rows = Object.values(participants).map((p) => ({
        name: p.name,
        email: p.email,
        sent: assign[p.email]?.sent ?? null,
      }));
      return res.json({
        count: rows.length,
        drawn: Object.keys(assign).length > 0,
        sent: Object.values(assign).filter((a) => a.sent).length,
        participants: rows,
      });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });
    const { action, to } = req.body || {};

    if (action === "test") {
      if (!to) return res.status(400).json({ error: "Укажи адрес" });
      await transporter().sendMail({ from: FROM(), to, subject: "Тайный Санта: тест почты", text: "Если ты это читаешь, почта настроена." });
      return res.json({ ok: true });
    }

    if (action === "draw") {
      if (Object.keys(assign).length) return res.status(409).json({ error: "Жеребьёвка уже проведена. Чтобы догнать неотправленные письма, нажми «Дослать»." });
      const pairs = makePairs(Object.keys(participants));
      await redis.hset(KEYS.assign, pairs);
      const result = await sendPending(participants, pairs);
      return res.json({ ok: true, ...result });
    }

    if (action === "send") {
      if (!Object.keys(assign).length) return res.status(400).json({ error: "Жеребьёвки ещё не было" });
      return res.json({ ok: true, ...(await sendPending(participants, assign)) });
    }

    if (action === "reset") {
      await redis.del(KEYS.assign);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "Неизвестное действие" });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
};
