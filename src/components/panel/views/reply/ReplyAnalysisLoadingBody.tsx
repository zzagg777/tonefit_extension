import { ButtonLongV2 } from "@/components/ui";
import { MailReadingIcon } from "@/components/ui/MotionIcons";

/** 회신 분석 로딩 화면 (call) */
const ReplyAnalysisLoadingBody = ({
  onCancel,
}: {
  onCancel?: () => void;
}) => (
  <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <MailReadingIcon size={60} />
      <p className="text-xl font-semibold leading-7 tracking-tight text-text-primary text-center">
        받은 메일을 읽고,
        <br />
        답할 질문을 추리고 있어요.
      </p>
    </div>
    {onCancel && (
      <div className="w-full shrink-0">
        <ButtonLongV2 onClick={onCancel}>중단하기</ButtonLongV2>
      </div>
    )}
  </div>
);

export default ReplyAnalysisLoadingBody;
