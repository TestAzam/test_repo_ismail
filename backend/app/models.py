"""
SQLAlchemy models for Asset Management Platform
Supports multi-tenancy with company isolation
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# Enums for fixed choices
class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    ACCOUNTANT = "Accountant"
    WAREHOUSE_KEEPER = "Warehouse_keeper"
    OBSERVER = "Observer"

class AssetCategory(str, enum.Enum):
    FIXED_ASSETS = "Fixed Assets"
    MATERIALS = "Materials"
    GOODS = "Goods"
    INVENTORY = "Inventory"

class AssetStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    REPAIR = "Repair"
    DISPOSED = "Disposed"

class OperationType(str, enum.Enum):
    RECEIPT = "Receipt"
    TRANSFER = "Transfer"
    DISPOSAL = "Disposal"
    ADJUSTMENT = "Adjustment"

# Company model - root of multi-tenancy
class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    inn = Column(String(12), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False)
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    branches = relationship("Branch", back_populates="company", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    company = relationship("Company", back_populates="users")
    operations = relationship("AssetOperation", back_populates="user")

class Branch(Base):
    __tablename__ = "branches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(Text)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    company = relationship("Company", back_populates="branches")
    warehouses = relationship("Warehouse", back_populates="branch", cascade="all, delete-orphan")

class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(Text)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    branch = relationship("Branch", back_populates="warehouses")
    assets = relationship("Asset", back_populates="warehouse", cascade="all, delete-orphan")
    operations_from = relationship("AssetOperation", foreign_keys="AssetOperation.from_warehouse_id", back_populates="from_warehouse")
    operations_to = relationship("AssetOperation", foreign_keys="AssetOperation.to_warehouse_id", back_populates="to_warehouse")

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    category = Column(Enum(AssetCategory), nullable=False, index=True)
    cost = Column(Float, nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    status = Column(Enum(AssetStatus), nullable=False, default=AssetStatus.ACTIVE, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)
    
    # Additional fields
    serial_number = Column(String(100), index=True)
    purchase_date = Column(DateTime(timezone=True))
    warranty_until = Column(DateTime(timezone=True))
    supplier = Column(String(255))
    notes = Column(Text)
    
    # Relationships
    warehouse = relationship("Warehouse", back_populates="assets")
    operations = relationship("AssetOperation", back_populates="asset", cascade="all, delete-orphan")

class AssetOperation(Base):
    __tablename__ = "asset_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(OperationType), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    
    # Warehouse movement tracking
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    
    # Operation details
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    operation_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    reason = Column(String(255))
    notes = Column(Text)
    document_number = Column(String(100), index=True)
    
    # Cost tracking for adjustments
    cost_before = Column(Float)
    cost_after = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="operations")
    user = relationship("User", back_populates="operations")
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id], back_populates="operations_from")
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id], back_populates="operations_to")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    resource_type = Column(String(50), nullable=False, index=True)  # Asset, User, Warehouse, etc.
    resource_id = Column(Integer, index=True)
    old_values = Column(Text)  # JSON string of old values
    new_values = Column(Text)  # JSON string of new values
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    company = relationship("Company")