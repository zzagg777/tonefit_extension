import type { UserProfile } from "@/types";
import profileImg from "@/assets/profile.svg";

export type Page = "settings" | "terms" | "privacy";

interface HeaderProps {
  page: Page;
  userProfile: (UserProfile & { picture?: string }) | null;
  onNavigate: (page: Page) => void;
  onLogoutClick: () => void;
}

const LogoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="39"
    viewBox="0 0 40 39"
    fill="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.5348 0.0266871C10.7673 0.0658585 10.4335 0.186022 10.0845 0.548991C9.9595 0.678962 9.00991 1.77441 7.97424 2.98337C4.17357 7.41994 0.240262 12.0047 0.125094 12.1326C-0.0483067 12.325 -0.0398512 12.7344 0.140596 12.8805C0.271323 12.9863 0.443483 12.9885 7.49716 12.9741L14.7198 12.9594L15.9882 12.3275C19.1151 10.7697 21.7607 9.91446 25.3742 9.29329C26.1349 9.16253 26.5474 9.06582 26.6425 8.99604C26.7201 8.93912 27.2745 8.34923 27.8746 7.68518C28.4747 7.02112 30.1363 5.18914 31.5669 3.61417C32.9977 2.03914 34.1898 0.687304 34.2161 0.610032C34.2744 0.439425 34.1705 0.15739 34.0197 0.0766796C33.9053 0.0154144 12.6808 -0.0318164 11.5348 0.0266871Z"
      fill="#7C4DFF"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22.5438 11.8465C18.8682 12.9982 15.921 14.5564 13.3169 16.7245C9.47297 19.9248 6.75691 24.2993 5.57467 29.194C5.05621 31.3406 4.85169 33.1105 4.82948 35.6437L4.81641 37.1288L4.94866 37.2359C5.20667 37.4448 5.15458 37.4778 6.65352 36.1552C9.28762 33.831 12.7524 31.1601 15.3119 29.4805C15.9635 29.053 16.0244 28.948 16.1124 28.0997C16.4913 24.4478 17.8282 20.4011 19.7809 16.9955C20.8237 15.1767 22.2077 13.2526 23.2955 12.1092C23.6271 11.7607 23.6838 11.5829 23.4616 11.588C23.4064 11.5893 22.9934 11.7056 22.5438 11.8465Z"
      fill="#7C4DFF"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M25.2578 12.766C25.1596 12.8088 24.9139 13.0566 24.6871 13.3415C22.0824 16.6141 20.2198 20.3407 19.29 24.1395C18.7462 26.3612 18.5369 27.9128 18.4706 30.215C18.422 31.8977 18.443 38.5572 18.4973 38.7284C18.5643 38.9395 18.7316 38.9511 21.7047 38.9511C24.546 38.9511 24.6003 38.949 24.7461 38.8343L24.8947 38.7175V30.473C24.8947 24.5844 24.9126 22.1773 24.9571 22.0493C25.0806 21.6952 24.9738 21.7044 28.9535 21.7044C31.9534 21.7044 32.5928 21.6909 32.7191 21.6249C32.8029 21.5812 33.0741 21.3086 33.322 21.019C34.0238 20.1993 35.842 18.1086 37.9495 15.6982C39.0084 14.4871 39.9034 13.4426 39.9385 13.377C40.0413 13.1849 40.0128 12.9736 39.864 12.8249L39.7257 12.6865L32.5779 12.6887C26.7522 12.6905 25.3983 12.7048 25.2578 12.766Z"
      fill="#7C4DFF"
    />
  </svg>
);

const LogOutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19L3 5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3L9 3"
      stroke="#7C4DFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 17L21 12L16 7"
      stroke="#7C4DFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12L9 12"
      stroke="#7C4DFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Header = ({ page, userProfile, onNavigate, onLogoutClick }: HeaderProps) => (
  <header className="flex items-center justify-between py-2.5 shrink-0">
    {/* 좌측: 로고 + 탭 */}
    <div className="flex items-center gap-8">
      <button
        type="button"
        onClick={() => onNavigate("settings")}
        className="flex items-center gap-5 cursor-pointer"
      >
        <LogoIcon />
        <span className="text-2xl-plus font-bold text-text-secondary tracking-tight leading-9 whitespace-nowrap">
          ToneFit
        </span>
      </button>

      <nav className="flex items-center gap-0">
        {page === "settings" ? (
          <div className="flex items-center justify-center px-2.5 py-2.5 w-30">
            <span className="text-xl font-semibold text-text-secondary tracking-tight leading-7 text-center">
              설정
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onNavigate("terms")}
              className={`flex items-center justify-center px-2.5 py-2.5 cursor-pointer transition-colors ${
                page === "terms"
                  ? "text-text-secondary"
                  : "text-text-placeholder hover:text-text-secondary"
              }`}
            >
              <span className="text-xl font-semibold tracking-tight leading-7 text-center whitespace-nowrap">
                이용약관
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("privacy")}
              className={`flex items-center justify-center px-2.5 py-2.5 cursor-pointer transition-colors ${
                page === "privacy"
                  ? "text-text-secondary"
                  : "text-text-placeholder hover:text-text-secondary"
              }`}
            >
              <span className="text-xl font-semibold tracking-tight leading-7 text-center whitespace-nowrap">
                개인정보처리방침
              </span>
            </button>
          </>
        )}
      </nav>
    </div>

    {/* 우측: 프로필 + 로그아웃 */}
    {userProfile && (
      <div className="flex items-center gap-2.5 p-4 rounded-2xl min-w-77.5 justify-between">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <img
            src={userProfile.picture || profileImg}
            alt={userProfile.nickname ?? ""}
            className="size-12 rounded-full object-cover shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = profileImg;
            }}
          />
          <div className="flex flex-col gap-0 shrink-0">
            <span className="text-lg font-semibold text-text-primary tracking-tight leading-6.5 whitespace-nowrap">
              {userProfile.nickname}
            </span>
            <span className="text-sm text-text-primary tracking-tight leading-5.5 whitespace-nowrap">
              {userProfile.email}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogoutClick}
          className="text-icon-tertiary hover:text-icon-primary transition-colors cursor-pointer size-6 shrink-0"
          aria-label="로그아웃"
        >
          <LogOutIcon />
        </button>
      </div>
    )}
  </header>
);

export default Header;
