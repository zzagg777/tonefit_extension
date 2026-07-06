/**
 * ToneFit Extension — Gmail Content Script
 *
 * 역할:
 * - GENERATION_START: 작성창 오버레이 표시 (직접 입력 차단)
 * - GENERATION_ERROR: 오버레이 제거
 * - INSERT_EMAIL: 오버레이 제거 + 제목/본문 주입
 * - 작성창이 없으면 편지쓰기 버튼 클릭 후 열리면 주입
 * - Gmail 작성창 툴바에 ToneFit 아이콘 버튼 삽입
 */

let DEBUG = false; // DEV toolbar ON/OFF 메시지로 동적 변경

// Gmail SPA 내비게이션으로 스크립트가 중복 주입되는 것을 방지
if ((window as Window & { __tonefit_injected?: boolean }).__tonefit_injected) {
  throw new Error('[ToneFit] content script already injected — skipping');
}
(window as Window & { __tonefit_injected?: boolean }).__tonefit_injected = true;

// ── Gmail DOM 셀렉터 ──────────────────────────────────────────────

const COMPOSE_BTN_SELECTOR = 'div[gh="cm"]';
const SUBJECT_SELECTOR = 'input[name="subjectbox"]';

/** 본문 영역: 여러 Gmail 버전 대응, 작성창 내 첫 번째 매칭 우선 */
const BODY_SELECTORS = [
  'div[aria-label="메일 본문"]',
  'div[aria-label="Message Body"]',
  'div[aria-label="본문"]',
  'div[g_editable="true"]',
  'div[contenteditable="true"].Am',
  'div[contenteditable="true"].editable',
  'div.Am.Al.editable',
];

/**
 * 보내기 드롭다운(▼) 버튼: 이 버튼 우측에 ToneFit 아이콘 삽입
 * 한국어·영어·data-tooltip·Gmail 내부 클래스 모두 대응
 */
const SEND_DROPDOWN_SELECTORS = [
  '[data-tooltip*="더 많은 보내기"]',
  '[data-tooltip*="보내기 옵션 더보기"]',
  '[data-tooltip*="More send options"]',
  '[data-tooltip*="Schedule send"]',
  '[aria-label*="더 많은 보내기"]',
  '[aria-label*="More send options"]',
  '.gU.T-I', // Gmail internal dropdown class
].join(', ');

/** 보내기 버튼 fallback 셀렉터 (드롭다운 없을 때) */
const SEND_BTN_SELECTORS = [
  '[data-tooltip*="보내기"]',
  '[aria-label*="보내기"]',
  '[data-tooltip*="Send"]',
  '[aria-label*="Send"]',
].join(', ');

const OVERLAY_ID = 'tonefit-overlay';
const TOOLBAR_BTN_CLASS = 'tonefit-toolbar-btn';
const STYLES_ID = 'tonefit-styles';

// 패널 열림 상태 추적 — 새 작성창에 버튼 삽입 시 즉시 반영
let isPanelOpen = false;

// ── 유틸 ─────────────────────────────────────────────────────────

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const isComposeOpen = (): boolean => !!document.querySelector(SUBJECT_SELECTOR);

/**
 * 작성창 컨테이너 반환 (오버레이 부모로 사용)
 * 인라인 답장: [data-compose-id] 우선
 * 팝업 작성창: subjectbox 기준 [role="dialog"]
 */
const getComposeContainer = (): HTMLElement | null => {
  // 인라인 답장 — data-compose-id가 본문/툴바를 모두 포함하는 루트
  const inlineCompose =
    document.querySelector<HTMLElement>('[data-compose-id]');
  if (inlineCompose) return inlineCompose;

  // 팝업 작성창
  const subjectEl = document.querySelector<HTMLElement>(SUBJECT_SELECTOR);
  if (!subjectEl) return null;

  return (
    subjectEl.closest<HTMLElement>('[role="dialog"]') ??
    subjectEl.closest<HTMLElement>('form') ??
    subjectEl.closest<HTMLElement>('.nH') ??
    null
  );
};

