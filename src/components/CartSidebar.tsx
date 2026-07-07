import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { type CartItem } from '../types/cart';
import { type FormaPagamento, type PedidoResponse, type TipoPedido } from '../types/api';
import { RatingStars } from './RatingStars';
import { OrderStatusCard } from './OrderStatusCard';

type CartSidebarProps = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  tipoPedido: TipoPedido;
  formaPagamento: FormaPagamento;
  trocoPara: string;
  checkoutLoading: boolean;
  checkoutMessage: string | null;
  checkoutMessageType: 'success' | 'error' | 'info';
  lastOrder: PedidoResponse | null;
  orderStatusLoading: boolean;
  orderStatusMessage: string | null;
  onRefreshOrderStatus: () => void;
  onClearLastOrder: () => void;
  onTipoPedidoChange: (tipo: TipoPedido) => void;
  onFormaPagamentoChange: (forma: FormaPagamento) => void;
  onTrocoParaChange: (value: string) => void;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
};

const tipoPedidoLabels: Record<TipoPedido, string> = {
  BALCAO: 'Balcão',
  DELIVERY: 'Delivery',
  RETIRADA: 'Retirada'
};

const formaPagamentoLabels: Record<FormaPagamento, string> = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartão crédito',
  CARTAO_DEBITO: 'Cartão débito'
};

export function CartSidebar({
  items,
  subtotal,
  deliveryFee,
  total,
  tipoPedido,
  formaPagamento,
  trocoPara,
  checkoutLoading,
  checkoutMessage,
  checkoutMessageType,
  lastOrder,
  orderStatusLoading,
  orderStatusMessage,
  onRefreshOrderStatus,
  onClearLastOrder,
  onTipoPedidoChange,
  onFormaPagamentoChange,
  onTrocoParaChange,
  onIncrement,
  onDecrement,
  onRemove,
  onCheckout
}: CartSidebarProps) {
  const trocoParaNormalizado = trocoPara.replace(/\./g, '').replace(',', '.').trim();
  const valorPagoEmDinheiro = Number(trocoParaNormalizado);
  const trocoParaEhValido = formaPagamento === 'DINHEIRO' && trocoPara.trim().length > 0 && Number.isFinite(valorPagoEmDinheiro);
  const trocoCalculado = trocoParaEhValido && valorPagoEmDinheiro > total ? valorPagoEmDinheiro - total : 0;
  const valorDinheiroInsuficiente = trocoParaEhValido && valorPagoEmDinheiro > 0 && valorPagoEmDinheiro < total;

  return (
    <aside className="cart-sidebar" aria-label="Resumo do carrinho">
      <div className="cart-header">
        <div>
          <span>Seu pedido</span>
          <h2>Carrinho</h2>
        </div>
        <div className="cart-icon">
          <ShoppingBag size={22} />
          <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
        </div>
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="empty-cart">
            <span>🍔</span>
            <strong>Seu carrinho está vazio</strong>
            <p>Adicione um item do cardápio para iniciar o pedido.</p>
          </div>
        ) : (
          items.map((item) => (
            <article className="cart-item" key={item.id}>
              <img src={item.image} alt={item.name} />
              <div className="cart-item-info">
                <strong>{item.name}</strong>
                <RatingStars rating={item.rating} />
                <span>{formatCurrency(item.price)}</span>
              </div>
              <div className="cart-item-actions">
                <button onClick={() => onIncrement(item.id)} aria-label={`Aumentar quantidade de ${item.name}`}>
                  <Plus size={15} />
                </button>
                <strong>{item.quantity}</strong>
                <button onClick={() => onDecrement(item.id)} aria-label={`Diminuir quantidade de ${item.name}`}>
                  <Minus size={15} />
                </button>
                <button className="remove" onClick={() => onRemove(item.id)} aria-label={`Remover ${item.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="order-options">
        <label>
          <span>Tipo do pedido</span>
          <select value={tipoPedido} onChange={(event) => onTipoPedidoChange(event.target.value as TipoPedido)}>
            {(Object.keys(tipoPedidoLabels) as TipoPedido[]).map((tipo) => (
              <option key={tipo} value={tipo}>{tipoPedidoLabels[tipo]}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Pagamento</span>
          <select value={formaPagamento} onChange={(event) => onFormaPagamentoChange(event.target.value as FormaPagamento)}>
            {(Object.keys(formaPagamentoLabels) as FormaPagamento[]).map((forma) => (
              <option key={forma} value={forma}>{formaPagamentoLabels[forma]}</option>
            ))}
          </select>
        </label>

        {formaPagamento === 'DINHEIRO' && (
          <label>
            <span>Troco para</span>
            <input
              inputMode="decimal"
              value={trocoPara}
              onChange={(event) => onTrocoParaChange(event.target.value)}
              placeholder="Ex: 50,00"
            />
          </label>
        )}
      </div>

      <div className="cart-totals">
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div>
          <span>Taxa de entrega</span>
          <strong>{formatCurrency(deliveryFee)}</strong>
        </div>

        {formaPagamento === 'DINHEIRO' && (
          <div className="change-row">
            <span>Troco</span>
            <strong>{formatCurrency(trocoCalculado)}</strong>
          </div>
        )}
      </div>

      {valorDinheiroInsuficiente && (
        <div className="change-warning">
          O valor informado para pagamento em dinheiro é menor que o total do pedido.
        </div>
      )}

      <button className="checkout-button" disabled={items.length === 0 || checkoutLoading} onClick={onCheckout}>
        {checkoutLoading ? 'Enviando...' : items.length === 0 ? 'Adicione itens' : 'Finalizar pedido'}
        <strong>{formatCurrency(total)}</strong>
      </button>

      {checkoutMessage && <div className={`checkout-message ${checkoutMessageType}`}>{checkoutMessage}</div>}


      <OrderStatusCard
        pedido={lastOrder}
        loading={orderStatusLoading}
        message={orderStatusMessage}
        onRefresh={onRefreshOrderStatus}
        onClear={onClearLastOrder}
      />

      <div className="payments">
        <span>Pagamento aceito</span>
        <div>
          <strong>VISA</strong>
          <strong>Master</strong>
          <strong>Pix</strong>
          <strong>Dinheiro</strong>
        </div>
      </div>
    </aside>
  );
}
