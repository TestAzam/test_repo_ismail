"""
FastAPI main application for Asset Management Platform
"""
import os
from datetime import timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db, init_database
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    require_admin, require_admin_or_accountant, require_warehouse_access, require_read_access,
    MultiTenantMiddleware, get_company_db, ACCESS_TOKEN_EXPIRE_MINUTES
)
from crud import *
from schemas import *
from utils import ExcelExporter
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Asset Management Platform",
    description="Multi-tenant SaaS platform for managing company assets",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Multi-tenant middleware
app.add_middleware(MultiTenantMiddleware)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database connection and tables"""
    try:
        init_database()
        logger.info("Application started successfully!")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

# Health check endpoint
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck()

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Asset Management Platform API", "status": "running"}

# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

@app.post("/auth/register", response_model=CompanyResponse)
async def register_company(company_data: CompanyCreate, db: Session = Depends(get_db)):
    """Register new company with admin user"""
    # Check if company with INN already exists
    existing_company = company_crud.get_by_inn(db, company_data.inn)
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this INN already exists"
        )
    
    # Check if admin email already exists
    existing_user = user_crud.get_by_email(db, company_data.admin_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    try:
        company = company_crud.create_with_admin(db, company_data)
        return company
    except Exception as e:
        logger.error(f"Error creating company: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating company"
        )

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    user = authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "company_id": user.company_id,
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.from_orm(user)
    )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

# ==========================================
# DASHBOARD ROUTES
# ==========================================

@app.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Get dashboard data with statistics and charts"""
    company_id = db.company_id
    
    # Get dashboard statistics
    stats = dashboard_crud.get_stats(db, company_id)
    category_stats = dashboard_crud.get_category_stats(db, company_id)
    
    # Get recent operations (last 10)
    recent_operations = operation_crud.get_by_company(db, company_id, skip=0, limit=10)
    
    # Mock monthly operations data (in production, calculate from actual data)
    monthly_operations = [
        MonthlyOperationStats(month="Янв", receipt=120, transfer=80, disposal=20, adjustment=15),
        MonthlyOperationStats(month="Фев", receipt=140, transfer=95, disposal=15, adjustment=20),
        MonthlyOperationStats(month="Мар", receipt=160, transfer=110, disposal=25, adjustment=18),
        MonthlyOperationStats(month="Апр", receipt=180, transfer=120, disposal=30, adjustment=22),
        MonthlyOperationStats(month="Май", receipt=200, transfer=140, disposal=35, adjustment=25),
        MonthlyOperationStats(month="Июн", receipt=220, transfer=160, disposal=28, adjustment=30)
    ]
    
    return DashboardData(
        stats=stats,
        category_stats=category_stats,
        monthly_operations=monthly_operations,
        recent_operations=[AssetOperationResponse.from_orm(op) for op in recent_operations]
    )

# ==========================================
# ASSET ROUTES
# ==========================================

@app.get("/assets", response_model=PaginatedResponse)
async def get_assets(
    request: Request,
    page: int = 1,
    size: int = 10,
    search: Optional[str] = None,
    category: Optional[AssetCategory] = None,
    status: Optional[AssetStatus] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Get paginated list of assets with filters"""
    company_id = db.company_id
    skip = (page - 1) * size
    
    # Get assets with filters
    assets = asset_crud.get_by_company(
        db, company_id, skip=skip, limit=size,
        search=search, category=category, status=status, warehouse_id=warehouse_id
    )
    
    # Get total count
    total = asset_crud.count_by_company(
        db, company_id,
        search=search, category=category, status=status, warehouse_id=warehouse_id
    )
    
    # Calculate pagination info
    pages = (total + size - 1) // size
    has_next = page < pages
    has_prev = page > 1
    
    return PaginatedResponse(
        items=[AssetResponse.from_orm(asset) for asset in assets],
        total=total,
        page=page,
        size=size,
        pages=pages,
        has_next=has_next,
        has_prev=has_prev
    )

@app.post("/assets", response_model=AssetResponse)
async def create_asset(
    asset_data: AssetCreate,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_warehouse_access)
):
    """Create new asset"""
    company_id = db.company_id
    
    try:
        asset = asset_crud.create(db, asset_data, company_id)
        return AssetResponse.from_orm(asset)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Get asset by ID"""
    company_id = db.company_id
    
    asset = db.query(Asset).join(Warehouse).join(Branch).filter(
        Asset.id == asset_id,
        Branch.company_id == company_id,
        Asset.is_active == True
    ).first()
    
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    
    return AssetResponse.from_orm(asset)

@app.put("/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_warehouse_access)
):
    """Update asset"""
    company_id = db.company_id
    
    try:
        asset = asset_crud.update(db, asset_id, asset_data, company_id)
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        return AssetResponse.from_orm(asset)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: int,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_admin_or_accountant)
):
    """Soft delete asset"""
    company_id = db.company_id
    
    asset = db.query(Asset).join(Warehouse).join(Branch).filter(
        Asset.id == asset_id,
        Branch.company_id == company_id,
        Asset.is_active == True
    ).first()
    
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    
    asset.is_active = False
    db.commit()
    
    return {"message": "Asset deleted successfully"}

