import json
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import (
    User, CustomerProfile, MerchantProfile, Address,
    Category, Product, DeliverySetting
)
from app.auth import get_password_hash


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Category).first():
            print("Database already contains seed data. Skipping re-seed.")
            return

        print("Seeding Farm2Home database...")

        # 1. Delivery settings
        delivery_setting = DeliverySetting(
            base_delivery_fee=30.0,
            free_delivery_threshold=300.0,
            estimated_hours=24,
            is_active=True,
            platform_name="Farm2Home",
            contact_phone="+91 98765 43210",
            contact_email="support@farm2home.org"
        )
        db.add(delivery_setting)

        # 2. Categories
        categories_data = [
            {"name": "Vegetables", "slug": "vegetables", "description": "Farm-fresh daily vegetables", "icon": "Carrot"},
            {"name": "Fruits", "slug": "fruits", "description": "Naturally ripened sweet fruits", "icon": "Apple"},
            {"name": "Leafy vegetables", "slug": "leafy-vegetables", "description": "Crisp greens harvested today", "icon": "Salad"},
            {"name": "Grains and pulses", "slug": "grains-pulses", "description": "Paddy, wheat, lentils, and millets", "icon": "Wheat"},
            {"name": "Spices", "slug": "spices", "description": "Aromatic natural country spices", "icon": "Flame"},
            {"name": "Other farm products", "slug": "other-farm-products", "description": "Jaggery, country honey, cold-pressed oils", "icon": "Sparkles"}
        ]

        categories_map = {}
        for cat in categories_data:
            c = Category(**cat)
            db.add(c)
            db.flush()
            categories_map[c.slug] = c.id

        # 3. Demo Users
        # Admin / Management
        admin_user = User(
            email="admin@farm2home.org",
            mobile="9876543219",
            password_hash=get_password_hash("admin123"),
            full_name="Farm2Home Admin Office",
            role="management",
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)
        db.flush()

        # Merchant 1: Farmer Ramesh (Kisan)
        farmer_user = User(
            email="farmer@farm2home.org",
            mobile="9876543211",
            password_hash=get_password_hash("farmer123"),
            full_name="Ramesh Patel (Kisan)",
            role="merchant",
            is_active=True,
            is_verified=True
        )
        db.add(farmer_user)
        db.flush()

        farmer_profile = MerchantProfile(
            user_id=farmer_user.id,
            farm_or_shop_name="Green Acres Organic Farm",
            contact_person="Ramesh Patel",
            farm_address="Survey No. 45, Near Krishna Canal",
            village="Guntur Rural",
            district="Guntur",
            state="Andhra Pradesh",
            categories_offered="Vegetables, Leafy vegetables, Spices",
            latitude=16.306,
            longitude=80.436,
            verification_status="approved",
            business_document_note="Kisan Credit Card Verified (KCC-2024-8831)"
        )
        db.add(farmer_profile)

        # Merchant 2: Lakshmi Agro Fresh
        farmer2_user = User(
            email="merchant@farm2home.org",
            mobile="9876543212",
            password_hash=get_password_hash("farmer123"),
            full_name="Lakshmi Devi (Fruit Orchards)",
            role="merchant",
            is_active=True,
            is_verified=True
        )
        db.add(farmer2_user)
        db.flush()

        farmer2_profile = MerchantProfile(
            user_id=farmer2_user.id,
            farm_or_shop_name="Lakshmi Devi Orchards & Grains",
            contact_person="Lakshmi Devi",
            farm_address="Hillside Mango & Citrus Farms",
            village="Nuzvid Mandi",
            district="Eluru",
            state="Andhra Pradesh",
            categories_offered="Fruits, Grains and pulses",
            latitude=16.785,
            longitude=80.846,
            verification_status="approved",
            business_document_note="APMC Farmer License No. 44102"
        )
        db.add(farmer2_profile)

        # Customer demo user
        customer_user = User(
            email="customer@farm2home.org",
            mobile="9876543210",
            password_hash=get_password_hash("customer123"),
            full_name="Ananya Sharma",
            role="customer",
            is_active=True,
            is_verified=True
        )
        db.add(customer_user)
        db.flush()

        customer_profile = CustomerProfile(
            user_id=customer_user.id,
            default_address="House #12, Rose Garden Enclave, 2nd Cross",
            village_town="Vijayawada Urban",
            district="Krishna",
            state="Andhra Pradesh",
            preferred_delivery_slot="Morning (7:00 AM - 10:00 AM)"
        )
        db.add(customer_profile)

        customer_address = Address(
            user_id=customer_user.id,
            label="Home",
            recipient_name="Ananya Sharma",
            mobile="9876543210",
            address_line="House #12, Rose Garden Enclave, 2nd Cross",
            village_town="Vijayawada Urban",
            district="Krishna",
            state="Andhra Pradesh",
            pincode="520001",
            latitude=16.506,
            longitude=80.648,
            is_default=True
        )
        db.add(customer_address)

        # In accordance with farmer-direct marketplace requirements:
        # NO sample vegetables or fruits are seeded.
        # Products are added only when registered farmers upload their fresh harvest!
        db.commit()
        print("Database successfully seeded with demo accounts and Andhra Pradesh settings (no dummy products).")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
