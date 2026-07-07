export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = RequestInit & {
  retry?: boolean;
};

function buildUrl(path: string): string {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function extractMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;

  const maybeMessage = (body as { message?: unknown; error?: unknown; detail?: unknown }).message
    ?? (body as { error?: unknown }).error
    ?? (body as { detail?: unknown }).detail;

  return typeof maybeMessage === 'string' ? maybeMessage : null;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  const text = await response.text();
  const body = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = extractMessage(body) ?? `Erro ${response.status} ao chamar ${path}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
