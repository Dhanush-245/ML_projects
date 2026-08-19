from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db, User
import hashlib
import secrets
import random
from datetime import datetime, timedelta

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class UserRegisterRequest(BaseModel):
    username: str
    email: str
    phone_number: str | None = None
    full_name: str
    password: str

class UserLoginRequest(BaseModel):
    username_or_email_or_phone: str
    password: str

class RequestOTPRequest(BaseModel):
    contact: str  # Email or Phone Number

class VerifyOTPRequest(BaseModel):
    contact: str
    otp_code: str

class ResetPasswordRequest(BaseModel):
    contact: str
    otp_code: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    phone_number: str | None = None
    full_name: str
    role: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    identifier_user = db.query(User).filter(
        (User.username == req.username) | 
        (User.email == req.email) | 
        (req.phone_number and User.phone_number == req.phone_number)
    ).first()

    if identifier_user:
        if identifier_user.username == req.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken. Please choose another username."
            )
        elif identifier_user.email == req.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered. Please sign in instead."
            )
        elif req.phone_number and identifier_user.phone_number == req.phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered. Please sign in instead."
            )

    new_user = User(
        username=req.username,
        email=req.email,
        phone_number=req.phone_number,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        role="Admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = secrets.token_hex(24)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "phone_number": new_user.phone_number,
            "full_name": new_user.full_name,
            "role": new_user.role,
        }
    }

@router.post("/login", response_model=AuthTokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    identifier = req.username_or_email_or_phone.strip()
    
    # Query database by username, email, or phone_number
    user = db.query(User).filter(
        (User.username == identifier) | 
        (User.email == identifier) |
        (User.phone_number == identifier)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not registered. Please create an account."
        )

    if user.hashed_password != hash_password(req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please check your password and try again."
        )

    token = secrets.token_hex(24)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "role": user.role,
        }
    }

@router.post("/forgot-password/request-otp")
def request_otp(req: RequestOTPRequest, db: Session = Depends(get_db)):
    contact = req.contact.strip()
    user = db.query(User).filter(
        (User.email == contact) | (User.phone_number == contact) | (User.username == contact)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found matching this email or phone number. Please check or register."
        )

    # Generate 6-digit OTP code valid for 2 minutes (120 seconds)
    otp = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=2)

    user.otp_code = otp
    user.otp_expires_at = expires_at
    db.commit()

    destination_type = "phone number" if (contact.startswith("+") or contact.isdigit()) else "email"

    return {
        "status": "success",
        "message": f"One-Time Password (OTP) dispatched to your {destination_type}. Code is valid for 2 minutes.",
        "otp_code": otp,  # Included for dev/demo visibility
        "expires_in_seconds": 120,
        "contact": contact
    }

@router.post("/forgot-password/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    contact = req.contact.strip()
    user = db.query(User).filter(
        (User.email == contact) | (User.phone_number == contact) | (User.username == contact)
    ).first()

    if not user or not user.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request or no OTP pending. Please request a new OTP."
        )

    # Check expiration (valid for 2 minutes)
    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        user.otp_code = None
        user.otp_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired (valid for 2 minutes). Please request a new OTP."
        )

    if user.otp_code != req.otp_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please enter the correct 6-digit code."
        )

    return {
        "status": "verified",
        "message": "OTP verified successfully. You can now set your new password."
    }

@router.post("/forgot-password/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    contact = req.contact.strip()
    user = db.query(User).filter(
        (User.email == contact) | (User.phone_number == contact) | (User.username == contact)
    ).first()

    if not user or not user.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session expired or invalid reset request."
        )

    # Verify OTP again
    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired (valid for 2 minutes). Please request a new OTP."
        )

    if user.otp_code != req.otp_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code."
        )

    user.hashed_password = hash_password(req.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    return {
        "status": "success",
        "message": "Password successfully reset! You can now sign in with your new password."
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_info():
    return {
        "id": 1,
        "username": "dhanush",
        "email": "dhanush@automlstudio.ai",
        "phone_number": "+1 555-019-2834",
        "full_name": "Lingareddy Dhanushkumar",
        "role": "Admin"
    }
