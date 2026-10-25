import pytest
from fastapi import HTTPException
from app.routers import auth
from app.schemas import (
    CustomerRegister, MerchantRegister, LoginRequest,
    DemoOTPRequest, DemoOTPVerify, ForgotPasswordRequest
)
from app.models import User


def test_customer_registration_and_login(db):
    reg_data = CustomerRegister(
        full_name="Kavitha Reddy",
        mobile="9848012345",
        email="kavitha@example.com",
        password="Password123!",
        delivery_address="House 55, Near Temple",
        village_town="Shadnagar",
        district="Rangareddy",
        state="Telangana",
        pincode="509216"
    )
    res = auth.register_customer(reg_data, db)
    assert "access_token" in res
    assert res["user"]["role"] == "customer"
    assert res["user"]["full_name"] == "Kavitha Reddy"

    # Login with email
    login_req = LoginRequest(identifier="kavitha@example.com", password="Password123!")
    login_res = auth.login(login_req, db)
    assert "access_token" in login_res

    # Login with mobile
    login_req2 = LoginRequest(identifier="9848012345", password="Password123!")
    login_res2 = auth.login(login_req2, db)
    assert "access_token" in login_res2

    # Login with wrong password
    with pytest.raises(HTTPException) as exc_info:
        auth.login(LoginRequest(identifier="kavitha@example.com", password="WrongPassword!"), db)
    assert exc_info.value.status_code == 401


def test_merchant_registration(db):
    merchant_data = MerchantRegister(
        farm_or_shop_name="Sri Krishna Organic Orchard",
        contact_person="Krishna Murthy",
        mobile="9848099887",
        email="krishna@farm.com",
        password="FarmerPassword123!",
        farm_address="Green Acres Survey 12",
        village="Devanahalli",
        district="Bengaluru Rural",
        state="Karnataka",
        categories_offered="Fruits, Vegetables"
    )
    res = auth.register_merchant(merchant_data, db)
    assert "access_token" in res
    assert res["user"]["role"] == "merchant"
    assert res["user"]["merchant_profile"]["farm_or_shop_name"] == "Sri Krishna Organic Orchard"


def test_demo_otp_flow(db):
    # Request demo OTP
    req = DemoOTPRequest(mobile="9876543210")
    otp_res = auth.send_demo_otp(req, db)
    assert otp_res["success"] is True
    assert otp_res["demo_code"] == "123456"

    # Verify demo OTP
    verify_req = DemoOTPVerify(mobile="9876543210", otp="123456")
    verify_res = auth.verify_demo_otp(verify_req, db)
    assert "access_token" in verify_res
    assert verify_res["user"]["mobile"] == "9876543210"
