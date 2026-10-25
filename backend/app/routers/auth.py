import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User, CustomerProfile, MerchantProfile, Address
from app.schemas import (
    CustomerRegister, MerchantRegister, LoginRequest,
    DemoOTPRequest, DemoOTPVerify, DemoEmailVerifyRequest,
    DemoEmailVerifyConfirm, ForgotPasswordRequest, TokenResponse
)
from app.auth import (
    get_password_hash, verify_password, create_access_token,
    normalize_mobile, get_current_user, DEMO_OTP_STORE, DEMO_EMAIL_STORE
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def serialize_user_profile(user: User):
    user_dict = {
        "id": user.id,
        "email": user.email,
        "mobile": user.mobile,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }
    if user.role == "customer" and user.customer_profile:
        user_dict["customer_profile"] = {
            "village_town": user.customer_profile.village_town,
            "district": user.customer_profile.district,
            "state": user.customer_profile.state,
            "default_address": user.customer_profile.default_address,
            "preferred_delivery_slot": user.customer_profile.preferred_delivery_slot
        }
    elif user.role == "merchant" and user.merchant_profile:
        user_dict["merchant_profile"] = {
            "farm_or_shop_name": user.merchant_profile.farm_or_shop_name,
            "contact_person": user.merchant_profile.contact_person,
            "farm_address": user.merchant_profile.farm_address,
            "village": user.merchant_profile.village,
            "district": user.merchant_profile.district,
            "state": user.merchant_profile.state,
            "verification_status": user.merchant_profile.verification_status,
            "rejection_reason": user.merchant_profile.rejection_reason,
            "latitude": user.merchant_profile.latitude,
            "longitude": user.merchant_profile.longitude,
            "categories_offered": user.merchant_profile.categories_offered
        }
    return user_dict


@router.post("/register/customer", response_model=TokenResponse)
def register_customer(data: CustomerRegister, db: Session = Depends(get_db)):
    norm_mobile = normalize_mobile(data.mobile)

    # Check if email or mobile exists
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please login instead."
        )
    if db.query(User).filter(User.mobile == norm_mobile).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this mobile number already exists. Please login instead."
        )

    # Create user
    new_user = User(
        email=data.email.lower(),
        mobile=norm_mobile,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name.strip(),
        role="customer",
        is_active=True,
        is_verified=True  # In demo/dev mode, mark verified
    )
    db.add(new_user)
    db.flush()

    # Create customer profile
    profile = CustomerProfile(
        user_id=new_user.id,
        default_address=data.delivery_address,
        village_town=data.village_town,
        district=data.district,
        state=data.state
    )
    db.add(profile)

    # Create primary delivery address
    primary_address = Address(
        user_id=new_user.id,
        label="Home",
        recipient_name=data.full_name,
        mobile=norm_mobile,
        address_line=data.delivery_address,
        village_town=data.village_town,
        district=data.district,
        state=data.state,
        pincode=data.pincode or "500001",
        latitude=data.latitude,
        longitude=data.longitude,
        is_default=True
    )
    db.add(primary_address)

    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user_profile(new_user)}


@router.post("/register/merchant", response_model=TokenResponse)
def register_merchant(data: MerchantRegister, db: Session = Depends(get_db)):
    norm_mobile = normalize_mobile(data.mobile)

    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please login instead."
        )
    if db.query(User).filter(User.mobile == norm_mobile).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this mobile number already exists. Please login instead."
        )

    new_user = User(
        email=data.email.lower(),
        mobile=norm_mobile,
        password_hash=get_password_hash(data.password),
        full_name=data.contact_person.strip(),
        role="merchant",
        is_active=True,
        is_verified=True
    )
    db.add(new_user)
    db.flush()

    merchant_profile = MerchantProfile(
        user_id=new_user.id,
        farm_or_shop_name=data.farm_or_shop_name.strip(),
        contact_person=data.contact_person.strip(),
        farm_address=data.farm_address,
        village=data.village,
        district=data.district,
        state=data.state,
        categories_offered=data.categories_offered,
        latitude=data.latitude,
        longitude=data.longitude,
        verification_status="approved",  # Pre-approve for seamless farmer onboarding test
        business_document_note=data.business_document_note
    )
    db.add(merchant_profile)

    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user_profile(new_user)}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    ident = data.identifier.strip().lower()
    norm_ident = normalize_mobile(data.identifier)

    # Search by email or mobile
    user = db.query(User).filter(
        or_(
            User.email == ident,
            User.mobile == norm_ident,
            User.mobile == data.identifier.strip()
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found. Please check your email or mobile number."
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again or use Forgot Password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Please contact Farm2Home support."
        )

    # Role check if explicitly passed from role card
    if data.role and user.role != data.role:
        role_labels = {
            "customer": "Customer / Buyer",
            "merchant": "Farmer / Merchant",
            "management": "Administrator / Management"
        }
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as a {role_labels.get(user.role, user.role)}, not {role_labels.get(data.role, data.role)}. Please choose the correct login option."
        )

    expires = timedelta(days=7) if data.remember_me else timedelta(hours=24)
    token = create_access_token(data={"sub": str(user.id), "role": user.role}, expires_delta=expires)

    return {"access_token": token, "token_type": "bearer", "user": serialize_user_profile(user)}