/** 작성창 내에서 본문 영역 탐색 */
const getBodyElement = (composeEl?: HTMLElement | null): HTMLElement | null => {
  const container = composeEl ?? getComposeContainer();

  for (const selector of BODY_SELECTORS) {
    const el = container
      ? container.querySelector<HTMLElement>(selector)
      : document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }

  // fallback: 인라인 답장처럼 aria-label 없는 경우 — 보내기 버튼이 있는 컨테이너 내 최초 contenteditable
  if (container) {
    const hasSendBtn = container.querySelector(
      SEND_DROPDOWN_SELECTORS + ', ' + SEND_BTN_SELECTORS
    );
    if (hasSendBtn) {
      const editable = container.querySelector<HTMLElement>(
        '[contenteditable="true"]'
      );
      if (editable) return editable;
    }
  }

  // 최후 수단: 페이지 전체에서 보내기 버튼 근처 contenteditable 탐색
  const sendBtn = document.querySelector<HTMLElement>(
    SEND_DROPDOWN_SELECTORS + ', ' + SEND_BTN_SELECTORS
  );
  if (sendBtn) {
    const composeRoot =
      sendBtn.closest<HTMLElement>('[role="dialog"]') ??
      sendBtn.closest<HTMLElement>('form') ??
      sendBtn.closest<HTMLElement>('.nH') ??
      sendBtn.parentElement;
    const editable = composeRoot?.querySelector<HTMLElement>(
      '[contenteditable="true"]'
    );
    if (editable) return editable;
  }

  return null;
};

// ── 스타일 주입 ───────────────────────────────────────────────────

