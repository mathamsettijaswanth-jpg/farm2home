from app.routers import cart, orders
from app.schemas import CartItemAdd, CartItemUpdate, OrderCreate
from app.models import User, Product


def test_cart_workflow_and_checkout(db):
    customer = db.query(User).filter(User.role == "customer").first()
    product = db.query(Product).first()

    # 1. Add to cart: 2 kg at ₹30/kg
    cart_summary = cart.add_to_cart(
        CartItemAdd(product_id=product.id, quantity=2.0),
        current_user=customer,
        db=db
    )
    assert cart_summary["item_count"] == 1
    assert cart_summary["subtotal"] == 60.0
    assert cart_summary["delivery_fee"] == 30.0
    assert cart_summary["total"] == 90.0

    # 2. Update quantity to 4 kg
    cart_item_id = cart_summary["items"][0]["id"]
    updated_cart = cart.update_cart_item(
        cart_item_id,
        CartItemUpdate(quantity=4.0),
        current_user=customer,
        db=db
    )
    assert updated_cart["subtotal"] == 120.0

    # 3. Checkout order
    order_data = orders.checkout_cart(
        OrderCreate(
            delivery_slot="Morning (7:00 AM - 10:00 AM)",
            notes="Please call before delivery"
        ),
        current_user=customer,
        db=db
    )
    assert order_data["status"] == "Confirmed"
    assert order_data["subtotal"] == 120.0
    assert "F2H-" in order_data["order_number"]
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["unit_price"] == 30.0
    assert order_data["items"][0]["quantity"] == 4.0

    # 4. Verify cart emptied
    after_cart = cart.get_cart(current_user=customer, db=db)
    assert after_cart["item_count"] == 0

    # 5. Verify stock deducted from 50.0 to 46.0
    db.refresh(product)
    assert product.stock_quantity == 46.0
