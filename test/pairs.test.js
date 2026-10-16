const assert = require("assert");
const { makePairs } = require("../api/_lib");

for (let n = 3; n <= 40; n++) {
  for (let run = 0; run < 20; run++) {
    const emails = Array.from({ length: n }, (_, i) => `u${i}@x.ru`);
    const p = makePairs(emails);
    assert.strictEqual(new Set(Object.values(p).map((a) => a.number)).size, n, "номера уникальны");
    assert.strictEqual(new Set(Object.values(p).map((a) => a.targetEmail)).size, n, "каждого выбирают ровно один раз");
    for (const [email, a] of Object.entries(p)) {
      assert.notStrictEqual(a.targetEmail, email, "не дарит себе");
      assert.notStrictEqual(p[a.targetEmail].targetEmail, email, "нет взаимных пар");
      assert.strictEqual(p[a.targetEmail].number, a.targetNumber, "номер получателя совпадает");
    }
  }
}

// Распределение не сводится к одному кругу: бывают и несколько отдельных цепочек
let multi = 0;
for (let run = 0; run < 400; run++) {
  const emails = Array.from({ length: 8 }, (_, i) => `u${i}@x.ru`);
  const p = makePairs(emails);
  let seen = new Set(), cycles = 0;
  for (const e of emails) {
    if (seen.has(e)) continue;
    cycles++;
    for (let x = e; !seen.has(x); x = p[x].targetEmail) seen.add(x);
  }
  if (cycles > 1) multi++;
}
assert.ok(multi > 0, "бывают несколько цепочек");

assert.throws(() => makePairs(["a@x.ru", "b@x.ru"]));
console.log("ok");
