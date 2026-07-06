/** DEV 모드 전용 로거 — DEV toolbar ON일 때만 출력 */

let _enabled = false;

export const setDevLogging = (on: boolean) => {
  _enabled = on;
};

export const devLog = (...args: unknown[]) => {
  if (_enabled) console.error(...args);
};
