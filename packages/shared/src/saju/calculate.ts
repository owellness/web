/// <reference path="../vendor/lunar-javascript.d.ts" />

import { Solar } from "lunar-javascript";

import {
  BRANCHES,
  ELEMENTS,
  SAJU_RESULT_VERSION,
  STEMS,
  type BranchKey,
  type ElementCounts,
  type ElementKey,
  type PillarKey,
  type SajuInput,
  type SajuPillar,
  type SajuWellnessResult,
  type StemKey,
} from "./model";

const MIN_SUPPORTED_YEAR = 1900;
const BEIJING_STANDARD_OFFSET_MINUTES = 8 * 60;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type TimeParts = {
  hour: number;
  minute: number;
};

function parseDate(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("생년월일을 정확히 입력해주세요.");

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    year < MIN_SUPPORTED_YEAR ||
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error(`${MIN_SUPPORTED_YEAR}년 이후의 실제 날짜를 입력해주세요.`);
  }

  const today = new Date();
  const todayKey = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  if (candidate.getTime() > todayKey) {
    throw new Error("미래 날짜는 입력할 수 없어요.");
  }

  return { year, month, day };
}

function parseTime(value: string | null): TimeParts {
  if (value === null) return { hour: 12, minute: 0 };
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("출생 시간을 정확히 입력해주세요.");

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new Error("출생 시간을 정확히 입력해주세요.");
  }
  return { hour, minute };
}

function parseGmtOffset(label: string): number | null {
  if (label === "GMT" || label === "UTC") return 0;
  const match = /^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(label);
  if (!match) return null;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/**
 * Resolve the historical UTC offset used by Seoul for the supplied wall date.
 * The probe is intentionally local-noon-ish; it captures historical standard
 * time and the 1987–1988 daylight-saving periods without transmitting input.
 */
function getSeoulOffsetMinutes(
  date: DateParts,
  time: TimeParts,
): number {
  const probe = new Date(
    Date.UTC(date.year, date.month - 1, date.day, time.hour - 9, time.minute),
  );
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    timeZoneName: "longOffset",
    hour: "2-digit",
  });
  const offsetLabel = formatter
    .formatToParts(probe)
    .find((part) => part.type === "timeZoneName")?.value;
  const parsed = offsetLabel ? parseGmtOffset(offsetLabel) : null;
  return parsed ?? 9 * 60;
}

