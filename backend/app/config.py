
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_SECRET: str = "dev-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    DATABASE_URL: str = "sqlite:///./db.sqlite3"
    
    STORAGE_PATH: str = "./storage"
    
    class Config:
        env_file = "../.env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
