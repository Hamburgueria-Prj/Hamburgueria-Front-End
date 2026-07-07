import { type MenuItem } from '../data/menu';

export type CartItem = MenuItem & {
  quantity: number;
};
