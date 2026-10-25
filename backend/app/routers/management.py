from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.database import get_db
from app.models import (
    User, CustomerProfile, MerchantProfile, Product,
    Category, Order, OrderItem, Payment, DeliverySetting, MerchantVerification
)
from app.auth import require_role
from app.schemas import (
    AdminOverviewStats, MerchantVerificationUpdate,
    UserStatusUpdate, DeliverySettingsUpdate, CategoryCreate, CategoryResponse
)
from app.routers.products import format_product_response
from app.routers.orders import format_order_response

router = APIRouter(prefix="/api/management", tags=["Management / Admin Area"])


@router.get("/stats", response_model=AdminOverviewStats)
def get_admin_stats(
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    total_customers = db.query(User).filter(User.role == "customer").count()
    total_merchants = db.query(User).filter(User.role == "merchant").count()
    pending_merchants = db.query(MerchantProfile).filter(MerchantProfile.verification_status == "pending").count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()

    total_revenue_query = db.query(func.sum(Order.total_amount)).filter(Order.status != "Cancelled").scalar()
    total_revenue = round(float(total_revenue_query or 0.0), 2)

    completed_orders = db.query(Order).filter(Order.status == "Delivered").count()
    cancelled_orders = db.query(Order).filter(Order.status == "Cancelled").count()

    return {
        "total_customers": total_customers,
        "total_merchants": total_merchants,
        "pending_merchants": pending_merchants,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders
    }


@router.get("/customers")
def list_customers(
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    customers = db.query(User).filter(User.role == "customer").order_by(User.id.desc()).all()
    result = []
    for c in customers:
        order_count = db.query(Order).filter(Order.customer_id == c.id).count()
        result.append({
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "mobile": c.mobile,
            "is_active": c.is_active,
            "is_verified": c.is_verified,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "village_town": c.customer_profile.village_town if c.customer_profile else "N/A",
            "district": c.customer_profile.district if c.customer_profile else "N/A",
            "state": c.customer_profile.state if c.customer_profile else "N/A",
            "order_count": order_count
        })
    return result


@router.get("/merchants")
def list_merchants(
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    merchants = db.query(User).filter(User.role == "merchant").order_by(User.id.desc()).all()
    result = []
    for m in merchants:
        mp = m.merchant_profile
        product_count = db.query(Product).filter(Product.merchant_id == m.id).count()
        verifications = db.query(MerchantVerification).filter(MerchantVerification.merchant_id == m.id).all()

        result.append({
            "id": m.id,
            "merchant_profile_id": mp.id if mp else None,
            "full_name": m.full_name,
            "email": m.email,
            "mobile": m.mobile,
            "farm_name": mp.farm_or_shop_name if mp else "N/A",
            "village": mp.village if mp else "N/A",
            "district": mp.district if mp else "N/A",
            "state": mp.state if mp else "N/A",
            "verification_status": mp.verification_status if mp else "pending",
            "rejection_reason": mp.rejection_reason if mp else None,
            "is_active": m.is_active,
            "product_count": product_count,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "verifications": [
                {
                    "type": v.document_type,
                    "number": v.document_number,
                    "status": v.status,
                    "notes": v.notes
                }
                for v in verifications
            ]
        })
    return result


@router.put("/merchants/{merchant_id}/verification")
def update_merchant_verification(
    merchant_id: int,
    data: MerchantVerificationUpdate,
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == merchant_id, User.role == "merchant").first()
    if not user or not user.merchant_profile:
        raise HTTPException(status_code=404, detail="Merchant not found.")

    user.merchant_profile.verification_status = data.verification_status
    if data.rejection_reason:
        user.merchant_profile.rejection_reason = data.rejection_reason
    elif data.verification_status == "approved":
        user.merchant_profile.rejection_reason = None

    db.commit()
    return {
        "success": True,
        "message": f"Merchant application {data.verification_status}.",
        "verification_status": user.merchant_profile.verification_status
    }


@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    data: UserStatusUpdate,
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own administrator account.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    user.is_active = data.is_active
    db.commit()

    action = "activated" if data.is_active else "suspended"
    return {"success": True, "message": f"User account has been {action}."}


@router.get("/products")
def list_all_products_for_management(
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    prods = db.query(Product).order_by(Product.id.desc()).all()
    return [format_product_response(p) for p in prods]


@router.delete("/products/{product_id}")
def moderate_remove_product(
    product_id: int,
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    prod.is_active = False
    db.commit()
    return {"success": True, "message": "Product removed by platform administrator."}


@router.get("/orders")
def list_all_orders_for_management(
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).order_by(Order.id.desc()).all()
    return [format_order_response(o) for o in orders]


@router.get("/payments")
def list_all_payments_for_management(
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    payments = db.query(Payment).order_by(Payment.id.desc()).all()
    import json
    result = []
    for p in payments:
        try:
            details = json.loads(p.payment_details_json) if p.payment_details_json else {}
        except Exception:
            details = {}
        result.append({
            "id": p.id,
            "order_id": p.order_id,
            "order_number": p.order.order_number if p.order else "N/A",
            "customer_name": p.order.customer.full_name if (p.order and p.order.customer) else "N/A",
            "amount": p.amount,
            "payment_method": p.payment_method,
            "status": p.status,
            "transaction_ref": p.transaction_ref,
            "error_message": p.error_message,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "details": details
        })
    return result


@router.get("/delivery-settings")
def get_delivery_settings(db: Session = Depends(get_db)):
    setting = db.query(DeliverySetting).first()
    if not setting:
        setting = DeliverySetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.put("/delivery-settings")
def update_delivery_settings(
    data: DeliverySettingsUpdate,
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    setting = db.query(DeliverySetting).first()
    if not setting:
        setting = DeliverySetting()
        db.add(setting)

    if data.base_delivery_fee is not None:
        setting.base_delivery_fee = data.base_delivery_fee
    if data.free_delivery_threshold is not None:
        setting.free_delivery_threshold = data.free_delivery_threshold
    if data.estimated_hours is not None:
        setting.estimated_hours = data.estimated_hours
    if data.platform_name is not None:
        setting.platform_name = data.platform_name
    if data.contact_phone is not None:
        setting.contact_phone = data.contact_phone
    if data.contact_email is not None:
        setting.contact_email = data.contact_email

    db.commit()
    return {"success": True, "message": "Delivery and platform settings updated.", "settings": setting}


@router.post("/categories", response_model=CategoryResponse)
def create_category(
    data: CategoryCreate,
    current_user: User = Depends(require_role(["management"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Category).filter(Category.name.ilike(data.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists.")

    cat = Category(
        name=data.name.strip(),
        slug=data.slug.strip().lower(),
        description=data.description,
        icon=data.icon
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
