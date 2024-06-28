export type ProductItem = {
  productId: string;
  quantity: number;
};

export const findProductItem = (
  productItems: ProductItem[],
  productId: string,
): ProductItem | undefined => {
  return productItems.find((item) => item.productId === productId);
};

export const addProductItem = (
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

export const removeProductItem = (
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

export const assertProductItemExists = (
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
