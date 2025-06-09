"""
CRUD operations with multi-tenancy support
All operations automatically filter by company_id for data isolation
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta
from models import *
from schemas import *
from auth import get_password_hash
from utils import generate_unique_inventory_number, log_audit_action
import logging

logger = logging.getLogger(__name__)

class CRUDBase:
    """Base CRUD class with multi-tenancy support"""
    
    def __init__(self, model):
        self.model = model
    
    def get_company_filter(self, db: Session, company_id: int = None):
        """Get company filter for queries"""
        if company_id is None:
            company_id = getattr(db, 'company_id', None)
        
        if company_id is None:
            raise ValueError("Company ID is required for data isolation")
        
        return company_id

# Company CRUD
class CRUDCompany(CRUDBase):
    def __init__(self):
        super().__init__(Company)
    
    def create_with_admin(self, db: Session, company_data: CompanyCreate) -> Company:
        """Create company with admin user"""
        # Create company
        company = Company(
            name=company_data.name,
            inn=company_data.inn,
            email=company_data.email,
            address=company_data.address
        )
        db.add(company)
        db.flush()  # Get company ID
        
        # Create admin user
        admin_user = User(
            email=company_data.admin_email,
            username=company_data.admin_username,
            hashed_password=get_password_hash(company_data.admin_password),
            role=UserRole.ADMIN,
            company_id=company.id
        )
        db.add(admin_user)
        db.commit()
        db.refresh(company)
        
        logger.info(f"Created company {company.name} with admin {admin_user.email}")
        return company
    
    def get_by_inn(self, db: Session, inn: str) -> Optional[Company]:
        """Get company by INN"""
        return db.query(Company).filter(Company.inn == inn, Company.is_active == True).first()

# User CRUD
class CRUDUser(CRUDBase):
    def __init__(self):
        super().__init__(User)
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email, User.is_active == True).first()
    
    def create(self, db: Session, user_data: UserCreate, company_id: int) -> User:
        """Create user"""
        user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role,
            company_id=company_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        log_audit_action(user.id, company_id, "CREATE", "User", user.id, db=db)
        return user
    
    def get_users_by_company(self, db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users by company"""
        return db.query(User).filter(
            User.company_id == company_id,
            User.is_active == True
        ).offset(skip).limit(limit).all()
    
    def update(self, db: Session, user_id: int, user_data: UserUpdate, current_user: User) -> Optional[User]:
        """Update user"""
        user = db.query(User).filter(
            User.id == user_id,
            User.company_id == current_user.company_id,
            User.is_active == True
        ).first()
        
        if not user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        if 'password' in update_data:
            update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        log_audit_action(current_user.id, current_user.company_id, "UPDATE", "User", user.id, db=db)
        return user

