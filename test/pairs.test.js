const assert = require("assert");
const { makePairs } = require("../api/_lib");

for (let n = 3; n <= 40; n++) {
  const emails = Array.from({ length: n }, (_, i) => `u${i}@x.ru`);
  const p = makePairs(emails);
  const numbers = new Set(Object.values(p).map((a) => a.number));
  assert.strictEqual(numbers.size, n, "номера уникальны");
  const targets = new Set(Object.values(p).map((a) => a.targetEmail));
  assert.strictEqual(targets.size, n, "каждого выбирают ровно один раз");
  for (const [email, a] of Object.entries(p)) {
    assert.notStrictEqual(a.targetEmail, email, "не дарит себе");
    assert.notStrictEqual(p[a.targetEmail].targetEmail, email, "нет взаимных пар");
    assert.strictEqual(p[a.targetEmail].number, a.targetNumber, "номер получателя совпадает");
  }
}
assert.throws(() => makePairs(["a@x.ru", "b@x.ru"]));
console.log("ok");
