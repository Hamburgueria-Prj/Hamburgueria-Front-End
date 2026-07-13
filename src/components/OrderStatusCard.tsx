import { CheckCircle2, Clock3, PackageCheck, RefreshCcw, XCircle } from 'lucide-react';
import { type PedidoResponse, type StatusPedido } from '../types/api';
import { formatCurrency } from '../utils/format';

type OrderStatusCardProps = {
  pedido: PedidoResponse | null;
  loading: boolean;
  message: string | null;
  onRefresh: () => void;
  onClear: () => void;
};

const statusLabels: Record<StatusPedido, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado'
};

const statusSteps: StatusPedido[] = ['RECEBIDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE'];

function toNumber(value: number | string | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value?: string): string {
  if (!value) return 'Agora';

  const normalized = String(value).trim();

  // Formato ISO vindo do backend Java: 2026-07-05T22:04:00
  const isoMatch = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/
  );

  if (isoMatch) {
    const [, , month, day, hour, minute] = isoMatch;
    return hour && minute ? `${day}/${month}, ${hour}:${minute}` : `${day}/${month}`;
  }

  // Formato brasileiro já pronto: 05/07/2026, 22:04 ou 05/07, 22:04.
  // Não usar new Date aqui, porque o JavaScript interpreta 05/07 como mês/dia.
  const brMatch = normalized.match(
    /^(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?(?:,?\s+(\d{1,2}):(\d{2}))?/
  );

  if (brMatch) {
    const [, dayRaw, monthRaw, hourRaw, minuteRaw] = brMatch;
    const day = dayRaw.padStart(2, '0');
    const month = monthRaw.padStart(2, '0');
    const hour = hourRaw?.padStart(2, '0');
    const minute = minuteRaw;

    return hour && minute ? `${day}/${month}, ${hour}:${minute}` : `${day}/${month}`;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}, ${hour}:${minute}`;
}

function getStepState(status: StatusPedido, step: StatusPedido): 'done' | 'current' | 'pending' | 'cancelled' {
  if (status === 'CANCELADO') return 'cancelled';

  const currentIndex = statusSteps.indexOf(status);
  const stepIndex = statusSteps.indexOf(step);

  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export function OrderStatusCard({ pedido, loading, message, onRefresh, onClear }: OrderStatusCardProps) {
  if (!pedido) {
    return (
      <section className="order-status-card empty-status" aria-label="Acompanhar pedido">
        <div className="order-status-title">
          <Clock3 size={18} />
          <div>
            <span>Acompanhar pedido</span>
            <strong>Nenhum pedido recente</strong>
          </div>
        </div>
        <p>Finalize um pedido para acompanhar o preparo e a entrega por aqui.</p>
      </section>
    );
  }

  const total = toNumber(pedido.valorTotal ?? pedido.total);
  const status = pedido.status;

  return (
    <section className={`order-status-card status-${status.toLowerCase()}`} aria-label="Acompanhar pedido">
      <div className="order-status-title">
        {status === 'CANCELADO' ? <XCircle size={19} /> : <PackageCheck size={19} />}
        <div>
          <span>Acompanhar pedido</span>
          <strong>Pedido #{pedido.id}</strong>
        </div>
      </div>

      <div className="order-status-summary">
        <div>
          <span>Status</span>
          <strong>{statusLabels[status] ?? status}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div>
          <span>Data</span>
          <strong>{formatDate(pedido.dataCriacao ?? pedido.dataPedido)}</strong>
        </div>
      </div>

      {status !== 'CANCELADO' ? (
        <div className="order-progress" aria-label="Progresso do pedido">
          {statusSteps.map((step) => {
            const state = getStepState(status, step);
            return (
              <div className={`progress-step ${state}`} key={step}>
                <span>{state === 'done' ? <CheckCircle2 size={14} /> : null}</span>
                <small>{statusLabels[step]}</small>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="order-cancelled-warning">Este pedido foi cancelado pela administração.</div>
      )}

      {message && <div className="order-status-message">{message}</div>}

      <div className="order-status-actions">
        <button type="button" className="refresh-order-button" onClick={onRefresh} disabled={loading}>
          <RefreshCcw size={15} />
          {loading ? 'Atualizando...' : 'Atualizar status'}
        </button>
        <button type="button" className="clear-order-button" onClick={onClear}>
          Limpar
        </button>
      </div>
    </section>
  );
}
