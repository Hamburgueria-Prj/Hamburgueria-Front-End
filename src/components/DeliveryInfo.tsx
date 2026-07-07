import { Clock3, CreditCard, MapPin } from 'lucide-react';

export function DeliveryInfo() {
  return (
    <section className="delivery-info" aria-label="Informações do pedido">
      <div>
        <Clock3 size={18} />
        <span>Entrega estimada:</span>
        <strong>30–45 min</strong>
      </div>
      <div>
        <CreditCard size={18} />
        <span>Pagamento:</span>
        <strong>cartão, Pix ou dinheiro</strong>
      </div>
      <div>
        <MapPin size={18} />
        <span>Retirada:</span>
        <strong>balcão disponível</strong>
      </div>
    </section>
  );
}
