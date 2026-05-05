from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import settings

security = HTTPBearer()


class CurrentUser(BaseModel):
    """Authenticated user extracted from JWT."""
    id: UUID
    email: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    """
    Verify the Supabase JWT and extract the current user.
    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials

    try:
        # We delegate verification to the Supabase Auth server because the project uses ES256 asymmetric keys.
        # This securely verifies the token signature, checks expiration, and retrieves the user object.
        from app.services.supabase import supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": True, "message": "Invalid or expired token", "code": "UNAUTHORIZED"},
            )
            
        user_id = user_response.user.id
        email = user_response.user.email or ""
        
        return CurrentUser(id=UUID(user_id), email=email)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": True, "message": f"Invalid or expired token: {str(e)}", "code": "UNAUTHORIZED"},
        )
