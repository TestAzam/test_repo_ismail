-- Asset Management Platform Database Schema
-- PostgreSQL initialization script

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('Admin', 'Accountant', 'Warehouse_keeper', 'Observer');

-- Asset category enum
CREATE TYPE asset_category AS ENUM ('Fixed Assets', 'Materials', 'Goods', 'Inventory');

-- Asset status enum
CREATE TYPE asset_status AS ENUM ('Active', 'Inactive', 'Repair', 'Disposed');

-- Operation type enum
CREATE TYPE operation_type AS ENUM ('Receipt', 'Transfer', 'Disposal', 'Adjustment');

-- ==========================================
-- COMPANIES TABLE
-- ==========================================

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(12) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for companies
CREATE INDEX idx_companies_inn ON companies(inn);
CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_companies_name ON companies(name);

-- ==========================================
-- USERS TABLE
-- ==========================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_company_active ON users(company_id, is_active);

-- ==========================================
-- BRANCHES TABLE
-- ==========================================

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for branches
CREATE INDEX idx_branches_company_id ON branches(company_id);
CREATE INDEX idx_branches_is_active ON branches(is_active);
CREATE INDEX idx_branches_name ON branches(name);
CREATE INDEX idx_branches_company_active ON branches(company_id, is_active);

-- ==========================================
-- WAREHOUSES TABLE
-- ==========================================

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for warehouses
CREATE INDEX idx_warehouses_branch_id ON warehouses(branch_id);
CREATE INDEX idx_warehouses_is_active ON warehouses(is_active);
CREATE INDEX idx_warehouses_name ON warehouses(name);

-- ==========================================
-- ASSETS TABLE
-- ==========================================

CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    inventory_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category asset_category NOT NULL,
    cost DECIMAL(12,2) NOT NULL CHECK (cost >= 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    status asset_status NOT NULL DEFAULT 'Active',
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    -- Additional fields
    serial_number VARCHAR(100),
    purchase_date TIMESTAMP WITH TIME ZONE,
    warranty_until TIMESTAMP WITH TIME ZONE,
    supplier VARCHAR(255),
    notes TEXT
);

-- Create indexes for assets
CREATE INDEX idx_assets_inventory_number ON assets(inventory_number);
CREATE INDEX idx_assets_name ON assets(name);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_warehouse_id ON assets(warehouse_id);
CREATE INDEX idx_assets_is_active ON assets(is_active);
CREATE INDEX idx_assets_cost ON assets(cost);
CREATE INDEX idx_assets_purchase_date ON assets(purchase_date);
CREATE INDEX idx_assets_serial_number ON assets(serial_number);

-- Composite indexes for common queries
CREATE INDEX idx_assets_warehouse_active ON assets(warehouse_id, is_active);
CREATE INDEX idx_assets_category_status ON assets(category, status);
CREATE INDEX idx_assets_status_active ON assets(status, is_active);

-- Full text search index for assets
CREATE INDEX idx_assets_search ON assets USING gin(to_tsvector('russian', name || ' ' || COALESCE(description, '') || ' ' || inventory_number));

-- ==========================================
-- ASSET OPERATIONS TABLE
-- ==========================================

CREATE TABLE asset_operations (
    id SERIAL PRIMARY KEY,
    type operation_type NOT NULL,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    -- Warehouse movement tracking
    from_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    to_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    -- Operation details
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    operation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),
    notes TEXT,
    document_number VARCHAR(100),
    -- Cost tracking for adjustments
    cost_before DECIMAL(12,2),
    cost_after DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for asset_operations
CREATE INDEX idx_operations_type ON asset_operations(type);
CREATE INDEX idx_operations_asset_id ON asset_operations(asset_id);
CREATE INDEX idx_operations_user_id ON asset_operations(user_id);
CREATE INDEX idx_operations_operation_date ON asset_operations(operation_date);
CREATE INDEX idx_operations_from_warehouse ON asset_operations(from_warehouse_id);
CREATE INDEX idx_operations_to_warehouse ON asset_operations(to_warehouse_id);
CREATE INDEX idx_operations_is_active ON asset_operations(is_active);
CREATE INDEX idx_operations_document_number ON asset_operations(document_number);

-- Composite indexes for common queries
CREATE INDEX idx_operations_asset_date ON asset_operations(asset_id, operation_date DESC);
CREATE INDEX idx_operations_type_date ON asset_operations(type, operation_date DESC);
CREATE INDEX idx_operations_user_date ON asset_operations(user_id, operation_date DESC);

