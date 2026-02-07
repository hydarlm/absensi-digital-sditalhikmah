
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import Base, engine
from .routes import auth, students, attendance, reports
from .routes import class_schedules

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Student Attendance API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(reports.router)
app.include_router(class_schedules.router)


@app.on_event("startup")
async def startup_event():
    """Create storage directories on startup."""
    from .config import get_settings
    settings = get_settings()
    barcodes_dir = os.path.join(settings.STORAGE_PATH, "barcodes")
    os.makedirs(barcodes_dir, exist_ok=True)
    print(f"✓ Storage directory created: {barcodes_dir}")


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Student Attendance System API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "OK"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


from .config import get_settings
settings = get_settings()

if os.path.exists(settings.STORAGE_PATH):
    app.mount(
        "/storage",
        StaticFiles(directory=settings.STORAGE_PATH),
        name="storage"
    )
