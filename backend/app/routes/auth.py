
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import TokenResponse, UserResponse
from ..auth import authenticate_user, create_access_token, get_current_user
from ..models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    return TokenResponse(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    Requires: Authorization header with Bearer token
    """
    return current_user


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client-side token removal).
    Server doesn't track sessions, so just return success.
    Client should remove token from storage.
    """
    return {"message": "Successfully logged out"}
