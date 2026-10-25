from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

# ==========================================
# AUTH SCHEMAS
# ==========================================

class CustomerRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(..., min_length=10, max_length=15)
    email: str = Field(..., pattern=EMAIL_REGEX)
    password: str = Field(..., min_length=6)
    delivery_address: str = Field(..., min_length=5)
    village_town: str = Field(..., min_length=2)
    district: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    pincode: Optional[str] = "500001"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MerchantRegister(BaseModel):
    farm_or_shop_name: str = Field(..., min_length=2, max_length=100)
    contact_person: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(..., min_length=10, max_length=15)
    email: str = Field(..., pattern=EMAIL_REGEX)
    password: str = Field(..., min_length=6)
    farm_address: str = Field(..., min_length=5)
    village: str = Field(..., min_length=2)
    district: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    categories_offered: Optional[str] = "Vegetables, Fruits"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    business_document_note: Optional[str] = None


class LoginRequest(BaseModel):
    identifier: str  # Email or Mobile
    password: str
    role: Optional[str] = None  # customer, merchant, management
    remember_me: Optional[bool] = False


class DemoOTPRequest(BaseModel):
    mobile: str
    role: Optional[str] = "customer"


class DemoOTPVerify(BaseModel):
    mobile: str
    otp: str
    role: Optional[str] = "customer"


class DemoEmailVerifyRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)


class DemoEmailVerifyConfirm(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)
    code: str


class ForgotPasswordRequest(BaseModel):
    identifier: str  # Email or Mobile
    new_password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ==========================================
# ADDRESS SCHEMAS
# ==========================================

class AddressBase(BaseModel):
    label: str = "Home"
    recipient_name: str
    mobile: str
    address_line: str
    village_town: str
    district: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# CATEGORY SCHEMAS
# ==========================================

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PRODUCT SCHEMAS
# ==========================================

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: int
    image_url: Optional[str] = None
    price_per_unit: float = Field(..., gt=0)
    unit_type: str  # kg, 500 g, bunch, piece, litre, bag
    stock_quantity: float = Field(..., ge=0)
    farm_location: str
    harvest_date: Optional[str] = None
    is_featured: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    price_per_unit: Optional[float] = Field(None, gt=0)
    unit_type: Optional[str] = None
    stock_quantity: Optional[float] = Field(None, ge=0)
    farm_location: Optional[str] = None
    harvest_date: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    merchant_id: int
    is_active: bool
    created_at: datetime
    merchant_name: Optional[str] = None
    merchant_farm: Optional[str] = None
    category_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# CART SCHEMAS
# ==========================================

class CartItemAdd(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)


class CartItemUpdate(BaseModel):
    quantity: float = Field(..., gt=0)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product: ProductResponse
    quantity: float
    line_total: float

    model_config = ConfigDict(from_attributes=True)


class CartSummaryResponse(BaseModel):
    items: List[CartItemResponse]
    item_count: int
    subtotal: float
    delivery_fee: float
    discount: float
    total: float
    free_delivery_threshold: float
    amount_needed_for_free_delivery: float


# ==========================================
# ORDER SCHEMAS
# ==========================================

class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    unit_type: str
    unit_price: float
    quantity: float
    line_total: float
    merchant_id: int

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    address_id: Optional[int] = None
    manual_address: Optional[AddressBase] = None
    delivery_slot: str = "Standard Morning (7:00 AM - 10:00 AM)"
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    delivery_address: dict
    delivery_slot: str
    subtotal: float
    delivery_fee: float
    discount: float
    total_amount: float
    status: str
    notes: Optional[str]
    created_at: datetime
    items: List[OrderItemResponse]
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


# ==========================================
# PAYMENT SCHEMAS
# ==========================================

class DemoPaymentInitiate(BaseModel):
    order_id: int
    payment_method: str  # UPI, CARD, COD
    upi_vpa: Optional[str] = None
    card_holder_name: Optional[str] = None
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvv: Optional[str] = None
    simulate_failure: bool = False  # Allows testing payment failure scenario


class DemoPaymentResponse(BaseModel):
    id: int
    order_id: int
    order_number: str
    payment_method: str
    transaction_ref: str
    amount: float
    status: str  # SUCCESS, FAILED, PENDING
    payment_details: Optional[dict] = None
    error_message: Optional[str] = None
    is_demo: bool = True
    demo_disclaimer: str = "DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# MANAGEMENT SCHEMAS
# ==========================================

class AdminOverviewStats(BaseModel):
    total_customers: int
    total_merchants: int
    pending_merchants: int
    total_products: int
    total_orders: int
    total_revenue: float
    completed_orders: int
    cancelled_orders: int


class MerchantVerificationUpdate(BaseModel):
    verification_status: str  # approved, rejected, pending
    rejection_reason: Optional[str] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class DeliverySettingsUpdate(BaseModel):
    base_delivery_fee: Optional[float] = None
    free_delivery_threshold: Optional[float] = None
    estimated_hours: Optional[int] = None
    platform_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
