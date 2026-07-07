/**
 * ToneFit Extension — Background Service Worker
 */

// ── 탭별 팝업 vs 사이드패널 분기 ────────────────────────────────────
// Gmail 탭: popup 제거 → onClicked 발화 → 사이드패널
// 그 외 탭: popup 유지 → 기존 팝업창 표시
const POPUP_PATH = 'src/popup/index.html';
const isGmailTab = (url?: string) =>
  !!url && url.startsWith('https://mail.google.com/');

const syncPopup = (tabId: number, url?: string) => {
  chrome.action.setPopup({
    tabId,
    popup: isGmailTab(url) ? '' : POPUP_PATH,
  });
};

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => syncPopup(tabId, tab.url));
});

chrome.tabs.onUpdated.addListener((tabId, _, tab) => {
  syncPopup(tabId, tab.url);
});

// Gmail 탭에서 아이콘 클릭 시 (popup이 '' 일 때만 onClicked 발화)
chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) {
    chrome.storage.local.set({ tonefit_open_source: 'toolbar' });
    chrome.sidePanel.open({ tabId: tab.id }).catch(console.error);
  }
});

// ── 패널 → Gmail 탭으로 메시지 중계 ─────────────────────────────────
//
// ⚠️ active + currentWindow 방식은 사이드 패널에 포커스가 있을 때
//    currentWindow가 Gmail 탭 창을 못 찾는 경우가 있음.
//    → Gmail URL로 직접 탭을 찾는 방식으로 변경.

// pending reply data (OPEN_SIDE_PANEL_REPLY → GET_REPLY_DATA)
let pendingReplyData: {
  mails: { sender: string; body: string }[];
  to?: string[];
  cc?: string[];
  subject?: string;
  replyError?: string;
} | null = null;

const sendToTab = (tabId: number, message: unknown) => {
  chrome.tabs.sendMessage(tabId, message).catch((err) => {
    console.error(
      '[ToneFit BG] content script 전달 실패 (tabId:',
      tabId,
      ')',
      err.message
    );
  });
};

// 패널 포트 연결 감지 — disconnect 시 content script에 PANEL_CLOSED 전달
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'panel') return;
  let registeredTabId: number | undefined;
  port.onMessage.addListener((msg: { type: string; tabId?: number }) => {
    if (msg.type === 'PANEL_REGISTER' && msg.tabId !== undefined) {
      registeredTabId = msg.tabId;
    }
  });
  port.onDisconnect.addListener(() => {
    if (registeredTabId !== undefined) {
      sendToTab(registeredTabId, { type: 'PANEL_CLOSED' });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ type: 'PONG' });
    return true;
  }

  // content script → 사이드 패널 열기
  if (message.type === 'OPEN_SIDE_PANEL') {
    const tabId = sender.tab?.id;
    const bodyLength = message.bodyLength as number | undefined;
    if (tabId !== null && tabId !== undefined) {
      chrome.sidePanel
        .open({ tabId })
        .then(() => {
          sendToTab(tabId, { type: 'PANEL_OPENED' });
          // 이미 열려있는 패널에 모드 힌트 전달 (패널 페이지는 runtime.sendMessage로 수신)
          if (bodyLength !== undefined) {
            chrome.runtime
              .sendMessage({ type: 'MODE_HINT', bodyLength })
              .catch(() => {});
          }
        })
        .catch(console.error);
    }
    return true;
  }

  if (message.type === 'OPEN_SIDE_PANEL_REPLY') {
    const tabId = sender.tab?.id;
    pendingReplyData = {
      mails: message.mails ?? [],
      to: message.to,
      cc: message.cc,
      subject: message.subject,
      replyError: message.replyError,
    };
    if (tabId !== null && tabId !== undefined) {
      chrome.sidePanel
        .open({ tabId })
        .then(() => {
          sendToTab(tabId, { type: 'PANEL_OPENED' });
          // 패널이 이미 열려 있을 때도 새 회신 데이터를 인지할 수 있도록 알림
          chrome.runtime
            .sendMessage({ type: 'REPLY_DATA_READY' })
            .catch(() => {});
        })
        .catch(console.error);
    }
    return true;
  }

  if (message.type === 'GET_REPLY_DATA') {
    const data = pendingReplyData;
    pendingReplyData = null;
    sendResponse({ data });
    return true;
  }

  if (
    message.type === 'INSERT_EMAIL' ||
    message.type === 'GENERATION_START' ||
    message.type === 'GENERATION_ERROR'
  ) {
    // 패널이 전달한 tabId로만 전송 (브로드캐스트 방지)
    const tabId = message.tabId as number | undefined;
    if (tabId !== null && tabId !== undefined) {
      sendToTab(tabId, message);
    } else {
      console.error('[ToneFit BG] tabId 없음 — 메시지 전송 불가');
    }
    return true;
  }

  return true;
});
