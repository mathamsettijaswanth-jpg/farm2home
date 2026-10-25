from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Product, Category, User
from app.schemas import ProductCreate, ProductUpdate, ProductResponse, CategoryResponse
from app.auth import get_current_user, require_role, get_optional_user

router = APIRouter(prefix="/api/products", tags=["Products & Categories"])


def format_product_response(p: Product) -> dict:
    merchant_name = p.merchant.full_name if p.merchant else "Verified Farmer"
    merchant_farm = (
        p.merchant.merchant_profile.farm_or_shop_name
        if p.merchant and p.merchant.merchant_profile
        else "Local Agro Farm"
    )
    category_name = p.category.name if p.category else "Fresh Produce"

    return {
        "id": p.id,
        "merchant_id": p.merchant_id,
        "category_id": p.category_id,
        "name": p.name,
        "description": p.description,
        "image_url": p.image_url,
        "price_per_unit": p.price_per_unit,
        "unit_type": p.unit_type,
        "min_order_quantity": getattr(p, "min_order_quantity", 10.0) or 10.0,
        "stock_quantity": p.stock_quantity,
        "farm_location": p.farm_location,
        "harvest_date": p.harvest_date,
        "is_active": p.is_active,
        "is_featured": p.is_featured,
        "created_at": p.created_at,
        "merchant_name": merchant_name,
        "merchant_farm": merchant_farm,
        "category_name": category_name
    }


@router.get("/categories/all", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.id.asc()).all()


@router.get("", response_model=List[ProductResponse])
def get_products(
    category: Optional[str] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock_only: Optional[bool] = False,
    featured_only: Optional[bool] = False,
    merchant_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    if category_id:
        query = query.filter(Product.category_id == category_id)
    elif category:
        cat = db.query(Category).filter(or_(Category.slug == category, Category.name.ilike(category))).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.farm_location.ilike(search_term)
            )
        )

    if min_price is not None:
        query = query.filter(Product.price_per_unit >= min_price)
    if max_price is not None:
        query = query.filter(Product.price_per_unit <= max_price)

    if in_stock_only:
        query = query.filter(Product.stock_quantity > 0)

    if featured_only:
        query = query.filter(Product.is_featured == True)

    if merchant_id:
        query = query.filter(Product.merchant_id == merchant_id)

    products = query.order_by(Product.is_featured.desc(), Product.id.desc()).all()
    return [format_product_response(p) for p in products]


@router.get("/merchant/my-products", response_model=List[ProductResponse])
def get_merchant_products(
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.merchant_id == current_user.id
    ).order_by(Product.id.desc()).all()

    return [format_product_response(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product_details(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    return format_product_response(p)


@router.post("", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    # Validate category exists
    cat = db.query(Category).filter(Category.id == data.category_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Invalid category ID selected.")

    # Farmer's farm location default if not supplied
    farm_loc = data.farm_location
    if not farm_loc and current_user.merchant_profile:
        farm_loc = f"{current_user.merchant_profile.village}, {current_user.merchant_profile.district}"

    new_prod = Product(
        merchant_id=current_user.id,
        category_id=data.category_id,
        name=data.name.strip(),
        description=data.description,
        image_url=data.image_url or "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
        price_per_unit=data.price_per_unit,
        unit_type=data.unit_type,
        min_order_quantity=data.min_order_quantity if data.min_order_quantity >= 10.0 or data.unit_type not in ["kg", "kgs"] else 10.0,
        stock_quantity=data.stock_quantity,
        farm_location=farm_loc or "Organic Farm, India",
        harvest_date=data.harvest_date or "Fresh Today",
        is_active=True,
        is_featured=data.is_featured
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    return format_product_response(new_prod)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Ensure seller can only edit own products
    if prod.merchant_id != current_user.id and current_user.role != "management":
        raise HTTPException(status_code=403, detail="You do not have permission to modify this product.")

    if data.name is not None:
        prod.name = data.name.strip()
    if data.description is not None:
        prod.description = data.description
    if data.category_id is not None:
        cat = db.query(Category).filter(Category.id == data.category_id).first()
        if not cat:
            raise HTTPException(status_code=400, detail="Invalid category ID.")
        prod.category_id = data.category_id
    if data.image_url is not None:
        prod.image_url = data.image_url
    if data.price_per_unit is not None:
        prod.price_per_unit = data.price_per_unit
    if data.unit_type is not None:
        prod.unit_type = data.unit_type
    if data.min_order_quantity is not None:
        prod.min_order_quantity = data.min_order_quantity
    if data.stock_quantity is not None:
        prod.stock_quantity = data.stock_quantity
    if data.farm_location is not None:
        prod.farm_location = data.farm_location
    if data.harvest_date is not None:
        prod.harvest_date = data.harvest_date
    if data.is_active is not None:
        prod.is_active = data.is_active
    if data.is_featured is not None:
        prod.is_featured = data.is_featured

    db.commit()
    db.refresh(prod)
    return format_product_response(prod)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: User = Depends(require_role(["merchant", "management"])),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    if prod.merchant_id != current_user.id and current_user.role != "management":
        raise HTTPException(status_code=403, detail="You do not have permission to delete this product.")

    # Soft delete / deactivate so historical orders remain valid
    prod.is_active = False
    db.commit()

    return {"success": True, "message": "Product removed successfully."}