# Branch CRUD
class CRUDBranch(CRUDBase):
    def __init__(self):
        super().__init__(Branch)
    
    def create(self, db: Session, branch_data: BranchCreate, company_id: int) -> Branch:
        """Create branch"""
        branch = Branch(
            name=branch_data.name,
            address=branch_data.address,
            company_id=company_id
        )
        db.add(branch)
        db.commit()
        db.refresh(branch)
        return branch
    
    def get_by_company(self, db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[Branch]:
        """Get branches by company"""
        return db.query(Branch).filter(
            Branch.company_id == company_id,
            Branch.is_active == True
        ).offset(skip).limit(limit).all()
    
    def update(self, db: Session, branch_id: int, branch_data: BranchUpdate, company_id: int) -> Optional[Branch]:
        """Update branch"""
        branch = db.query(Branch).filter(
            Branch.id == branch_id,
            Branch.company_id == company_id,
            Branch.is_active == True
        ).first()
        
        if not branch:
            return None
        
        update_data = branch_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(branch, field, value)
        
        db.commit()
        db.refresh(branch)
        return branch

# Warehouse CRUD
class CRUDWarehouse(CRUDBase):
    def __init__(self):
        super().__init__(Warehouse)
    
    def create(self, db: Session, warehouse_data: WarehouseCreate, company_id: int) -> Warehouse:
        """Create warehouse"""
        # Verify branch belongs to company
        branch = db.query(Branch).filter(
            Branch.id == warehouse_data.branch_id,
            Branch.company_id == company_id,
            Branch.is_active == True
        ).first()
        
        if not branch:
            raise ValueError("Branch not found or doesn't belong to company")
        
        warehouse = Warehouse(
            name=warehouse_data.name,
            address=warehouse_data.address,
            branch_id=warehouse_data.branch_id
        )
        db.add(warehouse)
        db.commit()
        db.refresh(warehouse)
        return warehouse
    
    def get_by_company(self, db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[Warehouse]:
        """Get warehouses by company"""
        return db.query(Warehouse).join(Branch).filter(
            Branch.company_id == company_id,
            Warehouse.is_active == True,
            Branch.is_active == True
        ).options(joinedload(Warehouse.branch)).offset(skip).limit(limit).all()
    
    def get_by_branch(self, db: Session, branch_id: int, company_id: int) -> List[Warehouse]:
        """Get warehouses by branch"""
        return db.query(Warehouse).join(Branch).filter(
            Warehouse.branch_id == branch_id,
            Branch.company_id == company_id,
            Warehouse.is_active == True,
            Branch.is_active == True
        ).all()

# Asset CRUD
class CRUDAsset(CRUDBase):
    def __init__(self):
        super().__init__(Asset)
    
    def create(self, db: Session, asset_data: AssetCreate, company_id: int) -> Asset:
        """Create asset with auto-generated inventory number"""
        # Verify warehouse belongs to company
        warehouse = db.query(Warehouse).join(Branch).filter(
            Warehouse.id == asset_data.warehouse_id,
            Branch.company_id == company_id,
            Warehouse.is_active == True,
            Branch.is_active == True
        ).first()
        
        if not warehouse:
            raise ValueError("Warehouse not found or doesn't belong to company")
        
        # Generate unique inventory number
        inventory_number = generate_unique_inventory_number(db, company_id)
        
        asset = Asset(
            inventory_number=inventory_number,
            name=asset_data.name,
            description=asset_data.description,
            category=asset_data.category,
            cost=asset_data.cost,
            quantity=asset_data.quantity,
            status=asset_data.status,
            warehouse_id=asset_data.warehouse_id,
            serial_number=asset_data.serial_number,
            purchase_date=asset_data.purchase_date,
            warranty_until=asset_data.warranty_until,
            supplier=asset_data.supplier,
            notes=asset_data.notes
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset
    
    def get_by_company(self, db: Session, company_id: int, skip: int = 0, limit: int = 100, 
                      search: Optional[str] = None, category: Optional[AssetCategory] = None,
                      status: Optional[AssetStatus] = None, warehouse_id: Optional[int] = None) -> List[Asset]:
        """Get assets by company with filters"""
        query = db.query(Asset).join(Warehouse).join(Branch).filter(
            Branch.company_id == company_id,
            Asset.is_active == True,
            Warehouse.is_active == True,
            Branch.is_active == True
        ).options(
            joinedload(Asset.warehouse).joinedload(Warehouse.branch)
        )
        
        # Apply filters
        if search:
            query = query.filter(
                or_(
                    Asset.name.ilike(f"%{search}%"),
                    Asset.inventory_number.ilike(f"%{search}%"),
                    Asset.description.ilike(f"%{search}%")
                )
            )
        
        if category:
            query = query.filter(Asset.category == category)
        
        if status:
            query = query.filter(Asset.status == status)
        
        if warehouse_id:
            query = query.filter(Asset.warehouse_id == warehouse_id)
        
        return query.offset(skip).limit(limit).all()
    
    def count_by_company(self, db: Session, company_id: int, **filters) -> int:
        """Count assets by company with filters"""
        query = db.query(Asset).join(Warehouse).join(Branch).filter(
            Branch.company_id == company_id,
            Asset.is_active == True
        )
        
        # Apply same filters as get_by_company
        if filters.get('search'):
            search = filters['search']
            query = query.filter(
                or_(
                    Asset.name.ilike(f"%{search}%"),
                    Asset.inventory_number.ilike(f"%{search}%"),
                    Asset.description.ilike(f"%{search}%")
                )
            )
        
        if filters.get('category'):
            query = query.filter(Asset.category == filters['category'])
        
        if filters.get('status'):
            query = query.filter(Asset.status == filters['status'])
        
        if filters.get('warehouse_id'):
            query = query.filter(Asset.warehouse_id == filters['warehouse_id'])
        
        return query.count()
    
    def update(self, db: Session, asset_id: int, asset_data: AssetUpdate, company_id: int) -> Optional[Asset]:
        """Update asset"""
        asset = db.query(Asset).join(Warehouse).join(Branch).filter(
            Asset.id == asset_id,
            Branch.company_id == company_id,
            Asset.is_active == True
        ).first()
        
        if not asset:
            return None
        
        update_data = asset_data.dict(exclude_unset=True)
        
        # Verify new warehouse belongs to company if warehouse_id is being updated
        if 'warehouse_id' in update_data:
            warehouse = db.query(Warehouse).join(Branch).filter(
                Warehouse.id == update_data['warehouse_id'],
                Branch.company_id == company_id,
                Warehouse.is_active == True
            ).first()
            if not warehouse:
                raise ValueError("Warehouse not found or doesn't belong to company")
        
        for field, value in update_data.items():
            setattr(asset, field, value)
        
        asset.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(asset)
        return asset

# Asset Operation CRUD
class CRUDAssetOperation(CRUDBase):
    def __init__(self):
        super().__init__(AssetOperation)
    
    def create(self, db: Session, operation_data: AssetOperationCreate, user_id: int, company_id: int) -> AssetOperation:
        """Create asset operation"""
        # Verify asset belongs to company
        asset = db.query(Asset).join(Warehouse).join(Branch).filter(
            Asset.id == operation_data.asset_id,
            Branch.company_id == company_id,
            Asset.is_active == True
        ).first()
        
        if not asset:
            raise ValueError("Asset not found or doesn't belong to company")
        
        # Verify warehouses belong to company if specified
        if operation_data.from_warehouse_id:
            from_warehouse = db.query(Warehouse).join(Branch).filter(
                Warehouse.id == operation_data.from_warehouse_id,
                Branch.company_id == company_id,
                Warehouse.is_active == True
            ).first()
            if not from_warehouse:
                raise ValueError("From warehouse not found or doesn't belong to company")
        
        if operation_data.to_warehouse_id:
            to_warehouse = db.query(Warehouse).join(Branch).filter(
                Warehouse.id == operation_data.to_warehouse_id,
                Branch.company_id == company_id,
                Warehouse.is_active == True
            ).first()
            if not to_warehouse:
                raise ValueError("To warehouse not found or doesn't belong to company")
        
        operation = AssetOperation(
            type=operation_data.type,
            asset_id=operation_data.asset_id,
            quantity=operation_data.quantity,
            from_warehouse_id=operation_data.from_warehouse_id,
            to_warehouse_id=operation_data.to_warehouse_id,
            user_id=user_id,
            reason=operation_data.reason,
            notes=operation_data.notes,
            document_number=operation_data.document_number,
            cost_before=operation_data.cost_before,
            cost_after=operation_data.cost_after
        )
        
        db.add(operation)
        
        # Update asset based on operation type
        if operation_data.type == OperationType.TRANSFER and operation_data.to_warehouse_id:
            asset.warehouse_id = operation_data.to_warehouse_id
        elif operation_data.type == OperationType.DISPOSAL:
            asset.status = AssetStatus.DISPOSED
        elif operation_data.type == OperationType.ADJUSTMENT:
            if operation_data.cost_after:
                asset.cost = operation_data.cost_after
        
        db.commit()
        db.refresh(operation)
        return operation
    
    def get_by_company(self, db: Session, company_id: int, skip: int = 0, limit: int = 100,
                      operation_type: Optional[OperationType] = None,
                      start_date: Optional[datetime] = None,
                      end_date: Optional[datetime] = None) -> List[AssetOperation]:
        """Get operations by company with filters"""
        query = db.query(AssetOperation).join(Asset).join(Warehouse).join(Branch).filter(
            Branch.company_id == company_id,
            AssetOperation.is_active == True
        ).options(
            joinedload(AssetOperation.asset),
            joinedload(AssetOperation.user),
            joinedload(AssetOperation.from_warehouse),
            joinedload(AssetOperation.to_warehouse)
        )
        
        if operation_type:
            query = query.filter(AssetOperation.type == operation_type)
        
        if start_date:
            query = query.filter(AssetOperation.operation_date >= start_date)
        
        if end_date:
            query = query.filter(AssetOperation.operation_date <= end_date)
        
        return query.order_by(desc(AssetOperation.operation_date)).offset(skip).limit(limit).all()

# Dashboard CRUD
class CRUDDashboard:
    def get_stats(self, db: Session, company_id: int) -> DashboardStats:
        """Get dashboard statistics"""
        # Total assets
        total_assets = db.query(Asset).join(Warehouse).join(Branch).filter(
            Branch.company_id == company_id,
            Asset.is_active == True,
            Asset.status.in_([AssetStatus.ACTIVE, AssetStatus.INACTIVE, AssetStatus.REPAIR])
        ).count()
        
        # Total value
        total_value = db.query(func.sum(Asset.cost * Asset.quantity)).join(Warehouse).join(Branch).filter(
            Branch.company_id == company_id,
            Asset.is_active == True,
            Asset.status.in_([AssetStatus.ACTIVE, AssetStatus.INACTIVE, AssetStatus.REPAIR])
        ).scalar() or 0
        
        # Operations today
        today = datetime.now().date()
        operations_today = db.query(AssetOperation).join(Asset).join(Warehouse).join(Branch).filter(
            Branch.company_id == company_id,
            func.date(AssetOperation.operation_date) == today,
            AssetOperation.is_active == True
        ).count()
        
        # Active warehouses
        active_warehouses = db.query(Warehouse).join(Branch).filter(
            Branch.company_id == company_id,
            Warehouse.is_active == True,
            Branch.is_active == True
        ).count()
        
        return DashboardStats(
            total_assets=total_assets,
            total_value=float(total_value),
            operations_today=operations_today,
            active_warehouses=active_warehouses,
            monthly_growth=0.0  # TODO: Calculate actual growth
        )
    
    def get_category_stats(self, db: Session, company_id: int) -> List[AssetCategoryStats]:
        """Get asset statistics by category"""
        stats = []
        total_assets = 0
        total_value = 0
        
        # First pass to get totals
        for category in AssetCategory:
            count = db.query(Asset).join(Warehouse).join(Branch).filter(
                Branch.company_id == company_id,
                Asset.category == category,
                Asset.is_active == True,
                Asset.status.in_([AssetStatus.ACTIVE, AssetStatus.INACTIVE, AssetStatus.REPAIR])
            ).count()
            
            value = db.query(func.sum(Asset.cost * Asset.quantity)).join(Warehouse).join(Branch).filter(
                Branch.company_id == company_id,
                Asset.category == category,
                Asset.is_active == True,
                Asset.status.in_([AssetStatus.ACTIVE, AssetStatus.INACTIVE, AssetStatus.REPAIR])
            ).scalar() or 0
            
            total_assets += count
            total_value += float(value)
        
        # Second pass to calculate percentages
        for category in AssetCategory:
            count = db.query(Asset).join(Warehouse).join(Branch).filter(
                Branch.company_id == company_id,
                Asset.category == category,
                Asset.is_active == True,
                Asset.status.in_([AssetStatus.ACTIVE, AssetStatus.INACTIVE, AssetStatus.REPAIR])
            ).count()
            
            value = db.query(func.sum(Asset.cost * Asset.quantity)).join(Warehouse).join(Branch).filter(
                Branch.company_id == company_id,
                Asset.category == category,
                Asset.is_active == True,
                Asset.status.in_([AssetStatus.ACTIVE, AssetStatus.INACTIVE, AssetStatus.REPAIR])
            ).scalar() or 0
            
            percentage = (count / total_assets * 100) if total_assets > 0 else 0
            
            stats.append(AssetCategoryStats(
                category=category,
                count=count,
                value=float(value),
                percentage=round(percentage, 1)
            ))
        
        return stats

# Initialize CRUD instances
company_crud = CRUDCompany()
user_crud = CRUDUser()
branch_crud = CRUDBranch()
warehouse_crud = CRUDWarehouse()
asset_crud = CRUDAsset()
operation_crud = CRUDAssetOperation()
dashboard_crud = CRUDDashboard()