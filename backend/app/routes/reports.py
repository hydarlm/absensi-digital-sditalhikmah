"""
Reports API routes for semester reports and analytics.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, case
from typing import List, Optional
from ..database import get_db
from ..schemas import SemesterReportItem, ClassListResponse
from ..models import Student, Attendance
from ..auth import get_current_user, User

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/semester", response_model=List[SemesterReportItem])
async def get_semester_report(
    semester: int = Query(..., ge=1, le=2, description="Semester (1 or 2)"),
    year: int = Query(..., description="Year"),
    class_name: Optional[str] = Query(None, description="Filter by class"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get semester attendance report aggregated by student with status breakdown.
    
    Semester 1 (Ganjil): July - December (months 7-12)
    Semester 2 (Genap): January - June (months 1-6)
    """
    
    # Determine month range based on semester
    if semester == 1:
        start_month, end_month = 7, 12
    else:
        start_month, end_month = 1, 6
    
    # Build query with status breakdown using CASE statements
    query = db.query(
        Student.nis.label('student_id'),
        Student.name.label('student_name'),
        Student.class_name,
        func.sum(case((Attendance.status == 'Present', 1), else_=0)).label('total_present'),
        func.sum(case((Attendance.status == 'Late', 1), else_=0)).label('total_late'),
        func.sum(case((Attendance.status == 'Sick', 1), else_=0)).label('total_sick'),
        func.sum(case((Attendance.status == 'Permission', 1), else_=0)).label('total_permission'),
        func.sum(case((Attendance.status == 'Absent', 1), else_=0)).label('total_absent'),
        func.count(Attendance.id).label('total_days')
    ).outerjoin(
        Attendance, Student.id == Attendance.student_id
    ).filter(
        extract('year', Attendance.scanned_at) == year,
        extract('month', Attendance.scanned_at) >= start_month,
        extract('month', Attendance.scanned_at) <= end_month,
        Attendance.is_undone == False  # Only count non-undone attendance
    )
    
    # Apply class filter if provided
    if class_name:
        query = query.filter(Student.class_name == class_name)
    
    # Group by student
    query = query.group_by(
        Student.id, Student.nis, Student.name, Student.class_name
    ).order_by(
        Student.class_name, Student.name
    )
    
    results = query.all()
    
    # Format response
    report = []
    for row in results:
        total_present = row.total_present or 0
        total_late = row.total_late or 0
        total_sick = row.total_sick or 0
        total_permission = row.total_permission or 0
        total_absent = row.total_absent or 0
        
        # Calculate total attendance records for this student
        total_records = total_present + total_late + total_sick + total_permission + total_absent
        
        # Calculate attendance count (Present + Late = attended)
        total_attended = total_present + total_late
        
        # Calculate percentage based on total records, not hardcoded days
        attendance_percentage = (total_attended / total_records * 100) if total_records > 0 else 0.0
        
        report.append(SemesterReportItem(
            student_id=row.student_id,
            student_name=row.student_name,
            class_name=row.class_name,
            total_present=total_present,
            total_late=total_late,
            total_sick=total_sick,
            total_permission=total_permission,
            total_absent=total_absent,
            attendance_percentage=round(attendance_percentage, 2)
        ))
    
    return report


@router.get("/classes", response_model=ClassListResponse)
async def get_classes_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of unique classes from students table.
    """
    classes = db.query(Student.class_name).distinct().order_by(Student.class_name).all()
    class_list = [c[0] for c in classes if c[0]]  # Extract string from tuple and filter None
    
    return ClassListResponse(classes=class_list)
