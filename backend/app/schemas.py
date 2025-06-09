"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from models import UserRole, AssetCategory, AssetStatus, OperationType

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# Authentication schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"

class TokenData(BaseModel):
    email: Optional[str] = None
    company_id: Optional[int] = None
    role: Optional[UserRole] = None

# Company schemas
class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    inn: str = Field(..., min_length=10, max_length=12)
    email: EmailStr
    address: Optional[str] = None

class CompanyCreate(CompanyBase):
    admin_email: EmailStr
    admin_username: str = Field(..., min_length=2, max_length=100)
    admin_password: str = Field(..., min_length=6)

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class CompanyResponse(CompanyBase, BaseSchema):
    id: int
    created_at: datetime
    is_active: bool

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=100)
    role: UserRole

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None

class UserResponse(UserBase, BaseSchema):
    id: int
    company_id: int
    created_at: datetime
    last_login: Optional[datetime]
    is_active: bool

# Branch schemas
class BranchBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    address: Optional[str] = None

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = None
    is_active: Optional[bool] = None

class BranchResponse(BranchBase, BaseSchema):
    id: int
    company_id: int
    created_at: datetime
    is_active: bool

# Warehouse schemas
class WarehouseBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    address: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    branch_id: int

class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = None
    branch_id: Optional[int] = None
    is_active: Optional[bool] = None

class WarehouseResponse(WarehouseBase, BaseSchema):
    id: int
    branch_id: int
    created_at: datetime
    is_active: bool
    branch: Optional[BranchResponse] = None

# Asset schemas
class AssetBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: AssetCategory
    cost: float = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    status: AssetStatus = AssetStatus.ACTIVE
    serial_number: Optional[str] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None

class AssetCreate(AssetBase):
    warehouse_id: int
    purchase_date: Optional[datetime] = None
    warranty_until: Optional[datetime] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[AssetCategory] = None
    cost: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, gt=0)
    status: Optional[AssetStatus] = None
    warehouse_id: Optional[int] = None
    serial_number: Optional[str] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_until: Optional[datetime] = None
    is_active: Optional[bool] = None

class AssetResponse(AssetBase, BaseSchema):
    id: int
    inventory_number: str
    warehouse_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    is_active: bool
    purchase_date: Optional[datetime]
    warranty_until: Optional[datetime]
    warehouse: Optional[WarehouseResponse] = None

# Asset Operation schemas
class AssetOperationBase(BaseModel):
    type: OperationType
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = None
    notes: Optional[str] = None
    document_number: Optional[str] = None

class AssetOperationCreate(AssetOperationBase):
    asset_id: int
    from_warehouse_id: Optional[int] = None
    to_warehouse_id: Optional[int] = None
    cost_before: Optional[float] = None
    cost_after: Optional[float] = None

    @validator('to_warehouse_id')
    def validate_warehouses(cls, v, values):
        if values.get('type') == OperationType.TRANSFER and not v:
            raise ValueError('to_warehouse_id is required for transfer operations')
        return v

class AssetOperationResponse(AssetOperationBase, BaseSchema):
    id: int
    asset_id: int
    user_id: int
    from_warehouse_id: Optional[int]
    to_warehouse_id: Optional[int]
    operation_date: datetime
    cost_before: Optional[float]
    cost_after: Optional[float]
    created_at: datetime
    asset: Optional[AssetResponse] = None
    user: Optional[UserResponse] = None
    from_warehouse: Optional[WarehouseResponse] = None
    to_warehouse: Optional[WarehouseResponse] = None

# Dashboard schemas
class DashboardStats(BaseModel):
    total_assets: int
    total_value: float
    operations_today: int
    active_warehouses: int
    monthly_growth: float

class AssetCategoryStats(BaseModel):
    category: AssetCategory
    count: int
    value: float
    percentage: float

class MonthlyOperationStats(BaseModel):
    month: str
    receipt: int
    transfer: int
    disposal: int
    adjustment: int

class DashboardData(BaseModel):
    stats: DashboardStats
    category_stats: List[AssetCategoryStats]
    monthly_operations: List[MonthlyOperationStats]
    recent_operations: List[AssetOperationResponse]

# Report schemas
class ReportFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    warehouse_ids: Optional[List[int]] = None
    category: Optional[AssetCategory] = None
    status: Optional[AssetStatus] = None

class AssetReport(BaseModel):
    filters: ReportFilter
    assets: List[AssetResponse]
    total_count: int
    total_value: float

class OperationReport(BaseModel):
    filters: ReportFilter
    operations: List[AssetOperationResponse]
    total_count: int
    summary_by_type: dict

# Pagination schemas
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(10, ge=1, le=100)
    search: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = Field("asc", regex="^(asc|desc)$")

class PaginatedResponse(BaseModel):
    items: List[BaseSchema]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool

# Bulk operation schemas
class BulkAssetUpdate(BaseModel):
    asset_ids: List[int] = Field(..., min_items=1)
    updates: AssetUpdate

class BulkOperationCreate(BaseModel):
    asset_ids: List[int] = Field(..., min_items=1)
    operation: AssetOperationCreate

# Export schemas
class ExportRequest(BaseModel):
    format: str = Field("excel", regex="^(excel|csv)$")
    filters: Optional[ReportFilter] = None
    include_operations: bool = False

# Error response schema
class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

# Health check schema
class HealthCheck(BaseModel):
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)
    database: str = "connected"
    version: str = "1.0.0"

# Update forward references
Token.model_rebuild()
AssetOperationResponse.model_rebuild()
WarehouseResponse.model_rebuild()