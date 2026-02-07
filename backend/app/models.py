
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Time
from sqlalchemy.orm import relationship
from datetime import datetime, time
from .database import Base


class User(Base):
    """Admin user model for authentication."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Student(Base):
    """Student model with QR code token fields."""
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    nis = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    class_name = Column(String(50), nullable=False)
    
    # QR Code fields
    barcode_token = Column(Text, nullable=True)
    barcode_nonce = Column(String(50), nullable=True)
    barcode_generated_at = Column(DateTime, nullable=True)
    
    # Student photo
    photo_path = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")


class Attendance(Base):
    """Attendance record model with status tracking."""
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    scanned_at = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(20), default='Present', nullable=False)  # Present, Late, Sick, Permission, Absent
    is_undone = Column(Boolean, default=False)
    undone_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    student = relationship("Student", back_populates="attendances")


class ClassSchedule(Base):
    """Class schedule with configurable late threshold per class."""
    __tablename__ = "class_schedule"
    
    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(50), unique=True, nullable=False, index=True)
    late_threshold_time = Column(Time, default=time(7, 30), nullable=False)  # Default 07:30
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
