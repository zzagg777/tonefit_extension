import { NoCorrectionIcon } from "@/components/ui/MotionIcons";

/** 교정 항목 없음 화면 */
const CorrectNoneBody = ({ onConfirm }: { onConfirm?: () => void }) => (
  <div className="flex flex-col items-center justify-between h-full px-4 pt-8 pb-6">
    <div className="flex flex-col items-center gap-4 flex-1 justify-center">
      <NoCorrectionIcon size={160} />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xl-plus font-semibold leading-height-xl tracking-tight text-text-primary">
          더 고칠 부분이 없어요
        </p>
        <p className="text-base font-normal leading-6 text-text-secondary whitespace-pre-line">
          {
            "지금 메일은 그대로 보내도 좋아요.\n작성창에서 마지막으로 확인해 주세요."
          }
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onConfirm}
      className="w-full h-12 rounded-xl bg-background-brand text-text-inverse font-semibold text-base"
    >
      확인
    </button>
  </div>
);

export default CorrectNoneBody;
