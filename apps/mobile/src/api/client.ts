import { API_BASE_URL } from '../config/network';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function formatErrorMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback;

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.filter((item): item is string => typeof item === 'string').join('\n');
  }

  if (typeof payload === 'object' && payload !== null) {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
    if (Array.isArray(maybeMessage)) {
      return maybeMessage.filter((item): item is string => typeof item === 'string').join('\n');
    }
  }

  return fallback;
}

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
    const fallback = `Request failed: ${res.status}`;
    let parsed: unknown = rawBody;
    if (rawBody) {
      try {
        parsed = JSON.parse(rawBody) as unknown;
      } catch {
        parsed = rawBody;
      }
    }
    throw new ApiError(formatErrorMessage(parsed, fallback), res.status);
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
