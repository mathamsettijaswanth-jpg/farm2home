import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(30), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="customer")  # customer, merchant, management
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    merchant_profile = relationship("MerchantProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="merchant", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    default_address = Column(Text, nullable=True)
    village_town = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True)
    state = Column(String(255), nullable=True)
    preferred_delivery_slot = Column(String(100), nullable=True, default="Morning (7:00 AM - 10:00 AM)")

    user = relationship("User", back_populates="customer_profile")


class MerchantProfile(Base):
    __tablename__ = "merchant_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    farm_or_shop_name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    farm_address = Column(Text, nullable=False)
    village = Column(String(255), nullable=False)
    district = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    categories_offered = Column(Text, nullable=True)  # Comma-separated or JSON string
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    verification_status = Column(String(50), default="pending")  # pending, approved, rejected
    rejection_reason = Column(Text, nullable=True)
    business_document_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="merchant_profile")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(50), default="Home")  # Home, Farm, Work, Other
    recipient_name = Column(String(255), nullable=False)
    mobile = Column(String(30), nullable=False)
    address_line = Column(Text, nullable=False)
    village_town = Column(String(255), nullable=False)
    district = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    pincode = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="addresses")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    price_per_unit = Column(Float, nullable=False)
    unit_type = Column(String(50), nullable=False)  # kg, 500 g, bunch, piece, litre, bag
    stock_quantity = Column(Float, nullable=False, default=0.0)
    farm_location = Column(String(255), nullable=False)
    harvest_date = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    merchant = relationship("User", back_populates="products")
    category = relationship("Category", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    delivery_address_json = Column(Text, nullable=False)
    delivery_slot = Column(String(100), nullable=False, default="Standard Delivery")
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, nullable=False, default=0.0)
    discount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False)
    status = Column(
        String(50),
        nullable=False,
        default="Pending"
    )  # Pending, Confirmed, Accepted by Seller, Packed, Out for Delivery, Delivered, Cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    customer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    merchant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(255), nullable=False)
    unit_type = Column(String(50), nullable=False)
    unit_price = Column(Float, nullable=False)  # snapshot of price
    quantity = Column(Float, nullable=False)
    line_total = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    payment_method = Column(String(50), nullable=False)  # UPI, CARD, COD
    transaction_ref = Column(String(100), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="PENDING")  # SUCCESS, FAILED, PENDING, REFUNDED
    payment_details_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="payment")


class MerchantVerification(Base):
    __tablename__ = "merchant_verifications"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False)  # Kisan Credit Card, Aadhaar, Land Record, Trade License
    document_number = Column(String(100), nullable=False)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DeliverySetting(Base):
    __tablename__ = "delivery_settings"

    id = Column(Integer, primary_key=True, index=True)
    base_delivery_fee = Column(Float, default=30.0)
    free_delivery_threshold = Column(Float, default=300.0)
    estimated_hours = Column(Integer, default=24)
    is_active = Column(Boolean, default=True)
    platform_name = Column(String(100), default="Farm2Home")
    contact_phone = Column(String(50), default="+91 98765 43210")
    contact_email = Column(String(100), default="support@farm2home.org")
