import json
import random
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, Payment, User
from app.schemas import DemoPaymentInitiate, DemoPaymentResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Demo Payment Simulator"])


def generate_demo_tx_ref(prefix: str = "DEMO-TXN") -> str:
    now = datetime.datetime.utcnow()
    rand = f"{random.randint(100000, 999999)}"
    return f"{prefix}-{now.strftime('%Y%m%d%H%M')}-{rand}"


@router.post("/simulate", response_model=DemoPaymentResponse)
def simulate_payment(
    data: DemoPaymentInitiate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify order exists
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for payment.")

    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this order payment.")

    # Prevent duplicate payment if already SUCCESS
    existing_payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    if existing_payment and existing_payment.status == "SUCCESS":
        raise HTTPException(
            status_code=400,
            detail=f"This order has already been paid successfully with reference {existing_payment.transaction_ref}."
        )

    # Process simulation
    is_failure = data.simulate_failure
    tx_status = "FAILED" if is_failure else "SUCCESS"
    tx_ref = generate_demo_tx_ref()

    payment_details = {
        "payment_method": data.payment_method,
        "is_simulation": True,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "disclaimer": "DEMO PAYMENT — NO REAL MONEY CHARGED"
    }

    if data.payment_method == "UPI":
        payment_details["upi_vpa"] = data.upi_vpa or "kisan.fresh@demoupi"
    elif data.payment_method == "CARD":
        last_4 = (data.card_number or "4242")[-4:]
        payment_details["card_brand"] = "Demo RuPay / Visa"
        payment_details["card_last4"] = last_4
    elif data.payment_method == "COD":
        payment_details["mode"] = "Cash on Delivery"
        tx_status = "PENDING"  # COD is pending until physical delivery

    error_msg = None
    if is_failure:
        error_msg = "Simulated bank decline: Transaction failed as requested for testing retry flow."

    if existing_payment:
        # Retry flow: update existing payment record
        existing_payment.payment_method = data.payment_method
        existing_payment.transaction_ref = tx_ref
        existing_payment.amount = order.total_amount
        existing_payment.status = tx_status
        existing_payment.payment_details_json = json.dumps(payment_details)
        existing_payment.error_message = error_msg
        payment_record = existing_payment
    else:
        payment_record = Payment(
            order_id=order.id,
            payment_method=data.payment_method,
            transaction_ref=tx_ref,
            amount=order.total_amount,
            status=tx_status,
            payment_details_json=json.dumps(payment_details),
            error_message=error_msg
        )
        db.add(payment_record)

    # If payment succeeded or COD confirmed, ensure order status is at least Confirmed
    if tx_status in ["SUCCESS", "PENDING"]:
        order.status = "Confirmed"

    db.commit()
    db.refresh(payment_record)

    return {
        "id": payment_record.id,
        "order_id": order.id,
        "order_number": order.order_number,
        "payment_method": payment_record.payment_method,
        "transaction_ref": payment_record.transaction_ref,
        "amount": payment_record.amount,
        "status": payment_record.status,
        "payment_details": payment_details,
        "error_message": payment_record.error_message,
        "is_demo": True,
        "demo_disclaimer": "DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED",
        "created_at": payment_record.created_at
    }


@router.get("/order/{order_id}")
def get_order_payment(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="No payment record found for this order.")

    # Authorization
    if current_user.role == "customer" and payment.order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    try:
        details = json.loads(payment.payment_details_json) if payment.payment_details_json else {}
    except Exception:
        details = {}

    return {
        "id": payment.id,
        "order_id": payment.order_id,
        "order_number": payment.order.order_number,
        "payment_method": payment.payment_method,
        "transaction_ref": payment.transaction_ref,
        "amount": payment.amount,
        "status": payment.status,
        "payment_details": details,
        "error_message": payment.error_message,
        "is_demo": True,
        "demo_disclaimer": "DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED",
        "created_at": payment.created_at
    }
