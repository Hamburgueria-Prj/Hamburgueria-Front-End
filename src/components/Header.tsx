import { ClipboardList, LogOut, Menu, ShieldCheck, ShoppingBag } from 'lucide-react';
import { categories, type Category } from '../data/menu';

type HeaderProps = {
  activeCategory?: Category | 'todos';
  onCategoryChange?: (category: Category | 'todos') => void;
  area: 'cliente' | 'admin';
  onSwitchArea: (area: 'cliente' | 'admin') => void;
  onLogout: () => void;
  canAccessAdmin?: boolean;
};

export function Header({
  activeCategory = 'todos',
  onCategoryChange,
  area,
  onSwitchArea,
  onLogout,
  canAccessAdmin = false
}: HeaderProps) {
  return (
    <header className="topbar">
      <button className="menu-mobile" aria-label="Abrir menu">
        <Menu size={22} />
      </button>

      <button className="brand" onClick={() => onCategoryChange?.('todos')} aria-label="Voltar para início">
        <span className="brand-icon">🍔🔥</span>
        <span>
          <strong>BOCA DE</strong>
          <strong>BRASA</strong>
        </span>
      </button>

      {area === 'cliente' ? (
        <nav className="nav-categories" aria-label="Categorias do cardápio">
          <button className={activeCategory === 'todos' ? 'active' : ''} onClick={() => onCategoryChange?.('todos')}>
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? 'active' : ''}
              onClick={() => onCategoryChange?.(category.id)}
            >
              {category.label}
            </button>
          ))}
        </nav>
      ) : (
        <div className="admin-title-mini">
          <ShieldCheck size={18} />
          <span>Área administrativa</span>
        </div>
      )}

      {(area === 'admin' || canAccessAdmin) && (
        <button className="management-button" onClick={() => onSwitchArea(area === 'cliente' ? 'admin' : 'cliente')}>
          {area === 'cliente' ? <ClipboardList size={17} /> : <ShoppingBag size={17} />}
          <span>{area === 'cliente' ? 'Admin' : 'Cliente'}</span>
        </button>
      )}

      <button className="logout-button" onClick={onLogout} aria-label="Sair do sistema" title="Sair do sistema">
        <LogOut size={18} />
        <span>Sair</span>
      </button>
    </header>
  );
}
