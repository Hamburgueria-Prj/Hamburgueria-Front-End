import { type Category } from '../data/menu';

export type ProdutoResponse = {
  id: number;
  nome: string;
  descricao?: string | null;
  preco: number | string;
  categoria: Category;
  ativo: boolean;
  imagemUrl?: string | null;
  imagemBase64?: string | null;
};

export type ProdutoRequest = {
  nome: string;
  descricao?: string;
  preco: number;
  categoria: Category;
  imagemUrl?: string | null;
  imagemBase64?: string | null;
};

export type PerfilUsuario = 'ADMIN' | 'CLIENTE';

export type UsuarioResponse = {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  dataCadastro?: string;
};

export type UsuarioRequest = {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
};

export type UsuarioCreateResponse = UsuarioResponse & {
  id: number;
};

export type AuthLoginRequest = {
  email: string;
  senha: string;
};

export type AuthRegisterRequest = {
  nome: string;
  email: string;
  senha: string;
};

export type AuthResponse = {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  mensagem?: string;
};

export type TipoPedido = 'BALCAO' | 'DELIVERY' | 'RETIRADA';
export type StatusPedido = 'RECEBIDO' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO';
export type StatusPagamento = 'PENDENTE' | 'PAGO' | 'CANCELADO';

export type PedidoRequest = {
  usuarioId: number;
  tipoPedido: TipoPedido;
  desconto: number;
  observacao?: string;
  itens: Array<{
    produtoId: number;
    quantidade: number;
  }>;
};

export type PedidoResponse = {
  id: number;
  usuarioId?: number;
  usuarioNome?: string | null;
  usuarioPerfil?: PerfilUsuario;
  status: StatusPedido;
  tipoPedido: TipoPedido;
  subtotal: number | string;
  desconto: number | string;
  total?: number | string;
  valorTotal?: number | string;
  dataPedido?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
  observacao?: string | null;
  itens?: Array<{
    produtoId: number;
    nomeProduto: string;
    quantidade: number;
    precoUnitario: number | string;
    subtotalItem: number | string;
  }>;
  pagamento?: PagamentoResponse | null;
};

export type PagamentoRequest = {
  pedidoId: number;
  formaPagamento: FormaPagamento;
  valorPago: number;
  trocoPara?: number | null;
};

export type PagamentoResponse = {
  id: number;
  pedidoId: number;
  formaPagamento: FormaPagamento;
  statusPagamento: StatusPagamento;
  valorPago: number | string;
  trocoPara?: number | string | null;
  troco?: number | string | null;
  dataPagamento?: string | null;
};

export type ItemMaisVendidoResponse = {
  produtoId: number;
  nomeProduto: string;
  quantidadeVendida: number;
};

export type DashboardResponse = {
  totalVendidoDia: number | string;
  quantidadePedidosDia: number;
  itensMaisVendidos: ItemMaisVendidoResponse[];
  pedidosPorStatus: Partial<Record<StatusPedido, number>>;
};

