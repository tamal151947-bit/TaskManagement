import { clearAuthState, getAuthState, updateAccessToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (!isJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const refreshAccessToken = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    clearAuthState();
    return null;
  }

  const data = (await response.json()) as { accessToken: string };
  updateAccessToken(data.accessToken);
  return data.accessToken;
};

export const ensureAccessToken = async () => {
  const auth = getAuthState();
  if (auth?.accessToken) {
    return auth.accessToken;
  }

  return refreshAccessToken();
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
  retry = true,
): Promise<T> => {
  const auth = getAuthState();

  const headers = new Headers(options.headers);
  if (!options.skipAuth && auth?.accessToken) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !options.skipAuth && retry) {
    const token = await refreshAccessToken();
    if (token) {
      return apiRequest<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const errorBody = await parseResponse<{ message?: string }>(response).catch(() => undefined);
    throw new Error(errorBody?.message ?? "Request failed");
  }

  return parseResponse<T>(response);
};

export const authRequest = async <T>(path: string, payload: unknown) => {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
};
