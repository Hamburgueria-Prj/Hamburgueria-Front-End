import { useEffect, useMemo, useState } from 'react';
import { CartSidebar } from './components/CartSidebar';
import { DeliveryInfo } from './components/DeliveryInfo';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LoginPage } from './components/LoginPage';
import { ManagementPanel } from './components/ManagementPanel';
import { MenuGrid } from './components/MenuGrid';
import { SearchAndPromo } from './components/SearchAndPromo';
import { demoMenuItems, type Category, type MenuItem } from './data/menu';
import { API_URL } from './lib/api';
import { garantirProdutosDeAmostra } from './services/productService';
import { buscarPedidoPorId, finalizarPedido } from './services/orderService';
import { type CartItem } from './types/cart';
import { type AuthResponse, type FormaPagamento, type PedidoResponse, type TipoPedido } from './types/api';

const DELIVERY_FEE = 4;

type AppArea = 'login' | 'cliente' | 'admin';

type LoginSession = AuthResponse;

const SESSION_STORAGE_KEY = 'flame_bite_login_session';
const LAST_ORDER_ID_STORAGE_KEY = 'flame_bite_last_order_id';
const LAST_ORDER_ID_STORAGE_PREFIX = 'flame_bite_last_order_id_user';

function loadStoredSession(): LoginSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoginSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: LoginSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function getLastOrderStorageKey(userId?: number | null): string {
  return userId ? `${LAST_ORDER_ID_STORAGE_PREFIX}_${userId}` : LAST_ORDER_ID_STORAGE_KEY;
}

function readOrderIdFromStorage(key: string): number | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function loadStoredLastOrderId(userId?: number | null): number | null {
  const userKey = getLastOrderStorageKey(userId);
  const userOrderId = readOrderIdFromStorage(userKey);

  if (userOrderId) return userOrderId;

  // Compatibilidade com versões anteriores do front, que salvavam o último pedido
  // em uma chave global. Se existir, migra para a chave do usuário logado.
  if (userId) {
    const oldGlobalOrderId = readOrderIdFromStorage(LAST_ORDER_ID_STORAGE_KEY);

    if (oldGlobalOrderId) {
      localStorage.setItem(userKey, String(oldGlobalOrderId));
      localStorage.removeItem(LAST_ORDER_ID_STORAGE_KEY);
      return oldGlobalOrderId;
    }
  }

  return null;
}

function saveLastOrderId(id: number, userId?: number | null): void {
  localStorage.setItem(getLastOrderStorageKey(userId), String(id));
}

function clearLastOrderId(userId?: number | null): void {
  localStorage.removeItem(getLastOrderStorageKey(userId));
}

