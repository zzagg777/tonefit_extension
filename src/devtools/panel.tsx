import { StrictMode, useEffect, useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import '../panel/index.css';

// ── 타입 ────────────────────────────────────────────────────────────
interface LogEntry {
  id: number;
  time: string;
  level: 'info' | 'error' | 'warn';
  tag: string;
  message: string;
}

interface StorageState {
  hasToken: boolean;
  tokenPreview: string;
  cache: Record<string, unknown>;
}

// ── 유틸 ────────────────────────────────────────────────────────────
const now = () =>
  new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

let logId = 0;
const makeLog = (level: LogEntry['level'], tag: string, message: string): LogEntry => ({
  id: logId++,
  time: now(),
  level,
  tag,
  message,
});

// ── 패널 컴포넌트 ────────────────────────────────────────────────────
const Panel = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [storage, setStorage] = useState<StorageState | null>(null);
  const [tab, setTab] = useState<'logs' | 'storage'>('logs');
  const bottomRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((level: LogEntry['level'], tag: string, message: string) => {
    setLogs((prev) => [...prev.slice(-499), makeLog(level, tag, message)]);
  }, []);

  // storage 상태 조회
  const refreshStorage = useCallback(() => {
    chrome.storage.local.get(null, (items) => {
      const token = items['tonefit_access_token'] as string | undefined;
      const { tonefit_access_token: _t, ...rest } = items;
      setStorage({
        hasToken: !!token,
        tokenPreview: token ? `${token.slice(0, 12)}...${token.slice(-6)}` : '없음',
        cache: rest,
      });
    });
  }, []);

  // background로부터 메시지 수신 (로그 릴레이)
  useEffect(() => {
    refreshStorage();
    addLog('info', 'DevTools', 'ToneFit DevTools 패널 시작');

    const listener = (msg: unknown) => {
      if (!msg || typeof msg !== 'object') return;
      const m = msg as { type?: string; level?: string; tag?: string; message?: string };
      if (m.type === 'DEVTOOLS_LOG') {
        const level = (m.level as LogEntry['level']) ?? 'info';
        addLog(level, m.tag ?? '?', m.message ?? '');
      }
      if (m.type === 'STORAGE_CHANGED') {
        refreshStorage();
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [addLog, refreshStorage]);

  // 로그 추가 시 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const levelColor = (level: LogEntry['level']) => {
    if (level === 'error') return 'text-red-500';
    if (level === 'warn') return 'text-yellow-500';
    return 'text-text-secondary';
  };

  const levelBg = (level: LogEntry['level']) => {
    if (level === 'error') return 'bg-red-50';
    if (level === 'warn') return 'bg-yellow-50';
    return '';
  };

  return (
    <div className="h-screen flex flex-col bg-background-page text-text-primary text-fs-sm font-sans">
      {/* 상단 바 */}
      <div className="flex items-center gap-0 px-3 py-2 bg-background-surface border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <span className="font-bold text-text-brand tracking-tight">ToneFit</span>
          <div className="flex gap-0">
            {(['logs', 'storage'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1 text-fs-xs font-semibold rounded tracking-tight cursor-pointer transition-colors ${
                  tab === t
                    ? 'bg-background-selected text-text-brand'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {t === 'logs' ? '로그' : '스토리지'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {storage && (
            <span
              className={`text-fs-xs px-2 py-0.5 rounded-full font-semibold ${
                storage.hasToken
                  ? 'bg-background-success-subtle text-text-success'
                  : 'bg-background-danger-subtle text-text-danger'
              }`}
            >
              {storage.hasToken ? '로그인 됨' : '미로그인'}
            </span>
          )}
          <button
            type="button"
            onClick={refreshStorage}
            className="text-fs-xs text-text-tertiary hover:text-text-secondary cursor-pointer px-2 py-0.5 rounded hover:bg-background-hover transition-colors"
          >
            새로고침
          </button>
          {tab === 'logs' && (
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-fs-xs text-text-tertiary hover:text-text-danger cursor-pointer px-2 py-0.5 rounded hover:bg-background-danger-subtle transition-colors"
            >
              지우기
            </button>
          )}
        </div>
      </div>

      {/* 로그 탭 */}
      {tab === 'logs' && (
        <div className="flex-1 overflow-y-auto font-mono">
          {logs.length === 0 && (
            <p className="text-text-placeholder text-fs-xs px-4 py-6 text-center">
              로그가 없습니다. 익스텐션을 사용하면 여기에 표시됩니다.
            </p>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              className={`flex gap-2 px-3 py-0.5 border-b border-border-subtle text-fs-xs ${levelBg(log.level)}`}
            >
              <span className="text-text-placeholder shrink-0 w-16">{log.time}</span>
              <span className={`shrink-0 w-12 font-semibold uppercase ${levelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="text-text-brand shrink-0 max-w-28 truncate">{log.tag}</span>
              <span className={`flex-1 break-all ${levelColor(log.level)}`}>{log.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* 스토리지 탭 */}
      {tab === 'storage' && storage && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* 토큰 */}
          <div className="bg-background-surface rounded-lg border border-border-subtle p-3 flex flex-col gap-1">
            <p className="text-fs-xs font-semibold text-text-tertiary tracking-tight uppercase">Access Token</p>
            <p className={`text-fs-xs font-mono ${storage.hasToken ? 'text-text-secondary' : 'text-text-placeholder'}`}>
              {storage.tokenPreview}
            </p>
          </div>

          {/* 나머지 스토리지 */}
          <div className="bg-background-surface rounded-lg border border-border-subtle p-3 flex flex-col gap-2">
            <p className="text-fs-xs font-semibold text-text-tertiary tracking-tight uppercase">저장된 데이터</p>
            {Object.keys(storage.cache).length === 0 ? (
              <p className="text-fs-xs text-text-placeholder">없음</p>
            ) : (
              Object.entries(storage.cache).map(([key, val]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <p className="text-fs-xs font-semibold text-text-brand">{key}</p>
                  <pre className="text-fs-xs text-text-secondary whitespace-pre-wrap break-all bg-background-subtle rounded p-2">
                    {JSON.stringify(val, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Panel />
  </StrictMode>
);
