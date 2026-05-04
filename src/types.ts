export enum OrderStatus {
  NEW = 'NEW',
  DESIGN = 'DESIGN',
  PRODUCTION = 'PRODUCTION',
  READY = 'READY',
  DELIVERED = 'DELIVERED'
}

export enum OrderType {
  NORMAL = 'normal',
  CUSTOM = 'custom'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  instagram?: string;
  email?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStockThreshold: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  size: string;
  details?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  type: OrderType;
  status: OrderStatus;
  totalAmount: number;
  orderDate: string;
  estimatedDeliveryDate: string;
  customDesignUrl?: string;
  notes?: string;
  items: OrderItem[];
  lastStatusUpdate: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone: string;
  email?: string;
  category: string;
  createdAt: string;
}