-- ==========================================
-- AUDIT LOGS TABLE
-- ==========================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    old_values TEXT, -- JSON string
    new_values TEXT, -- JSON string
    ip_address INET,
    user_agent VARCHAR(500),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Composite indexes for common audit queries
CREATE INDEX idx_audit_company_timestamp ON audit_logs(company_id, timestamp DESC);
CREATE INDEX idx_audit_user_timestamp ON audit_logs(user_id, timestamp DESC);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate asset operations
CREATE OR REPLACE FUNCTION validate_asset_operation()
RETURNS TRIGGER AS $$
BEGIN
    -- For transfers, to_warehouse_id is required
    IF NEW.type = 'Transfer' AND NEW.to_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'to_warehouse_id is required for Transfer operations';
    END IF;
    
    -- For receipts, from_warehouse_id should be NULL (external)
    IF NEW.type = 'Receipt' AND NEW.from_warehouse_id IS NOT NULL THEN
        -- Allow but log warning
        NULL;
    END IF;
    
    -- For disposals, to_warehouse_id should be NULL (external)
    IF NEW.type = 'Disposal' AND NEW.to_warehouse_id IS NOT NULL THEN
        -- Allow but log warning
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add operation validation trigger
CREATE TRIGGER validate_asset_operation_trigger BEFORE INSERT OR UPDATE ON asset_operations
    FOR EACH ROW EXECUTE FUNCTION validate_asset_operation();

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- View for asset summary with warehouse and branch info
CREATE VIEW asset_summary AS
SELECT 
    a.id,
    a.inventory_number,
    a.name,
    a.category,
    a.status,
    a.cost,
    a.quantity,
    a.cost * a.quantity as total_value,
    w.name as warehouse_name,
    b.name as branch_name,
    c.name as company_name,
    c.id as company_id,
    a.created_at,
    a.is_active
FROM assets a
JOIN warehouses w ON a.warehouse_id = w.id
JOIN branches b ON w.branch_id = b.id
JOIN companies c ON b.company_id = c.id
WHERE a.is_active = TRUE 
  AND w.is_active = TRUE 
  AND b.is_active = TRUE 
  AND c.is_active = TRUE;

-- View for operation history with full details
CREATE VIEW operation_history AS
SELECT 
    o.id,
    o.type,
    o.quantity,
    o.operation_date,
    o.reason,
    o.notes,
    o.document_number,
    a.name as asset_name,
    a.inventory_number,
    u.username as user_name,
    u.email as user_email,
    wf.name as from_warehouse_name,
    wt.name as to_warehouse_name,
    c.name as company_name,
    c.id as company_id
FROM asset_operations o
JOIN assets a ON o.asset_id = a.id
JOIN users u ON o.user_id = u.id
JOIN warehouses wa ON a.warehouse_id = wa.id
JOIN branches ba ON wa.branch_id = ba.id
JOIN companies c ON ba.company_id = c.id
LEFT JOIN warehouses wf ON o.from_warehouse_id = wf.id
LEFT JOIN warehouses wt ON o.to_warehouse_id = wt.id
WHERE o.is_active = TRUE
ORDER BY o.operation_date DESC;

-- ==========================================
-- SECURITY POLICIES (Row Level Security)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies would be implemented in application layer through ORM
-- as they require context from JWT tokens which is handled by FastAPI

-- ==========================================
-- PERFORMANCE OPTIMIZATIONS
-- ==========================================

-- Partial indexes for better performance
CREATE INDEX idx_active_assets ON assets(id) WHERE is_active = TRUE;
CREATE INDEX idx_active_users ON users(id) WHERE is_active = TRUE;
CREATE INDEX idx_active_companies ON companies(id) WHERE is_active = TRUE;

-- Statistics for better query planning
ANALYZE companies;
ANALYZE users;
ANALYZE branches;
ANALYZE warehouses;
ANALYZE assets;
ANALYZE asset_operations;
ANALYZE audit_logs;

-- Set statistics targets for frequently queried columns
ALTER TABLE assets ALTER COLUMN name SET STATISTICS 1000;
ALTER TABLE assets ALTER COLUMN category SET STATISTICS 1000;
ALTER TABLE assets ALTER COLUMN status SET STATISTICS 1000;
ALTER TABLE asset_operations ALTER COLUMN type SET STATISTICS 1000;
ALTER TABLE asset_operations ALTER COLUMN operation_date SET STATISTICS 1000;

COMMIT;