import { v4 as uuid } from 'uuid';
import {
  ShoppingCartEvent,
  getShoppingCart,
  toShoppingCartStreamName,
} from './shopping-carts/shoppingCart';
import { getEventStore } from '#core/streams';
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';

enum ProductsId {
  SHOES = 'air-jordan',
  SHIRT = 'croc-tshirt',
}

async function generateEventStream(
  eventStore: EventStoreDBClient,
  shoppingCartId: string,
) {
  const clientId = 'client-123';
  const streamName = toShoppingCartStreamName(shoppingCartId);

  const events: ShoppingCartEvent[] = [
    {
      type: 'shopping-cart-opened',
      data: { shoppingCartId, clientId, openedAt: new Date().toJSON() },
    },
    {
      type: 'product-item-added-to-shopping-cart',
      data: {
        shoppingCartId,
        productItem: {
          productId: ProductsId.SHIRT,
          quantity: 1,
        },
      },
    },
    {
      type: 'product-item-added-to-shopping-cart',
      data: {
        shoppingCartId,
        productItem: {
          productId: ProductsId.SHOES,
          quantity: 3,
        },
      },
    },
    {
      type: 'product-item-removed-from-shopping-cart',
      data: {
        shoppingCartId,
        productItem: {
          productId: ProductsId.SHOES,
          quantity: 1,
        },
      },
    },
    {
      type: 'shopping-cart-confirmed',
      data: {
        shoppingCartId,
        confirmedAt: new Date().toJSON(),
      },
    },
  ];

  // apend events to a stream
  await eventStore.appendToStream<ShoppingCartEvent>(
    streamName,
    events.map((e) => jsonEvent<ShoppingCartEvent>(e)),
  );
}

async function projectStream(
  eventStore: EventStoreDBClient,
  shoppingCartId: string,
) {
  const streamName = toShoppingCartStreamName(shoppingCartId);
  // read stream
  const shoppingCartStream =
    eventStore.readStream<ShoppingCartEvent>(streamName);

  const cart = await getShoppingCart(shoppingCartStream);

  return cart;
}

async function execute() {
  const shoppingCartId = `cart-${uuid()}`;
  const eventStore = getEventStore();
  await generateEventStream(eventStore, shoppingCartId);

  const result = await projectStream(eventStore, shoppingCartId);
  return result;
}

execute()
  .then((result) => console.log(result))
  .catch((err) => console.log(err));
