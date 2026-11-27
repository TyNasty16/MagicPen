// One-time tip to open Steady from the Home Screen (workflow 11). In an iPhone/iPad browser tab, the browser
// may clear saved data after 7 days without a visit; the Home Screen app is exempt. Pure apart from `readDevice`.

export const TIP_DISMISSED_KEY = 'steady.homeScreenTipDismissed';
const DAY = 86_400_000;

export interface Device { ua: string; touchPoints: number; standalone: boolean }

/** iPhone, iPod, iPad (including iPadOS, which reports itself as a Mac but has touch), and Chrome/Firefox on iOS. */
export const isAppleMobile = (d: Pick<Device, 'ua' | 'touchPoints'>) =>
  /iPhone|iPad|iPod|CriOS|FxiOS/.test(d.ua) || (/Macintosh/.test(d.ua) && d.touchPoints > 1);

export function shouldShowTip(d: Device, now: Date, firstUse?: string, lastBackupAt?: string, dismissed = false): boolean {
  if (dismissed || d.standalone || !isAppleMobile(d) || !firstUse) return false;
  if (now.getTime() - new Date(firstUse).getTime() < 3 * DAY) return false;
  if (lastBackupAt && now.getTime() - new Date(lastBackupAt).getTime() < 14 * DAY) return false;
  return true;
}

export function readDevice(): Device {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
  return { ua: navigator.userAgent, touchPoints: navigator.maxTouchPoints ?? 0, standalone };
}

/** Asks the browser to keep Steady's data (iPhone/iPad only: desktop Firefox would show a prompt). No promise is made to the owner. */
export function askToKeepData(): void {
  try {
    if (isAppleMobile(readDevice()) && navigator.storage?.persist) void navigator.storage.persist().catch(() => undefined);
  } catch { /* not available */ }
}
