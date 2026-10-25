import json
import random
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, OrderItem, CartItem, Product, Address, DeliverySetting, User, Payment
from app.schemas import OrderCreate, OrderResponse, OrderItemResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/orders", tags=["Orders & Checkout"])


def generate_order_number() -> str:
    now = datetime.datetime.utcnow()
    rand_part = f"{random.randint(1000, 9999)}"
    return f"F2H-{now.strftime('%Y%m%d')}-{rand_part}"


def format_order_response(order: Order) -> dict:
    try:
        addr = json.loads(order.delivery_address_json)
    except Exception:
        addr = {"address_line": order.delivery_address_json}

    items_data = [
        {
            "id": it.id,
            "product_id": it.product_id,
            "product_name": it.product_name,
            "unit_type": it.unit_type,
            "unit_price": it.unit_price,
            "quantity": it.quantity,
            "line_total": it.line_total,
            "merchant_id": it.merchant_id
        }
        for it in order.items
    ]

    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "delivery_address": addr,
        "delivery_slot": order.delivery_slot,
        "subtotal": order.subtotal,
        "delivery_fee": order.delivery_fee,
        "discount": order.discount,
        "total_amount": order.total_amount,
        "status": order.status,
        "notes": order.notes,
        "created_at": order.created_at,
        "items": items_data,
        "payment_status": order.payment.status if order.payment else "PENDING",
        "payment_method": order.payment.payment_method if order.payment else "COD"
    }


@router.post("/checkout", response_model=OrderResponse)
def checkout_cart(
    data: OrderCreate,
    current_user: User = Depends(require_role(["customer", "management"])),
    db: Session = Depends(get_db)
):
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Your cart is empty. Add fresh items before checkout.")

    # 1. Resolve delivery address snapshot
    delivery_address_dict = {}
    if data.address_id:
        addr = db.query(Address).filter(Address.id == data.address_id, Address.user_id == current_user.id).first()
        if not addr:
            raise HTTPException(status_code=400, detail="Selected delivery address was not found.")
        delivery_address_dict = {
            "recipient_name": addr.recipient_name,
            "mobile": addr.mobile,
            "label": addr.label,
            "address_line": addr.address_line,
            "village_town": addr.village_town,
            "district": addr.district,
            "state": addr.state,
            "pincode": addr.pincode,
            "latitude": addr.latitude,
            "longitude": addr.longitude
        }
    elif data.manual_address:
        delivery_address_dict = data.manual_address.dict()
    else:
        # Check if customer has a default address
        addr = db.query(Address).filter(Address.user_id == current_user.id, Address.is_default == True).first()
        if not addr:
            addr = db.query(Address).filter(Address.user_id == current_user.id).first()
        if not addr:
            raise HTTPException(status_code=400, detail="Please provide a delivery address.")
        delivery_address_dict = {
            "recipient_name": addr.recipient_name,
            "mobile": addr.mobile,
            "label": addr.label,
            "address_line": addr.address_line,
            "village_town": addr.village_town,
            "district": addr.district,
            "state": addr.state,
            "pincode": addr.pincode,
            "latitude": addr.latitude,
            "longitude": addr.longitude
        }

    # 2. Validate all products and stock availability
    subtotal = 0.0
    items_to_create = []

    for ci in cart_items:
        prod = ci.product
        if not prod or not prod.is_active:
            raise HTTPException(
                status_code=400,
                detail=f"Item '{prod.name if prod else 'Unknown'}' is no longer active in marketplace."
            )
        min_qty = getattr(prod, "min_order_quantity", 10.0) or 10.0
        if ci.quantity < min_qty and prod.unit_type.lower() in ["kg", "kgs", "kilogram"]:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order for '{prod.name}' is {min_qty} {prod.unit_type}. You have {ci.quantity} {prod.unit_type} in your cart."
            )
        if prod.stock_quantity < ci.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{prod.name}'. Only {prod.stock_quantity} {prod.unit_type} remaining."
            )

        line_total = round(ci.quantity * prod.price_per_unit, 2)
        subtotal += line_total

        # Deduct stock safely
        prod.stock_quantity = round(prod.stock_quantity - ci.quantity, 2)

        items_to_create.append({
            "product_id": prod.id,
            "merchant_id": prod.merchant_id,
            "product_name": prod.name,
            "unit_type": prod.unit_type,
            "unit_price": prod.price_per_unit,
            "quantity": ci.quantity,
            "line_total": line_total
        })

    subtotal = round(subtotal, 2)

    # 3. Calculate delivery fee
    setting = db.query(DeliverySetting).first()
    base_fee = setting.base_delivery_fee if setting else 30.0
    free_threshold = setting.free_delivery_threshold if setting else 300.0

    delivery_fee = 0.0 if subtotal >= free_threshold else base_fee
    discount = 0.0
    total_amount = round(subtotal + delivery_fee - discount, 2)

    # 4. Create Order
    new_order = Order(
        order_number=generate_order_number(),
        customer_id=current_user.id,
        delivery_address_json=json.dumps(delivery_address_dict),
        delivery_slot=data.delivery_slot or "Standard Morning (7:00 AM - 10:00 AM)",
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        discount=discount,
        total_amount=total_amount,
        status="Confirmed",  # Confirmed on checkout
        notes=data.notes
    )
    db.add(new_order)
    db.flush()

    # 5. Create Order Items
    for it in items_to_create:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=it["product_id"],
            merchant_id=it["merchant_id"],
            product_name=it["product_name"],
            unit_type=it["unit_type"],
            unit_price=it["unit_price"],
            quantity=it["quantity"],
            line_total=it["line_total"]
        )
        db.add(order_item)

    # 6. Clear customer cart
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()

    db.commit()
    db.refresh(new_order)

    return format_order_response(new_order)


@router.get("", response_model=List[OrderResponse])
def get_customer_orders(
    current_user: User = Depends(require_role(["customer", "management"])),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(
        Order.customer_id == current_user.id
    ).order_by(Order.id.desc()).all()

    return [format_order_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Authorization: Customer must own it, or merchant must have items in it, or management
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this order.")

    return format_order_response(order)


@router.post("/{order_id}/cancel")
def cancel_customer_order(
    order_id: int,
    current_user: User = Depends(require_role(["customer", "management"])),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    if order.status in ["Delivered", "Cancelled", "Out for Delivery"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order in '{order.status}' status."
        )

    # Restore stock for ordered items
    for item in order.items:
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            if prod:
                prod.stock_quantity = round(prod.stock_quantity + item.quantity, 2)

    order.status = "Cancelled"
    if order.payment and order.payment.status == "SUCCESS":
        order.payment.status = "REFUNDED"

    db.commit()
    return {"success": True, "message": "Order cancelled and stock restored successfully.", "status": "Cancelled"}
