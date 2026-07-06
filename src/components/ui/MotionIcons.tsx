interface MailPackingIconProps {
  size?: number;
  title?: string;
}

export function MailPackingIcon({
  size = 88,
  title = '메일 담기 중',
}: MailPackingIconProps) {
  return (
    <svg
      width={size}
      height={(size * 99) / 88}
      viewBox="0 0 88 99"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <style>{`
        .tf-mail-paper {
          transform-origin: 44px 49px;
          animation: tf-mail-paper-pack 3.2s cubic-bezier(.22, .9, .2, 1) infinite;
        }
        @keyframes tf-mail-paper-pack {
          0%, 10% { transform: translateY(0); opacity: 1; }
          58%, 100% { transform: translateY(30px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-mail-paper { animation: none; }
        }
      `}</style>
      <path
        d="M41.1473 9.73406L7.009 43.1411C4.44707 45.6482 6.22211 50 9.80665 50H78.1746C81.7617 50 83.5355 45.6428 80.9684 43.1374L46.7387 9.73033C45.1834 8.21236 42.7006 8.21402 41.1473 9.73406Z"
        fill="#BFA7FF"
        stroke="#7C4DFF"
        strokeWidth="6"
      />
      <g className="tf-mail-paper">
        <path
          d="M30.5283 2.56641H57.4717C67.392 2.56641 75.4336 10.608 75.4336 20.5283V47.4717C75.4336 57.392 67.392 65.4336 57.4717 65.4336H30.5283C20.608 65.4336 12.5664 57.392 12.5664 47.4717V20.5283C12.5664 10.608 20.608 2.56641 30.5283 2.56641Z"
          fill="white"
        />
        <path
          d="M30.5283 2.56641H57.4717C67.392 2.56641 75.4336 10.608 75.4336 20.5283V47.4717C75.4336 57.392 67.392 65.4336 57.4717 65.4336H30.5283C20.608 65.4336 12.5664 57.392 12.5664 47.4717V20.5283C12.5664 10.608 20.608 2.56641 30.5283 2.56641Z"
          stroke="#7C4DFF"
          strokeWidth="5.13208"
        />
        <path
          d="M24.1133 21.1697C24.1133 19.3982 25.5493 17.9622 27.3208 17.9622H60.6793C62.4508 17.9622 63.8869 19.3982 63.8869 21.1697C63.8869 22.9412 62.4508 24.3773 60.6793 24.3773H27.3208C25.5494 24.3773 24.1133 22.9412 24.1133 21.1697Z"
          fill="#7C4DFF"
        />
        <path
          d="M24.1133 33.9998C24.1133 32.2283 25.5493 30.7922 27.3208 30.7922H60.6793C62.4508 30.7922 63.8869 32.2283 63.8869 33.9998C63.8869 35.7713 62.4508 37.2073 60.6793 37.2073H27.3208C25.5494 37.2073 24.1133 35.7713 24.1133 33.9998Z"
          fill="#9B78FF"
        />
        <path
          d="M24.1133 46.8301C24.1133 45.0586 25.5493 43.6226 27.3208 43.6226H60.6793C62.4508 43.6226 63.8869 45.0586 63.8869 46.8301C63.8869 48.6016 62.4508 50.0377 60.6793 50.0377H27.3208C25.5494 50.0377 24.1133 48.6016 24.1133 46.8301Z"
          fill="#BFA7FF"
        />
      </g>
      <path
        d="M42.4412 64.476L11.1887 44.0457C8.52827 42.3065 5 44.2153 5 47.3937V92C5 94.2091 6.79086 96 9 96H79C81.2091 96 83 94.2091 83 92V47.5353C83 44.3282 79.415 42.4252 76.7587 44.2222L46.8712 64.4411C45.5364 65.344 43.7901 65.3578 42.4412 64.476Z"
        fill="white"
        stroke="#7C4DFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface AIPencilWritingIconProps {
  size?: number;
  title?: string;
}

export function AIPencilWritingIcon({
  size = 160,
  title = 'AI가 작성 중',
}: AIPencilWritingIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <style>{`
        .tf-ai-pencil {
          transform-origin: 80px 80px;
          animation: tf-ai-pencil-write 1.85s cubic-bezier(.42, 0, .2, 1) infinite;
        }
        .tf-ai-dot {
          transform-origin: center;
          animation: tf-ai-dot-appear 1.85s ease-in-out infinite;
        }
        .tf-ai-dot-1 { animation-delay: .38s; }
        .tf-ai-dot-2 { animation-delay: .58s; }
        .tf-ai-dot-3 { animation-delay: .78s; }
        @keyframes tf-ai-pencil-write {
          0%, 14% { transform: translateX(0); }
          34% { transform: translateX(-2px); }
          54% { transform: translateX(-4.5px); }
          74%, 100% { transform: translateX(-7px); }
        }
        @keyframes tf-ai-dot-appear {
          0%, 22% { opacity: 0; transform: scale(.7); }
          32%, 82% { opacity: 1; transform: scale(1); }
          100% { opacity: .3; transform: scale(.92); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-ai-pencil, .tf-ai-dot { animation: none; }
        }
      `}</style>
      <g className="tf-ai-pencil">
        <path
          d="M95.7161 77.5921L69.3161 103.992H58.0014V92.6774L84.4014 66.2774L95.7161 77.5921ZM93.8308 56.8481C94.3308 56.3482 95.009 56.0673 95.7161 56.0673C96.4232 56.0673 97.1014 56.3482 97.6014 56.8481L105.143 64.3948C105.643 64.8948 105.924 65.573 105.924 66.2801C105.924 66.9872 105.643 67.6653 105.143 68.1654L99.4868 73.8188L88.1721 62.5068L93.8308 56.8481ZM62.0788 51.5201C62.1789 51.2688 62.3521 51.0533 62.576 50.9014C62.7999 50.7496 63.0642 50.6685 63.3348 50.6685C63.6053 50.6685 63.8696 50.7496 64.0935 50.9014C64.3174 51.0533 64.4906 51.2688 64.5908 51.5201L65.2654 53.1521C66.398 55.9113 68.5454 58.1312 71.2654 59.3548L73.1801 60.2081C73.4249 60.3214 73.6322 60.5023 73.7774 60.7296C73.9227 60.9569 73.9999 61.221 73.9999 61.4908C73.9999 61.7605 73.9227 62.0246 73.7774 62.2519C73.6322 62.4792 73.4249 62.6601 73.1801 62.7734L71.1534 63.6748C68.5011 64.865 66.3909 67.0056 65.2388 69.6748L64.5801 71.1841C64.4776 71.4299 64.3046 71.6398 64.083 71.7875C63.8614 71.9352 63.6011 72.014 63.3348 72.014C63.0685 72.014 62.8081 71.9352 62.5865 71.7875C62.3649 71.6398 62.1919 71.4299 62.0894 71.1841L61.4308 69.6774C60.2786 67.0068 58.1673 64.8651 55.5134 63.6748L53.4868 62.7734C53.2412 62.6605 53.0332 62.4795 52.8874 62.2519C52.7416 62.0243 52.6641 61.7597 52.6641 61.4894C52.6641 61.2191 52.7416 60.9545 52.8874 60.7269C53.0332 60.4994 53.2412 60.3184 53.4868 60.2054L55.4014 59.3521C58.122 58.1297 60.2703 55.9108 61.4041 53.1521L62.0788 51.5201Z"
          fill="#7C4DFF"
        />
      </g>
      <circle
        className="tf-ai-dot tf-ai-dot-1"
        cx="82"
        cy="102"
        r="4"
        fill="#EEE7FF"
      />
      <circle
        className="tf-ai-dot tf-ai-dot-2"
        cx="95"
        cy="102"
        r="4"
        fill="#EEE7FF"
      />
      <circle
        className="tf-ai-dot tf-ai-dot-3"
        cx="108"
        cy="102"
        r="4"
        fill="#EEE7FF"
      />
    </svg>
  );
}

