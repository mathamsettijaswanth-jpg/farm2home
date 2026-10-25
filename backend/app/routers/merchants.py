from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.database import get_db
from app.models import User, MerchantProfile, Product, Order, OrderItem, MerchantVerification
from app.auth import require_role
from app.schemas import OrderStatusUpdate

router = APIRouter(prefix="/api/merchants", tags=["Merchant / Farmer Area"])


class MerchantProfileUpdate(BaseModel):
    farm_or_shop_name: Optional[str] = None
    contact_person: Optional[str] = None
    farm_address: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    categories_offered: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    business_document_note: Optional[str] = None


class VerificationDocCreate(BaseModel):
    document_type: str  # Kisan Credit Card, Aadhaar, Land Record, Trade License
    document_number: str
    notes: Optional[str] = None


@router.get("/profile")
def get_merchant_profile(
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    profile = current_user.merchant_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Merchant profile not found.")
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "email": current_user.email,
        "mobile": current_user.mobile,
        "farm_or_shop_name": profile.farm_or_shop_name,
        "contact_person": profile.contact_person,
        "farm_address": profile.farm_address,
        "village": profile.village,
        "district": profile.district,
        "state": profile.state,
        "categories_offered": profile.categories_offered,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "verification_status": profile.verification_status,
        "rejection_reason": profile.rejection_reason,
        "business_document_note": profile.business_document_note
    }


@router.put("/profile")
def update_merchant_profile(
    data: MerchantProfileUpdate,
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    profile = current_user.merchant_profile
    if not profile:
        profile = MerchantProfile(
            user_id=current_user.id,
            farm_or_shop_name=data.farm_or_shop_name or "My Farm",
            contact_person=current_user.full_name,
            farm_address=data.farm_address or "",
            village=data.village or "",
            district=data.district or "",
            state=data.state or ""
        )
        db.add(profile)

    if data.farm_or_shop_name:
        profile.farm_or_shop_name = data.farm_or_shop_name
    if data.contact_person:
        profile.contact_person = data.contact_person
        current_user.full_name = data.contact_person
    if data.farm_address:
        profile.farm_address = data.farm_address
    if data.village:
        profile.village = data.village
    if data.district:
        profile.district = data.district
    if data.state:
        profile.state = data.state
    if data.categories_offered:
        profile.categories_offered = data.categories_offered
    if data.latitude is not None:
        profile.latitude = data.latitude
    if data.longitude is not None:
        profile.longitude = data.longitude
    if data.business_document_note:
        profile.business_document_note = data.business_document_note

    db.commit()
    return {"success": True, "message": "Farm profile updated successfully."}


@router.get("/stats")
def get_merchant_stats(
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    # Total products
    total_products = db.query(Product).filter(
        Product.merchant_id == current_user.id,
        Product.is_active == True
    ).count()

    # Total order items for this merchant
    order_items = db.query(OrderItem).filter(OrderItem.merchant_id == current_user.id).all()
    order_ids = list(set([item.order_id for item in order_items]))

    total_orders = len(order_ids)
    total_sales = sum([item.line_total for item in order_items])

    # Pending / active orders
    active_orders = 0
    if order_ids:
        active_orders = db.query(Order).filter(
            Order.id.in_(order_ids),
            Order.status.in_(["Pending", "Confirmed", "Accepted by Seller", "Packed", "Out for Delivery"])
        ).count()

    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": round(total_sales, 2),
        "active_orders": active_orders,
        "verification_status": current_user.merchant_profile.verification_status if current_user.merchant_profile else "pending"
    }


@router.get("/orders")
def get_merchant_orders(
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    # Get all order items belonging to this merchant
    items = db.query(OrderItem).filter(OrderItem.merchant_id == current_user.id).all()
    order_ids = list(set([item.order_id for item in items]))

    if not order_ids:
        return []

    orders = db.query(Order).filter(Order.id.in_(order_ids)).order_by(Order.id.desc()).all()

    import json
    result = []
    for o in orders:
        # Filter items for this merchant
        merchant_items = [
            {
                "id": it.id,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit_type": it.unit_type,
                "unit_price": it.unit_price,
                "line_total": it.line_total
            }
            for it in o.items if it.merchant_id == current_user.id
        ]
        merchant_subtotal = sum(it["line_total"] for it in merchant_items)

        try:
            address_data = json.loads(o.delivery_address_json)
        except Exception:
            address_data = {"address_line": o.delivery_address_json}

        result.append({
            "id": o.id,
            "order_number": o.order_number,
            "customer_id": o.customer_id,
            "customer_name": address_data.get("recipient_name", "Customer"),
            "customer_mobile": address_data.get("mobile", ""),
            "delivery_address": address_data,
            "delivery_slot": o.delivery_slot,
            "status": o.status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "merchant_items": merchant_items,
            "merchant_subtotal": merchant_subtotal,
            "notes": o.notes,
            "payment_status": o.payment.status if o.payment else "PENDING",
            "payment_method": o.payment.payment_method if o.payment else "COD"
        })

    return result


@router.put("/orders/{order_id}/status")
def update_merchant_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    # Verify order contains merchant's products
    has_item = db.query(OrderItem).filter(
        OrderItem.order_id == order_id,
        OrderItem.merchant_id == current_user.id
    ).first()

    if not has_item and current_user.role != "management":
        raise HTTPException(status_code=403, detail="You do not have permission to manage this order.")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    valid_statuses = [
        "Pending", "Confirmed", "Accepted by Seller",
        "Packed", "Out for Delivery", "Delivered", "Cancelled"
    ]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {', '.join(valid_statuses)}")

    order.status = data.status
    if data.notes:
        order.notes = f"{order.notes or ''} [Merchant Update: {data.notes}]".strip()

    db.commit()
    return {"success": True, "message": f"Order status updated to {data.status}.", "status": order.status}


@router.post("/verifications")
def submit_verification(
    data: VerificationDocCreate,
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    doc = MerchantVerification(
        merchant_id=current_user.id,
        document_type=data.document_type,
        document_number=data.document_number,
        notes=data.notes,
        status="pending"
    )
    db.add(doc)
    db.commit()
    return {"success": True, "message": "Verification documents uploaded for administrator review."}
