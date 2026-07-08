import type { ReceiverType, PurposeType } from "@/types";

export const RECEIVER_OPTIONS: { value: ReceiverType; label: string }[] = [
  { value: "DIRECT_SUPERVISOR", label: "상사" },
  { value: "OTHER_DEPT_COLLEAGUE", label: "동료" },
  { value: "CLIENT", label: "고객사" },
  { value: "EXTERNAL_PARTNER", label: "협력사" },
];

export const PURPOSE_OPTIONS: { value: PurposeType; label: string }[] = [
  { value: "REPORT", label: "보고" },
  { value: "REQUEST", label: "요청" },
  { value: "NOTICE", label: "안내" },
  { value: "THANKS", label: "감사" },
  { value: "APOLOGY", label: "사과" },
  { value: "DECLINE", label: "거절" },
];

/** 이메일 내용 입력 최대 글자 수 (생성용 brief — 교정용 2000자와 다름) */
export const EMAIL_MAX = 200;

/** [DEV ONLY] 교정 리뷰 화면 미리보기용 mock 데이터 */
export const DEV_MOCK_ORIGINAL =
  "팀장님, 보고서 확인해주세요. 문제 있으면 알려주세요.";

export const DEV_MOCK_REPLY_ANALYSIS: import("@/types").ReplyAnalysisResponse = {
  conversation:
    "김팀장이 프로젝트 일정 조정 가능 여부를 문의했고, 추가로 예산 확인도 요청했습니다.",
  recipient: {
    type: "DIRECT_SUPERVISOR",
    label: "상사",
    confidence: "high",
    reason: "발신인이 팀장 직함을 사용하고 있습니다.",
  },
  questions: [
    { id: 1, question: "프로젝트 일정 조정이 가능한가요?" },
    { id: 2, question: "예산 변경 사항이 있나요?" },
    { id: 3, question: "추가로 전달해야 할 사항이 있나요?" },
  ],
};

export const DEV_MOCK_REPLY_SUMMARIES: string[] = [
  "프로젝트 일정 조정 가능 여부 문의",
  "예산 항목 확인 요청 및 다음 주 회의 일정 조율 제안",
];

export const DEV_MOCK_CHANGES: import("@/types").CorrectionChange[] = [
  {
    index: 0,
    start: 8,
    end: 14,
    original: "확인해주세요",
    corrected: "확인 부탁드립니다",
    reason: "구어적인 요청을 업무 메일에 맞는 정중한 표현으로 다듬었습니다.",
    label: "AUTO",
    confidence: 0.95,
    applied_rules: [],
    action: null,
  },
  {
    index: 1,
    start: 17,
    end: 23,
    original: "문제 있으면",
    corrected: "특이사항 있으면",
    reason: "모호한 표현을 협업자가 바로 이해할 수 있게 구체화했습니다.",
    label: "SUGGEST",
    confidence: 0.88,
    applied_rules: [],
    action: null,
  },
  {
    index: 2,
    start: 24,
    end: 29,
    original: "알려주세요",
    corrected: "말씀해 주세요",
    reason: "친근한 느낌은 유지하되 비즈니스 메일 톤에 맞게 정리했습니다.",
    label: "STYLE",
    confidence: 0.75,
    applied_rules: [],
    action: null,
  },
];
