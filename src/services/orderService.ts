import { getErrorMessage, request } from '../lib/api';
import { type CartItem } from '../types/cart';
import {
  type FormaPagamento,
  type PagamentoResponse,
  type PedidoResponse,
  type StatusPedido,
  type TipoPedido
} from '../types/api';

export type CheckoutOptions = {
  tipoPedido: TipoPedido;
  formaPagamento: FormaPagamento;
  trocoPara?: number | null;
  observacao?: string;
  usuarioId?: number;
};

export type CheckoutResult = {
  pedido: PedidoResponse;
  pagamento?: PagamentoResponse;
  pagamentoErro?: string;
};

async function criarPedido(items: CartItem[], usuarioId: number, options: CheckoutOptions): Promise<PedidoResponse> {
  return request<PedidoResponse>('/pedidos', {
    method: 'POST',
    body: JSON.stringify({
      usuarioId,
      tipoPedido: options.tipoPedido,
      desconto: 0,
      observacao: options.observacao || 'Pedido criado pela área do cliente Boca de Brasa',
      itens: items.map((item) => ({
        produtoId: item.id,
        quantidade: item.quantity
      }))
    })
  });
}

async function registrarPagamento(
  pedidoId: number,
  total: number,
  formaPagamento: FormaPagamento,
  trocoPara?: number | null
): Promise<PagamentoResponse> {
  return request<PagamentoResponse>('/pagamentos', {
    method: 'POST',
    body: JSON.stringify({
      pedidoId,
      formaPagamento,
      valorPago: Number(total.toFixed(2)),
      trocoPara: formaPagamento === 'DINHEIRO' ? trocoPara ?? null : null
    })
  });
}

export async function finalizarPedido(items: CartItem[], total: number, options: CheckoutOptions): Promise<CheckoutResult> {
  if (!options.usuarioId) {
    throw new Error('Usuário não identificado. Faça login novamente para finalizar o pedido.');
  }

  const pedido = await criarPedido(items, options.usuarioId, options);

  try {
    const pagamento = await registrarPagamento(pedido.id, total, options.formaPagamento, options.trocoPara);
    return { pedido, pagamento };
  } catch (error) {
    return {
      pedido,
      pagamentoErro: getErrorMessage(error, 'Pedido criado, mas houve falha ao registrar o pagamento.')
    };
  }
}

export async function listarPedidos(): Promise<PedidoResponse[]> {
  return request<PedidoResponse[]>('/pedidos');
}

export async function listarPedidosPorUsuario(usuarioId: number): Promise<PedidoResponse[]> {
  return request<PedidoResponse[]>(`/pedidos/usuario/${usuarioId}`);
}

export async function atualizarStatusPedido(id: number, status: StatusPedido): Promise<PedidoResponse> {
  return request<PedidoResponse>(`/pedidos/${id}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH'
  });
}

export async function buscarPedidoPorId(id: number): Promise<PedidoResponse> {
  return request<PedidoResponse>(`/pedidos/${id}`);
}
