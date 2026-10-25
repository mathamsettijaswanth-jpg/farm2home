import {
  User, Address, Category, Product, CartSummary,
  Order, DemoPayment, AdminStats, DeliverySettings
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export const getStoredToken = (): string | null => {
  return localStorage.getItem('farm2home_token');
};

export const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('farm2home_token', token);
  } else {
    localStorage.removeItem('farm2home_token');
  }
};

async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  token?: string | null
): Promise<T> {
  const currentToken = token !== undefined ? token : getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = isJson && data.detail ? data.detail : `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  registerCustomer: (data: any) => apiRequest<{ access_token: string; user: User }>('/auth/register/customer', 'POST', data),
  registerMerchant: (data: any) => apiRequest<{ access_token: string; user: User }>('/auth/register/merchant', 'POST', data),
  login: (data: { identifier: string; password: string; role?: string; remember_me?: boolean }) =>
    apiRequest<{ access_token: string; user: User }>('/auth/login', 'POST', data),
  sendDemoOtp: (mobile: string, role?: string) =>
    apiRequest<{ success: boolean; message: string; demo_code: string }>('/auth/otp/send', 'POST', { mobile, role }),
  verifyDemoOtp: (mobile: string, otp: string, role?: string) =>
    apiRequest<{ access_token: string; user: User }>('/auth/otp/verify', 'POST', { mobile, otp, role }),
  sendDemoEmailVerify: (email: string) =>
    apiRequest<{ success: boolean; message: string; demo_code: string }>('/auth/email/verify/send', 'POST', { email }),
  confirmDemoEmail: (email: string, code: string) =>
    apiRequest<{ success: boolean; message: string }>('/auth/email/verify/confirm', 'POST', { email, code }),
  forgotPassword: (identifier: string, new_password: string) =>
    apiRequest<{ success: boolean; message: string }>('/auth/forgot-password', 'POST', { identifier, new_password }),
  getMe: (token?: string) => apiRequest<User>('/auth/me', 'GET', undefined, token),
  logout: () => apiRequest<{ success: boolean }>('/auth/logout', 'POST'),

  // Products & Categories
  getCategories: () => apiRequest<Category[]>('/products/categories/all'),
  getProducts: (params?: { category?: string; search?: string; min_price?: number; max_price?: number; in_stock_only?: boolean; featured_only?: boolean; merchant_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.min_price !== undefined) query.append('min_price', params.min_price.toString());
    if (params?.max_price !== undefined) query.append('max_price', params.max_price.toString());
    if (params?.in_stock_only) query.append('in_stock_only', 'true');
    if (params?.featured_only) query.append('featured_only', 'true');
    if (params?.merchant_id) query.append('merchant_id', params.merchant_id.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<Product[]>(`/products${qs}`);
  },
  getProductDetails: (id: number) => apiRequest<Product>(`/products/${id}`),
  createProduct: (data: any) => apiRequest<Product>('/products', 'POST', data),
  updateProduct: (id: number, data: any) => apiRequest<Product>(`/products/${id}`, 'PUT', data),
  deleteProduct: (id: number) => apiRequest<{ success: boolean; message: string }>(`/products/${id}`, 'DELETE'),
  getMyProducts: () => apiRequest<Product[]>('/products/merchant/my-products'),

  // Cart
  getCart: () => apiRequest<CartSummary>('/cart'),
  addToCart: (product_id: number, quantity: number) =>
    apiRequest<CartSummary>('/cart/items', 'POST', { product_id, quantity }),
  updateCartItem: (item_id: number, quantity: number) =>
    apiRequest<CartSummary>(`/cart/items/${item_id}`, 'PUT', { quantity }),
  removeCartItem: (item_id: number) =>
    apiRequest<CartSummary>(`/cart/items/${item_id}`, 'DELETE'),
  clearCart: () => apiRequest<{ success: boolean }>('/cart/clear', 'DELETE'),

  // Orders & Checkout
  checkout: (data: { address_id?: number; manual_address?: any; delivery_slot?: string; notes?: string }) =>
    apiRequest<Order>('/orders/checkout', 'POST', data),
  getMyOrders: () => apiRequest<Order[]>('/orders'),
  getOrderDetails: (id: number) => apiRequest<Order>(`/orders/${id}`),
  cancelOrder: (id: number) => apiRequest<{ success: boolean; message: string; status: string }>(`/orders/${id}/cancel`, 'POST'),

  // Payments (Demo Simulator)
  simulatePayment: (data: {
    order_id: number;
    payment_method: 'UPI' | 'CARD' | 'COD';
    upi_vpa?: string;
    card_number?: string;
    card_expiry?: string;
    card_cvv?: string;
    simulate_failure?: boolean;
  }) => apiRequest<DemoPayment>('/payments/simulate', 'POST', data),
  getOrderPayment: (order_id: number) => apiRequest<DemoPayment>(`/payments/order/${order_id}`),

  // Customers & Addresses
  getAddresses: () => apiRequest<Address[]>('/customers/addresses'),
  addAddress: (data: any) => apiRequest<Address>('/customers/addresses', 'POST', data),
  updateAddress: (id: number, data: any) => apiRequest<Address>(`/customers/addresses/${id}`, 'PUT', data),
  deleteAddress: (id: number) => apiRequest<{ success: boolean }>(`/customers/addresses/${id}`, 'DELETE'),
  setDefaultAddress: (id: number) => apiRequest<{ success: boolean }>(`/customers/addresses/${id}/default`, 'POST'),
  reverseGeocode: (latitude: number, longitude: number) =>
    apiRequest<{
      latitude: number;
      longitude: number;
      village_town: string;
      district: string;
      state: string;
      pincode: string;
      formatted_address: string;
    }>('/customers/location/reverse-geocode', 'POST', { latitude, longitude }),

  // Merchants
  getMerchantProfile: () => apiRequest<any>('/merchants/profile'),
  updateMerchantProfile: (data: any) => apiRequest<any>('/merchants/profile', 'PUT', data),
  getMerchantStats: () => apiRequest<any>('/merchants/stats'),
  getMerchantOrders: () => apiRequest<any[]>('/merchants/orders'),
  updateMerchantOrderStatus: (order_id: number, status: string, notes?: string) =>
    apiRequest<any>(`/merchants/orders/${order_id}/status`, 'PUT', { status, notes }),

  // Management / Admin
  getAdminStats: () => apiRequest<AdminStats>('/management/stats'),
  getAdminCustomers: () => apiRequest<any[]>('/management/customers'),
  getAdminMerchants: () => apiRequest<any[]>('/management/merchants'),
  updateMerchantVerification: (merchant_id: number, verification_status: string, rejection_reason?: string) =>
    apiRequest<any>(`/management/merchants/${merchant_id}/verification`, 'PUT', { verification_status, rejection_reason }),
  toggleUserStatus: (user_id: number, is_active: boolean) =>
    apiRequest<any>(`/management/users/${user_id}/status`, 'PUT', { is_active }),
  getAdminOrders: () => apiRequest<Order[]>('/management/orders'),
  getAdminPayments: () => apiRequest<any[]>('/management/payments'),
  getDeliverySettings: () => apiRequest<DeliverySettings>('/management/delivery-settings'),
  updateDeliverySettings: (data: any) => apiRequest<any>('/management/delivery-settings', 'PUT', data),
  moderateDeleteProduct: (product_id: number) =>
    apiRequest<{ success: boolean; message: string }>(`/management/products/${product_id}`, 'DELETE'),
  createCategory: (data: { name: string; slug: string; description?: string; icon?: string }) =>
    apiRequest<Category>('/management/categories', 'POST', data),
};
