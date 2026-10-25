import os
os.environ["TESTING"] = "true"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import User, Category, Product, CustomerProfile, MerchantProfile, Address, DeliverySetting
from app.auth import get_password_hash

# Isolated in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    # Initial delivery setting
    setting = DeliverySetting(
        base_delivery_fee=30.0,
        free_delivery_threshold=300.0,
        estimated_hours=24
    )
    session.add(setting)

    # Categories
    cat1 = Category(name="Vegetables", slug="vegetables", description="Fresh vegetables")
    cat2 = Category(name="Fruits", slug="fruits", description="Fresh fruits")
    session.add(cat1)
    session.add(cat2)
    session.flush()

    # Admin User
    admin = User(
        email="admin@test.com",
        mobile="9999999999",
        password_hash=get_password_hash("admin123"),
        full_name="Admin Office",
        role="management",
        is_active=True,
        is_verified=True
    )
    session.add(admin)

    # Farmer Merchant
    farmer = User(
        email="farmer@test.com",
        mobile="8888888888",
        password_hash=get_password_hash("farmer123"),
        full_name="Farmer Ramesh",
        role="merchant",
        is_active=True,
        is_verified=True
    )
    session.add(farmer)
    session.flush()

    f_profile = MerchantProfile(
        user_id=farmer.id,
        farm_or_shop_name="Ramesh Farms",
        contact_person="Farmer Ramesh",
        farm_address="Field 10",
        village="Shadnagar",
        district="Rangareddy",
        state="Telangana",
        verification_status="approved"
    )
    session.add(f_profile)

    # Customer User
    customer = User(
        email="customer@test.com",
        mobile="7777777777",
        password_hash=get_password_hash("customer123"),
        full_name="Ananya Sharma",
        role="customer",
        is_active=True,
        is_verified=True
    )
    session.add(customer)
    session.flush()

    c_profile = CustomerProfile(
        user_id=customer.id,
        default_address="House 12",
        village_town="Shadnagar",
        district="Rangareddy",
        state="Telangana"
    )
    session.add(c_profile)

    addr = Address(
        user_id=customer.id,
        label="Home",
        recipient_name="Ananya Sharma",
        mobile="7777777777",
        address_line="House 12",
        village_town="Shadnagar",
        district="Rangareddy",
        state="Telangana",
        pincode="509216",
        is_default=True
    )
    session.add(addr)

    # Initial Product
    prod = Product(
        merchant_id=farmer.id,
        category_id=cat1.id,
        name="Fresh Tomatoes",
        description="Juicy red country tomatoes",
        price_per_unit=30.0,
        unit_type="kg",
        stock_quantity=50.0,
        farm_location="Shadnagar",
        is_active=True,
        is_featured=True
    )
    session.add(prod)
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
