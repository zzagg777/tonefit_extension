import { useState, useEffect } from "react";
import { ButtonLongV2 } from "@/components/ui";
import { AIPencilWritingIcon } from "@/components/ui/MotionIcons";

const getLoadingMessage = (
  elapsed: number,
  receiverLabel: string,
  purposeLabel: string,
): string => {
  if (elapsed < 5) return `${receiverLabel}에게 맞는 표현을 찾고 있어요.`;
  if (elapsed < 10) return `${purposeLabel}에 맞는 초안을 준비하고 있어요.`;
  return "초안을 완성하고 있어요. 잠깐만요.";
};

/** 이메일 생성 중 로딩 본문 */
const GenerateLoadingBody = ({
  receiverLabel,
  purposeLabel,
  onCancel,
  message,
}: {
  receiverLabel: string;
  purposeLabel: string;
  onCancel?: () => void;
  message?: string;
}) => {
  const [elapsed, setElapsed] = useState(0);

  // 경과 시간 — 로딩 메시지 전환용
  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* AI 연필 쓰기 애니메이션 */}
        <div className="shrink-0">
          <AIPencilWritingIcon size={160} />
        </div>

        {/* 텍스트 */}
        <div className="flex flex-col gap-2 items-center text-center w-80">
          <h6 className="text-xl font-medium leading-7 tracking-tight text-text-primary whitespace-pre-line">
            {message ?? getLoadingMessage(elapsed, receiverLabel, purposeLabel)}
          </h6>
          {!message && (
            <p className="text-sm font-normal leading-5.5 tracking-tight text-text-tertiary">
              입력하신 내용을 바탕으로
              <br />
              자연스러운 톤의 이메일을 만드는 중입니다.
            </p>
          )}
        </div>
      </div>

      {/* 취소 버튼 — 익스텐션 전용 */}
      {onCancel && (
        <div className="w-full shrink-0">
          <ButtonLongV2 onClick={onCancel}>중단하기</ButtonLongV2>
        </div>
      )}
    </div>
  );
};

export default GenerateLoadingBody;