function shiftWallTime(
  date: DateParts,
  time: TimeParts,
  minutes: number,
): DateParts & TimeParts {
  const shifted = new Date(
    Date.UTC(
      date.year,
      date.month - 1,
      date.day,
      time.hour,
      time.minute + minutes,
    ),
  );
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

function isStem(value: string): value is StemKey {
  return value in STEMS;
}

function isBranch(value: string): value is BranchKey {
  return value in BRANCHES;
}

function makePillar(key: PillarKey, ganZhi: string): SajuPillar {
  const [stem, branch] = [...ganZhi];
  if (!isStem(stem) || !isBranch(branch)) {
    throw new Error("명식 계산 결과를 읽지 못했어요. 입력을 확인해주세요.");
  }
  return {
    key,
    stem,
    branch,
    stemElement: STEMS[stem].element,
    branchElement: BRANCHES[branch].element,
  };
}

function emptyElementCounts(): Record<ElementKey, number> {
  return Object.fromEntries(
    ELEMENTS.map((element) => [element.key, 0]),
  ) as Record<ElementKey, number>;
}

function countElements(pillars: readonly SajuPillar[]): ElementCounts {
  const counts = emptyElementCounts();
  for (const pillar of pillars) {
    counts[pillar.stemElement] += 1;
    counts[pillar.branchElement] += 1;
  }
  return counts;
}

function getEightChar(date: DateParts, time: TimeParts) {
  const eightChar = Solar.fromYmdHms(
    date.year,
    date.month,
    date.day,
    time.hour,
    time.minute,
    0,
  )
    .getLunar()
    .getEightChar();
  // Sect 2 changes the day pillar at civil midnight, not at 23:00.
  eightChar.setSect(2);
  return eightChar;
}

/**
 * Builds a reflection-oriented wellness result from a Korean solar birth date.
 * Year/month use solar-term boundaries adjusted from the engine's UTC+8 basis
 * to historical Asia/Seoul civil time. Day/time use the entered local clock.
 */
export function calculateSajuWellness(input: SajuInput): SajuWellnessResult {
  const date = parseDate(input.birthDate);
  const time = parseTime(input.birthTime);
  const timeKnown = input.birthTime !== null;

  const localEightChar = getEightChar(date, time);
  const seoulOffset = getSeoulOffsetMinutes(date, time);
  const termShiftMinutes = BEIJING_STANDARD_OFFSET_MINUTES - seoulOffset;
  const termDateTime = shiftWallTime(date, time, termShiftMinutes);
  const termEightChar = getEightChar(termDateTime, termDateTime);

  const year = makePillar("year", termEightChar.getYear());
  const month = makePillar("month", termEightChar.getMonth());
  const day = makePillar("day", localEightChar.getDay());
  const timePillar = timeKnown
    ? makePillar("time", localEightChar.getTime())
    : null;

  const includedPillars = [year, month, day];
  if (timePillar) includedPillars.push(timePillar);

  return {
    version: SAJU_RESULT_VERSION,
    dayMaster: day.stem,
    pillars: { year, month, day, time: timePillar },
    elementCounts: countElements(includedPillars),
    includedSymbols: timeKnown ? 8 : 6,
    timeKnown,
    termBoundaryAdjusted:
      localEightChar.getYear() !== termEightChar.getYear() ||
      localEightChar.getMonth() !== termEightChar.getMonth(),
  };
}

export function isSajuWellnessResult(
  value: unknown,
): value is SajuWellnessResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<SajuWellnessResult>;
  const isPillar = (pillar: unknown, expectedKey: PillarKey): boolean => {
    if (!pillar || typeof pillar !== "object") return false;
    const candidate = pillar as Partial<SajuPillar>;
    return (
      candidate.key === expectedKey &&
      typeof candidate.stem === "string" &&
      isStem(candidate.stem) &&
      typeof candidate.branch === "string" &&
      isBranch(candidate.branch) &&
      candidate.stemElement === STEMS[candidate.stem].element &&
      candidate.branchElement === BRANCHES[candidate.branch].element
    );
  };

  if (result.includedSymbols !== 6 && result.includedSymbols !== 8) return false;
  if (!result.pillars || typeof result.pillars !== "object") return false;
  if (!result.elementCounts || typeof result.elementCounts !== "object") {
    return false;
  }

  const countsAreValid = ELEMENTS.every((element) => {
    const count = result.elementCounts?.[element.key];
    return typeof count === "number" && Number.isInteger(count) && count >= 0;
  });
  const countTotal = countsAreValid
    ? ELEMENTS.reduce(
        (sum, element) => sum + (result.elementCounts?.[element.key] ?? 0),
        0,
      )
    : -1;

  return (
    result.version === SAJU_RESULT_VERSION &&
    typeof result.dayMaster === "string" &&
    isStem(result.dayMaster) &&
    isPillar(result.pillars.year, "year") &&
    isPillar(result.pillars.month, "month") &&
    isPillar(result.pillars.day, "day") &&
    (result.pillars.time === null || isPillar(result.pillars.time, "time")) &&
    countsAreValid &&
    countTotal === result.includedSymbols &&
    typeof result.timeKnown === "boolean" &&
    result.timeKnown === (result.pillars.time !== null) &&
    result.includedSymbols === (result.timeKnown ? 8 : 6) &&
    typeof result.termBoundaryAdjusted === "boolean"
  );
}
