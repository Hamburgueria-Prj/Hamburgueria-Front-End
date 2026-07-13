import { request } from '../lib/api';
import { type UsuarioCreateResponse, type UsuarioRequest, type UsuarioResponse } from '../types/api';

const CLIENT_USER_STORAGE_KEY = 'flame_bite_cliente_usuario_id';

function getStoredClientUserId(): number | null {
  const raw = localStorage.getItem(CLIENT_USER_STORAGE_KEY);
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function storeClientUserId(id: number): void {
  localStorage.setItem(CLIENT_USER_STORAGE_KEY, String(id));
}

export function clearStoredClientUserId(): void {
  localStorage.removeItem(CLIENT_USER_STORAGE_KEY);
}

export async function listarUsuarios(): Promise<UsuarioResponse[]> {
  return request<UsuarioResponse[]>('/usuario');
}

export async function buscarUsuarioPorId(id: number): Promise<UsuarioResponse> {
  return request<UsuarioResponse>(`/usuario/${id}`);
}

export async function cadastrarUsuario(payload: UsuarioRequest): Promise<UsuarioCreateResponse> {
  return request<UsuarioCreateResponse>('/usuario', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function atualizarUsuario(id: number, payload: UsuarioRequest): Promise<UsuarioResponse> {
  return request<UsuarioResponse>(`/usuario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function inativarUsuario(id: number): Promise<void> {
  await request<void>(`/usuario/${id}/inativar`, {
    method: 'PATCH'
  });
}

export async function criarClienteWeb(): Promise<UsuarioCreateResponse> {
  return cadastrarUsuario({
    nome: 'Cliente Web',
    email: `cliente.web.${Date.now()}@bocadebrasa.local`,
    senha: '123456',
    perfil: 'CLIENTE'
  });
}

export async function obterOuCriarClienteWeb(): Promise<number> {
  const storedId = getStoredClientUserId();

  if (storedId) {
    try {
      await buscarUsuarioPorId(storedId);
      return storedId;
    } catch {
      clearStoredClientUserId();
    }
  }

  const usuario = await criarClienteWeb();
  storeClientUserId(usuario.id);
  return usuario.id;
}
