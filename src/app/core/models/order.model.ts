export type OrderStatus = 'Pending' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  shippingAddress: ShippingAddress;
  items: OrderLine[];
}

export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
}
