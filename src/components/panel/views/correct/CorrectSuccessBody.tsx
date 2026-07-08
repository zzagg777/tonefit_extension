import { ButtonLongV2 } from "@/components/ui";
import type { CorrectionChange } from "@/types";

/** 교정 완료 요약 화면 */
const CorrectSuccessBody = ({
  acceptedChanges,
  rejectedChanges,
  totalCount,
  onReset,
}: {
  acceptedChanges: CorrectionChange[];
  rejectedChanges: CorrectionChange[];
  totalCount: number;
  onReset: () => void;
}) => (
  <div className="flex-1 flex flex-col justify-between h-full overflow-hidden bg-background-page">
    <div className="flex-1 overflow-y-auto px-4 py-10 flex flex-col gap-10">
      {/* 상단: 아이콘 + 타이틀 */}
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center justify-center size-25">
          <svg
            width="55"
            height="60"
            viewBox="0 0 55 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 봉투 몸체 */}
            <rect
              x="3"
              y="25"
              width="49"
              height="32"
              rx="5"
              fill="white"
              stroke="#7C4DFF"
              strokeWidth="3.2"
            />
            {/* 봉투 플랩 */}
            <path
              d="M3 30L27.5 46L52 30"
              stroke="#7C4DFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 편지지 */}
            <rect
              x="12"
              y="3"
              width="31"
              height="36"
              rx="4"
              fill="white"
              stroke="#7C4DFF"
              strokeWidth="3.2"
            />
            {/* 편지 줄 */}
            <line
              x1="18"
              y1="14"
              x2="37"
              y2="14"
              stroke="#7C4DFF"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <line
              x1="18"
              y1="21"
              x2="37"
              y2="21"
              stroke="#9B78FF"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <line
              x1="18"
              y1="28"
              x2="31"
              y2="28"
              stroke="#BFA7FF"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-3.5 items-center text-center">
          <p className="text-xl-plus font-semibold leading-7.5 tracking-tight text-text-primary">
            교정안을 작성칸에 넣어뒀어요.
          </p>
          <p className="text-base font-normal leading-6 tracking-tight text-text-secondary text-center">
            필요한 부분은 작성칸에서
            <br />한 번 더 다듬어 보낼 수 있어요.
          </p>
        </div>
      </div>

      {/* 교정 요약 + 상세 카드 */}
      <div className="flex flex-col gap-3.5">
        {/* 교정 요약 카드 */}
        <div className="bg-background-surface rounded-2xl p-3 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                교정 요약
              </span>
              <span className="text-xs font-semibold leading-4 tracking-tight text-text-brand">
                총 {totalCount}건
              </span>
            </div>
            <div className="flex gap-2.5 items-center text-center">
              <div className="flex-1 flex flex-col gap-1 items-center px-2.5 py-2.5 rounded-2xl bg-background-brand-subtle text-text-brand">
                <span className="text-2xl font-bold leading-8 tracking-tight">
                  {acceptedChanges.length}
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight">
                  반영
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center px-2.5 py-2.5 rounded-2xl bg-background-subtle text-text-secondary">
                <span className="text-2xl font-bold leading-8 tracking-tight">
                  {rejectedChanges.length}
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight whitespace-nowrap">
                  원문 유지
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center px-2.5 py-2.5 rounded-2xl bg-background-subtle text-text-placeholder">
                <span className="text-2xl font-bold leading-8 tracking-tight">
                  0
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight">
                  미검토
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 반영/원문유지 상세 카드 */}
        <div className="bg-background-surface rounded-2xl p-3 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] flex flex-col gap-4">
          {/* 반영된 교정 */}
          {acceptedChanges.length > 0 && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                  반영된 교정
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight text-text-brand">
                  {acceptedChanges.length}건
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {acceptedChanges.map((c, i) => (
                  <div key={c.index} className="flex gap-2.5 items-center">
                    <div className="bg-background-brand flex flex-col items-center justify-center px-2.5 py-0.5 rounded-full shrink-0 min-w-9">
                      <span className="text-xs font-semibold leading-4 text-text-inverse text-center">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex flex-1 gap-1.5 items-center min-w-0">
                      <p className="flex-1 text-xs font-semibold leading-4 text-text-tertiary truncate min-w-0 max-w-20">
                        {c.original}
                      </p>
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="9"
                          height="11"
                          viewBox="0 0 9 11"
                          fill="none"
                        >
                          <path
                            d="M7.75192 4.30125C8.34566 4.69707 8.34566 5.56953 7.75192 5.96535L1.5547 10.0968C0.890147 10.5399 4.75901e-07 10.0635 5.10813e-07 9.26478L8.71999e-07 1.00182C9.06911e-07 0.203122 0.890147 -0.273269 1.5547 0.169768L7.75192 4.30125Z"
                            fill="#7C4DFF"
                          />
                        </svg>
                      </span>
                      <p className="flex-1 text-xs font-semibold leading-4 text-text-primary truncate min-w-0">
                        {c.corrected}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 구분선 */}
          {acceptedChanges.length > 0 && rejectedChanges.length > 0 && (
            <div className="h-px w-full bg-border-subtle" />
          )}

          {/* 원문 유지 */}
          {rejectedChanges.length > 0 && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                  원문 유지
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight text-text-secondary">
                  {rejectedChanges.length}건
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {rejectedChanges.map((c, i) => (
                  <div key={c.index} className="flex gap-2.5 items-center">
                    <div className="bg-background-muted flex flex-col items-center justify-center px-2.5 py-0.5 rounded-full shrink-0 min-w-9">
                      <span className="text-xs font-semibold leading-4 text-text-placeholder text-center">
                        {String(acceptedChanges.length + i + 1).padStart(
                          2,
                          "0",
                        )}
                      </span>
                    </div>
                    <p className="flex-1 text-xs font-semibold leading-4 text-text-placeholder truncate min-w-0">
                      {c.original}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* 하단 버튼 */}
    <div className="px-4 pb-3 shrink-0">
      <ButtonLongV2 onClick={onReset}>새 교정 시작하기</ButtonLongV2>
    </div>
  </div>
);

export default CorrectSuccessBody;
