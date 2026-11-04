import {WORKSPACE_URL, isWorkspaceModule} from './modules';
/** Workspace entry preference; graph API authentication still uses the server session. */
export const LOGIN_KEY = 'zhike-login';

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LOGIN_KEY) === '1';
  } catch {
    return false;
  }
}

export function setLoggedIn(): void {
  try {
    localStorage.setItem(LOGIN_KEY, '1');
  } catch {
    /* 隐私模式下可能写入失败，忽略即可 */
  }
  try {
    document.cookie = `${LOGIN_KEY}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  } catch {
    /* cookie 不可用时忽略 */
  }
}

export function clearLoggedIn(): void {
  try {
    localStorage.removeItem(LOGIN_KEY);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${LOGIN_KEY}=; path=/; max-age=0; samesite=lax`;
  } catch {
    /* ignore */
  }
}

/** 只允许站内相对路径，避免开放重定向。 */
export function safeNext(raw: string | null | undefined, fallback = WORKSPACE_URL): string {
  if (typeof raw !== 'string') return fallback;
  const v = raw.trim();
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return fallback;
  // A login return target must not send the user straight back to the welcome page.
  const target = new URL(v, 'https://zhike.invalid');
  if (target.pathname.replace(/\/$/, '') === '/login') return fallback;
  if (target.pathname === '/') {
    const modules = target.searchParams.getAll('m');
    if (modules.length !== 1 || !isWorkspaceModule(modules[0])) return fallback;
  }
  return v;
}
