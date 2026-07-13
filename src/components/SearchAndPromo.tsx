import { Search } from 'lucide-react';

type SearchAndPromoProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function SearchAndPromo({ search, onSearchChange }: SearchAndPromoProps) {
  return (
    <div className="tools-row">
      <label className="search-box">
        <span className="sr-only">Pesquisar no cardápio</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filtrar por lanche, bebida ou sobremesa..."
        />
        <button type="button" aria-label="Pesquisar">
          <Search size={18} />
        </button>
      </label>

      <article className="promo-banner" aria-label="Promoção da semana">
        <span className="promo-emoji">🍟</span>
        <div>
          <strong>Combo da semana</strong>
          <p>Double Burger + batata + bebida por apenas R$ 20,00</p>
        </div>
        <span className="promo-emoji burger">🍔</span>
      </article>
    </div>
  );
}
