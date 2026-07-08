import { useState } from "react";
import { ChipV2, ButtonLongV2 } from "@/components/ui";
import type { ReceiverType } from "@/types";
import { RECEIVER_OPTIONS } from "../../constants";

/** 회신 질문 답변 입력 폼 (input) */
const ReplyInputBody = ({
  analysis,
  summaries,
  originalSubject,
  onSubmit,
}: {
  analysis: import("@/types").ReplyAnalysisResponse;
  summaries: string[];
  originalSubject?: string;
  onSubmit: (data: import("@/types").ReplyRequest) => void;
}) => {
  const [receiver, setReceiver] = useState<ReceiverType | null>(
    analysis.recipient?.type ?? null,
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [freeInput, setFreeInput] = useState("");
  const [extraMessage, setExtraMessage] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);

  const answeredCount = Object.values(answers).filter((v) => v.trim()).length;
  const hasQuestions = analysis.questions.length > 0;
  const canSubmit =
    !!receiver &&
    (hasQuestions
      ? answeredCount >= Math.min(2, analysis.questions.length)
      : freeInput.trim().length > 0);

  const handleSubmit = () => {
    if (!receiver) return;
    const answerItems = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([id, answer]) => ({ question_id: Number(id), answer }));
    onSubmit({
      conversation: analysis.conversation,
      receiver_type: receiver,
      original_subject: originalSubject || undefined,
      questions: analysis.questions.length > 0 ? analysis.questions : undefined,
      answers: answerItems.length > 0 ? answerItems : undefined,
      free_input: freeInput.trim() || undefined,
      extra_message: extraMessage.trim() || undefined,
    });
  };

  return (
    <div className="bg-background-page flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
        {/* 헤더 */}
        <div className="px-2.5">
          <h2 className="text-2xl font-bold leading-8 tracking-tight text-text-primary">
            받은 메일을 읽고,
            <br />
            답장에 필요한 질문을 추렸어요
          </h2>
        </div>

        {/* 메일 요약 카드 */}
        <div className="bg-background-surface rounded-2xl p-3.5 shadow-[0px_1px_4px_rgba(124,77,255,0.1)]">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold leading-6 tracking-tight text-text-primary">
              메일 요약
            </span>
            <button
              type="button"
              onClick={() => setSummaryOpen((o) => !o)}
              className="text-text-tertiary cursor-pointer"
              aria-label={summaryOpen ? "접기" : "펼치기"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-200 ${summaryOpen ? "rotate-90" : ""}`}
              >
                <path
                  d="M13.8297 10.8192C14.3984 10.4211 14.3984 9.57887 13.8297 9.18077L6.57346 4.10142C5.91069 3.63748 5 4.11163 5 4.92066L5 15.0793C5 15.8884 5.91069 16.3625 6.57346 15.8986L13.8297 10.8192Z"
                  fill="#D2D6E1"
                />
              </svg>
            </button>
          </div>
          {summaryOpen && summaries.length > 0 && (
            <>
              <div className="border-t border-border-subtle w-full my-2.5" />
              <div className="flex flex-col gap-1.5">
                {summaries.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1 px-1.5 py-1 rounded-sm"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mt-0.5"
                    >
                      <path
                        d="M7.29338 2.22711C7.05537 2.07868 6.7805 2 6.5 2C6.18699 1.99981 5.88177 2.09759 5.62714 2.27963C5.3725 2.46166 5.18122 2.71882 5.08012 3.01505L4.55535 4.55488L3.01703 5.07965L2.84011 5.15162C2.57346 5.28215 2.35157 5.4889 2.20256 5.74568C2.05354 6.00245 1.98411 6.29768 2.00306 6.59395C2.02201 6.89023 2.12848 7.17421 2.309 7.4099C2.48951 7.6456 2.73593 7.8224 3.01703 7.9179L4.55685 8.44267L5.08162 9.981L5.15359 10.1564C5.28399 10.4231 5.49062 10.6451 5.7473 10.7942C6.00398 10.9433 6.29916 11.0129 6.59542 10.9941C6.89168 10.9753 7.1757 10.869 7.41149 10.6887C7.64727 10.5083 7.82421 10.262 7.91988 9.981L8.44465 8.44117L9.98297 7.9164L10.1599 7.84444C10.4265 7.7139 10.6484 7.50715 10.7974 7.25038C10.9465 6.99361 11.0159 6.69837 10.9969 6.4021C10.978 6.10583 10.8715 5.82185 10.691 5.58615C10.5105 5.35045 10.2641 5.17365 9.98297 5.07815L8.44315 4.55338L7.91838 3.01505L7.84641 2.83963C7.72299 2.58775 7.53139 2.37553 7.29338 2.22711Z"
                        fill="#7C4DFF"
                      />
                    </svg>
                    <p className="text-xs font-normal leading-4.5 tracking-tight text-text-secondary">
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 수신자 유형 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-3">
            <p className="text-base font-semibold leading-6 tracking-tight text-text-primary shrink-0">
              수신자 유형 선택
            </p>
            <p className="text-xs font-normal leading-4 tracking-tight text-text-placeholder">
              *AI가 미리 골라뒀어요
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {RECEIVER_OPTIONS.map(({ value, label }) => (
              <ChipV2
                key={value}
                selected={receiver === value}
                size="md"
                onClick={() => setReceiver(receiver === value ? null : value)}
              >
                {label}
              </ChipV2>
            ))}
          </div>
        </div>

        {/* 회신에 필요한 정보 (질문) */}
        {analysis.questions.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="px-3">
              <p className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                회신에 필요한 정보
              </p>
            </div>
            <div className="bg-background-surface rounded-2xl p-4 shadow-[0px_1px_4px_rgba(124,77,255,0.1)]">
              <div className="flex flex-col gap-5">
                {analysis.questions.map((q, i) => (
                  <div key={q.id}>
                    {i > 0 && (
                      <div className="border-t border-border-subtle w-full mb-5" />
                    )}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start gap-2">
                        <span className="bg-background-brand text-text-inverse text-xs font-semibold leading-4 tracking-tight px-2.5 py-0.5 rounded-full min-w-[35px] text-center">
                          Q{q.id}
                        </span>
                        <p className="flex-1 text-sm font-semibold leading-5 tracking-tight text-text-primary">
                          {q.question}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={answers[q.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder="답변을 작성해주세요."
                        className="w-full bg-background-subtle border border-border-default rounded-lg px-4 py-3 text-sm font-normal leading-5.5 tracking-tight text-text-primary placeholder:text-text-placeholder outline-none focus:border-border-focus"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 자유 입력 (질문 없을 때) */}
        {!hasQuestions && (
          <div className="flex flex-col gap-2.5">
            <div className="px-3">
              <p className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                회신에 필요한 정보
              </p>
            </div>
            <textarea
              value={freeInput}
              onChange={(e) => setFreeInput(e.target.value)}
              placeholder="전하려는 내용을 입력해주세요"
              rows={4}
              className="w-full bg-background-surface border border-border-default rounded-2xl px-4 py-3 text-sm font-normal leading-5.5 tracking-tight text-text-primary placeholder:text-text-placeholder outline-none focus:border-border-focus resize-none"
            />
          </div>
        )}

        {/* 추가로 전할 말 (선택) */}
        <div className="flex flex-col gap-2.5">
          <div className="px-3">
            <p className="text-base font-semibold leading-6 tracking-tight text-text-primary">
              추가로 전할 말 <span>(선택)</span>
            </p>
          </div>
          <textarea
            value={extraMessage}
            onChange={(e) => setExtraMessage(e.target.value)}
            placeholder="내용을 입력해주세요"
            rows={4}
            className="w-full bg-background-surface border border-border-default rounded-2xl px-4 py-3 text-xs font-normal leading-4.5 tracking-tight text-text-primary placeholder:text-text-placeholder outline-none focus:border-border-focus resize-none"
          />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-4 py-3 shrink-0 bg-gradient-to-t from-background-page via-background-page to-transparent pt-6">
        <ButtonLongV2 onClick={handleSubmit} disabled={!canSubmit}>
          회신 작성하기
        </ButtonLongV2>
      </div>
    </div>
  );
};

export default ReplyInputBody;
