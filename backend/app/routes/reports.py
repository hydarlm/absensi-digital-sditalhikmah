"""
Reports API routes for semester reports and analytics.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, case
from typing import List, Optional
from ..database import get_db
from ..schemas import SemesterReportItem, ClassListResponse
from ..models import Student, Attendance
from ..auth import get_current_user, User, get_teacher_classes

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
    
    Teachers can only access reports for assigned classes.
    """
    
    allowed_classes = get_teacher_classes(current_user, db)
    
    if allowed_classes is not None:  # Teacher
        if class_name:
            if class_name not in allowed_classes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied to class {class_name}"
                )
    
    if semester == 1:
        start_month, end_month = 7, 12
    else:
        start_month, end_month = 1, 6
    
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
    
    if allowed_classes is not None:  # Teacher
        if class_name:
            query = query.filter(Student.class_name == class_name)
        else:
            query = query.filter(Student.class_name.in_(allowed_classes))
    elif class_name:  # Admin 
        query = query.filter(Student.class_name == class_name)
    
    query = query.group_by(
        Student.id, Student.nis, Student.name, Student.class_name
    ).order_by(
        Student.class_name, Student.name
    )
    
    results = query.all()
    
    report = []
    for row in results:
        total_present = row.total_present or 0
        total_late = row.total_late or 0
        total_sick = row.total_sick or 0
        total_permission = row.total_permission or 0
        total_absent = row.total_absent or 0
        
        total_records = total_present + total_late + total_sick + total_permission + total_absent
        
        total_attended = total_present + total_late
        
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
    Get list of classes accessible by current user.
    Admin: all classes
    Teacher: only assigned classes
    """
    from ..auth import get_teacher_classes
    
    allowed_classes = get_teacher_classes(current_user, db)
    
    if allowed_classes is None:  # Admin 
        classes = db.query(Student.class_name).distinct().order_by(Student.class_name).all()
        class_list = [c[0] for c in classes if c[0]]  
    else:  # Teacher 
        class_list = sorted(allowed_classes)
    
    return ClassListResponse(classes=class_list)
