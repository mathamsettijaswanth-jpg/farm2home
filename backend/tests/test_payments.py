import pytest
from fastapi import HTTPException
from app.routers import cart, orders, payments
from app.schemas import CartItemAdd, OrderCreate, DemoPaymentInitiate
from app.models import User, Product


def test_payment_simulation_success_failure_and_retry(db):
    customer = db.query(User).filter(User.role == "customer").first()
    product = db.query(Product).first()

    # Create order
    cart.add_to_cart(CartItemAdd(product_id=product.id, quantity=1.0), current_user=customer, db=db)
    order_res = orders.checkout_cart(OrderCreate(), current_user=customer, db=db)
    order_id = order_res["id"]

    # 1. Simulate payment failure
    fail_res = payments.simulate_payment(
        DemoPaymentInitiate(
            order_id=order_id,
            payment_method="UPI",
            upi_vpa="testfarmer@upi",
            simulate_failure=True
        ),
        current_user=customer,
        db=db
    )
    assert fail_res["status"] == "FAILED"
    assert "Simulated bank decline" in fail_res["error_message"]

    # 2. Retry payment with success
    success_res = payments.simulate_payment(
        DemoPaymentInitiate(
            order_id=order_id,
            payment_method="UPI",
            upi_vpa="testfarmer@upi",
            simulate_failure=False
        ),
        current_user=customer,
        db=db
    )
    assert success_res["status"] == "SUCCESS"
    assert "DEMO PAYMENT" in success_res["demo_disclaimer"]

    # 3. Prevent duplicate payment once successfully paid
    with pytest.raises(HTTPException) as exc_info:
        payments.simulate_payment(
            DemoPaymentInitiate(
                order_id=order_id,
                payment_method="UPI",
                upi_vpa="testfarmer@upi",
                simulate_failure=False
            ),
            current_user=customer,
            db=db
        )
    assert exc_info.value.status_code == 400
    assert "already been paid" in exc_info.value.detail
