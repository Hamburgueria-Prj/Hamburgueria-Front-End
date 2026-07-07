import { Plus } from 'lucide-react';
import { type MenuItem } from '../data/menu';
import { RatingStars } from './RatingStars';
import { formatCurrency } from '../utils/format';

type ProductCardProps = {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
};

export function ProductCard({ item, onAddToCart }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={item.image} alt={item.name} className="product-image" />
        {item.tag && <span className="product-tag">{item.tag}</span>}
      </div>

      <div className="product-content">
        <div>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>

        <div className="product-meta">
          <div>
            <strong>{formatCurrency(item.price)}</strong>
            <RatingStars rating={item.rating} />
          </div>
          <button className="add-button" onClick={() => onAddToCart(item)}>
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}
