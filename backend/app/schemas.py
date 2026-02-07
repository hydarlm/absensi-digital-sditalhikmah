from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# ============================================================================
# Auth Schemas
# ============================================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Student Schemas
# ============================================================================

class StudentCreate(BaseModel):
    nis: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    class_name: str = Field(..., min_length=1, max_length=50)


class StudentUpdate(BaseModel):
    nis: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    class_name: Optional[str] = Field(None, min_length=1, max_length=50)


class StudentResponse(BaseModel):
    id: int
    nis: str
    name: str
    class_name: str
    barcode_token: Optional[str] = None
    barcode_generated_at: Optional[datetime] = None
    photo_path: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Attendance Schemas
# ============================================================================

class AttendanceScan(BaseModel):
    token: str = Field(..., min_length=1)


class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_class: str
    scanned_at: datetime
    status: str = 'Present'
    is_undone: bool
    undone_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ScanResult(BaseModel):
    success: bool
    message: str
    student_name: Optional[str] = None
    student_class: Optional[str] = None
    student_photo_url: Optional[str] = None
    attendance_id: Optional[int] = None
    already_scanned: bool = False


class AttendanceStats(BaseModel):
    total_today: int
    total_this_week: int
    total_this_month: int


# Reports Schemas
class SemesterReportItem(BaseModel):
    student_id: str  # NIS
    student_name: str
    class_name: str
    total_present: int
    total_late: int
    total_sick: int
    total_permission: int
    total_absent: int
    attendance_percentage: float

# Class Schedule Schemas
class ClassScheduleResponse(BaseModel):
    id: int
    class_name: str
    late_threshold_time: str  # Time as string HH:MM
    is_active: bool
    
    class Config:
        from_attributes = True

class ClassScheduleUpdate(BaseModel):
    late_threshold_time: str  # HH:MM format
    is_active: Optional[bool] = None

# Batch Attendance Update
class AttendanceUpdateItem(BaseModel):
    student_id: int
    status: str  # Present, Late, Sick, Permission, Absent
    scan_time: Optional[str] = None  # ISO datetime string

class BatchAttendanceUpdate(BaseModel):
    date: str  # YYYY-MM-DD
    class_name: str
    records: List[AttendanceUpdateItem]

class StudentAttendanceStatus(BaseModel):
    student_id: int
    nis: str
    name: str
    class_name: str
    photo_path: Optional[str]
    status: Optional[str] = None
    scanned_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ClassListResponse(BaseModel):
    classes: List[str]
