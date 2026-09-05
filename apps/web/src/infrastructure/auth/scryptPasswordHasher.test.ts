import assert from "node:assert/strict";
import { test } from "node:test";

import { scryptPasswordHasher } from "./scryptPasswordHasher";

test("scrypt password hashes are salted and never contain the plaintext", async () => {
  const password = "wellness123";
  const first = await scryptPasswordHasher.hash(password);
  const second = await scryptPasswordHasher.hash(password);

  assert.match(first, /^scrypt\$v1\$16384\$8\$1\$/);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
});