interface LoginExpiredIconProps {
  size?: number;
  title?: string;
}

export function LoginExpiredIcon({
  size = 160,
  title = '로그인 만료',
}: LoginExpiredIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <style>{`
        .tf-login-lock {
          transform-origin: 78px 84px;
          animation: tf-login-lock 5.8s cubic-bezier(.22,.9,.2,1) infinite;
        }
        .tf-login-shackle {
          stroke-dasharray: 92;
          stroke-dashoffset: 92;
          animation: tf-login-shackle 5.8s cubic-bezier(.42,0,.2,1) infinite;
        }
        .tf-login-key {
          transform-origin: 114px 92px;
          animation: tf-login-key 5.8s cubic-bezier(.22,.9,.2,1) infinite;
        }
        @keyframes tf-login-shackle {
          0%,8%  { stroke-dashoffset:92; opacity:.55; }
          20%,88%{ stroke-dashoffset:0;  opacity:1;   }
          100%   { stroke-dashoffset:92; opacity:.55; }
        }
        @keyframes tf-login-key {
          0%,20% { opacity:0; transform:translateX(22px) rotate(0deg);  }
          32%    { opacity:1; transform:translateX(0)    rotate(0deg);   }
          43%    { opacity:1; transform:translateX(-4px) rotate(-7deg);  }
          52%    { opacity:1; transform:translateX(7px)  rotate(8deg);   }
          64%,86%{ opacity:1; transform:translateX(14px) rotate(0deg);   }
          100%   { opacity:0; transform:translateX(22px) rotate(0deg);   }
        }
        @keyframes tf-login-lock {
          0%,36%   { transform:translateX(0)     rotate(0deg);    }
          43%      { transform:translateX(-1.8px) rotate(-1.2deg); }
          50%      { transform:translateX(1.8px)  rotate(1.2deg);  }
          57%,100% { transform:translateX(0)     rotate(0deg);    }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-login-lock,.tf-login-shackle,.tf-login-key { animation:none; }
          .tf-login-shackle,.tf-login-key { opacity:1; }
        }
      `}</style>
      <defs>
        <clipPath id="tf-login-shackle-clip">
          <rect x="0" y="0" width="160" height="74" />
        </clipPath>
      </defs>
      <g className="tf-login-lock">
        <path
          className="tf-login-shackle"
          clipPath="url(#tf-login-shackle-clip)"
          d="M58 76V66C58 53.8497 67.8497 44 80 44C92.1503 44 102 53.8497 102 66V76"
          stroke="#7C4DFF"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <rect
          x="46"
          y="72"
          width="68"
          height="52"
          rx="16"
          fill="#F2EDFF"
          stroke="#7C4DFF"
          strokeWidth="6"
        />
        <circle cx="80" cy="95" r="6" fill="#7C4DFF" />
        <rect x="77" y="99" width="6" height="13" rx="3" fill="#7C4DFF" />
      </g>
      <g className="tf-login-key">
        <circle
          cx="122"
          cy="92"
          r="9"
          fill="white"
          stroke="#7C4DFF"
          strokeWidth="5"
        />
        <rect x="91" y="89" width="28" height="6" rx="3" fill="#7C4DFF" />
        <path
          d="M94 92V101"
          stroke="#7C4DFF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M102 92V98"
          stroke="#7C4DFF"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

interface ErrorNoticeIconProps {
  size?: number;
  title?: string;
}

export function ErrorNoticeIcon({
  size = 160,
  title = '오류 발생',
}: ErrorNoticeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <style>{`
        .tf-error-halo {
          transform-origin: 80px 80px;
          animation: tf-error-halo 5.2s ease-in-out infinite;
        }
        .tf-error-doc {
          transform-origin: 78px 82px;
          animation: tf-error-doc 5.2s cubic-bezier(.22,.9,.2,1) infinite;
        }
        .tf-error-line-1,.tf-error-line-2,.tf-error-line-3 {
          animation: tf-error-line 5.2s ease-in-out infinite;
        }
        .tf-error-line-2 { animation-delay:.1s; }
        .tf-error-line-3 { animation-delay:.2s; }
        .tf-error-badge {
          transform-origin: 108px 106px;
          animation: tf-error-badge 5.2s cubic-bezier(.22,.9,.2,1) infinite;
        }
        .tf-error-ring {
          transform-origin: 108px 106px;
          animation: tf-error-ring 5.2s ease-out infinite;
        }
        .tf-error-mark {
          transform-origin: 108px 106px;
          animation: tf-error-mark 5.2s cubic-bezier(.22,.9,.2,1) infinite;
        }
        @keyframes tf-error-halo {
          0%,12%   { opacity:.2;  transform:scale(.92); }
          30%,82%  { opacity:.48; transform:scale(1);   }
          100%     { opacity:.2;  transform:scale(.92); }
        }
        @keyframes tf-error-doc {
          0%,8%    { opacity:.78; transform:translateY(4px) scale(.97); }
          20%,84%  { opacity:1;   transform:translateY(0)   scale(1);   }
          100%     { opacity:.78; transform:translateY(4px) scale(.97); }
        }
        @keyframes tf-error-line {
          0%,16%   { opacity:.38; }
          32%,84%  { opacity:1;   }
          100%     { opacity:.38; }
        }
        @keyframes tf-error-badge {
          0%,24%   { opacity:0; transform:translateY(5px) scale(.82); }
          34%      { opacity:1; transform:translateY(0)   scale(1.06); }
          42%,86%  { opacity:1; transform:translateY(0)   scale(1);    }
          100%     { opacity:0; transform:translateY(5px) scale(.88);  }
        }
        @keyframes tf-error-ring {
          0%,35%   { opacity:0;   transform:scale(.74);  }
          44%      { opacity:.42;                        }
          66%,100% { opacity:0;   transform:scale(1.34); }
        }
        @keyframes tf-error-mark {
          0%,34%   { transform:scale(.9);  }
          43%      { transform:scale(1.08);}
          52%,100% { transform:scale(1);  }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-error-halo,.tf-error-doc,.tf-error-line-1,.tf-error-line-2,
          .tf-error-line-3,.tf-error-badge,.tf-error-ring,.tf-error-mark { animation:none; }
          .tf-error-halo { opacity:.38; }
          .tf-error-doc,.tf-error-line-1,.tf-error-line-2,.tf-error-line-3,.tf-error-badge { opacity:1; }
          .tf-error-ring { opacity:0; }
        }
      `}</style>
      <circle className="tf-error-halo" cx="80" cy="80" r="52" fill="#F2EDFF" />
      <g className="tf-error-doc">
        <rect
          x="46"
          y="46"
          width="68"
          height="68"
          rx="18"
          fill="#F2EDFF"
          stroke="#7C4DFF"
          strokeWidth="6"
        />
        <rect
          className="tf-error-line-1"
          x="61"
          y="63"
          width="39"
          height="6"
          rx="3"
          fill="#7C4DFF"
        />
        <rect
          className="tf-error-line-2"
          x="61"
          y="78"
          width="33"
          height="6"
          rx="3"
          fill="#9B78FF"
        />
        <rect
          className="tf-error-line-3"
          x="61"
          y="93"
          width="24"
          height="6"
          rx="3"
          fill="#BFA7FF"
        />
      </g>
      <circle
        className="tf-error-ring"
        cx="108"
        cy="106"
        r="22"
        stroke="#9B78FF"
        strokeWidth="6"
      />
      <g className="tf-error-badge">
        <circle cx="108" cy="106" r="23" fill="white" />
        <circle cx="108" cy="106" r="18" fill="#7C4DFF" />
        <g className="tf-error-mark">
          <rect
            x="105.4"
            y="93.5"
            width="5.2"
            height="15.5"
            rx="2.6"
            fill="white"
          />
          <circle cx="108" cy="115" r="3.1" fill="white" />
        </g>
      </g>
    </svg>
  );
}

