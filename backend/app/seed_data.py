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
            village="Shadnagar Rural",
            district="Rangareddy",
            state="Telangana",
            categories_offered="Vegetables, Leafy vegetables, Spices",
            latitude=17.067,
            longitude=78.204,
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
            farm_address="Hillside Mango & Basmati Farms",
            village="Devanahalli Mandi",
            district="Bengaluru Rural",
            state="Karnataka",
            categories_offered="Fruits, Grains and pulses",
            latitude=13.248,
            longitude=77.712,
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
            village_town="Shadnagar Town",
            district="Rangareddy",
            state="Telangana",
            preferred_delivery_slot="Morning (7:00 AM - 10:00 AM)"
        )
        db.add(customer_profile)

        customer_address = Address(
            user_id=customer_user.id,
            label="Home",
            recipient_name="Ananya Sharma",
            mobile="9876543210",
            address_line="House #12, Rose Garden Enclave, 2nd Cross",
            village_town="Shadnagar Town",
            district="Rangareddy",
            state="Telangana",
            pincode="509216",
            latitude=17.072,
            longitude=78.209,
            is_default=True
        )
        db.add(customer_address)

        # 4. Sample Products with INR prices as specified in project prompt
        products_data = [
            # Tomatoes: ₹30/kg
            {
                "merchant_id": farmer_user.id,
                "category_id": categories_map["vegetables"],
                "name": "Fresh Country Tomatoes",
                "description": "Naturally grown, sun-ripened red country tomatoes. Perfect for curries, rasam, and fresh salads.",
                "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 30.0,
                "unit_type": "kg",
                "stock_quantity": 85.0,
                "farm_location": "Shadnagar Rural, Rangareddy",
                "harvest_date": "Harvested this morning",
                "is_featured": True
            },
            # Onions: ₹35/kg
            {
                "merchant_id": farmer_user.id,
                "category_id": categories_map["vegetables"],
                "name": "Farm Fresh Onions (Nashik Red)",
                "description": "Crisp red medium onions with pungent natural flavor and long shelf-life.",
                "image_url": "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 35.0,
                "unit_type": "kg",
                "stock_quantity": 120.0,
                "farm_location": "Shadnagar Rural, Rangareddy",
                "harvest_date": "Harvested 2 days ago",
                "is_featured": True
            },
            # Potatoes: ₹25/kg
            {
                "merchant_id": farmer_user.id,
                "category_id": categories_map["vegetables"],
                "name": "Fresh Soil Potatoes",
                "description": "Golden skin fresh soil potatoes, unpolished and chemical-free.",
                "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 25.0,
                "unit_type": "kg",
                "stock_quantity": 150.0,
                "farm_location": "Shadnagar Rural, Rangareddy",
                "harvest_date": "Harvested 3 days ago",
                "is_featured": False
            },
            # Carrots: ₹40/kg
            {
                "merchant_id": farmer_user.id,
                "category_id": categories_map["vegetables"],
                "name": "Crunchy Orange Carrots",
                "description": "Sweet, crunchy baby carrots freshly pulled from organic farm soil.",
                "image_url": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 40.0,
                "unit_type": "kg",
                "stock_quantity": 60.0,
                "farm_location": "Shadnagar Rural, Rangareddy",
                "harvest_date": "Harvested today at dawn",
                "is_featured": True
            },
            # Spinach: ₹15/bunch
            {
                "merchant_id": farmer_user.id,
                "category_id": categories_map["leafy-vegetables"],
                "name": "Organic Spinach (Palak)",
                "description": "Tender and deep-green spinach bunches. Rich in natural iron and dietary vitamins.",
                "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 15.0,
                "unit_type": "bunch",
                "stock_quantity": 40.0,
                "farm_location": "Shadnagar Rural, Rangareddy",
                "harvest_date": "Harvested 4 hours ago",
                "is_featured": True
            },
            # Green chillies: ₹60/kg
            {
                "merchant_id": farmer_user.id,
                "category_id": categories_map["spices"],
                "name": "Spicy Green Chillies (Hari Mirchi)",
                "description": "Pungent, fresh green chillies packed with authentic farm zest.",
                "image_url": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 60.0,
                "unit_type": "kg",
                "stock_quantity": 30.0,
                "farm_location": "Shadnagar Rural, Rangareddy",
                "harvest_date": "Freshly picked today",
                "is_featured": False
            },
            # Fruits: Alphonso Mangoes: ₹120/kg
            {
                "merchant_id": farmer2_user.id,
                "category_id": categories_map["fruits"],
                "name": "Farm Alphonso Mangoes",
                "description": "Tree-ripened sweet Alphonso mangoes from chemical-free orchards.",
                "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 120.0,
                "unit_type": "kg",
                "stock_quantity": 50.0,
                "farm_location": "Devanahalli Mandi, Bengaluru Rural",
                "harvest_date": "Harvested yesterday",
                "is_featured": True
            },
            # Fruits: Shimla Apples: ₹110/kg
            {
                "merchant_id": farmer2_user.id,
                "category_id": categories_map["fruits"],
                "name": "Crisp Shimla Royal Apples",
                "description": "Juicy, crisp red apples directly transported from mountain hill orchards.",
                "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 110.0,
                "unit_type": "kg",
                "stock_quantity": 70.0,
                "farm_location": "Devanahalli Mandi, Bengaluru Rural",
                "harvest_date": "Harvested 2 days ago",
                "is_featured": True
            },
            # Grains: Organic Basmati Rice: ₹95/kg
            {
                "merchant_id": farmer2_user.id,
                "category_id": categories_map["grains-pulses"],
                "name": "Organic Traditional Basmati Rice",
                "description": "Long-grain aromatic basmati paddy unpolished with full bran nutrition.",
                "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 95.0,
                "unit_type": "kg",
                "stock_quantity": 200.0,
                "farm_location": "Devanahalli Mandi, Bengaluru Rural",
                "harvest_date": "Winter Harvest Season",
                "is_featured": False
            },
            # Pulses: Toor Dal: ₹140/kg
            {
                "merchant_id": farmer2_user.id,
                "category_id": categories_map["grains-pulses"],
                "name": "Unpolished Desi Toor Dal",
                "description": "High-protein yellow split pigeon peas, stone-ground with no artificial color.",
                "image_url": "https://images.unsplash.com/photo-1599307767316-776533dae580?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 140.0,
                "unit_type": "kg",
                "stock_quantity": 180.0,
                "farm_location": "Devanahalli Mandi, Bengaluru Rural",
                "harvest_date": "Fresh season stock",
                "is_featured": False
            },
            # Other Farm Products: Pure Raw Forest Honey: ₹250/litre
            {
                "merchant_id": farmer_user.id,
                "category_id": categories_map["other-farm-products"],
                "name": "Raw Wild Flora Forest Honey",
                "description": "100% pure unfiltered raw honey collected by tribal beekeepers on farm periphery.",
                "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80",
                "price_per_unit": 250.0,
                "unit_type": "litre",
                "stock_quantity": 35.0,
                "farm_location": "Shadnagar Rural, Rangareddy",
                "harvest_date": "Extracted this month",
                "is_featured": True
            }
        ]

        for p_data in products_data:
            p = Product(**p_data)
            db.add(p)

        db.commit()
        print("Database successfully seeded with demo accounts and farm produce!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
