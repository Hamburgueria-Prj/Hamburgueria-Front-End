import { request } from '../lib/api';
import { type PagamentoResponse } from '../types/api';

export async function listarPagamentos(): Promise<PagamentoResponse[]> {
  return request<PagamentoResponse[]>('/pagamentos');
}
