import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateSajuWellness,
  isSajuWellnessResult,
} from "@owellness/shared/saju";

test("calculates the documented 1986 solar-date fixture", () => {
  const result = calculateSajuWellness({
    birthDate: "1986-05-29",
    birthTime: "00:00",
  });

  assert.equal(
    `${result.pillars.year.stem}${result.pillars.year.branch}`,
    "丙寅",
  );
  assert.equal(
    `${result.pillars.month.stem}${result.pillars.month.branch}`,
    "癸巳",
  );
  assert.equal(
    `${result.pillars.day.stem}${result.pillars.day.branch}`,
    "癸酉",
  );
  assert.equal(
    `${result.pillars.time?.stem}${result.pillars.time?.branch}`,
    "壬子",
  );
  assert.equal(result.dayMaster, "癸");
  assert.equal(result.includedSymbols, 8);
});

test("does not invent a time pillar when birth time is unknown", () => {
  const result = calculateSajuWellness({
    birthDate: "1986-05-29",
    birthTime: null,
  });

  assert.equal(result.pillars.time, null);
  assert.equal(result.includedSymbols, 6);
  assert.equal(
    Object.values(result.elementCounts).reduce((sum, count) => sum + count, 0),
    6,
  );
});

test("adjusts the 2024 solar-term boundary from UTC+8 to Korea time", () => {
  const before = calculateSajuWellness({
    birthDate: "2024-02-04",
    birthTime: "17:00",
  });
  const after = calculateSajuWellness({
    birthDate: "2024-02-04",
    birthTime: "18:00",
  });

  assert.equal(`${before.pillars.year.stem}${before.pillars.year.branch}`, "癸卯");
  assert.equal(`${before.pillars.month.stem}${before.pillars.month.branch}`, "乙丑");
  assert.equal(`${after.pillars.year.stem}${after.pillars.year.branch}`, "甲辰");
  assert.equal(`${after.pillars.month.stem}${after.pillars.month.branch}`, "丙寅");
  assert.equal(before.termBoundaryAdjusted, true);
});

test("rejects invalid and future dates", () => {
  assert.throws(
    () =>
      calculateSajuWellness({
        birthDate: "2025-02-29",
        birthTime: null,
      }),
    /실제 날짜/,
  );
  assert.throws(
    () =>
      calculateSajuWellness({
        birthDate: "9999-01-01",
        birthTime: null,
      }),
    /미래 날짜/,
  );
});

test("rejects corrupt stored results before rendering", () => {
  const valid = calculateSajuWellness({
    birthDate: "1986-05-29",
    birthTime: null,
  });

  assert.equal(isSajuWellnessResult(valid), true);
  assert.equal(
    isSajuWellnessResult({ ...valid, pillars: { day: valid.pillars.day } }),
    false,
  );
  assert.equal(
    isSajuWellnessResult({
      ...valid,
      elementCounts: { ...valid.elementCounts, water: 999 },
    }),
    false,
  );
});
