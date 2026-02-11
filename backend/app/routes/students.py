
import os
import io
import csv
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pathlib import Path
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from ..schemas import StudentCreate, StudentUpdate, StudentResponse, ImportSummary, ImportResultRow
from ..models import Student, User
from ..auth import get_current_user, require_admin
from ..barcode import generate_token, save_qr_image
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("", response_model=List[StudentResponse])
async def get_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    students = db.query(Student).offset(skip).limit(limit).all()
    return students


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return student


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
 
    student = Student(
        nis=student_data.nis,
        name=student_data.name,
        class_name=student_data.class_name
    )
    
    try:
        db.add(student)
        db.commit()
        db.refresh(student)
        return student
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this NIS already exists"
        )


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update fields if provided
    update_data = student_data.model_dump(exclude_unset=True)
    
    try:
        for field, value in update_data.items():
            setattr(student, field, value)
        
        db.commit()
        db.refresh(student)
        return student
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this NIS already exists"
        )


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Delete QR image file if exists
    if student.barcode_token:
        qr_filename = f"student_{student.id}.png"
        qr_filepath = os.path.join(settings.STORAGE_PATH, "barcodes", qr_filename)
        if os.path.exists(qr_filepath):
            os.remove(qr_filepath)
    
    # Delete photo file if exists
    if student.photo_path:
        photo_filepath = os.path.join(settings.STORAGE_PATH, student.photo_path)
        if os.path.exists(photo_filepath):
            os.remove(photo_filepath)
    
    db.delete(student)
    db.commit()
    
    return None


@router.post("/{student_id}/generate-qr")
async def generate_student_qr(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check if QR already generated
    if student.barcode_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code already generated for this student"
        )
    
    # Generate token
    token, nonce = generate_token(str(student.id))
    
    # Update student record
    student.barcode_token = token
    student.barcode_nonce = nonce
    student.barcode_generated_at = datetime.utcnow()
    
    # Save QR image to storage
    qr_filename = f"student_{student.id}.png"
    barcodes_dir = os.path.join(settings.STORAGE_PATH, "barcodes")
    os.makedirs(barcodes_dir, exist_ok=True)
    qr_filepath = os.path.join(barcodes_dir, qr_filename)
    
    save_qr_image(token, qr_filepath, size=400)
    
    db.commit()
    db.refresh(student)
    
    return {
        "message": "QR code generated successfully",
        "student_id": student.id,
        "token": token,
        "download_url": f"/api/students/{student.id}/download-qr"
    }


@router.get("/{student_id}/download-qr")
async def download_student_qr(
    student_id: int,
    db: Session = Depends(get_db)
):

    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if not student.barcode_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code not generated yet. Please generate first."
        )
    
    qr_filename = f"student_{student.id}.png"
    qr_filepath = os.path.join(settings.STORAGE_PATH, "barcodes", qr_filename)
    
    
    if not os.path.exists(qr_filepath):
        save_qr_image(student.barcode_token, qr_filepath, size=400)
    
    return FileResponse(
        path=qr_filepath,
        media_type="image/png",
        filename=f"QR_{student.nis}_{student.name}.png"
    )


@router.post("/{student_id}/upload-photo")
async def upload_student_photo(
    student_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload or update student photo."""
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate file type
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif']
    file_extension = photo.filename.split('.')[-1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create photos directory
    photos_dir = os.path.join(settings.STORAGE_PATH, "photos")
    os.makedirs(photos_dir, exist_ok=True)
    
    # Delete old photo if exists
    if student.photo_path:
        old_photo_path = os.path.join(settings.STORAGE_PATH, student.photo_path)
        if os.path.exists(old_photo_path):
            os.remove(old_photo_path)
    
    # Save new photo
    photo_filename = f"student_{student.id}.{file_extension}"
    photo_filepath = os.path.join(photos_dir, photo_filename)
    
    with open(photo_filepath, "wb") as buffer:
        content = await photo.read()
        buffer.write(content)
    
    # Update student record with relative path
    student.photo_path = f"photos/{photo_filename}"
    db.commit()
    db.refresh(student)
    
    return {
        "message": "Photo uploaded successfully",
        "student_id": student.id,
        "photo_url": f"/api/students/{student.id}/photo"
    }


@router.get("/{student_id}/photo")
async def get_student_photo(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Get student photo."""
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if not student.photo_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student photo not found"
        )
    
    photo_filepath = os.path.join(settings.STORAGE_PATH, student.photo_path)
    
    if not os.path.exists(photo_filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo file not found"
        )
    
    # Determine media type from file extension
    file_extension = student.photo_path.split('.')[-1].lower()
    media_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif'
    }
    media_type = media_types.get(file_extension, 'image/jpeg')
    
    return FileResponse(
        path=photo_filepath,
        media_type=media_type,
        filename=f"Photo_{student.nis}_{student.name}.{file_extension}"
    )


