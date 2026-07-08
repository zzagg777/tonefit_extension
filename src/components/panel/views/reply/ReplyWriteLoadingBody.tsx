import { useState, useEffect } from "react";
import { ButtonLongV2 } from "@/components/ui";
import { MailReadingIcon } from "@/components/ui/MotionIcons";
import GenerateLoadingBody from "../generate/GenerateLoadingBody";

/** 회신 작성 로딩 화면 (load) — 10초 후 점검 메시지로 전환 */
const ReplyWriteLoadingBody = ({
  onCancel,
}: {
  onCancel?: () => void;
}) => {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <MailReadingIcon size={60} />
          <p className="text-xl font-semibold leading-7 tracking-tight text-text-primary text-center">
            이상이 없는지
            <br />
            꼼꼼히 살펴볼게요.
          </p>
        </div>
        {onCancel && (
          <div className="w-full shrink-0">
            <ButtonLongV2 onClick={onCancel}>중단하기</ButtonLongV2>
          </div>
        )}
      </div>
    );
  }

  return (
    <GenerateLoadingBody
      receiverLabel=""
      purposeLabel=""
      message={"답해주신 내용으로\n회신을 작성하고 있어요"}
      onCancel={onCancel}
    />
  );
};

export default ReplyWriteLoadingBody;
