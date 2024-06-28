import { JSONEventType } from '@eventstore/db-client';
import { ProductItem } from './productItem';

//<---------------events--------------->//

export type ShoppingCartOpened = JSONEventType<
  'shopping-cart-opened',
  { shoppingCartId: string; clientId: string; openedAt: string }
>;

export type ProductItemAddedToShoppingCart = JSONEventType<
  'product-item-added-to-shopping-cart',
  { shoppingCartId: string; productItem: ProductItem }
>;

export type ProductItemRemovedFromShoppingCart = JSONEventType<
  'product-item-removed-from-shopping-cart',
  { shoppingCartId: string; productItem: ProductItem }
>;

export type ShoppingCartConfirmed = JSONEventType<
  'shopping-cart-confirmed',
  { shoppingCartId: string; confirmedAt: Date }
>;

export type ShoppingCartEvent =
  | ShoppingCartOpened
  | ProductItemAddedToShoppingCart
  | ProductItemRemovedFromShoppingCart
  | ShoppingCartConfirmed;

//<---------------entity--------------->//

export type ShoppingCart = {
  id: string;
  clientId: string;
  status: ShoppingCartStatus;
  productItems: ProductItem[];
  openedAt: Date;
  confirmedAt?: Date;
};

export enum ShoppingCartStatus {
  Opened = 1,
  Confirmed = 2,
  Cancelled = 4,
  Closed = Confirmed | Cancelled,
}
