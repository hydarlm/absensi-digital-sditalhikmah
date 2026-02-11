"""
Attendance routes for scanning, undo, and history.
"""
from datetime import datetime, timedelta, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..database import get_db
from ..schemas import (
    AttendanceScan, AttendanceResponse, ScanResult, AttendanceStats,
    BatchAttendanceUpdate, StudentAttendanceStatus
)
from ..models import Student, Attendance, User, ClassSchedule
from ..auth import get_current_user, get_teacher_classes
from ..barcode import verify_token
from ..timezone_utils import get_wib_now, to_wib

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])



@router.post("/scan", response_model=ScanResult)
async def scan_attendance(
    scan_data: AttendanceScan,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scan barcode for attendance with class access validation.
    Teachers can only scan students from assigned classes.
    """
    try:
        payload = verify_token(scan_data.token)
        student_id = int(payload["sid"])
        student = db.query(Student).filter(Student.id == student_id).first()
        
        if not student:
            return ScanResult(
                success=False,
                message="Student not found or token expired"
            )
        
        allowed_classes = get_teacher_classes(current_user, db)
        if allowed_classes is not None and student.class_name not in allowed_classes:
            return ScanResult(
                success=False,
                message=f"Access denied to class {student.class_name}"
            )
        
        now_wib = get_wib_now()
        today_start = now_wib.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        existing = db.query(Attendance).filter(
            and_(
                Attendance.student_id == student.id,
                Attendance.scanned_at >= today_start,
                Attendance.scanned_at < today_end,
                Attendance.is_undone == False
            )
        ).first()
        
        if existing:
            return ScanResult(
                success=False,
                message=f"{student.name} sudah melakukan absensi hari ini",
                student_name=student.name,
                student_class=student.class_name,
                student_photo_url=f"/api/students/{student.id}/photo" if student.photo_path else None,
                already_scanned=True,
                attendance_id=existing.id
            )
        
        attendance = Attendance(
            student_id=student.id,
            scanned_at=now_wib,
            status='Present'
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        return ScanResult(
            success=True,
            message=f"Absensi berhasil untuk {student.name}",
            student_name=student.name,
            student_class=student.class_name,
            student_photo_url=f"/api/students/{student.id}/photo" if student.photo_path else None,
            attendance_id=attendance.id,
            already_scanned=False
        )
        
    except ValueError as e:
        return ScanResult(
            success=False,
            message=str(e)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{attendance_id}/undo")
async def undo_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Undo attendance within 10 seconds with class access validation."""
    
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    if attendance.is_undone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already undone"
        )
    
    student = db.query(Student).filter(Student.id == attendance.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    allowed_classes = get_teacher_classes(current_user, db)
    if allowed_classes is not None and student.class_name not in allowed_classes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied to class {student.class_name}"
        )
    
    now_wib = get_wib_now()
    time_elapsed = (now_wib - attendance.scanned_at).total_seconds()
    
    if time_elapsed > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Undo period expired (max 10 seconds)"
        )
    
    attendance.is_undone = True
    attendance.undone_at = now_wib  
    
    db.commit()
    
    return {
        "message": "Attendance undone successfully",
        "attendance_id": attendance_id
    }


