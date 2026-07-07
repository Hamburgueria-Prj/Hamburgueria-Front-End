import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, Trash2 } from 'lucide-react';
import { categories, categoryLabels, type Category } from '../data/menu';
import {
  type FormaPagamento,
  type PagamentoResponse,
  type PedidoResponse,
  type ProdutoResponse,
  type StatusPedido,
  type TipoPedido,
  type UsuarioResponse
} from '../types/api';
import { formatCurrency } from '../utils/format';
import { atualizarProduto, inativarProduto, listarProdutosApi, salvarProdutoSemDuplicar } from '../services/productService';
import { atualizarUsuario, cadastrarUsuario, inativarUsuario, listarUsuarios } from '../services/userService';
import { listarPagamentos } from '../services/paymentService';
import { atualizarStatusPedido, listarPedidos } from '../services/orderService';

type ManagementPanelProps = {
  lastOrder: PedidoResponse | null;
  onProductsChanged: () => Promise<void>;
};

type Tab = 'produtos' | 'usuarios' | 'pedidos' | 'pagamentos';

type ProductForm = {
  id?: number;
  nome: string;
  descricao: string;
  preco: string;
  categoria: Category;
  imagemBase64: string;
};

type UserForm = {
  id?: number;
  nome: string;
  email: string;
  senha: string;
  perfil: 'ADMIN' | 'CLIENTE';
};

const initialProductForm: ProductForm = {
  nome: '',
  descricao: '',
  preco: '',
  categoria: 'HAMBURGUER',
  imagemBase64: ''
};

const initialUserForm: UserForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'CLIENTE'
};

const statusLabels: Record<StatusPedido, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado'
};

const tipoPedidoLabels: Record<TipoPedido, string> = {
  BALCAO: 'Balcão',
  DELIVERY: 'Delivery',
  RETIRADA: 'Retirada'
};

const paymentLabels: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  CARTAO_CREDITO: 'Cartão crédito',
  CARTAO_DEBITO: 'Cartão débito'
};

const statusActions: StatusPedido[] = ['EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  return typeof value === 'number' ? value : Number(value);
}

function parseMoney(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    reader.readAsDataURL(file);
  });
}

function isValidImageBase64(value: string): boolean {
  return value.startsWith('data:image/');
}