# ==========================================
# OPERATIONS ROUTES
# ==========================================

@app.get("/operations", response_model=List[AssetOperationResponse])
async def get_operations(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    operation_type: Optional[OperationType] = None,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_warehouse_access)
):
    """Get list of operations"""
    company_id = db.company_id
    
    operations = operation_crud.get_by_company(
        db, company_id, skip=skip, limit=limit, operation_type=operation_type
    )
    
    return [AssetOperationResponse.from_orm(op) for op in operations]

@app.post("/operations", response_model=AssetOperationResponse)
async def create_operation(
    operation_data: AssetOperationCreate,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_warehouse_access)
):
    """Create new asset operation"""
    company_id = db.company_id
    
    try:
        operation = operation_crud.create(db, operation_data, current_user.id, company_id)
        return AssetOperationResponse.from_orm(operation)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ==========================================
# WAREHOUSE ROUTES
# ==========================================

@app.get("/warehouses", response_model=List[WarehouseResponse])
async def get_warehouses(
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Get list of warehouses"""
    company_id = db.company_id
    warehouses = warehouse_crud.get_by_company(db, company_id)
    return [WarehouseResponse.from_orm(w) for w in warehouses]

@app.post("/warehouses", response_model=WarehouseResponse)
async def create_warehouse(
    warehouse_data: WarehouseCreate,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_admin_or_accountant)
):
    """Create new warehouse"""
    company_id = db.company_id
    
    try:
        warehouse = warehouse_crud.create(db, warehouse_data, company_id)
        return WarehouseResponse.from_orm(warehouse)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ==========================================
# BRANCH ROUTES
# ==========================================

@app.get("/branches", response_model=List[BranchResponse])
async def get_branches(
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Get list of branches"""
    company_id = db.company_id
    branches = branch_crud.get_by_company(db, company_id)
    return [BranchResponse.from_orm(b) for b in branches]

@app.post("/branches", response_model=BranchResponse)
async def create_branch(
    branch_data: BranchCreate,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_admin)
):
    """Create new branch (Admin only)"""
    company_id = db.company_id
    branch = branch_crud.create(db, branch_data, company_id)
    return BranchResponse.from_orm(branch)

# ==========================================
# USER ROUTES
# ==========================================

@app.get("/users", response_model=List[UserResponse])
async def get_users(
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_admin)
):
    """Get list of users (Admin only)"""
    company_id = db.company_id
    users = user_crud.get_users_by_company(db, company_id)
    return [UserResponse.from_orm(u) for u in users]