function parseMoney(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function App() {
  const [session, setSession] = useState<LoginSession | null>(() => loadStoredSession());
  const [area, setArea] = useState<AppArea>(() => {
    const storedSession = loadStoredSession();
    if (!storedSession) return 'login';
    return storedSession.perfil === 'ADMIN' ? 'admin' : 'cliente';
  });
  const [activeCategory, setActiveCategory] = useState<Category | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsMessage, setProductsMessage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutMessageType, setCheckoutMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>('DELIVERY');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [trocoPara, setTrocoPara] = useState('');
  const [lastOrder, setLastOrder] = useState<PedidoResponse | null>(null);
  const [lastOrderId, setLastOrderId] = useState<number | null>(() => {
    const storedSession = loadStoredSession();
    return storedSession ? loadStoredLastOrderId(storedSession.id) : null;
  });
  const [orderStatusLoading, setOrderStatusLoading] = useState(false);
  const [orderStatusMessage, setOrderStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    if (!session) {
      setLastOrder(null);
      setLastOrderId(null);
      setOrderStatusMessage(null);
      return;
    }

    const storedOrderId = loadStoredLastOrderId(session.id);
    setLastOrder(null);
    setLastOrderId(storedOrderId);
    setOrderStatusMessage(null);
  }, [session?.id]);

  useEffect(() => {
    if (area === 'cliente' && lastOrderId) {
      void refreshOrderStatus(lastOrderId, true);
    }
  }, [area, lastOrderId]);

  useEffect(() => {
    if (area !== 'cliente' || !lastOrderId) return;

    const timer = window.setInterval(() => {
      void refreshOrderStatus(lastOrderId, true);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [area, lastOrderId]);

  async function loadProducts() {
    setLoadingProducts(true);
    setProductsMessage(null);

    try {
      const { produtos, cadastrados } = await garantirProdutosDeAmostra();

      setMenuItems(produtos);
      setProductsMessage(
        cadastrados > 0
          ? `Boca de Brasa online. Cardápio atualizado com ${cadastrados} novidade(s) e pronto para receber pedidos.`
          : 'Boca de Brasa online. Cardápio atualizado e pronto para receber pedidos.'
      );
    } catch {
      setMenuItems(demoMenuItems);
      setProductsMessage('Cardápio temporariamente em modo demonstração. Tente novamente em instantes.');
    } finally {
      setLoadingProducts(false);
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'todos' || item.category === activeCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, menuItems, search]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cartItems.length === 0 || tipoPedido !== 'DELIVERY' ? 0 : DELIVERY_FEE;
  const total = cartItems.length === 0 ? 0 : subtotal + deliveryFee;

  function handleAddToCart(item: MenuItem) {
    setCheckoutMessage(null);

    setCartItems((current) => {
      const existingItem = current.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return current.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }

  function handleIncrement(id: number) {
    setCartItems((current) => current.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)));
  }

  function handleDecrement(id: number) {
    setCartItems((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function handleRemove(id: number) {
    setCartItems((current) => current.filter((item) => item.id !== id));
  }

  async function refreshOrderStatus(orderId: number | null = lastOrder?.id ?? lastOrderId, silent = false) {
    if (!orderId) {
      setOrderStatusMessage('Nenhum pedido recente para acompanhar.');
      return;
    }

    if (!silent) {
      setOrderStatusLoading(true);
      setOrderStatusMessage(null);
    }

    try {
      const pedidoAtualizado = await buscarPedidoPorId(orderId);
      setLastOrder(pedidoAtualizado);
      setLastOrderId(pedidoAtualizado.id);
      saveLastOrderId(pedidoAtualizado.id, session?.id);

      if (!silent) {
        setOrderStatusMessage(`Status atualizado: ${pedidoAtualizado.status.replace(/_/g, ' ').toLowerCase()}.`);
      }
    } catch (error) {
      if (!silent) {
        setOrderStatusMessage(error instanceof Error ? error.message : 'Não foi possível atualizar o status do pedido.');
      }
    } finally {
      if (!silent) {
        setOrderStatusLoading(false);
      }
    }
  }

  function handleClearLastOrder() {
    setLastOrder(null);
    setLastOrderId(null);
    setOrderStatusMessage(null);
    clearLastOrderId(session?.id);
  }

  async function handleCheckout() {
    if (cartItems.length === 0) return;

    const hasOnlyBackendItems = cartItems.every((item) => item.fromBackend);

    if (!hasOnlyBackendItems) {
      setCheckoutMessageType('error');
      setCheckoutMessage('Não foi possível finalizar agora. Tente novamente em instantes.');
      return;
    }

    const trocoParaNumber = parseMoney(trocoPara);
    if (formaPagamento === 'DINHEIRO' && trocoPara.trim() && trocoParaNumber === null) {
      setCheckoutMessageType('error');
      setCheckoutMessage('Informe um valor válido no campo troco para.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutMessageType('info');
    setCheckoutMessage('Enviando seu pedido para a cozinha...');

    try {
      const result = await finalizarPedido(cartItems, total, {
        tipoPedido,
        formaPagamento,
        trocoPara: trocoParaNumber,
        usuarioId: session?.id,
        observacao: `Pedido ${tipoPedido.toLowerCase()} criado por ${session?.nome ?? 'Cliente'} na área do cliente Boca de Brasa`
      });

      setCartItems([]);
      setLastOrder(result.pedido);
      setLastOrderId(result.pedido.id);
      saveLastOrderId(result.pedido.id, session?.id);
      setOrderStatusMessage('Pedido salvo para acompanhamento.');
      setCheckoutMessageType(result.pagamentoErro ? 'info' : 'success');
      setCheckoutMessage(
        result.pagamentoErro
          ? `Pedido #${result.pedido.id} criado, mas o pagamento retornou aviso: ${result.pagamentoErro}`
          : `Pedido #${result.pedido.id} criado com sucesso. Valor registrado: R$ ${total.toFixed(2).replace('.', ',')}.`
      );
    } catch (error) {
      setCheckoutMessageType('error');
      setCheckoutMessage(error instanceof Error ? error.message : 'Não foi possível finalizar o pedido.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handleLogin(nextSession: LoginSession) {
    saveSession(nextSession);
    setSession(nextSession);
    setLastOrder(null);
    setLastOrderId(loadStoredLastOrderId(nextSession.id));
    setOrderStatusMessage(null);
    setArea(nextSession.perfil === 'ADMIN' ? 'admin' : 'cliente');
  }

  function handleSwitchArea(nextArea: 'cliente' | 'admin') {
    if (!session || (nextArea === 'admin' && session.perfil !== 'ADMIN')) {
      setArea('login');
      return;
    }

    setArea(nextArea);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setArea('login');
    setActiveCategory('todos');
    setSearch('');
    setCartItems([]);
    setCheckoutMessage(null);
    setLastOrder(null);
    setLastOrderId(null);
    setOrderStatusMessage(null);
  }

  if (area === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (area === 'admin') {
    return (
      <main className="app-shell admin-shell">
        <section className="dashboard-card admin-mode">
          <Header area="admin" onSwitchArea={handleSwitchArea} onLogout={handleLogout} canAccessAdmin />
          <ManagementPanel lastOrder={lastOrder} onProductsChanged={loadProducts} />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="dashboard-card client-mode">
        <div className="content-column">
          <Header
            area="cliente"
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onSwitchArea={handleSwitchArea}
            onLogout={handleLogout}
            canAccessAdmin={session?.perfil === 'ADMIN'}
          />
          <Hero />
          <SearchAndPromo search={search} onSearchChange={setSearch} />

          {productsMessage && <div className="backend-status">{productsMessage}</div>}

          <MenuGrid items={filteredItems} onAddToCart={handleAddToCart} loading={loadingProducts} />
          <DeliveryInfo />
        </div>

        <CartSidebar
          items={cartItems}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          total={total}
          tipoPedido={tipoPedido}
          formaPagamento={formaPagamento}
          trocoPara={trocoPara}
          checkoutLoading={checkoutLoading}
          checkoutMessage={checkoutMessage}
          checkoutMessageType={checkoutMessageType}
          lastOrder={lastOrder}
          orderStatusLoading={orderStatusLoading}
          orderStatusMessage={orderStatusMessage}
          onRefreshOrderStatus={() => void refreshOrderStatus()}
          onClearLastOrder={handleClearLastOrder}
          onTipoPedidoChange={setTipoPedido}
          onFormaPagamentoChange={setFormaPagamento}
          onTrocoParaChange={setTrocoPara}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
        />
      </section>
    </main>
  );
}

export default App;
