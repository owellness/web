import type { DomainKey } from "./model";

export type OwtiQuestion = {
  /** 1-based question number (1–48), as printed in the assessment. */
  id: number;
  domain: DomainKey;
  /** Sub-facet label, e.g. "도전" / "수면". */
  facet: string;
  text: string;
};

// The 48 self-assessment items, 12 per domain, in printed order.
// Action Q1–12, Fitness Q13–24, Calm Q25–36, Heart Q37–48.
export const QUESTIONS: readonly OwtiQuestion[] = [
  // ── 실천의 힘 (Action) ──────────────────────────────────────────────
  { id: 1, domain: "action", facet: "도전", text: "나는 새로운 운동이나 건강 습관을 기꺼이 시도해본다." },
  { id: 2, domain: "action", facet: "도전", text: "나는 건강을 위해 지금과 다른 방식을 실험해볼 의지가 있다." },
  { id: 3, domain: "action", facet: "도전", text: "나는 불편하더라도 건강에 좋다면 생활 방식을 바꾸려 한다." },
  { id: 4, domain: "action", facet: "도전", text: "나는 건강 관련 강의, 책, 영상을 찾아본 적이 있다." },
  { id: 5, domain: "action", facet: "탐구", text: "나는 내 몸에 어떤 음식이나 운동이 맞는지 스스로 확인해본다." },
  { id: 6, domain: "action", facet: "탐구", text: "나는 건강·영양·수면 등에 관한 새로운 정보를 찾아 읽는다." },
  { id: 7, domain: "action", facet: "탐구", text: "나는 내 몸의 변화(체중, 컨디션, 수면 등)를 주기적으로 확인한다." },
  { id: 8, domain: "action", facet: "탐구", text: "나는 건강에 대해 가족이나 친구와 이야기를 나눈다." },
  { id: 9, domain: "action", facet: "목표", text: "나는 건강 관련 목표를 세우고 주기적으로 점검한다." },
  { id: 10, domain: "action", facet: "목표", text: "나는 건강 목표를 가족이나 친구 등 주변 사람과 공유한다." },
  { id: 11, domain: "action", facet: "목표", text: "나는 오늘 하루 내가 실천할 건강 행동을 미리 생각해둔다." },
  { id: 12, domain: "action", facet: "목표", text: "나는 건강 목표를 이루기 위해 구체적인 계획을 세운다." },

  // ── 건강한 몸 (Fitness) ─────────────────────────────────────────────
  { id: 13, domain: "fitness", facet: "신체 활동", text: "나는 일주일에 3일 이상 30분 이상 몸을 움직이는 활동을 한다." },
  { id: 14, domain: "fitness", facet: "신체 활동", text: "나는 유산소 운동 외에 근력 운동도 주 1회 이상 한다." },
  { id: 15, domain: "fitness", facet: "신체 활동", text: "나는 1시간 이상 앉아 있으면 일어나서 몸을 움직인다." },
  { id: 16, domain: "fitness", facet: "신체 활동", text: "나는 엘리베이터보다 계단을 이용하는 등 일상 속 활동량을 늘리려 한다." },
  { id: 17, domain: "fitness", facet: "영양", text: "나는 하루 한 끼 이상 채소와 과일을 충분히 포함한 식사를 한다." },
  { id: 18, domain: "fitness", facet: "영양", text: "나는 가공식품·배달음식보다 직접 조리한 식사를 더 자주 먹는다." },
  { id: 19, domain: "fitness", facet: "영양", text: "나는 단 음식이나 음료를 하루에 한 번 이내로 제한한다." },
  { id: 20, domain: "fitness", facet: "영양", text: "나는 배가 고프지 않아도 습관적으로 먹거나 폭식하는 일이 거의 없다." },
  { id: 21, domain: "fitness", facet: "수면", text: "나는 매일 7~8시간 정도 끊기지 않고 잘 잔다." },
  { id: 22, domain: "fitness", facet: "수면", text: "나는 잠자리에 들기 전 일정한 취침 루틴(스마트폰 줄이기, 조명 낮추기 등)이 있다." },
  { id: 23, domain: "fitness", facet: "수면", text: "나는 주말에도 평일과 비슷한 시간에 잠들고 일어난다." },
  { id: 24, domain: "fitness", facet: "수면", text: "나는 낮에 졸음이 심하거나 피로가 쌓인 느낌 없이 하루를 보낸다." },

  // ── 고요한 중심 (Calm) ──────────────────────────────────────────────
  { id: 25, domain: "calm", facet: "스트레스 회복", text: "나는 스트레스를 받을 때 내가 쓰는 나만의 해소 방법이 있다." },
  { id: 26, domain: "calm", facet: "스트레스 회복", text: "나는 화가 나거나 불안할 때 심호흡이나 잠깐의 휴식으로 진정한다." },
  { id: 27, domain: "calm", facet: "스트레스 회복", text: "나는 힘든 일이 있어도 며칠 안에 다시 일상으로 돌아온다." },
  { id: 28, domain: "calm", facet: "스트레스 회복", text: "나는 스트레스가 쌓이기 전에 미리 풀어내는 편이다." },
  { id: 29, domain: "calm", facet: "태도", text: "나는 실수나 실패를 배움의 기회로 받아들인다." },
  { id: 30, domain: "calm", facet: "태도", text: "나는 오늘 하루에서 감사할 것을 찾으려 한다." },
  { id: 31, domain: "calm", facet: "태도", text: "나는 어떤 상황에서도 긍정적인 면을 보려고 노력한다." },
  { id: 32, domain: "calm", facet: "태도", text: "나는 내가 통제할 수 없는 일에 지나치게 걱정하지 않는다." },
  { id: 33, domain: "calm", facet: "휴식", text: "나는 하루 중 업무나 집안일에서 완전히 벗어나는 시간을 갖는다." },
  { id: 34, domain: "calm", facet: "휴식", text: "나는 저녁이나 주말에 스마트폰·SNS에서 벗어나는 시간을 의도적으로 갖는다." },
  { id: 35, domain: "calm", facet: "휴식", text: "나는 업무나 공부 중 짧은 휴식을 의도적으로 취한다." },
  { id: 36, domain: "calm", facet: "휴식", text: "나는 몸이나 마음이 지쳤을 때 쉬어야 한다는 것을 스스로 인정한다." },

  // ── 나를 채우는 것들 (Heart) ────────────────────────────────────────
  { id: 37, domain: "heart", facet: "목적", text: "나는 내 삶에서 나만의 뚜렷한 목적이 있다." },
  { id: 38, domain: "heart", facet: "목적", text: "나는 내 가치관에 맞는 활동과 역할에 시간을 쓰고 있다." },
  { id: 39, domain: "heart", facet: "목적", text: "나는 지금 하는 일이나 활동에서 의미를 느낀다." },
  { id: 40, domain: "heart", facet: "목적", text: "나는 10년 후 내가 어떤 삶을 살고 싶은지 그림이 있다." },
  { id: 41, domain: "heart", facet: "관계", text: "나는 힘들 때 솔직하게 털어놓을 수 있는 사람이 있다." },
  { id: 42, domain: "heart", facet: "관계", text: "나는 운동·식사·건강 실천을 함께하는 사람이 주변에 있다." },
  { id: 43, domain: "heart", facet: "관계", text: "나는 일주일에 5회 이상 가족·친구와 직접 또는 전화로 연락한다." },
  { id: 44, domain: "heart", facet: "관계", text: "나는 주변 사람들과의 관계에서 대체로 만족감을 느낀다." },
  { id: 45, domain: "heart", facet: "에너지", text: "나는 나에게 활력을 주는 활동이나 취미가 하나 이상 있다." },
  { id: 46, domain: "heart", facet: "에너지", text: "나는 아침에 일어날 때 오늘 하루가 기대되거나 살아있다는 느낌이 든다." },
  { id: 47, domain: "heart", facet: "에너지", text: "나는 나를 지치게 하는 상황이나 사람과 적절히 거리를 둔다." },
  { id: 48, domain: "heart", facet: "에너지", text: "나는 피곤할 때 무리하지 않고 쉰다." },
] as const;

/** Questions for one domain, in printed order. */
export const questionsForDomain = (domain: DomainKey): OwtiQuestion[] =>
  QUESTIONS.filter((q) => q.domain === domain);
