from app.routers import management
from app.schemas import MerchantVerificationUpdate, UserStatusUpdate, DeliverySettingsUpdate
from app.models import User, MerchantProfile


def test_management_overview_and_actions(db):
    admin = db.query(User).filter(User.role == "management").first()
    farmer = db.query(User).filter(User.role == "merchant").first()

    # 1. Admin overview stats
    stats = management.get_admin_stats(current_user=admin, db=db)
    assert stats["total_customers"] >= 1
    assert stats["total_merchants"] >= 1
    assert stats["total_products"] >= 1

    # 2. List customers
    customers_list = management.list_customers(current_user=admin, db=db)
    assert len(customers_list) >= 1

    # 3. List merchants
    merchants_list = management.list_merchants(current_user=admin, db=db)
    assert len(merchants_list) >= 1

    # 4. Update merchant verification status
    verif_res = management.update_merchant_verification(
        farmer.id,
        MerchantVerificationUpdate(verification_status="approved"),
        current_user=admin,
        db=db
    )
    assert verif_res["verification_status"] == "approved"

    # 5. Delivery settings update
    deliv_res = management.update_delivery_settings(
        DeliverySettingsUpdate(base_delivery_fee=25.0, free_delivery_threshold=250.0),
        current_user=admin,
        db=db
    )
    assert deliv_res["success"] is True
