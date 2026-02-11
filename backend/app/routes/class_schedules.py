"""
Class Schedule routes for managing class information and schedules.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import time
from ..database import get_db
from ..schemas import ClassScheduleResponse, ClassScheduleUpdate
from ..models import ClassSchedule, User
from ..auth import get_current_user

router = APIRouter(prefix="/api/class-schedules", tags=["Class Schedules"])


@router.get("", response_model=List[ClassScheduleResponse])
async def get_class_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all class schedules."""
    schedules = db.query(ClassSchedule).order_by(ClassSchedule.class_name).all()
    
    result = []
    for schedule in schedules:
        late_time_str = schedule.late_threshold_time.strftime('%H:%M') if schedule.late_threshold_time else '07:30'
        
        result.append(ClassScheduleResponse(
            id=schedule.id,
            class_name=schedule.class_name,
            late_threshold_time=late_time_str,
            is_active=schedule.is_active
        ))
    
    return result


@router.post("", response_model=ClassScheduleResponse)
async def create_class_schedule(
    class_name: str,
    late_threshold_time: str = "07:30",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new class schedule."""
    existing = db.query(ClassSchedule).filter(ClassSchedule.class_name == class_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class already exists"
        )
    
    try:
        hours, minutes = late_threshold_time.split(':')
        threshold_time = time(int(hours), int(minutes))
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM"
        )
    
    schedule = ClassSchedule(
        class_name=class_name,
        late_threshold_time=threshold_time,
        is_active=True
    )
    
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    return ClassScheduleResponse(
        id=schedule.id,
        class_name=schedule.class_name,
        late_threshold_time=late_threshold_time,
        is_active=schedule.is_active
    )


@router.put("/{schedule_id}", response_model=ClassScheduleResponse)
async def update_class_schedule(
    schedule_id: int,
    update_data: ClassScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a class schedule."""
    schedule = db.query(ClassSchedule).filter(ClassSchedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class schedule not found"
        )
    
    # Update late threshold time
    try:
        hours, minutes = update_data.late_threshold_time.split(':')
        schedule.late_threshold_time = time(int(hours), int(minutes))
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM"
        )
    
    if update_data.is_active is not None:
        schedule.is_active = update_data.is_active
    
    db.commit()
    db.refresh(schedule)
    
    return ClassScheduleResponse(
        id=schedule.id,
        class_name=schedule.class_name,
        late_threshold_time=update_data.late_threshold_time,
        is_active=schedule.is_active
    )


@router.delete("/{schedule_id}")
async def delete_class_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a class schedule."""
    schedule = db.query(ClassSchedule).filter(ClassSchedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class schedule not found"
        )
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "Class schedule deleted successfully"}


@router.get("/{class_name}", response_model=ClassScheduleResponse)
async def get_class_schedule_by_name(
    class_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get class schedule by class name."""
    schedule = db.query(ClassSchedule).filter(ClassSchedule.class_name == class_name).first()
    
    if not schedule:
        # Return default
        return ClassScheduleResponse(
            id=0,
            class_name=class_name,
            late_threshold_time="07:30",
            is_active=True
        )
    
    late_time_str = schedule.late_threshold_time.strftime('%H:%M') if schedule.late_threshold_time else '07:30'
    
    return ClassScheduleResponse(
        id=schedule.id,
        class_name=schedule.class_name,
        late_threshold_time=late_time_str,
        is_active=schedule.is_active
    )
