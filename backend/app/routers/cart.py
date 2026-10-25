from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CartItem, Product, User, DeliverySetting
from app.schemas import CartItemAdd, CartItemUpdate, CartSummaryResponse, CartItemResponse
from app.auth import get_current_user, require_role
from app.routers.products import format_product_response

router = APIRouter(prefix="/api/cart", tags=["Shopping Cart"])


def calculate_cart_summary(user_id: int, db: Session) -> dict:
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()

    # Get delivery settings
    setting = db.query(DeliverySetting).first()
    base_fee = setting.base_delivery_fee if setting else 30.0
    free_threshold = setting.free_delivery_threshold if setting else 300.0

    cart_responses = []
    subtotal = 0.0
    item_count = 0

    for ci in items:
        prod = ci.product
        if not prod or not prod.is_active:
            continue

        # Adjust quantity if exceeds stock
        if ci.quantity > prod.stock_quantity and prod.stock_quantity > 0:
            ci.quantity = prod.stock_quantity
            db.commit()

        line_total = round(ci.quantity * prod.price_per_unit, 2)
        subtotal += line_total
        item_count += 1

        cart_responses.append({
            "id": ci.id,
            "product_id": prod.id,
            "product": format_product_response(prod),
            "quantity": ci.quantity,
            "line_total": line_total
        })

    subtotal = round(subtotal, 2)

    # Free delivery logic
    if subtotal == 0:
        delivery_fee = 0.0
        amount_needed = free_threshold
    elif subtotal >= free_threshold:
        delivery_fee = 0.0
        amount_needed = 0.0
    else:
        delivery_fee = base_fee
        amount_needed = round(free_threshold - subtotal, 2)

    discount = 0.0
    total = round(subtotal + delivery_fee - discount, 2)

    return {
        "items": cart_responses,
        "item_count": item_count,
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "discount": discount,
        "total": total,
        "free_delivery_threshold": free_threshold,
        "amount_needed_for_free_delivery": max(0.0, amount_needed)
    }


@router.get("", response_model=CartSummaryResponse)
def get_cart(
    current_user: User = Depends(require_role(["customer", "management"])),
    db: Session = Depends(get_db)
):
    return calculate_cart_summary(current_user.id, db)


@router.post("/items")
def add_to_cart(
    data: CartItemAdd,
    current_user: User = Depends(require_role(["customer", "management"])),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == data.product_id, Product.is_active == True).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product is no longer available.")

    if prod.stock_quantity <= 0:
        raise HTTPException(status_code=400, detail="This product is currently out of stock.")

    # Check if item is already in cart
    existing = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == data.product_id
    ).first()

    requested_qty = data.quantity if not existing else (existing.quantity + data.quantity)

    if requested_qty > prod.stock_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add {requested_qty} {prod.unit_type}. Only {prod.stock_quantity} {prod.unit_type} available in stock."
        )

    if existing:
        existing.quantity = requested_qty
    else:
        new_item = CartItem(
            user_id=current_user.id,
            product_id=data.product_id,
            quantity=data.quantity
        )
        db.add(new_item)

    db.commit()
    return calculate_cart_summary(current_user.id, db)


@router.put("/items/{item_id}")
def update_cart_item(
    item_id: int,
    data: CartItemUpdate,
    current_user: User = Depends(require_role(["customer", "management"])),
    db: Session = Depends(get_db)
):
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found in cart.")

    if data.quantity <= 0:
        db.delete(item)
        db.commit()
        return calculate_cart_summary(current_user.id, db)

    prod = item.product
    if not prod or not prod.is_active:
        db.delete(item)
        db.commit()
        raise HTTPException(status_code=400, detail="Product is no longer available and was removed.")

    if data.quantity > prod.stock_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {prod.stock_quantity} {prod.unit_type} available in stock."
        )

    item.quantity = data.quantity
    db.commit()

    return calculate_cart_summary(current_user.id, db)


@router.delete("/items/{item_id}")
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(require_role(["customer", "management"])),
    db: Session = Depends(get_db)
):
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found in your cart.")

    db.delete(item)
    db.commit()

    return calculate_cart_summary(current_user.id, db)


@router.delete("/clear")
def clear_cart(
    current_user: User = Depends(require_role(["customer", "management"])),
    db: Session = Depends(get_db)
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return {"success": True, "message": "Cart emptied."}
