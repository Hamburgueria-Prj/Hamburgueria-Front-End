import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="hero-card">
      <div className="hero-overlay" />
      <div className="hero-copy">
        <span className="eyebrow">Feito na brasa • entrega rápida</span>
        <h1>Bateu aquela fome?</h1>
        <p>
          Hambúrguer artesanal, bacon crocante, queijo derretido e molho especial para pedir em poucos cliques.
        </p>
        <a href="#cardapio" className="primary-cta">
          Pedir agora
          <ArrowRight size={18} />
        </a>
      </div>
      <div className="hero-burger" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1000&q=90"
          alt="Hambúrguer artesanal com bacon e queijo"
        />
      </div>
    </section>
  );
}
