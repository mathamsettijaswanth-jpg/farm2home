from app.routers import products
from app.schemas import ProductCreate, ProductUpdate
from app.models import User


def test_products_list_and_search(db):
    # List all
    prod_list = products.get_products(db=db)
    assert len(prod_list) >= 1
    assert prod_list[0]["name"] == "Fresh Tomatoes"

    # Search existing
    search_res = products.get_products(search="Tomatoes", db=db)
    assert len(search_res) >= 1
    assert "Tomatoes" in search_res[0]["name"]

    # Search non-existing
    empty_res = products.get_products(search="DoesNotExist12345", db=db)
    assert len(empty_res) == 0


def test_merchant_create_and_update_product(db):
    farmer = db.query(User).filter(User.role == "merchant").first()

    # Create new product
    new_prod_data = ProductCreate(
        name="Organic Red Chillies",
        description="Fresh spicy chillies",
        category_id=1,
        price_per_unit=60.0,
        unit_type="kg",
        stock_quantity=20.0,
        farm_location="Shadnagar Farm",
        harvest_date="Today"
    )
    created = products.create_product(new_prod_data, current_user=farmer, db=db)
    assert created["name"] == "Organic Red Chillies"
    assert created["price_per_unit"] == 60.0

    # Update price
    updated = products.update_product(
        created["id"],
        ProductUpdate(price_per_unit=55.0, stock_quantity=18.0),
        current_user=farmer,
        db=db
    )
    assert updated["price_per_unit"] == 55.0
    assert updated["stock_quantity"] == 18.0
