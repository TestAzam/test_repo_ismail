"""
JWT Authentication and Authorization
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole
from schemas import TokenData
import logging

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Security scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        company_id: int = payload.get("company_id")
        role: str = payload.get("role")
        
        if email is None or company_id is None or role is None:
            return None
            
        token_data = TokenData(
            email=email,
            company_id=company_id,
            role=UserRole(role)
        )
        return token_data
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        return None

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password"""
    user = db.query(User).filter(
        User.email == email,
        User.is_active == True
    ).first()
    
    if not user or not verify_password(password, user.hashed_password):
        return None
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials.credentials:
        raise credentials_exception
    
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        raise credentials_exception
    
    user = db.query(User).filter(
        User.email == token_data.email,
        User.company_id == token_data.company_id,
        User.is_active == True
    ).first()
    
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

# Role-based access decorators
def require_role(allowed_roles: Union[UserRole, list]):
    """Decorator to require specific roles"""
    if isinstance(allowed_roles, UserRole):
        allowed_roles = [allowed_roles]
    
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    
    return role_checker

# Specific role dependencies
require_admin = require_role([UserRole.ADMIN])
require_admin_or_accountant = require_role([UserRole.ADMIN, UserRole.ACCOUNTANT])
require_warehouse_access = require_role([UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.WAREHOUSE_KEEPER])
require_read_access = require_role([UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.WAREHOUSE_KEEPER, UserRole.OBSERVER])

# Multi-tenancy middleware
class MultiTenantMiddleware:
    """Middleware to ensure data isolation between companies"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Skip authentication for public endpoints
            public_paths = ["/", "/docs", "/redoc", "/openapi.json", "/health", "/auth/login", "/auth/register"]
            if any(request.url.path.startswith(path) for path in public_paths):
                await self.app(scope, receive, send)
                return
            
            # Extract and validate company_id from token
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                token_data = verify_token(token)
                if token_data:
                    # Add company_id to request state for use in CRUD operations
                    request.state.company_id = token_data.company_id
                    request.state.user_role = token_data.role
        
        await self.app(scope, receive, send)

def get_company_id(request: Request) -> int:
    """Get company_id from request state"""
    company_id = getattr(request.state, 'company_id', None)
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Company context not found"
        )
    return company_id

def get_user_role(request: Request) -> UserRole:
    """Get user role from request state"""
    role = getattr(request.state, 'user_role', None)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User role not found"
        )
    return role

# Company-aware database dependency
def get_company_db(request: Request, db: Session = Depends(get_db)):
    """Database session with company context"""
    company_id = get_company_id(request)
    db.company_id = company_id  # Attach company_id to session for CRUD operations
    return db