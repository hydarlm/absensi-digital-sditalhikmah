"""
User management routes for RBAC (Admin only).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, TeacherClassAccess
from ..schemas import (
    UserCreate, UserUpdate, UserResponse, UserWithClasses,
    AssignClassesRequest, TeacherClassAccessResponse
)
from ..auth import require_admin, hash_password, get_current_user
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/api/users", tags=["User Management"])


@router.post("/", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Create new user (admin only)."""
    
    # Check if username already exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create new user
    new_user = User(
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        role=user_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/", response_model=List[UserWithClasses], dependencies=[Depends(require_admin)])
async def list_users(db: Session = Depends(get_db)):
    """List all users with their assigned classes (admin only)."""
    
    users = db.query(User).all()
    
    # Build response with assigned classes
    result = []
    for user in users:
        assigned_classes = []
        if user.role == "teacher":
            accesses = db.query(TeacherClassAccess).filter(
                TeacherClassAccess.user_id == user.id
            ).all()
            assigned_classes = [a.class_name for a in accesses]
        
        result.append(UserWithClasses(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            assigned_classes=assigned_classes
        ))
    
    return result


@router.get("/{user_id}", response_model=UserWithClasses, dependencies=[Depends(require_admin)])
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get single user by ID (admin only)."""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    assigned_classes = []
    if user.role == "teacher":
        accesses = db.query(TeacherClassAccess).filter(
            TeacherClassAccess.user_id == user.id
        ).all()
        assigned_classes = [a.class_name for a in accesses]
    
    return UserWithClasses(
        id=user.id,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        assigned_classes=assigned_classes
    )


@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    """Update user information (admin only)."""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update username if provided and different
    if user_data.username and user_data.username != user.username:
        # Check if new username already exists
        existing = db.query(User).filter(
            User.username == user_data.username,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        user.username = user_data.username
    
    # Update password if provided
    if user_data.password:
        user.hashed_password = hash_password(user_data.password)
    
    # Update role if provided
    if user_data.role:
        user.role = user_data.role
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)."""
    
    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)  # Cascade will delete TeacherClassAccess entries
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/{user_id}/classes", response_model=List[TeacherClassAccessResponse], dependencies=[Depends(require_admin)])
async def assign_classes(
    user_id: int,
    request: AssignClassesRequest,
    db: Session = Depends(get_db)
):
    """Assign classes to teacher (admin only)."""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only assign classes to teachers"
        )
    
    # Delete existing assignments
    db.query(TeacherClassAccess).filter(
        TeacherClassAccess.user_id == user_id
    ).delete()
    
    # Create new assignments
    new_accesses = []
    for class_name in request.class_names:
        access = TeacherClassAccess(
            user_id=user_id,
            class_name=class_name
        )
        db.add(access)
        new_accesses.append(access)
    
    try:
        db.commit()
        for access in new_accesses:
            db.refresh(access)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more class names are invalid"
        )
    
    return new_accesses


@router.get("/{user_id}/classes", response_model=List[str], dependencies=[Depends(require_admin)])
async def get_teacher_classes_list(user_id: int, db: Session = Depends(get_db)):
    """Get classes assigned to teacher (admin only)."""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    accesses = db.query(TeacherClassAccess).filter(
        TeacherClassAccess.user_id == user_id
    ).all()
    
    return [a.class_name for a in accesses]
