export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  /** The size and colour chosen on the product page (informational; orders don't record them yet). */
  size?: string;
  color?: string;
}
