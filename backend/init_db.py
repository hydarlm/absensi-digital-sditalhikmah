"""
Database initialization script.
Creates all tables and seeds initial data.
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models import User, Student
from app.auth import hash_password


def init_database():
    """Initialize database - create tables and seed data."""
    print("Creating database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if not existing_admin:
            # Create default admin user
            admin = User(
                username="admin",
                hashed_password=hash_password("admin123"),
                role="admin",  # EXPLICITLY SET ADMIN ROLE
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("✓ Default admin user created (username: admin, password: admin123)")
            print("  ⚠️  IMPORTANT: Change the default password after first login!")
        else:
            print("✓ Admin user already exists")
        
        # Optional: Seed sample students (uncomment if needed)
        """
        sample_students = [
            {"nis": "2024001", "name": "Ahmad Rizki", "class_name": "X-A"},
            {"nis": "2024002", "name": "Siti Nurhaliza", "class_name": "X-A"},
            {"nis": "2024003", "name": "Budi Santoso", "class_name": "X-B"},
            {"nis": "2024004", "name": "Dewi Lestari", "class_name": "X-B"},
        ]
        
        for student_data in sample_students:
            existing_student = db.query(Student).filter(Student.nis == student_data["nis"]).first()
            if not existing_student:
                student = Student(**student_data)
                db.add(student)
        
        db.commit()
        print(f"✓ Seeded {len(sample_students)} sample students")
        """
        
        print("\n" + "="*60)
        print("Database initialization completed successfully!")
        print("="*60)
        print("\nNext steps:")
        print("1. Copy .env.example to .env and update SECRET_KEY and JWT_SECRET")
        print("2. Start the backend: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print("3. Access API docs: http://localhost:8000/docs")
        print("="*60)
        
    except Exception as e:
        print(f"Error during initialization: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
