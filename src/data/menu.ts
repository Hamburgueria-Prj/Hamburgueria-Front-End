export type Category = 'HAMBURGUER' | 'BEBIDA' | 'ACOMPANHAMENTO' | 'SOBREMESA';

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: Category;
  image: string;
  tag?: string;
  fromBackend?: boolean;
};

export const categories: { id: Category; label: string }[] = [
  { id: 'HAMBURGUER', label: 'Hambúrgueres' },
  { id: 'ACOMPANHAMENTO', label: 'Acompanhamentos' },
  { id: 'BEBIDA', label: 'Bebidas' },
  { id: 'SOBREMESA', label: 'Sobremesas' }
];

export const categoryLabels: Record<Category, string> = {
  HAMBURGUER: 'Hambúrgueres',
  ACOMPANHAMENTO: 'Acompanhamentos',
  BEBIDA: 'Bebidas',
  SOBREMESA: 'Sobremesas'
};

export const fallbackImages: Record<Category, string> = {
  HAMBURGUER: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  ACOMPANHAMENTO: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
  BEBIDA: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80',
  SOBREMESA: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80'
};

export function imageForProduct(name: string, category: Category): string {
  const normalized = name.toLowerCase();

  if (normalized.includes('bbq') || normalized.includes('defumado')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80';
  }

  if (normalized.includes('frango')) {
    return 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80';
  }

  if (normalized.includes('veggie') || normalized.includes('vegetal')) {
    return 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80';
  }

  if (normalized.includes('batata') || normalized.includes('frita')) {
    return fallbackImages.ACOMPANHAMENTO;
  }

  if (normalized.includes('shake') || normalized.includes('chocolate')) {
    return fallbackImages.SOBREMESA;
  }

  if (normalized.includes('limonada') || normalized.includes('refri') || normalized.includes('suco')) {
    return fallbackImages.BEBIDA;
  }

  return fallbackImages[category];
}

export const demoMenuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Cheeseburger Clássico',
    description: 'Blend bovino, cheddar, alface, tomate e molho da casa.',
    price: 11.99,
    rating: 5,
    category: 'HAMBURGUER',
    tag: 'Mais vendido',
    image: imageForProduct('Cheeseburger Clássico', 'HAMBURGUER')
  },
  {
    id: 2,
    name: 'Burger BBQ Defumado',
    description: 'Carne artesanal, bacon crocante, cheddar e barbecue defumado.',
    price: 14.5,
    rating: 5,
    category: 'HAMBURGUER',
    tag: 'Especial',
    image: imageForProduct('Burger BBQ Defumado', 'HAMBURGUER')
  },
  {
    id: 3,
    name: 'Sanduíche de Frango Crocante',
    description: 'Frango empanado, maionese temperada, picles e salada.',
    price: 12.5,
    rating: 4.5,
    category: 'HAMBURGUER',
    image: imageForProduct('Sanduíche de Frango Crocante', 'HAMBURGUER')
  },
  {
    id: 4,
    name: 'Veggie Deluxe',
    description: 'Hambúrguer vegetal, queijo, salada fresca e molho especial.',
    price: 13,
    rating: 4.5,
    category: 'HAMBURGUER',
    image: imageForProduct('Veggie Deluxe', 'HAMBURGUER')
  },
  {
    id: 5,
    name: 'Batata Frita Carregada',
    description: 'Batata crocante com cheddar cremoso, bacon e molho ranch.',
    price: 6,
    rating: 5,
    category: 'ACOMPANHAMENTO',
    tag: 'Para dividir',
    image: imageForProduct('Batata Frita Carregada', 'ACOMPANHAMENTO')
  },
  {
    id: 6,
    name: 'Milkshake de Chocolate',
    description: 'Milkshake cremoso com chocolate, chantilly e calda artesanal.',
    price: 7.5,
    rating: 5,
    category: 'SOBREMESA',
    image: imageForProduct('Milkshake de Chocolate', 'SOBREMESA')
  },
  {
    id: 7,
    name: 'Limonada da Casa',
    description: 'Limão fresco, hortelã, gelo e toque cítrico.',
    price: 4.9,
    rating: 4,
    category: 'BEBIDA',
    image: imageForProduct('Limonada da Casa', 'BEBIDA')
  }
];
