"""
Database configuration and connection management
"""
import os
import time
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/asset_management")

# SQLAlchemy engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=os.getenv("DEBUG", "False").lower() == "true"
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    """
    Database dependency for FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def wait_for_db(max_retries: int = 30, delay: int = 2):
    """
    Wait for database to be available with retry logic
    """
    retries = 0
    while retries < max_retries:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection successful!")
            return True
        except OperationalError as e:
            retries += 1
            logger.warning(f"Database connection failed (attempt {retries}/{max_retries}): {e}")
            if retries < max_retries:
                time.sleep(delay)
    
    logger.error(f"Could not connect to database after {max_retries} attempts")
    return False

def create_tables():
    """
    Create all tables
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

def init_database():
    """
    Initialize database connection and create tables
    """
    logger.info("Initializing database...")
    
    if wait_for_db():
        create_tables()
        return True
    else:
        raise Exception("Failed to initialize database")

# Test database connection on import
if __name__ == "__main__":
    init_database()