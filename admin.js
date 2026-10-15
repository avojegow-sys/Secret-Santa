const $ = (id) => document.getElementById(id);
const msg = (t, err) => { $("msg").textContent = t; $("msg").className = err ? "status err" : "status"; };

try { $("token").value = sessionStorage.getItem("santa-token") || ""; } catch (e) {}

async function call(method, body) {
  const res = await fetch("/api/admin", {
    method,
    headers: { "Content-Type": "application/json", "x-admin-token": $("token").value },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ошибка " + res.status);
  return data;
}

async function refresh() {
  try {
    const d = await call("GET");
    try { sessionStorage.setItem("santa-token", $("token").value); } catch (e) {}
    $("panel").hidden = false;
    $("stats").textContent = `Участников: ${d.count}. ` + (d.drawn ? `Жеребьёвка проведена, писем отправлено: ${d.sent}.` : "Жеребьёвка ещё не проводилась.");
    $("rows").innerHTML = "";
    d.participants.forEach((p) => {
      const tr = document.createElement("tr");
      [p.name, p.email, p.sent === null ? "—" : p.sent ? "отправлено" : "не отправлено"].forEach((v) => {
        const td = document.createElement("td"); td.textContent = v; tr.appendChild(td);
      });
      $("rows").appendChild(tr);
    });
    msg("");
  } catch (e) { $("panel").hidden = true; msg(e.message, true); }
}

async function act(action, extra, okText) {
  msg("Работаю…");
  try {
    const d = await call("POST", { action, ...extra });
    msg(typeof d.sent === "number" ? `${okText} Отправлено: ${d.sent}` + (d.errors?.length ? `, ошибок: ${d.errors.length} (${d.errors[0].error})` : "") : okText);
    await refresh();
  } catch (e) { msg(e.message, true); }
}

$("load").onclick = refresh;
$("test").onclick = () => act("test", { to: $("test-to").value }, "Тестовое письмо отправлено.");
$("send").onclick = () => act("send", {}, "Готово.");
$("draw").onclick = () => {
  if (!$("draw").dataset.armed) {
    $("draw").dataset.armed = "1";
    $("draw").textContent = "Точно? Нажми ещё раз";
    setTimeout(() => { delete $("draw").dataset.armed; $("draw").textContent = "Провести жеребьёвку"; }, 5000);
    return;
  }
  delete $("draw").dataset.armed;
  $("draw").textContent = "Провести жеребьёвку";
  act("draw", {}, "Жеребьёвка проведена.");
};
