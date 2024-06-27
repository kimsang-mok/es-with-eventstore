import {
  EventType,
  JSONEventData,
  JSONEventType,
  RecordedEvent,
} from '@eventstore/db-client';

type ProductItem = Readonly<{
  productId: string;
  quantity: number;
}>;

//<---------------events--------------->//

type ShoppingCartOpened = JSONEventType<
  'shopping-cart-opened',
  { shoppingCartId: string; clientId: string; openedAt: string }
>;

type ProductItemAddedToShoppingCart = JSONEventType<
  'product-item-added-to-shopping-cart',
  { shoppingCartId: string; productItem: ProductItem }
>;

type ProductItemRemovedFromShoppingCart = JSONEventType<
  'product-item-removed-from-shopping-cart',
  { shoppingCartId: string; productItem: ProductItem }
>;

type ShoppingCartConfirmed = JSONEventType<
  'shopping-cart-confirmed',
  { shoppingCartId: string; confirmedAt: Date }
>;

type ShoppingCartEvent =
  | ShoppingCartOpened
  | ProductItemAddedToShoppingCart
  | ProductItemRemovedFromShoppingCart
  | ShoppingCartConfirmed;

type ShoppingCart = {
  id: string;
  clientId: string;
  status: ShoppingCartStatus;
  productItems: ProductItem[];
  openedAt: Date;
  confirmedAt?: Date;
};

enum ShoppingCartStatus {
  Opened = 1,
  Confirmed = 2,
  Cancelled = 4,
  Closed = Confirmed | Cancelled,
}

type ApplyEvent<Entity, Event> = (
  currentState: Entity | undefined,
  event: Event,
) => Entity;

const StreamAggregator =
  <Entity, Event>(when: ApplyEvent<Entity, Event>) =>
  (events: Event[]): Entity => {
    let currentState: Entity | undefined = undefined;

    for (const event of events) {
      currentState = when(currentState, event);
    }

    if (currentState == null) throw new Error('Stream not found');

    return currentState;
  };

const getShoppingCart = StreamAggregator<ShoppingCart, ShoppingCartEvent>(
  (currentState, event) => {
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
  },
);

const findProductItem = (
  productItems: ProductItem[],
  productId: string,
): ProductItem | undefined => {
  return productItems.find((item) => item.productId === productId);
};

const addProductItem = (
  productItems: ProductItem[],
  newProductItem: ProductItem,
): ProductItem[] => {
  const { productId, quantity } = newProductItem;

  /**
   * check if the item exists
   * if it does not exist, we simply add the new item
   * otherwise, we just update the quantity of the item
   */
  const currentProductItem = findProductItem(productItems, productId);

  if (!currentProductItem) return [...productItems, newProductItem];

  const newQuantity = currentProductItem.quantity + quantity;
  const mergedProductItem = { productId, quantity: newQuantity };

  return productItems.map((item) =>
    item.productId === productId ? mergedProductItem : item,
  );
};

const removeProductItem = (
  productItems: ProductItem[],
  productItemToBeRemoved: ProductItem,
) => {
  const { productId, quantity } = productItemToBeRemoved;

  const currentProductItem = assertProductItemExists(
    productItems,
    productItemToBeRemoved,
  );

  const newQuantity = currentProductItem.quantity - quantity;

  if (newQuantity === 0) {
    return productItems.filter((item) => item.productId !== productId);
  }

  const mergedProductItem = { productId, quantity: newQuantity };

  return productItems.map((item) =>
    item.productId === productId ? mergedProductItem : item,
  );
};

const assertProductItemExists = (
  productItems: ProductItem[],
  productItemToBeRemoved: ProductItem,
) => {
  const { productId, quantity } = productItemToBeRemoved;

  const currentProductItem = findProductItem(productItems, productId);

  if (!currentProductItem || currentProductItem.quantity < quantity) {
    throw new Error('Product not found or insufficient');
  }

  return currentProductItem;
};
