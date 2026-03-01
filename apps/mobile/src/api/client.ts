import { API_BASE_URL } from '../config/network';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const rawBody = await res.text();

  if (!res.ok) {
    throw new Error(rawBody || `Request failed: ${res.status}`);
  }

  if (res.status === 204 || res.status === 205 || rawBody.trim().length === 0) {
    return null as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error('Request succeeded but response body was not valid JSON.');
  }
}