# Demo OTP flow
@router.post("/otp/send")
def send_demo_otp(data: DemoOTPRequest, db: Session = Depends(get_db)):
    norm_mobile = normalize_mobile(data.mobile)
    if len(norm_mobile) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid 10-digit mobile number."
        )

    # Development demo OTP
    demo_otp = "123456"
    DEMO_OTP_STORE[norm_mobile] = {
        "otp": demo_otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "role": data.role or "customer"
    }

    return {
        "success": True,
        "mobile": norm_mobile,
        "message": f"[DEMO SIMULATION] Your verification code is: {demo_otp}. (No real SMS was dispatched).",
        "demo_code": demo_otp
    }


@router.post("/otp/verify", response_model=TokenResponse)
def verify_demo_otp(data: DemoOTPVerify, db: Session = Depends(get_db)):
    norm_mobile = normalize_mobile(data.mobile)
    record = DEMO_OTP_STORE.get(norm_mobile)

    # Allow universal demo code 123456 or stored OTP
    if not (data.otp == "123456" or (record and record["otp"] == data.otp.strip())):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please enter 123456 for demo login."
        )

    # Find existing user or create temporary customer demo account
    user = db.query(User).filter(User.mobile == norm_mobile).first()
    if not user:
        # Auto-create demo customer user for quick farmer/buyer testing
        role = data.role or "customer"
        user = User(
            email=f"user_{norm_mobile[-6:]}@farm2home.demo",
            mobile=norm_mobile,
            password_hash=get_password_hash("DemoPass123!"),
            full_name=f"Farmer/Buyer ({norm_mobile[-4:]})",
            role=role,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.flush()

        if role == "customer":
            cp = CustomerProfile(
                user_id=user.id,
                default_address="Plot 42, Green Valley Farm Road",
                village_town="Kisan Nagar",
                district="Rangareddy",
                state="Telangana"
            )
            db.add(cp)
            addr = Address(
                user_id=user.id,
                label="Home",
                recipient_name=user.full_name,
                mobile=norm_mobile,
                address_line="Plot 42, Green Valley Farm Road",
                village_town="Kisan Nagar",
                district="Rangareddy",
                state="Telangana",
                pincode="501504",
                is_default=True
            )
            db.add(addr)
        elif role == "merchant":
            mp = MerchantProfile(
                user_id=user.id,
                farm_or_shop_name=f"Farm Fresh Organics ({norm_mobile[-4:]})",
                contact_person=user.full_name,
                farm_address="Survey No. 88, Near Canal",
                village="Krishi Gramam",
                district="Rangareddy",
                state="Telangana",
                verification_status="approved"
            )
            db.add(mp)

        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user_profile(user)}


@router.post("/email/verify/send")
def send_demo_email_verify(data: DemoEmailVerifyRequest):
    code = "789123"
    DEMO_EMAIL_STORE[data.email.lower()] = {
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=15)
    }
    return {
        "success": True,
        "email": data.email,
        "message": f"[DEMO SIMULATION] Verification email dispatched. Demo code is: {code}.",
        "demo_code": code
    }


@router.post("/email/verify/confirm")
def confirm_demo_email(data: DemoEmailVerifyConfirm, db: Session = Depends(get_db)):
    record = DEMO_EMAIL_STORE.get(data.email.lower())
    if not (data.code == "789123" or (record and record["code"] == data.code.strip())):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email verification code. Use demo code 789123."
        )

    user = db.query(User).filter(User.email == data.email.lower()).first()
    if user:
        user.is_verified = True
        db.commit()

    return {"success": True, "message": "Email address verified successfully!"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    ident = data.identifier.strip().lower()
    norm_ident = normalize_mobile(data.identifier)

    user = db.query(User).filter(
        or_(
            User.email == ident,
            User.mobile == norm_ident,
            User.mobile == data.identifier.strip()
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email or mobile number."
        )

    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"success": True, "message": "Password updated successfully. You can now login with your new password."}


@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    return serialize_user_profile(current_user)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"success": True, "message": "Logged out successfully."}