@router.post("/import", response_model=ImportSummary, dependencies=[Depends(require_admin)])
async def import_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk import students from CSV file.
    Admin only.
    
    Expected format:
    NIS, Name, Class
    12345, Ahmad Fauzi, 1A
    12346, Siti Nurhaliza, 1A
    """
    
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided"
        )
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.csv']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload CSV file"
        )
    
    # Read file content
    content = await file.read()
    
    # Parse CSV file
    try:
        data = parse_csv(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error parsing file: {str(e)}"
        )
    
    # Process imports
    success_count = 0
    error_count = 0
    results: List[ImportResultRow] = []
    
    for row_num, row_data in enumerate(data, start=2):  # Start at 2 (header is row 1)
        try:
            # Validate required fields
            nis = row_data.get('nis', '').strip()
            name = row_data.get('name', '').strip()
            class_name = row_data.get('class', '').strip()
            
            if not nis or not name or not class_name:
                error_count += 1
                results.append(ImportResultRow(
                    row=row_num,
                    nis=nis or "N/A",
                    name=name or "N/A",
                    class_name=class_name or "N/A",
                    success=False,
                    error="Missing required fields (NIS, Name, or Class)"
                ))
                continue
            
            # Check for duplicate NIS
            existing = db.query(Student).filter(Student.nis == nis).first()
            if existing:
                error_count += 1
                results.append(ImportResultRow(
                    row=row_num,
                    nis=nis,
                    name=name,
                    class_name=class_name,
                    success=False,
                    error=f"NIS {nis} already exists"
                ))
                continue
            
            # Create student
            student = Student(
                nis=nis,
                name=name,
                class_name=class_name
            )
            
            db.add(student)
            db.flush()  # Get the ID without committing
            
            success_count += 1
            results.append(ImportResultRow(
                row=row_num,
                nis=nis,
                name=name,
                class_name=class_name,
                success=True,
                error=None
            ))
            
        except Exception as e:
            error_count += 1
            results.append(ImportResultRow(
                row=row_num,
                nis=row_data.get('nis', 'N/A'),
                name=row_data.get('name', 'N/A'),
                class_name=row_data.get('class', 'N/A'),
                success=False,
                error=str(e)
            ))
    
    # Commit all successful imports
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving to database: {str(e)}"
        )
    
    return ImportSummary(
        total_rows=len(data),
        success=success_count,
        failed=error_count,
        duplicates=0,  # We already counted duplicates in error_count
        errors=results
    )


@router.get("/import/template")
async def download_import_template():
    """Download CSV template for bulk import."""
    
    # Create CSV template
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['nis', 'name', 'class'])
    
    # Write example rows
    writer.writerow(['12345', 'Ahmad Fauzi', '1A'])
    writer.writerow(['12346', 'Siti Nurhaliza', '1A'])
    writer.writerow(['12347', 'Budi Santoso', '1B'])
    
    # Convert to bytes
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=template_import_siswa.csv"
        }
    )


def parse_csv(content: bytes) -> List[Dict[str, str]]:
    """Parse CSV file content into list of dictionaries."""
    
    # Decode bytes to string
    text = content.decode('utf-8-sig')  # utf-8-sig handles BOM
    
    # Parse CSV
    reader = csv.DictReader(io.StringIO(text))
    
    # Convert to list of dicts
    data = []
    for row in reader:
        # Normalize keys to lowercase and strip whitespace
        normalized_row = {k.strip().lower(): v.strip() for k, v in row.items()}
        data.append(normalized_row)
    
    return data
