"""Authentication utilities and dependencies for FastAPI routes."""

import uuid
from fastapi import Header, HTTPException, status
from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    """Simple representation of an authenticated user."""

    id: uuid.UUID


async def get_current_user(x_user_id: str = Header(..., alias="X-User-Id")) -> AuthenticatedUser:
    """Resolve the current authenticated user from headers.

    This placeholder implementation expects an ``X-User-Id`` header containing a
    valid UUID string. In a production system this dependency should be
    replaced with real authentication/authorization logic that validates the
    incoming request token/session and loads the associated user from the
    database or identity provider.
    """

    try:
        user_uuid = uuid.UUID(x_user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication credentials",
        ) from None

    return AuthenticatedUser(id=user_uuid)
