export type UserRole = 'customer' | 'merchant' | 'management';

export interface CustomerProfile {
  village_town?: string;
  district?: string;
  state?: string;
  default_address?: string;
  preferred_delivery_slot?: string;
}

export interface MerchantProfile {
  farm_or_shop_name: string;
  contact_person: string;
  farm_address: string;
  village: string;
  district: string;
  state: string;
  categories_offered?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  latitude?: number;
  longitude?: number;
  business_document_note?: string;
}

export interface User {
  id: number;
  email: string;
  mobile: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  customer_profile?: CustomerProfile;
  merchant_profile?: MerchantProfile;
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  recipient_name: string;
  mobile: string;
  address_line: string;
  village_town: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Product {
  id: number;
  merchant_id: number;
  category_id: number;
  name: string;
  description?: string;
  image_url: string;
  price_per_unit: number;
  unit_type: string; // kg, 500 g, bunch, piece, litre, bag
  min_order_quantity: number; // minimum quantity required (e.g. 10 kg)
  stock_quantity: number;
  farm_location: string;
  harvest_date?: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  merchant_name?: string;
  merchant_farm?: string;
  category_name?: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  line_total: number;
}

export interface CartSummary {
  items: CartItem[];
  item_count: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  free_delivery_threshold: number;
  amount_needed_for_free_delivery: number;
}

export interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  unit_type: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  merchant_id: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  delivery_address: any;
  delivery_slot: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
  status: 'Pending' | 'Confirmed' | 'Accepted by Seller' | 'Packed' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  notes?: string;
  created_at: string;
  items: OrderItem[];
  payment_status?: string;
  payment_method?: string;
}

export interface MarketPriceItem {
  name: string;
  wholesale_price: number;
  retail_price_range: string;
  unit: string;
  image_url?: string;
  category?: string;
  state: string;
  source?: string;
}

export interface MarketPriceResponse {
  state: string;
  market: string;
  date: string;
  source_url: string;
  total_items: number;
  items: MarketPriceItem[];
  cached?: boolean;
}

export interface DemoPayment {
  id: number;
  order_id: number;
  order_number: string;
  payment_method: 'UPI' | 'CARD' | 'COD';
  transaction_ref: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  payment_details?: any;
  error_message?: string;
  is_demo: boolean;
  demo_disclaimer: string;
  created_at: string;
}

export interface AdminStats {
  total_customers: number;
  total_merchants: number;
  pending_merchants: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  cancelled_orders: number;
}

export interface DeliverySettings {
  id: number;
  base_delivery_fee: number;
  free_delivery_threshold: number;
  estimated_hours: number;
  is_active: boolean;
  platform_name: string;
  contact_phone: string;
  contact_email: string;
}