function totalPedido(pedido: PedidoResponse): number {
  return toNumber(pedido.total ?? pedido.valorTotal ?? pedido.subtotal);
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';

  // Backend atual já envia no formato brasileiro: dd/MM/yyyy HH:mm:ss.
  if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    return value.slice(0, 16);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function ManagementPanel({ lastOrder, onProductsChanged }: ManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('produtos');
  const [products, setProducts] = useState<ProdutoResponse[]>([]);
  const [users, setUsers] = useState<UsuarioResponse[]>([]);
  const [payments, setPayments] = useState<PagamentoResponse[]>([]);
  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [productForm, setProductForm] = useState<ProductForm>(initialProductForm);
  const [userForm, setUserForm] = useState<UserForm>(initialUserForm);
  const [updatedOrder, setUpdatedOrder] = useState<PedidoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (lastOrder) {
      setUpdatedOrder(lastOrder);
      setOrders((current) => {
        const exists = current.some((order) => order.id === lastOrder.id);
        return exists ? current.map((order) => (order.id === lastOrder.id ? lastOrder : order)) : [lastOrder, ...current];
      });
    }
  }, [lastOrder]);

  const productTotal = useMemo(() => products.length, [products]);
  const userTotal = useMemo(() => users.length, [users]);
  const orderTotal = useMemo(() => orders.length, [orders]);
  const paymentTotal = useMemo(() => payments.reduce((sum, payment) => sum + toNumber(payment.valorPago), 0), [payments]);

  async function loadAll() {
    setLoading(true);
    setMessage(null);

    try {
      const [productList, userList, paymentList, orderList] = await Promise.allSettled([
        listarProdutosApi(),
        listarUsuarios(),
        listarPagamentos(),
        listarPedidos()
      ]);

      if (productList.status === 'fulfilled') setProducts(productList.value);
      if (userList.status === 'fulfilled') setUsers(userList.value);
      if (paymentList.status === 'fulfilled') setPayments(paymentList.value);
      if (orderList.status === 'fulfilled') setOrders(orderList.value);

      const failures = [productList, userList, paymentList, orderList].filter((result) => result.status === 'rejected');
      setMessage(
        failures.length > 0
          ? { type: 'info', text: 'Alguns dados não carregaram. Confira se o backend está ligado e tente atualizar.' }
          : { type: 'success', text: 'Dados da área administrativa carregados do backend.' }
      );
    } catch (error) {
      setMessage({ type: 'error', text: normalizeMessage(error, 'Falha ao carregar os dados da gestão.') });
    } finally {
      setLoading(false);
    }
  }

  async function reloadProducts() {
    const productList = await listarProdutosApi();
    setProducts(productList);
    await onProductsChanged();
  }

  async function reloadOrdersAndPayments() {
    const [orderList, paymentList] = await Promise.all([listarPedidos(), listarPagamentos()]);
    setOrders(orderList);
    setPayments(paymentList);
  }

  async function handleProductImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Selecione um arquivo de imagem válido.' });
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem está muito grande. Use uma imagem de até 2 MB.' });
      event.target.value = '';
      return;
    }

    try {
      const imagemBase64 = await readFileAsBase64(file);

      if (!isValidImageBase64(imagemBase64)) {
        setMessage({ type: 'error', text: 'A imagem selecionada não pôde ser convertida corretamente.' });
        return;
      }

      setProductForm((current) => ({ ...current, imagemBase64 }));
      setMessage({ type: 'info', text: 'Imagem carregada. Clique em Salvar para gravar o produto no banco.' });
    } catch (error) {
      setMessage({ type: 'error', text: normalizeMessage(error, 'Falha ao carregar a imagem.') });
    } finally {
      event.target.value = '';
    }
  }

  async function handleSubmitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const price = parseMoney(productForm.preco);
    if (!productForm.nome.trim() || !Number.isFinite(price) || price <= 0) {
      setMessage({ type: 'error', text: 'Informe nome e preço válido para salvar o produto.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        nome: productForm.nome.trim(),
        descricao: productForm.descricao.trim(),
        preco: price,
        categoria: productForm.categoria,
        imagemBase64: productForm.imagemBase64 || null
      };

      if (productForm.id) {
        await atualizarProduto(productForm.id, payload);
        setMessage({ type: 'success', text: 'Produto atualizado com sucesso.' });
      } else {
        await salvarProdutoSemDuplicar(payload);
        setMessage({ type: 'success', text: 'Produto salvo. Se já existia com mesmo nome/categoria, foi atualizado para evitar duplicação.' });
      }

      setProductForm(initialProductForm);
      await reloadProducts();
    } catch (error) {
      setMessage({ type: 'error', text: normalizeMessage(error, 'Falha ao salvar produto.') });
    } finally {
      setLoading(false);
    }
  }

  async function handleInactivateProduct(id: number) {
    if (!window.confirm('Inativar este produto? Ele não aparecerá mais no cardápio.')) return;

    setLoading(true);
    setMessage(null);

    try {
      await inativarProduto(id);
      setMessage({ type: 'success', text: 'Produto inativado.' });
      await reloadProducts();
    } catch (error) {
      setMessage({ type: 'error', text: normalizeMessage(error, 'Falha ao inativar produto.') });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userForm.nome.trim() || !userForm.email.trim() || userForm.senha.length < 6) {
      setMessage({ type: 'error', text: 'Informe nome, e-mail e senha com pelo menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        nome: userForm.nome.trim(),
        email: userForm.email.trim(),
        senha: userForm.senha,
        perfil: userForm.perfil
      };

      if (userForm.id) {
        await atualizarUsuario(userForm.id, payload);
        setMessage({ type: 'success', text: 'Usuário atualizado.' });
      } else {
        await cadastrarUsuario(payload);
        setMessage({ type: 'success', text: 'Usuário cadastrado.' });
      }

      setUserForm(initialUserForm);
      setUsers(await listarUsuarios());
    } catch (error) {
      setMessage({ type: 'error', text: normalizeMessage(error, 'Falha ao salvar usuário.') });
    } finally {
      setLoading(false);
    }
  }

  async function handleInactivateUser(id?: number) {
    if (!id) {
      setMessage({ type: 'info', text: 'O backend precisa retornar o campo id no UsuarioResponse para permitir inativar pela lista.' });
      return;
    }

    if (!window.confirm('Inativar este usuário?')) return;

    setLoading(true);
    setMessage(null);

    try {
      await inativarUsuario(id);
      setMessage({ type: 'success', text: 'Usuário inativado.' });
      setUsers(await listarUsuarios());
    } catch (error) {
      setMessage({ type: 'error', text: normalizeMessage(error, 'Falha ao inativar usuário.') });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateOrderStatus(orderId: number, status: StatusPedido) {
    setLoading(true);
    setMessage(null);

    try {
      const response = await atualizarStatusPedido(orderId, status);
      setUpdatedOrder(response);
      setOrders((current) => current.map((order) => (order.id === response.id ? response : order)));
      setMessage({ type: 'success', text: `Pedido #${response.id} atualizado para ${statusLabels[response.status]}.` });
      await reloadOrdersAndPayments();
    } catch (error) {
      setMessage({ type: 'error', text: normalizeMessage(error, 'Falha ao atualizar status do pedido.') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="management-panel" id="gestao">
      <div className="management-heading">
        <div>
          <span>Administração</span>
          <h2>Gestão do sistema</h2>
          <p>Área exclusiva do admin: produtos, usuários, pedidos e pagamentos.</p>
        </div>
        <button className="secondary-button" onClick={() => void loadAll()} disabled={loading}>
          <RefreshCw size={16} />
          Atualizar dados
        </button>
      </div>

      <div className="management-kpis">
        <article><span>Produtos</span><strong>{productTotal}</strong></article>
        <article><span>Usuários</span><strong>{userTotal}</strong></article>
        <article><span>Pedidos</span><strong>{orderTotal}</strong></article>
        <article><span>Total pago</span><strong>{formatCurrency(paymentTotal)}</strong></article>
      </div>

      <div className="management-tabs">
        {([
          ['produtos', 'Produtos'],
          ['usuarios', 'Usuários'],
          ['pedidos', 'Pedidos'],
          ['pagamentos', 'Pagamentos']
        ] as Array<[Tab, string]>).map(([tab, label]) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {label}
          </button>
        ))}
      </div>

      {message && <div className={`panel-message ${message.type}`}>{message.text}</div>}

      {activeTab === 'produtos' && (
        <div className="management-grid">
          <form className="panel-form" onSubmit={handleSubmitProduct}>
            <h3>{productForm.id ? 'Editar produto' : 'Cadastrar produto'}</h3>
            <label>
              Nome
              <input value={productForm.nome} onChange={(event) => setProductForm({ ...productForm, nome: event.target.value })} placeholder="Ex: X-Bacon artesanal" />
            </label>
            <label>
              Descrição
              <textarea value={productForm.descricao} onChange={(event) => setProductForm({ ...productForm, descricao: event.target.value })} placeholder="Ingredientes e observações" />
            </label>
            <div className="form-two-cols">
              <label>
                Preço
                <input value={productForm.preco} onChange={(event) => setProductForm({ ...productForm, preco: event.target.value })} placeholder="19,90" />
              </label>
              <label>
                Categoria
                <select value={productForm.categoria} onChange={(event) => setProductForm({ ...productForm, categoria: event.target.value as Category })}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Imagem do produto
              <div className="image-upload-box">
                {productForm.imagemBase64 ? (
                  <img src={productForm.imagemBase64} alt="Prévia do produto" className="product-image-preview" />
                ) : (
                  <div className="image-upload-placeholder">
                    <strong>Sem imagem</strong>
                    <span>Escolha uma foto para aparecer no cardápio.</span>
                  </div>
                )}

                <div className="image-upload-actions">
                  <input type="file" accept="image/*" onChange={(event) => void handleProductImageChange(event)} />
                  {productForm.imagemBase64 && (
                    <button className="ghost-button" type="button" onClick={() => setProductForm({ ...productForm, imagemBase64: '' })}>
                      Remover imagem
                    </button>
                  )}
                </div>
              </div>
            </label>
            <div className="form-actions">
              <button className="save-button" type="submit" disabled={loading}><Save size={16} /> Salvar</button>
              {productForm.id && <button className="ghost-button" type="button" onClick={() => setProductForm(initialProductForm)}>Cancelar edição</button>}
            </div>
          </form>

          <div className="panel-list">
            {products.map((product) => (
              <article className="panel-list-item product-list-item" key={product.id}>
                {product.imagemBase64 || product.imagemUrl ? (
                  <img src={product.imagemBase64 || product.imagemUrl || ''} alt={product.nome} className="panel-product-thumb" />
                ) : (
                  <div className="panel-product-thumb empty" aria-label="Produto sem imagem">🍔</div>
                )}
                <div>
                  <strong>{product.nome}</strong>
                  <span>{categoryLabels[product.categoria]} • {formatCurrency(toNumber(product.preco))}</span>
                  {product.descricao && <p>{product.descricao}</p>}
                </div>
                <div className="row-actions">
                  <button onClick={() => setProductForm({
                    id: product.id,
                    nome: product.nome,
                    descricao: product.descricao || '',
                    preco: String(product.preco).replace('.', ','),
                    categoria: product.categoria,
                    imagemBase64: product.imagemBase64 || product.imagemUrl || ''
                  })}>Editar</button>
                  <button className="danger" onClick={() => void handleInactivateProduct(product.id)}><Trash2 size={14} /> Inativar</button>
                </div>
              </article>
            ))}
            {products.length === 0 && <div className="panel-note">Nenhum produto cadastrado ainda.</div>}
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="management-grid">
          <form className="panel-form" onSubmit={handleSubmitUser}>
            <h3>{userForm.id ? 'Editar usuário' : 'Cadastrar usuário'}</h3>
            <label>
              Nome
              <input value={userForm.nome} onChange={(event) => setUserForm({ ...userForm, nome: event.target.value })} placeholder="Nome do usuário" />
            </label>
            <label>
              E-mail
              <input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="email@exemplo.com" />
            </label>
            <div className="form-two-cols">
              <label>
                Senha
                <input type="password" value={userForm.senha} onChange={(event) => setUserForm({ ...userForm, senha: event.target.value })} placeholder="Mínimo 6 caracteres" />
              </label>
              <label>
                Perfil
                <select value={userForm.perfil} onChange={(event) => setUserForm({ ...userForm, perfil: event.target.value as UserForm['perfil'] })}>
                  <option value="ADMIN">Admin</option>
                  <option value="CLIENTE">Cliente</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button className="save-button" type="submit" disabled={loading}><Save size={16} /> Salvar</button>
              {userForm.id && <button className="ghost-button" type="button" onClick={() => setUserForm(initialUserForm)}>Cancelar edição</button>}
            </div>
          </form>

          <div className="panel-list">
            <div className="panel-note">
              O login usa a entidade <strong>Usuario</strong>. Clientes do cardápio são usuários com perfil <strong>CLIENTE</strong>.
            </div>
            {users.map((user, index) => (
              <article className="panel-list-item" key={`${user.email}-${index}`}>
                <div>
                  <strong>{user.nome}</strong>
                  <span>{user.email} • {user.perfil}</span>
                  <p>ID retornado: {user.id ?? 'não enviado pelo backend'}</p>
                </div>
                <div className="row-actions">
                  <button disabled={!user.id} onClick={() => user.id && setUserForm({
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    senha: '',
                    perfil: user.perfil
                  })}>Editar</button>
                  <button className="danger" onClick={() => void handleInactivateUser(user.id)}><Trash2 size={14} /> Inativar</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pedidos' && (
        <div className="admin-orders-section">
          <div className="table-header">
            <div>
              <h3>Pedidos recebidos</h3>
              <p>Veja os itens comprados para começar o preparo e atualize o status para o cliente acompanhar.</p>
            </div>
            <button className="secondary-button compact" onClick={() => void reloadOrdersAndPayments()} disabled={loading}>Atualizar</button>
          </div>

          <div className="admin-orders-list">
            {orders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <div className="admin-order-top">
                  <div>
                    <span>Pedido #{order.id}</span>
                    <h4>{order.usuarioNome || 'Cliente'}</h4>
                    <p>{tipoPedidoLabels[order.tipoPedido]} • {formatDateTime(order.dataCriacao ?? order.dataPedido ?? order.dataAtualizacao)}</p>
                  </div>
                  <div className="admin-order-summary">
                    <span className={`status-pill status-${order.status.toLowerCase()}`}>{statusLabels[order.status]}</span>
                    <strong>{formatCurrency(totalPedido(order))}</strong>
                    {order.pagamento && (
                      <small>
                        {paymentLabels[order.pagamento.formaPagamento]} • {order.pagamento.statusPagamento}
                      </small>
                    )}
                  </div>
                </div>

                <div className="admin-order-items">
                  <strong>Itens para preparar</strong>
                  {(order.itens ?? []).length > 0 ? (
                    <ul>
                      {(order.itens ?? []).map((item) => (
                        <li key={`${order.id}-${item.produtoId}-${item.nomeProduto}`}>
                          <span>{item.quantidade}x {item.nomeProduto}</span>
                          <em>{formatCurrency(toNumber(item.subtotalItem))}</em>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Nenhum item retornado para este pedido.</p>
                  )}
                </div>

                {order.observacao && <p className="admin-order-note">Obs.: {order.observacao}</p>}

                <div className="admin-order-actions">
                  {statusActions.map((status) => (
                    <button
                      key={status}
                      className={status === 'CANCELADO' ? 'danger' : undefined}
                      disabled={loading || order.status === status || order.status === 'CANCELADO'}
                      onClick={() => void handleUpdateOrderStatus(order.id, status)}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </article>
            ))}
            {orders.length === 0 && <div className="panel-note">Nenhum pedido encontrado.</div>}
          </div>

          {updatedOrder && (
            <article className="order-status-card">
              <span>Último pedido atualizado</span>
              <strong>Pedido #{updatedOrder.id}</strong>
              <p>Status: {statusLabels[updatedOrder.status]}</p>
              <p>Tipo: {tipoPedidoLabels[updatedOrder.tipoPedido]}</p>
              <p>Total: {formatCurrency(totalPedido(updatedOrder))}</p>
            </article>
          )}
        </div>
      )}

      {activeTab === 'pagamentos' && (
        <div className="table-card">
          <div className="table-header">
            <h3>Pagamentos registrados</h3>
            <button className="secondary-button compact" onClick={() => listarPagamentos().then(setPayments)} disabled={loading}>Atualizar</button>
          </div>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pedido</th>
                  <th>Forma</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>#{payment.id}</td>
                    <td>#{payment.pedidoId}</td>
                    <td>{paymentLabels[payment.formaPagamento]}</td>
                    <td><span className="status-pill">{payment.statusPagamento}</span></td>
                    <td>{formatCurrency(toNumber(payment.valorPago))}</td>
                    <td>{formatDateTime(payment.dataPagamento)}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={6}>Nenhum pagamento encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
