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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractMessage(body: unknown): string | null {
  if (!body) return null;

  if (typeof body === 'string') return body;

  if (Array.isArray(body)) {
    const messages = body
      .map((item) => extractMessage(item))
      .filter((message): message is string => Boolean(message));

    return messages.length > 0 ? messages.join(' ') : null;
  }

  if (!isRecord(body)) return null;

  const directMessage = body.message ?? body.error ?? body.detail ?? body.title;
  if (typeof directMessage === 'string' && directMessage.trim()) {
    return directMessage;
  }

  const errors = body.errors ?? body.fieldErrors ?? body.violations;
  if (Array.isArray(errors)) {
    const messages = errors
      .map((item) => extractMessage(item))
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) return messages.join(' ');
  }

  if (isRecord(errors)) {
    const messages = Object.entries(errors)
      .flatMap(([field, value]) => {
        if (Array.isArray(value)) {
          return value.map((item) => `${field}: ${String(item)}`);
        }

        if (typeof value === 'string') {
          return [`${field}: ${value}`];
        }

        return [];
      });

    if (messages.length > 0) return messages.join(' ');
  }

  return null;
}

function messageContains(message: string, ...patterns: string[]): boolean {
  const normalized = message.toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
}

function translateMessage(message: string | null, status?: number): string | null {
  const raw = message?.trim();

  if (status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está ligado e tente novamente.';
  }

  if (!raw) {
    if (status === 400) return 'Requisição inválida. Confira os dados informados.';
    if (status === 401) return 'E-mail ou senha inválidos.';
    if (status === 403) return 'Você não tem permissão para realizar esta ação.';
    if (status === 404) return 'Registro não encontrado.';
    if (status === 409) return 'Já existe um registro com esses dados.';
    if (status === 500) return 'O servidor encontrou um erro interno. Verifique o backend e tente novamente.';
    if (status && status >= 500) return 'O servidor encontrou uma falha. Tente novamente em instantes.';
    return null;
  }

  if (messageContains(raw, 'failed to fetch', 'load failed', 'networkerror', 'network request failed', 'err_connection_refused', 'err_failed')) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está ligado e tente novamente.';
  }

  if (messageContains(raw, 'internal server error')) {
    return 'O servidor encontrou um erro interno. Verifique o backend e tente novamente.';
  }

  if (messageContains(raw, 'bad request')) {
    return 'Requisição inválida. Confira os dados informados.';
  }

  if (messageContains(raw, 'unauthorized', 'bad credentials', 'invalid credentials')) {
    return 'E-mail ou senha inválidos.';
  }

  if (messageContains(raw, 'forbidden', 'access denied')) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (messageContains(raw, 'not found', 'no static resource')) {
    return 'Registro não encontrado.';
  }

  if (messageContains(raw, 'duplicate', 'constraint', 'unique', 'already exists', 'já existe')) {
    return 'Já existe um registro com esses dados.';
  }

  if (messageContains(raw, 'data truncated')) {
    return 'Algum dado informado não é aceito pelo banco. Verifique as informações e tente novamente.';
  }

  if (messageContains(raw, 'could not execute statement', 'sql', 'jdbc', 'hibernate')) {
    return 'Ocorreu um problema ao salvar no banco de dados. Verifique o backend e tente novamente.';
  }

  if (messageContains(raw, 'validation failed', 'method argument not valid', 'must not be null', 'must not be blank', 'size must be')) {
    return 'Confira os campos obrigatórios e tente novamente.';
  }

  if (status === 400) return 'Requisição inválida. Confira os dados informados.';
  if (status === 401) return 'E-mail ou senha inválidos.';
  if (status === 403) return 'Você não tem permissão para realizar esta ação.';
  if (status === 404) return 'Registro não encontrado.';
  if (status === 409) return 'Já existe um registro com esses dados.';
  if (status === 500) return 'O servidor encontrou um erro interno. Verifique o backend e tente novamente.';
  if (status && status >= 500) return 'O servidor encontrou uma falha. Tente novamente em instantes.';

  return raw;
}

export function getErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (error instanceof ApiError) {
    return translateMessage(error.message, error.status) ?? fallback;
  }

  if (error instanceof Error) {
    return translateMessage(error.message) ?? fallback;
  }

  if (typeof error === 'string') {
    return translateMessage(error) ?? fallback;
  }

  return fallback;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {})
      },
      ...options
    });
  } catch (error) {
    throw new ApiError(getErrorMessage(error), 0, null);
  }

  const text = await response.text();
  const body = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const backendMessage = extractMessage(body);
    const message = translateMessage(backendMessage, response.status) ?? `Não foi possível concluir a operação. Código ${response.status}.`;
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