@router.get("/history", response_model=List[AttendanceResponse])
async def get_attendance_history(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance history with class access filtering for teachers."""
    
    query = db.query(Attendance).join(Student)
    
    allowed_classes = get_teacher_classes(current_user, db)
    if allowed_classes is not None:  # Teacher
        query = query.filter(Student.class_name.in_(allowed_classes))
    
    if date:
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            date_start = date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date_start + timedelta(days=1)
            query = query.filter(
                and_(
                    Attendance.scanned_at >= date_start,
                    Attendance.scanned_at < date_end
                )
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    
    query = query.order_by(Attendance.scanned_at.desc())
    
    attendances = query.offset(skip).limit(limit).all()
    
    result = []
    for att in attendances:
        result.append(AttendanceResponse(
            id=att.id,
            student_id=att.student_id,
            student_name=att.student.name,
            student_class=att.student.class_name,
            scanned_at=att.scanned_at,
            is_undone=att.is_undone,
            undone_at=att.undone_at
        ))
    
    return result


@router.get("/stats", response_model=AttendanceStats)
async def get_attendance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance statistics with class access filtering for teachers."""
    
    now = get_wib_now()
    
    allowed_classes = get_teacher_classes(current_user, db)
    
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    def build_query():
        query = db.query(func.count(Attendance.id)).join(Student)
        if allowed_classes is not None:  # Teacher
            query = query.filter(Student.class_name.in_(allowed_classes))
        return query
    
    total_today = build_query().filter(
        and_(
            Attendance.scanned_at >= today_start,
            Attendance.scanned_at < today_end,
            Attendance.is_undone == False
        )
    ).scalar()
    
    days_since_monday = now.weekday()
    week_start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)
    
    total_this_week = build_query().filter(
        and_(
            Attendance.scanned_at >= week_start,
            Attendance.scanned_at < week_end,
            Attendance.is_undone == False
        )
    ).scalar()
    
    # This month
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        month_end = month_start.replace(year=now.year + 1, month=1)
    else:
        month_end = month_start.replace(month=now.month + 1)
    
    total_this_month = build_query().filter(
        and_(
            Attendance.scanned_at >= month_start,
            Attendance.scanned_at < month_end,
            Attendance.is_undone == False
        )
    ).scalar()
    
    # Total students (also filtered by class for teachers)
    student_query = db.query(func.count(Student.id))
    if allowed_classes is not None:  # Teacher
        student_query = student_query.filter(Student.class_name.in_(allowed_classes))
    total_students = student_query.scalar()
    
    return AttendanceStats(
        total_today=total_today or 0,
        total_this_week=total_this_week or 0,
        total_this_month=total_this_month or 0,
        total_students=total_students or 0
    )


@router.get("/class-attendance")
async def get_class_attendance(
    date: str = Query(..., description="Date (YYYY-MM-DD)"),
    class_name: str = Query(..., description="Class name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all students in a class with their attendance status for a specific date."""
    
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        date_start = date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Get all students in the class
    students = db.query(Student).filter(Student.class_name == class_name).order_by(Student.name).all()
    
    if not students:
        return []
    
    # Get attendance records for this class and date
    attendance_records = db.query(Attendance).filter(
        and_(
            Attendance.student_id.in_([s.id for s in students]),
            Attendance.scanned_at >= date_start,
            Attendance.scanned_at < date_end,
            Attendance.is_undone == False
        )
    ).all()
    
    # Create a map of student_id to attendance
    attendance_map = {att.student_id: att for att in attendance_records}
    
    # Build response
    result = []
    for student in students:
        attendance = attendance_map.get(student.id)
        result.append(StudentAttendanceStatus(
            student_id=student.id,
            nis=student.nis,
            name=student.name,
            class_name=student.class_name,
            photo_path=student.photo_path,
            status=attendance.status if attendance else None,
            scanned_at=attendance.scanned_at if attendance else None
        ))
    
    return result


@router.post("/batch-update")
async def batch_update_attendance(
    batch_data: BatchAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Batch update attendance records for a class on a specific date."""
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Received batch update request: {batch_data}")
    
    try:
        date_obj = datetime.strptime(batch_data.date, "%Y-%m-%d")
        date_start = date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    updated_count = 0
    created_count = 0
    
    for record in batch_data.records:
        # Check if student exists
        student = db.query(Student).filter(Student.id == record.student_id).first()
        if not student:
            continue
        
        # Check if attendance already exists for this student on this date
        existing_attendance = db.query(Attendance).filter(
            and_(
                Attendance.student_id == record.student_id,
                Attendance.scanned_at >= date_start,
                Attendance.scanned_at < date_end,
                Attendance.is_undone == False
            )
        ).first()
        
        # Parse scan_time if provided
        if record.scan_time:
            try:
                scan_time = datetime.fromisoformat(record.scan_time.replace('Z', '+00:00'))
            except:
                scan_time = datetime.utcnow()
        else:
            scan_time = datetime.utcnow()
        
        if existing_attendance:
            # Update existing
            existing_attendance.status = record.status
            existing_attendance.scanned_at = scan_time
            updated_count += 1
        else:
            # Create new
            new_attendance = Attendance(
                student_id=record.student_id,
                scanned_at=scan_time,
                status=record.status,
                is_undone=False
            )
            db.add(new_attendance)
            created_count += 1
    
    db.commit()
    
    return {
        "message": "Batch update completed",
        "updated": updated_count,
        "created": created_count,
        "total": updated_count + created_count
    }
