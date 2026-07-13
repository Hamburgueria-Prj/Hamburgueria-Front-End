import { type MenuItem } from '../data/menu';
import { ProductCard } from './ProductCard';

type MenuGridProps = {
  items: MenuItem[];
  loading: boolean;
  onAddToCart: (item: MenuItem) => void;
};

export function MenuGrid({ items, loading, onAddToCart }: MenuGridProps) {
  return (
    <section id="cardapio" className="menu-section">
      <div className="section-title">
        <span>Cardápio digital</span>
        <h2>Escolha seu pedido</h2>
      </div>

      {loading ? (
        <div className="empty-menu">
          <strong>Carregando produtos...</strong>
          <p>Preparando o cardápio atualizado para você.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-menu">
          <strong>Nenhum item encontrado.</strong>
          <p>Tente pesquisar outro nome ou selecione outra categoria.</p>
        </div>
      ) : (
        <div className="menu-grid">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </section>
  );
}
