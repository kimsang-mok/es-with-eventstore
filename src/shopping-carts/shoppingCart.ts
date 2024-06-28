import { JSONEventType } from '@eventstore/db-client';
import { ProductItem, addProductItem, removeProductItem } from './productItem';
import { StreamAggregator } from '#core/streams';

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
  { shoppingCartId: string; confirmedAt: string }
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

export const toShoppingCartStreamName = (shoppingCartId: string) => {
  // esdb pattern: we need to specify category which is our entity name
  return `shopping_cart-${shoppingCartId}`;
};

export const getShoppingCart = StreamAggregator<
  ShoppingCart,
  ShoppingCartEvent
>((currentState, event) => {
  if (event.type === 'shopping-cart-opened') {
    if (currentState != null) throw new Error('Cart has already been opened');

    return {
      id: event.data.shoppingCartId,
      clientId: event.data.clientId,
      openedAt: new Date(event.data.openedAt),
      productItems: [],
      status: ShoppingCartStatus.Opened,
    };
  }

  if (currentState == null) throw new Error('Shopping cart not found');

  switch (event.type) {
    case 'product-item-added-to-shopping-cart':
      return {
        ...currentState,
        productItems: addProductItem(
          currentState.productItems,
          event.data.productItem,
        ),
      };
    case 'product-item-removed-from-shopping-cart':
      return {
        ...currentState,
        productItems: removeProductItem(
          currentState.productItems,
          event.data.productItem,
        ),
      };
    case 'shopping-cart-confirmed':
      return {
        ...currentState,
        status: ShoppingCartStatus.Confirmed,
        confirmedAt: new Date(event.data.confirmedAt),
      };
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = event;
      throw new Error('Unknown event type');
  }
});
