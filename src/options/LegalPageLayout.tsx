import type { ReactNode, RefObject } from "react";

interface LegalPageLayoutProps {
  title: string;
  /** 탭 등 타이틀 위에 들어가는 영역 */
  header?: ReactNode;
  children: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
}

const LegalPageLayout = ({ title, header, children, scrollRef }: LegalPageLayoutProps) => (
  <div
    className={`bg-background-surface rounded-4xl flex flex-col flex-1 shadow-[0px_4px_16px_rgba(124,77,255,0.14)] overflow-hidden px-6 pb-6 gap-18 ${header ? "pt-6" : "pt-25"}`}
  >
    {header}

    <div className="flex flex-col items-center shrink-0 w-full">
      <h1 className="text-2xl-plus font-bold text-text-secondary tracking-tight leading-9">
        {title}
      </h1>
    </div>

    <div className="border border-border-default rounded-xl flex flex-1 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-7 my-2.5 mx-1.25 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-background-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {children}
      </div>
    </div>
  </div>
);

export default LegalPageLayout;
