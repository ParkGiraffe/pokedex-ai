import { type AuthUser, useAuthStore } from './model/store';

const BASE = '/advisor';

export type AuthResult = { accessToken: string; user: AuthUser };

const authHeader = (): Record<string, string> => {
  const { token } = useAuthStore.getState();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiRequest = async <T>(path: string, init: RequestInit, fallback: string): Promise<T> => {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...init.headers },
  });
  if (response.status === 401) {
    useAuthStore.getState().clear();
  }
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `${fallback} (${response.status})`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

export const registerUser = (body: { email: string; password: string; nickname?: string }): Promise<AuthResult> =>
  apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }, '회원가입 실패');

export const loginUser = (body: { email: string; password: string }): Promise<AuthResult> =>
  apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }, '로그인 실패');

export const fetchMe = (): Promise<AuthUser> => apiRequest('/auth/me', { method: 'GET' }, '내 정보 조회 실패');