@app.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_admin)
):
    """Create new user (Admin only)"""
    company_id = db.company_id
    
    # Check if user with email already exists
    existing_user = user_crud.get_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user = user_crud.create(db, user_data, company_id)
    return UserResponse.from_orm(user)

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_admin)
):
    """Update user (Admin only)"""
    user = user_crud.update(db, user_id, user_data, current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.from_orm(user)

# ==========================================
# EXPORT ROUTES
# ==========================================

@app.get("/export/assets")
async def export_assets(
    request: Request,
    format: str = "excel",
    category: Optional[AssetCategory] = None,
    status: Optional[AssetStatus] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Export assets to Excel or CSV"""
    company_id = db.company_id
    
    # Get company name for report header
    company = db.query(Company).filter(Company.id == company_id).first()
    company_name = company.name if company else "Company"
    
    # Get all assets with filters
    assets = asset_crud.get_by_company(
        db, company_id, skip=0, limit=10000,  # Large limit for export
        category=category, status=status, warehouse_id=warehouse_id
    )
    
    if format.lower() == "excel":
        # Create Excel export
        exporter = ExcelExporter()
        excel_buffer = exporter.create_assets_report(assets, company_name)
        
        # Create filename
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"assets_export_{timestamp}.xlsx"
        
        # Return Excel file
        return StreamingResponse(
            io.BytesIO(excel_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel format is currently supported"
        )

@app.get("/export/operations")
async def export_operations(
    request: Request,
    format: str = "excel",
    operation_type: Optional[OperationType] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Export operations to Excel or CSV"""
    company_id = db.company_id
    
    # Parse dates if provided
    start_dt = None
    end_dt = None
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid end_date format")
    
    # Get company name for report header
    company = db.query(Company).filter(Company.id == company_id).first()
    company_name = company.name if company else "Company"
    
    # Get all operations with filters
    operations = operation_crud.get_by_company(
        db, company_id, skip=0, limit=10000,  # Large limit for export
        operation_type=operation_type, start_date=start_dt, end_date=end_dt
    )
    
    if format.lower() == "excel":
        # Create Excel export
        exporter = ExcelExporter()
        excel_buffer = exporter.create_operations_report(operations, company_name)
        
        # Create filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"operations_export_{timestamp}.xlsx"
        
        # Return Excel file
        return StreamingResponse(
            io.BytesIO(excel_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel format is currently supported"
        )

# ==========================================
# BULK OPERATIONS ROUTES
# ==========================================

@app.post("/assets/bulk-update")
async def bulk_update_assets(
    bulk_data: BulkAssetUpdate,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_admin_or_accountant)
):
    """Bulk update multiple assets"""
    company_id = db.company_id
    updated_assets = []
    
    for asset_id in bulk_data.asset_ids:
        try:
            asset = asset_crud.update(db, asset_id, bulk_data.updates, company_id)
            if asset:
                updated_assets.append(asset)
        except Exception as e:
            logger.warning(f"Failed to update asset {asset_id}: {e}")
    
    return {
        "message": f"Updated {len(updated_assets)} assets successfully",
        "updated_count": len(updated_assets),
        "total_requested": len(bulk_data.asset_ids)
    }

# ==========================================
# REPORTS ROUTES
# ==========================================

@app.post("/reports/assets", response_model=AssetReport)
async def generate_asset_report(
    filters: ReportFilter,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Generate detailed asset report with filters"""
    company_id = db.company_id
    
    # Get assets with filters
    assets = asset_crud.get_by_company(
        db, company_id, skip=0, limit=10000,
        category=filters.category, status=filters.status,
        warehouse_id=filters.warehouse_ids[0] if filters.warehouse_ids else None
    )
    
    # Calculate total value
    total_value = sum(asset.cost * asset.quantity for asset in assets)
    
    return AssetReport(
        filters=filters,
        assets=[AssetResponse.from_orm(asset) for asset in assets],
        total_count=len(assets),
        total_value=total_value
    )

@app.post("/reports/operations", response_model=OperationReport)
async def generate_operation_report(
    filters: ReportFilter,
    request: Request,
    db: Session = Depends(get_company_db),
    current_user: User = Depends(require_read_access)
):
    """Generate detailed operation report with filters"""
    company_id = db.company_id
    
    # Get operations with filters
    operations = operation_crud.get_by_company(
        db, company_id, skip=0, limit=10000,
        start_date=filters.start_date, end_date=filters.end_date
    )
    
    # Calculate summary by type
    summary_by_type = {}
    for op_type in OperationType:
        count = sum(1 for op in operations if op.type == op_type)
        summary_by_type[op_type.value] = count
    
    return OperationReport(
        filters=filters,
        operations=[AssetOperationResponse.from_orm(op) for op in operations],
        total_count=len(operations),
        summary_by_type=summary_by_type
    )

# ==========================================
# ERROR HANDLERS
# ==========================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return {"detail": exc.detail, "status_code": exc.status_code}

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {exc}")
    return {"detail": "Internal server error", "status_code": 500}

# ==========================================
# STARTUP MESSAGE
# ==========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )