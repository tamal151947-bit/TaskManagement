export type User = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthState = {
  accessToken: string;
  user: User;
};

const AUTH_KEY = "task_app_auth";

export const getAuthState = (): AuthState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
};

export const setAuthState = (state: AuthState) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
};

export const updateAccessToken = (accessToken: string) => {
  const state = getAuthState();
  if (!state) {
    return;
  }

  setAuthState({ ...state, accessToken });
};

export const clearAuthState = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_KEY);
};