const injectStyles = () => {
  if (document.getElementById(STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    @keyframes tonefit-spin { to { transform: rotate(360deg); } }
    @keyframes tonefit-pulse {
      0%, 100% { opacity: 0; }
      50%       { opacity: 1; }
    }

    .tonefit-toolbar-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      cursor: pointer;
      border-radius: 50%;
      margin: 0 2px;
      flex-shrink: 0;
      vertical-align: middle;
    }
    .tonefit-toolbar-btn:hover .tonefit-btn-bg {
      opacity: 1 !important;
      animation: none !important;
    }
    .tonefit-btn-bg {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background-color: #DFD1FF;
      animation: tonefit-pulse 3.2s ease-in-out infinite;
      pointer-events: none;
    }
    .tonefit-toolbar-btn.tonefit-panel-open .tonefit-btn-bg {
      opacity: 1 !important;
      animation: none !important;
    }
    .tonefit-btn-icon {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;
  document.head.appendChild(style);
};

// ── 툴바 버튼 주입 ────────────────────────────────────────────────

const TONEFIT_SVG = `<svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1907 5.24809C9.84532 5.26572 9.69515 5.31979 9.53807 5.48313C9.48183 5.54162 9.05452 6.03457 8.58847 6.5786C6.87817 8.57506 5.10818 10.6382 5.05635 10.6958C4.97832 10.7823 4.98213 10.9666 5.06333 11.0323C5.12216 11.0799 5.19963 11.0809 8.37378 11.0744L11.624 11.0678L12.1948 10.7834C13.6018 10.0824 14.7924 9.69759 16.4184 9.41807C16.7608 9.35922 16.9464 9.3157 16.9892 9.2843C17.0241 9.25869 17.2736 8.99324 17.5436 8.69441C17.8137 8.39559 18.5614 7.5712 19.2052 6.86246C19.849 6.1537 20.3855 5.54537 20.3973 5.5106C20.4235 5.43383 20.3768 5.30691 20.3089 5.27059C20.2574 5.24302 10.7064 5.22177 10.1907 5.24809Z" fill="#7C4DFF"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M15.1448 10.5671C13.4908 11.0854 12.1646 11.7866 10.9927 12.7622C9.26293 14.2024 8.0407 16.1709 7.50869 18.3735C7.27539 19.3395 7.18335 20.1359 7.17336 21.2759L7.16747 21.9442L7.22698 21.9924C7.34309 22.0864 7.31965 22.1012 7.99417 21.506C9.17952 20.4601 10.7387 19.2582 11.8905 18.5024C12.1837 18.31 12.2111 18.2628 12.2507 17.8811C12.4212 16.2377 13.0228 14.4167 13.9015 12.8842C14.3708 12.0657 14.9935 11.1999 15.4831 10.6853C15.6323 10.5285 15.6578 10.4485 15.5578 10.4508C15.533 10.4514 15.3471 10.5037 15.1448 10.5671Z" fill="#7C4DFF"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M16.3661 10.9808C16.3219 11.0001 16.2113 11.1116 16.1093 11.2398C14.9372 12.7125 14.099 14.3895 13.6806 16.0989C13.4359 17.0987 13.3417 17.7969 13.3119 18.8329C13.29 19.5901 13.2995 22.5869 13.3239 22.6639C13.354 22.7589 13.4293 22.7641 14.7672 22.7641C16.0458 22.7641 16.0702 22.7632 16.1359 22.7116L16.2027 22.659V18.949C16.2027 16.2991 16.2107 15.2159 16.2308 15.1583C16.2864 14.999 16.2383 15.0031 18.0292 15.0031C19.3791 15.0031 19.6668 14.9971 19.7237 14.9674C19.7614 14.9477 19.8834 14.825 19.995 14.6947C20.3108 14.3258 21.129 13.385 22.0774 12.3003C22.5539 11.7553 22.9566 11.2853 22.9724 11.2558C23.0187 11.1694 23.0059 11.0742 22.9389 11.0073L22.8767 10.9451L19.6602 10.9461C17.0386 10.9469 16.4293 10.9533 16.3661 10.9808Z" fill="#7C4DFF"/>
</svg>`;

/**
 * Gmail 작성창 툴바에 ToneFit 버튼 삽입
 * 보내기 버튼 바로 우측에 위치
 */
const injectToolbarButton = (composeEl: HTMLElement): boolean => {
  // 이미 삽입된 경우 스킵
  if (composeEl.querySelector(`.${TOOLBAR_BTN_CLASS}`)) return true;

  // ▼ 드롭다운 버튼 탐색 → 없으면 보내기 버튼으로 fallback
  const dropdownBtn =
    composeEl.querySelector<HTMLElement>(SEND_DROPDOWN_SELECTORS) ??
    composeEl.querySelector<HTMLElement>(SEND_BTN_SELECTORS);
  if (!dropdownBtn) {
    if (DEBUG)
      console.error(
        '[ToneFit] 드롭다운/보내기 버튼을 찾지 못했습니다.',
        SEND_DROPDOWN_SELECTORS
      );
    return false;
  }

  injectStyles();

  const btn = document.createElement('div');
  btn.className = TOOLBAR_BTN_CLASS;
  btn.title = 'ToneFit으로 초안 생성';
  btn.innerHTML = `
    <span class="tonefit-btn-bg"></span>
    <span class="tonefit-btn-icon">${TONEFIT_SVG}</span>
  `;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();

    // 답장 여부 감지: body 에디터 내부 → composeEl 순으로 탐색 (document 전체 금지)
    const subjectEl =
      composeEl.querySelector<HTMLInputElement>('input[name="subjectbox"]') ??
      document.querySelector<HTMLInputElement>('input[name="subjectbox"]');
    // subjectbox는 인라인 답장에서 숨겨져 있으므로 hidden input[name="subject"]도 함께 확인
    const subject = subjectEl?.value ?? '';
    const hiddenSubjectEl = composeEl.querySelector<HTMLInputElement>(
      'input[name="subject"]'
    );
    const hiddenSubject = hiddenSubjectEl?.value ?? '';

    const bodyEditorEl = getBodyElement();

    // contenteditable 내 .gmail_quote (버튼 클릭 후 펼쳐진 상태)
    const quoteEl =
      bodyEditorEl?.querySelector<HTMLElement>('.gmail_quote') ??
      composeEl.querySelector<HTMLElement>('.gmail_quote');

    // "잘린 본문 표시" 버튼 존재 여부 — 답장 작성창에서만 나타남 (클릭 전/후 모두 DOM에 있음)
    const trimBtn = composeEl.querySelector('[aria-label="잘린 본문 표시"]');

    const isReply =
      !!quoteEl ||
      !!trimBtn ||
      /^(Re:|RE:|답장:)/i.test(subject) ||
      /^(Re:|RE:|답장:)/i.test(hiddenSubject);

    if (isReply) {
      // ── 사전 검증 ────────────────────────────────────────────────
      const openReplyError = (errorCode: string) => {
        chrome.runtime.sendMessage({
          type: 'OPEN_SIDE_PANEL_REPLY',
          mails: [],
          replyError: errorCode,
        });
      };

      // ── 헬퍼: 블록 인지 텍스트 추출 (detached 노드용 innerText 대체) ──
      const tfText = (root: Element): string => {
        const BLOCK =
          /^(DIV|P|LI|TR|TD|BLOCKQUOTE|H[1-6]|PRE|TABLE|UL|OL|SECTION|ARTICLE|HEADER|FOOTER)$/;
        let out = '';
        const walk = (nd: Node) => {
          if (nd.nodeType === 3) {
            out += nd.textContent;
            return;
          }
          if (nd.nodeType !== 1) return;
          const el = nd as Element;
          const tg = el.tagName;
          if (
            tg === 'STYLE' ||
            tg === 'SCRIPT' ||
            tg === 'TITLE' ||
            tg === 'NOSCRIPT'
          )
            return;
          if (tg === 'BR') {
            out += '\n';
            return;
          }
          const bl = BLOCK.test(tg);
          if (bl && out && !out.endsWith('\n')) out += '\n';
          for (const c of nd.childNodes) walk(c);
          if (bl && out && !out.endsWith('\n')) out += '\n';
        };
        walk(root);
        return out
          .replace(/\u00a0/g, ' ')
          .replace(/[ \t]+\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      };

      // ── 헬퍼: 중첩 gmail_quote를 최근 maxMails건 분리 (최신 우선) ──
      const SIG = '.gmail_signature,[data-smartmail="gmail_signature"]';
      const tfSplit = (
        rootQuote: Element,
        maxMails: number
      ): { sender: string; body: string }[] => {
        const acc: { sender: string; body: string }[] = [];
        let cur: Element | null = rootQuote;
        while (cur && acc.length < maxMails) {
          const attrEl = cur.querySelector('.gmail_attr');
          const ownAttr =
            attrEl && attrEl.closest('.gmail_quote') === cur ? attrEl : null;
          const sender = ownAttr
            ? (ownAttr.textContent ?? '').trim().replace(/\s+/g, ' ')
            : '발신자 미상';
          const bq: Element | null = cur.matches('blockquote')
            ? cur
            : cur.querySelector(':scope > blockquote.gmail_quote');
          if (bq) {
            const clone = bq.cloneNode(true) as Element;
            clone
              .querySelectorAll(`.gmail_quote,.gmail_attr,${SIG}`)
              .forEach((x) => x.remove());
            const body = tfText(clone);
            if (body) acc.push({ sender, body });
            cur = bq.querySelector('.gmail_quote');
          } else {
            // 비표준(Fwd/모바일): 하위 .gmail_quote 제거 없이 병합 1건 보존 후 종료
            const clone = cur.cloneNode(true) as Element;
            const a2 = clone.querySelector('.gmail_attr');
            if (a2 && a2.closest('.gmail_quote') === clone) a2.remove();
            clone.querySelectorAll(SIG).forEach((x) => x.remove());
            const body = tfText(clone);
            if (body) acc.push({ sender, body });
            cur = null;
          }
        }
        return acc;
      };

      // ── 본문 추출 ─────────────────────────────────────────────────
      // Case A: 버튼 클릭 후 → contenteditable에 .gmail_quote 존재
      // Case B: 버튼 클릭 전 → hidden input[name="uet"]에 인코딩된 HTML로 존재
      let mails: { sender: string; body: string }[] = [];
      const noQuote =
        !quoteEl &&
        !composeEl.querySelector<HTMLInputElement>('input[name="uet"]')?.value;

      try {
        if (quoteEl) {
          mails = tfSplit(quoteEl, 3);
        } else {
          const uetInput =
            composeEl.querySelector<HTMLInputElement>('input[name="uet"]');
          if (uetInput?.value) {
            const parsed = new DOMParser().parseFromString(
              uetInput.value,
              'text/html'
            );
            const parsedQuote = parsed.querySelector('.gmail_quote');
            if (parsedQuote) mails = tfSplit(parsedQuote, 3);
          }
        }
      } catch {
        openReplyError('REPLY_EXTRACT_ERROR');
        return;
      }

      if (DEBUG)
        console.error(
          '[ToneFit] reply 추출 — mails:',
          mails.length,
          '건',
          mails.map((m) => `${m.sender}(${m.body.length}자)`)
        );

      // 본문이 완전히 비어있는 경우
      if (!mails.length) {
        openReplyError(noQuote ? 'REPLY_NO_QUOTE' : 'REPLY_EMPTY');
        return;
      }

      // 최신 메일 단독 10,000자 초과
      if (mails[0].body.length > 10_000) {
        openReplyError('REPLY_TOO_LONG');
        return;
      }

      // 한국어 아님 (최신 메일 기준)
      if (!/[가-힣]/.test(mails[0].body)) {
        openReplyError('REPLY_NON_KOREAN');
        return;
      }

      // 시간순(오래된→최신)으로 뒤집어 전송 — BE 계약: 마지막 원소 = 답장 누른 메일
      chrome.runtime.sendMessage({
        type: 'OPEN_SIDE_PANEL_REPLY',
        mails: mails.slice().reverse(),
        subject: subject || hiddenSubject || undefined,
      });
      return;
    } else {
      const bodyEl2 = getBodyElement();
      const bodyLength = bodyEl2 ? getUserTypedLength(bodyEl2, composeEl) : 0;
      if (DEBUG)
        console.error('[ToneFit] 아이콘 클릭 — bodyLength:', bodyLength);
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL', bodyLength });
    }
  });

  // 패널이 이미 열려있으면 즉시 활성 스타일 적용
  if (isPanelOpen) btn.classList.add('tonefit-panel-open');

  // Gmail 툴바는 table 기반 — 부모 <td> 뒤에 새 <td>로 삽입
  const parentCell = dropdownBtn.closest('td');
  if (parentCell) {
    const td = document.createElement('td');
    td.style.cssText = 'vertical-align: middle; padding: 0;';
    td.appendChild(btn);
    parentCell.insertAdjacentElement('afterend', td);
  } else {
    // table 구조가 아닌 경우 fallback
    dropdownBtn.insertAdjacentElement('afterend', btn);
  }
  if (DEBUG) console.error('[ToneFit] 툴바 버튼 삽입 완료 (드롭다운 우측)');
  return true;
};

/**
 * subject input을 기준으로 작성창 루트 반환
 */
const getComposeRootFromSubject = (subjectEl: HTMLElement): HTMLElement =>
  subjectEl.closest<HTMLElement>('[role="dialog"]') ??
  subjectEl.closest<HTMLElement>('form') ??
  subjectEl.closest<HTMLElement>('.nH') ??
  subjectEl;

/** 드롭다운 버튼 기준으로 컴포즈 루트 반환 (인라인 답장 대응) */
const getComposeRootFromDropdown = (dropdownEl: HTMLElement): HTMLElement =>
  dropdownEl.closest<HTMLElement>('[data-compose-id]') ??
  dropdownEl.closest<HTMLElement>('[role="dialog"]') ??
  dropdownEl.closest<HTMLElement>('form') ??
  dropdownEl.closest<HTMLElement>('.nH') ??
  (dropdownEl.parentElement as HTMLElement) ??
  dropdownEl;

/**
 * MutationObserver로 Gmail 작성창 열림 감지 → 버튼 자동 삽입
 * - 새 메일: subject input 출현으로 감지
 * - 인라인 답장: 보내기 드롭다운 버튼 출현으로 감지 (subject 없음)
 */
const observeComposeWindows = () => {
  const injectedRoots = new WeakSet<HTMLElement>();

  const injectWithRetry = (root: HTMLElement, initialDelay = 600) => {
    const RETRY_DELAYS = [initialDelay, 1000, 2000, 3000];
    let attempt = 0;
    const attempt_inject = () => {
      if (injectToolbarButton(root)) {
        snapshotInitialBody(root);
        return;
      }
      attempt++;
      if (attempt < RETRY_DELAYS.length) {
        setTimeout(attempt_inject, RETRY_DELAYS[attempt]);
      } else {
        if (DEBUG)
          console.error(
            '[ToneFit] 툴바 버튼 삽입 최종 실패 — 드롭다운 버튼 없음'
          );
      }
    };
    setTimeout(attempt_inject, RETRY_DELAYS[0]);
  };

  const tryInjectFromSubject = (subjectEl: HTMLElement) => {
    const root = getComposeRootFromSubject(subjectEl);
    if (injectedRoots.has(root)) return;
    injectedRoots.add(root);
    injectWithRetry(root);
  };

  const tryInjectFromDropdown = (dropdownEl: HTMLElement) => {
    const root = getComposeRootFromDropdown(dropdownEl);
    if (injectedRoots.has(root)) return;
    injectedRoots.add(root);
    injectWithRetry(root);
  };

  // 드롭다운 감지용 셀렉터 목록
  const DROPDOWN_SELECTORS_LIST = [
    '[data-tooltip*="더 많은 보내기"]',
    '[data-tooltip*="보내기 옵션 더보기"]',
    '[data-tooltip*="More send options"]',
    '[data-tooltip*="Schedule send"]',
    '[aria-label*="더 많은 보내기"]',
    '[aria-label*="More send options"]',
    '.gU.T-I',
  ];

  const tryInjectFromComposeId = (composeEl: HTMLElement) => {
    if (injectedRoots.has(composeEl)) return;
    injectedRoots.add(composeEl);
    injectWithRetry(composeEl);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        // 인라인 답장: data-compose-id 루트 직접 감지 (가장 우선)
        if (node.matches('[data-compose-id]')) {
          tryInjectFromComposeId(node);
        }
        node
          .querySelectorAll<HTMLElement>('[data-compose-id]')
          .forEach(tryInjectFromComposeId);

        // 새 메일 작성창 감지
        if (node.matches(SUBJECT_SELECTOR)) {
          tryInjectFromSubject(node);
        }
        node
          .querySelectorAll<HTMLElement>(SUBJECT_SELECTOR)
          .forEach(tryInjectFromSubject);

        // 인라인 답장 감지 (드롭다운 버튼 기준 — fallback)
        for (const sel of DROPDOWN_SELECTORS_LIST) {
          if (node.matches(sel)) tryInjectFromDropdown(node);
          node
            .querySelectorAll<HTMLElement>(sel)
            .forEach(tryInjectFromDropdown);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

// 이미 열려있는 작성창에도 삽입 (새 메일 + 인라인 답장)
const injectIntoExistingComposes = () => {
  document.querySelectorAll<HTMLElement>(SUBJECT_SELECTOR).forEach((el) => {
    const root = getComposeRootFromSubject(el);
    if (!injectToolbarButton(root)) {
      setTimeout(() => {
        if (injectToolbarButton(root)) snapshotInitialBody(root);
      }, 600);
    } else {
      setTimeout(() => snapshotInitialBody(root), 600);
    }
  });

  document
    .querySelectorAll<HTMLElement>(SEND_DROPDOWN_SELECTORS)
    .forEach((el) => {
      const root = getComposeRootFromDropdown(el);
      if (!injectToolbarButton(root)) {
        setTimeout(() => {
          if (injectToolbarButton(root)) snapshotInitialBody(root);
        }, 600);
      } else {
        setTimeout(() => snapshotInitialBody(root), 600);
      }
    });
};

// 초기화
injectIntoExistingComposes();
observeComposeWindows();

// ── 오버레이 ─────────────────────────────────────────────────────

const showOverlay = () => {
  if (!isComposeOpen()) {
    if (DEBUG)
      console.error(
        '[ToneFit] 작성창을 찾을 수 없어 오버레이를 표시하지 않습니다'
      );
    return;
  }
  if (document.getElementById(OVERLAY_ID)) return;

  const container = getComposeContainer();
  if (!container) {
    if (DEBUG) console.error('[ToneFit] 작성창 컨테이너를 찾을 수 없습니다');
    return;
  }

  const prevPosition = container.style.position;
  const computedPosition = getComputedStyle(container).position;
  if (computedPosition === 'static') {
    container.style.position = 'relative';
  }

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('data-prev-position', prevPosition);
  overlay.style.cssText = `
    position: absolute;
    inset: 0;
    z-index: 9999;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(1px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: not-allowed;
    border-radius: inherit;
  `;

  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 28px;
    height: 28px;
    border: 3px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: tonefit-spin 0.8s linear infinite;
  `;

  injectStyles();
  overlay.appendChild(spinner);
  container.appendChild(overlay);
  if (DEBUG)
    console.error(
      '[ToneFit] 오버레이 표시 완료',
      container.tagName,
      container.className
    );
};

const removeOverlay = () => {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;

  const container = overlay.parentElement;
  if (container) {
    const prevPosition = overlay.getAttribute('data-prev-position') ?? '';
    container.style.position = prevPosition;
  }

  overlay.remove();
};

// ── 이메일 주입 ───────────────────────────────────────────────────

const injectSubject = (subject: string) => {
  const subjectEl = document.querySelector<HTMLInputElement>(SUBJECT_SELECTOR);
  if (!subjectEl) {
    console.error('[ToneFit] 제목 입력창을 찾을 수 없습니다');
    return;
  }
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(subjectEl, subject);
  } else {
    subjectEl.value = subject;
  }
  subjectEl.dispatchEvent(new Event('input', { bubbles: true }));
  subjectEl.dispatchEvent(new Event('change', { bubbles: true }));
};

const SIG_SELECTOR = '.gmail_signature, [data-smartmail="gmail_signature"]';

/**
 * 서명(gmail_signature) 이전 노드들의 텍스트만 반환.
 * 서명 div가 없으면 bodyEl 전체 innerText를 반환.
 */
const getBodyTextWithoutSignature = (bodyEl: HTMLElement): string => {
  const sigEl = bodyEl.querySelector<HTMLElement>(SIG_SELECTOR);
  if (!sigEl) return bodyEl.innerText.trim();

  const parts: string[] = [];
  let node: ChildNode | null = bodyEl.firstChild;
  while (node && node !== sigEl) {
    if (node instanceof HTMLElement) {
      parts.push(node.innerText);
    } else if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? '');
    }
    node = node.nextSibling;
  }
  return parts.join('').trim();
};

/**
 * 작성창별 초기 본문 길이 스냅샷 (서명만 있는 상태)
 * composeEl → initial innerText length
 */
const composeInitialLength = new WeakMap<HTMLElement, number>();

const snapshotInitialBody = (composeEl: HTMLElement) => {
  if (composeInitialLength.has(composeEl)) return;
  let bodyEl: HTMLElement | null = null;
  for (const sel of BODY_SELECTORS) {
    bodyEl = composeEl.querySelector<HTMLElement>(sel);
    if (bodyEl) break;
  }
  if (!bodyEl) return;
  // 서명 이전 텍스트 길이 스냅샷 — 초기엔 0이어야 함
  const len = getBodyTextWithoutSignature(bodyEl).length;
  composeInitialLength.set(composeEl, len);
  if (DEBUG) console.error('[ToneFit] 초기 스냅샷(서명 제외):', len);
};

/**
 * 사용자가 입력한 글자수 = 현재 서명-이전 텍스트 길이 - 초기 스냅샷
 * (서명 안에 타이핑하는 경우는 카운트 못하지만, 서명 이전 입력이 표준 동작)
 */
const getUserTypedLength = (
  bodyEl: HTMLElement,
  composeEl: HTMLElement | null
): number => {
  const current = getBodyTextWithoutSignature(bodyEl).length;

  let initialLen = 0;
  if (composeEl && composeInitialLength.has(composeEl)) {
    initialLen = composeInitialLength.get(composeEl)!;
  } else if (DEBUG) {
    console.error('[ToneFit] 스냅샷 없음 — initialLen=0 가정');
  }

  const typed = Math.max(0, current - initialLen);
  if (DEBUG)
    console.error(
      '[ToneFit] 현재(서명제외):',
      current,
      '/ 초기:',
      initialLen,
      '/ 사용자입력:',
      typed
    );
  return typed;
};

const injectBody = (content: string) => {
  const bodyEl = getBodyElement();
  if (!bodyEl) {
    if (DEBUG)
      console.error('[ToneFit] 본문 영역을 찾을 수 없습니다.', BODY_SELECTORS);
    return;
  }

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const unescaped = content.replace(/\\n/g, '\n');
  const normalized = unescaped.trim().replace(/\n{3,}/g, '\n\n');
  const newHtml = normalized
    .split('\n')
    .map((line) =>
      line.trim() === '' ? '<div><br></div>' : `<div>${escapeHtml(line)}</div>`
    )
    .join('');

  bodyEl.focus();

  // 전체 선택 후 innerHTML 교체 — 선택 없이 교체하면 Gmail이 삽입으로 인식해 중복됨
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(bodyEl);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  bodyEl.innerHTML = newHtml;
  bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
  if (DEBUG) console.error('[ToneFit] 본문 주입 완료');
};

const injectEmail = (subject: string, content: string) => {
  if (subject) injectSubject(subject);
  setTimeout(() => injectBody(content), 50);
};

/** 회신 초안 삽입 core — 생성하기와 동일하게 body 전체 교체 */
const doInjectReplyBody = (bodyEl: HTMLElement, content: string) => {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const unescaped = content.replace(/\\n/g, '\n');
  const normalized = unescaped.trim().replace(/\n{3,}/g, '\n\n') + '\n\n';
  const draftHtml = normalized
    .split('\n')
    .map((line) =>
      line.trim() === '' ? '<div><br></div>' : `<div>${escapeHtml(line)}</div>`
    )
    .join('');

  // 펼쳐진 인용 메일(.gmail_quote)이 있으면 보존하고 앞부분만 교체
  const quoteEl = bodyEl.querySelector<HTMLElement>('.gmail_quote');

  // bodyEl의 직계 자식 중 quoteEl을 포함하는 노드를 찾는다
  let anchorChild: Node | null = quoteEl;
  while (anchorChild && anchorChild.parentNode !== bodyEl) {
    anchorChild = anchorChild.parentNode;
  }

  if (anchorChild) {
    // anchorChild 이전의 직계 자식만 제거 후 초안 삽입
    const nodesToRemove: Node[] = [];
    for (const node of Array.from(bodyEl.childNodes)) {
      if (node === anchorChild) break;
      nodesToRemove.push(node);
    }
    nodesToRemove.forEach((n) => bodyEl.removeChild(n));

    const draftContainer = document.createElement('div');
    draftContainer.innerHTML = draftHtml;
    bodyEl.insertBefore(draftContainer, anchorChild);
  } else {
    bodyEl.innerHTML = draftHtml;
  }

  bodyEl.focus();
  bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
  if (DEBUG)
    console.error(
      '[ToneFit] 회신 초안 주입 — 길이:',
      content.length,
      '/ body 내용:',
      bodyEl.innerText.slice(0, 50)
    );
};

/**
 * 회신 초안 삽입 with retry
 * Gmail editor 초기화가 늦을 때 본문이 리셋되는 경우를 대비해
 * 삽입 후 검증하고, 비어있으면 최대 3회 재시도
 */
const injectReplyBody = (content: string, attempt = 0) => {
  const MAX_ATTEMPTS = 3;
  const VERIFY_DELAY = 500;

  const bodyEl = getBodyElement();
  if (DEBUG)
    console.error(
      '[ToneFit] injectReplyBody — attempt:',
      attempt,
      '/ bodyEl:',
      bodyEl?.id,
      bodyEl?.getAttribute('aria-label')
    );
  if (!bodyEl) {
    if (attempt < MAX_ATTEMPTS) {
      if (DEBUG) console.error('[ToneFit] body 없음 — 재시도:', attempt + 1);
      setTimeout(() => injectReplyBody(content, attempt + 1), VERIFY_DELAY);
    } else {
      if (DEBUG) console.error('[ToneFit] 회신 본문 영역 찾기 최종 실패');
    }
    return;
  }

  doInjectReplyBody(bodyEl, content);

  // Gmail init이 완료되면서 content를 리셋하는 케이스 대비 — 삽입 후 검증
  setTimeout(() => {
    if (!bodyEl.isConnected || bodyEl.innerText.trim()) return; // 정상이면 종료
    if (attempt < MAX_ATTEMPTS) {
      if (DEBUG)
        console.error(
          '[ToneFit] Gmail이 본문을 리셋했습니다. 재시도:',
          attempt + 1
        );
      injectReplyBody(content, attempt + 1);
    } else {
      if (DEBUG)
        console.error('[ToneFit] 회신 초안 주입 최종 실패 (Gmail 리셋 반복)');
    }
  }, VERIFY_DELAY);
};

const openComposeAndInject = async (subject: string, content: string) => {
  const composeBtn = document.querySelector<HTMLElement>(COMPOSE_BTN_SELECTOR);
  if (!composeBtn) {
    if (DEBUG) console.error('[ToneFit] 편지쓰기 버튼을 찾을 수 없습니다');
    return;
  }

  composeBtn.click();

  const MAX_WAIT = 3000;
  const INTERVAL = 100;
  let elapsed = 0;

  while (elapsed < MAX_WAIT) {
    await wait(INTERVAL);
    elapsed += INTERVAL;
    if (isComposeOpen()) {
      await wait(300);
      injectEmail(subject, content);
      return;
    }
  }

  if (DEBUG) console.error('[ToneFit] 작성창이 열리지 않았습니다 (3초 초과)');
};

// ── 메시지 수신 ───────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GENERATION_START') {
    showOverlay();
    return;
  }

  if (message.type === 'GENERATION_ERROR') {
    removeOverlay();
    return;
  }

  if (message.type === 'INSERT_EMAIL') {
    removeOverlay();
    const { subject, content, isReply } = message as {
      type: string;
      subject: string;
      content: string;
      isReply?: boolean;
    };

    if (DEBUG)
      console.error(
        '[ToneFit] INSERT_EMAIL 수신 — subject:',
        subject,
        '/ content 길이:',
        content?.length,
        '/ isReply:',
        isReply,
        '/ isComposeOpen:',
        isComposeOpen()
      );
    if (DEBUG)
      console.error(
        '[ToneFit] INSERT_EMAIL content 앞 200자:',
        content?.slice(0, 200)
      );

    if (isReply) {
      // Gmail 에디터 초기화 완료 대기 후 삽입 (즉시 삽입 시 init이 덮어쓰는 현상 방지)
      setTimeout(() => injectReplyBody(content), 300);
    } else if (isComposeOpen()) {
      injectEmail(subject, content);
    } else {
      if (DEBUG)
        console.error('[ToneFit] 작성창 없음 → openComposeAndInject 시도');
      openComposeAndInject(subject, content);
    }
    return;
  }

  if (message.type === 'DEV_LOGGING') {
    DEBUG = message.enabled === true;
    return;
  }

  if (message.type === 'PANEL_OPENED') {
    isPanelOpen = true;
    document
      .querySelectorAll<HTMLElement>(`.${TOOLBAR_BTN_CLASS}`)
      .forEach((btn) => btn.classList.add('tonefit-panel-open'));
    // 작성창이 없으면 자동으로 편지쓰기 버튼 클릭
    if (!isComposeOpen()) {
      const composeBtn =
        document.querySelector<HTMLElement>(COMPOSE_BTN_SELECTOR);
      composeBtn?.click();
    }
    return;
  }

  if (message.type === 'PANEL_CLOSED') {
    isPanelOpen = false;
    document
      .querySelectorAll<HTMLElement>(`.${TOOLBAR_BTN_CLASS}`)
      .forEach((btn) => btn.classList.remove('tonefit-panel-open'));
    return;
  }

  if (message.type === 'GET_EMAIL_CONTENT') {
    const bodyEl = getBodyElement();
    const subjectEl = document.querySelector<HTMLInputElement>(
      'input[name="subjectbox"]'
    );
    if (DEBUG && bodyEl) {
      console.error('[ToneFit] bodyEl 구조:');
      Array.from(bodyEl.children).forEach((c, i) => {
        const el = c as HTMLElement;
        console.error(
          `  [${i}] tag=${el.tagName} class="${el.className}" text="${el.innerText.slice(0, 40).replace(/\n/g, '↵')}"`
        );
      });
    }
    sendResponse({
      content: bodyEl ? getBodyTextWithoutSignature(bodyEl) : '',
      subject: subjectEl?.value ?? '',
      userLength: bodyEl
        ? getUserTypedLength(bodyEl, getComposeContainer())
        : 0,
      composeOpen: isComposeOpen(),
    });
    return true;
  }
});