interface MailReadingIconProps {
  size?: number;
  title?: string;
}

export function MailReadingIcon({
  size = 60,
  title = '메일 읽는 중',
}: MailReadingIconProps) {
  return (
    <svg
      width={size}
      height={(size * 53) / 60}
      viewBox="0 0 60 53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <style>{`
        .tf-line-1, .tf-line-2, .tf-line-3 {
          animation: tf-reading-line 2.6s ease-in-out infinite;
        }
        .tf-line-2 { animation-delay: .15s; }
        .tf-line-3 { animation-delay: .3s; }
        .tf-lens {
          transform-origin: 46.5px 26.5px;
          animation: tf-reading-lens 2.6s cubic-bezier(.42, 0, .2, 1) infinite;
        }
        @keyframes tf-reading-line {
          0%, 100% { opacity: .58; }
          36%, 58% { opacity: 1; }
        }
        @keyframes tf-reading-lens {
          0%, 18% { transform: translateY(-11px); opacity: 1; }
          46%, 58% { transform: translateY(0); opacity: 1; }
          84%, 91% { transform: translateY(10px); opacity: 1; }
          96% { transform: translateY(10px); opacity: 0; }
          97% { transform: translateY(-11px); opacity: 0; }
          100% { transform: translateY(-11px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-line-1, .tf-line-2, .tf-line-3, .tf-lens { animation: none; }
        }
      `}</style>
      <path
        d="M16 2H37C44.732 2 51 8.26801 51 16V37C51 44.732 44.732 51 37 51H16C8.26801 51 2 44.732 2 37V16C2 8.26801 8.26801 2 16 2Z"
        stroke="#7C4DFF"
        strokeWidth="4"
      />
      <path
        className="tf-line-1"
        d="M11 16.5C11 15.1193 12.1193 14 13.5 14H39.5C40.8807 14 42 15.1193 42 16.5C42 17.8807 40.8807 19 39.5 19H13.5C12.1193 19 11 17.8807 11 16.5Z"
        fill="#7C4DFF"
      />
      <path
        className="tf-line-2"
        d="M11 26.5C11 25.1193 12.1193 24 13.5 24H39.5C40.8807 24 42 25.1193 42 26.5C42 27.8807 40.8807 29 39.5 29H13.5C12.1193 29 11 27.8807 11 26.5Z"
        fill="#9B78FF"
      />
      <path
        className="tf-line-3"
        d="M11 36.5C11 35.1193 12.1193 34 13.5 34H39.5C40.8807 34 42 35.1193 42 36.5C42 37.8807 40.8807 39 39.5 39H13.5C12.1193 39 11 37.8807 11 36.5Z"
        fill="#BFA7FF"
      />
      <g className="tf-lens">
        <path
          d="M46.5 14C53.4036 14 59 19.5964 59 26.5C59 29.8971 57.6426 32.9755 55.4434 35.2285L59.0615 39.751C59.7514 40.6135 59.6115 41.8715 58.749 42.5615C57.8865 43.2514 56.6285 43.1115 55.9385 42.249L52.2266 37.6094C50.5105 38.4958 48.5646 39 46.5 39C39.5964 39 34 33.4036 34 26.5C34 19.5964 39.5964 14 46.5 14Z"
          fill="#7C4DFF"
        />
        <circle cx="46.5" cy="26.5" r="9.5" fill="#FBFAFF" />
      </g>
    </svg>
  );
}
interface NoCorrectionIconProps {
  size?: number;
  title?: string;
}

export function NoCorrectionIcon({
  size = 160,
  title = '제안할 교정 항목 없음',
}: NoCorrectionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <style>{`
        .tf-no-correction-doc {
          transform-origin: 80px 80px;
          animation: tf-no-correction-doc 6s ease-in-out infinite;
        }
        .tf-no-correction-line-1,
        .tf-no-correction-line-2,
        .tf-no-correction-line-3 {
          transform-origin: 80px 80px;
          animation: tf-no-correction-lines 6s ease-in-out infinite;
        }
        .tf-no-correction-line-2 { animation-delay: .1s; }
        .tf-no-correction-line-3 { animation-delay: .2s; }
        .tf-no-correction-badge {
          transform-origin: 110px 104px;
          animation: tf-no-correction-badge 6s cubic-bezier(.22, .9, .2, 1) infinite;
        }
        @keyframes tf-no-correction-doc {
          0%, 8%   { opacity: .92; transform: scale(.98); }
          18%, 88% { opacity: 1;   transform: scale(1);   }
          100%     { opacity: .92; transform: scale(.98); }
        }
        @keyframes tf-no-correction-lines {
          0%, 12%  { opacity: .35; }
          28%, 88% { opacity: 1;   }
          100%     { opacity: .35; }
        }
        @keyframes tf-no-correction-badge {
          0%, 28%  { opacity: 0; transform: translateY(3px) scale(.86); }
          36%      { opacity: 1; transform: translateY(0)  scale(1.04); }
          44%, 92% { opacity: 1; transform: translateY(0)  scale(1);    }
          100%     { opacity: 0; transform: translateY(3px) scale(.92); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-no-correction-doc,
          .tf-no-correction-line-1,
          .tf-no-correction-line-2,
          .tf-no-correction-line-3,
          .tf-no-correction-badge { animation: none; }
          .tf-no-correction-line-1,
          .tf-no-correction-line-2,
          .tf-no-correction-line-3,
          .tf-no-correction-badge { opacity: 1; }
        }
      `}</style>

      <g className="tf-no-correction-doc">
        <rect
          x="48"
          y="48"
          width="65"
          height="65"
          rx="16"
          fill="#F2EDFF"
          stroke="#7C4DFF"
          strokeWidth="6"
        />
        <rect
          className="tf-no-correction-line-1"
          x="62"
          y="64"
          width="39"
          height="6"
          rx="3"
          fill="#7C4DFF"
        />
        <rect
          className="tf-no-correction-line-2"
          x="62"
          y="78"
          width="39"
          height="6"
          rx="3"
          fill="#9B78FF"
        />
        <rect
          className="tf-no-correction-line-3"
          x="62"
          y="92"
          width="29"
          height="6"
          rx="3"
          fill="#BFA7FF"
        />
      </g>

      <g className="tf-no-correction-badge">
        <circle cx="110" cy="104" r="20" fill="#FFFFFF" />
        <circle cx="110" cy="104" r="17" fill="#7C4DFF" />
        <text
          x="110"
          y="111"
          textAnchor="middle"
          fontFamily="Inter, Pretendard, Arial, sans-serif"
          fontSize="20"
          fontWeight="800"
          fill="#FFFFFF"
        >
          0
        </text>
      </g>
    </svg>
  );
}
