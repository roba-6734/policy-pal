"""
FastAPI router for policy summarization and comparison endpoints.
Handles file uploads, URL processing, and database operations.
"""

import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.database import (
    get_db,
    save_summary,
    get_summary_by_id,
    list_summaries_for_user,
)
from app.models import (
    SummarizePolicyResponse,
    ComparePoliciesResponse,
    GetSummaryResponse,
    SummaryHistoryResponse,
    ErrorResponse
)
from app.services.summarizer import policy_summarizer
from app.config import settings
from app.utils.auth import AuthenticatedUser, get_current_user


router = APIRouter(prefix="/api", tags=["policy"])


@router.post(
    "/summarize_policy",
    response_model=SummarizePolicyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Summarize a policy document",
    description="Upload a PDF file or provide a URL to get an AI-generated policy summary with risk assessment."
)
async def summarize_policy(
    file: Optional[UploadFile] = File(None, description="PDF file to analyze"),
    url: Optional[str] = Form(None, description="URL to the policy document"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Summarize a policy document from PDF upload or URL.
    
    Either a file or URL must be provided, but not both.
    """
    # Validate input
    if not file and not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either file or url must be provided"
        )
    
    if file and url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either file or url, not both"
        )
    
    try:
        if file:
            # Validate file type
            if file.content_type != "application/pdf":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File must be a PDF"
                )
            
            # Check file size
            if file.size and file.size > settings.max_file_size:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File size exceeds limit of {settings.max_file_size} bytes"
                )
            
            # Read file content
            pdf_content = await file.read()
            
            # Validate PDF
            if not await policy_summarizer.validate_pdf(pdf_content):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or corrupted PDF file"
                )
            
            # Summarize PDF
            summary_data, file_hash = await policy_summarizer.summarize_from_pdf(
                pdf_content, file.filename or "unknown.pdf"
            )
            
            # Save to database
            summary_record = save_summary(
                db=db,
                user_id=current_user.id,
                source_type="pdf",
                source_name=file.filename or "unknown.pdf",
                source_url=None,
                summary_data=summary_data,
                file_hash=file_hash
            )
            
            return SummarizePolicyResponse(
                summary_id=str(summary_record.id),
                source_name=file.filename or "unknown.pdf",
                source_type="pdf",
                summary=summary_data,
                created_at=summary_record.created_at.isoformat()
            )
        
        else:  # URL processing
            # Validate URL
            if not await policy_summarizer.validate_url(url):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="URL is not accessible or contains no readable content"
                )
            
            # Summarize URL
            summary_data, url_hash, page_title = await policy_summarizer.summarize_from_url(url)
            
            # Save to database
            summary_record = save_summary(
                db=db,
                user_id=current_user.id,
                source_type="url",
                source_name=page_title,
                source_url=url,
                summary_data=summary_data,
                file_hash=url_hash
            )
            
            return SummarizePolicyResponse(
                summary_id=str(summary_record.id),
                source_name=page_title,
                source_type="url",
                summary=summary_data,
                created_at=summary_record.created_at.isoformat()
            )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.post(
    "/compare_policies",
    response_model=ComparePoliciesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Compare two policy documents",
    description="Upload two PDF files or provide two URLs to compare policies and highlight differences."
)
async def compare_policies(
    file1: Optional[UploadFile] = File(None, description="First PDF file"),
    file2: Optional[UploadFile] = File(None, description="Second PDF file"),
    url1: Optional[str] = Form(None, description="First policy URL"),
    url2: Optional[str] = Form(None, description="Second policy URL"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Compare two policy documents.
    
    Provide either two files or two URLs, but not a mix.
    """
    # Validate input
    if not ((file1 and file2) or (url1 and url2)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either two files or two URLs"
        )
    
    if (file1 or file2) and (url1 or url2):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either files or URLs, not a mix"
        )
    
    try:
        if file1 and file2:
            # Validate files
            for file in [file1, file2]:
                if file.content_type != "application/pdf":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File {file.filename} must be a PDF"
                    )
                
                if file.size and file.size > settings.max_file_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File {file.filename} exceeds size limit"
                    )
            
            # Read file contents
            pdf1_content = await file1.read()
            pdf2_content = await file2.read()
            
            # Validate PDFs
            if not await policy_summarizer.validate_pdf(pdf1_content):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="First PDF is invalid or corrupted"
                )
            
            if not await policy_summarizer.validate_pdf(pdf2_content):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Second PDF is invalid or corrupted"
                )
            
            # Compare PDFs
            comparison_data, hash1, hash2 = await policy_summarizer.compare_policies_from_pdfs(
                pdf1_content, pdf2_content,
                file1.filename or "policy1.pdf", file2.filename or "policy2.pdf"
            )
            
            # Generate comparison ID
            comparison_id = str(uuid.uuid4())
            
            return ComparePoliciesResponse(
                comparison_id=comparison_id,
                policy1_name=file1.filename or "policy1.pdf",
                policy2_name=file2.filename or "policy2.pdf",
                comparison=comparison_data,
                created_at=datetime.utcnow().isoformat()
            )
        
        else:  # URL comparison
            # Validate URLs
            if not await policy_summarizer.validate_url(url1):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="First URL is not accessible or contains no readable content"
                )
            
            if not await policy_summarizer.validate_url(url2):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Second URL is not accessible or contains no readable content"
                )
            
            # Compare URLs
            comparison_data, hash1, hash2, title1, title2 = await policy_summarizer.compare_policies_from_urls(
                url1, url2
            )
            
            # Generate comparison ID
            comparison_id = str(uuid.uuid4())
            
            return ComparePoliciesResponse(
                comparison_id=comparison_id,
                policy1_name=title1,
                policy2_name=title2,
                comparison=comparison_data,
                created_at=datetime.utcnow().isoformat()
            )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get(
    "/summary/{summary_id}",
    response_model=GetSummaryResponse,
    summary="Retrieve a stored policy summary",
    description="Get a previously generated policy summary by its ID."
)
async def get_summary(
    summary_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a stored policy summary by ID.
    """
    try:
        # Validate UUID format
        uuid.UUID(summary_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid summary ID format"
        )
    
    # Get summary from database
    summary_record = get_summary_by_id(db, summary_id, user_id=current_user.id)
    
    if not summary_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not found"
        )
    
    return GetSummaryResponse(
        summary_id=str(summary_record.id),
        source_name=summary_record.source_name,
        source_type=summary_record.source_type,
        source_url=summary_record.source_url,
        summary=summary_record.summary_data,
        created_at=summary_record.created_at.isoformat()
    )


@router.get(
    "/history",
    response_model=SummaryHistoryResponse,
    summary="Retrieve policy summary history",
    description="List previously generated summaries for the authenticated user."
)
async def get_summary_history(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    source_type: Optional[str] = Query(
        None,
        description="Filter by source type (pdf or url)",
        pattern="^(pdf|url)$"
    ),
    start_date: Optional[str] = Query(
        None,
        description="Filter summaries created on or after this ISO 8601 datetime"
    ),
    end_date: Optional[str] = Query(
        None,
        description="Filter summaries created on or before this ISO 8601 datetime"
    ),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Return paginated summary history for the current user."""

    def parse_datetime(value: Optional[str], field_name: str) -> Optional[datetime]:
        if value is None:
            return None

        try:
            return datetime.fromisoformat(value)
        except ValueError as exc:  # pragma: no cover - defensive branch
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be a valid ISO 8601 datetime"
            ) from exc

    start_dt = parse_datetime(start_date, "start_date")
    end_dt = parse_datetime(end_date, "end_date")

    if start_dt and end_dt and start_dt > end_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be earlier than or equal to end_date"
        )

    summaries, total = list_summaries_for_user(
        db,
        current_user.id,
        limit=limit,
        offset=offset,
        source_type=source_type,
        start_date=start_dt,
        end_date=end_dt
    )

    def build_summary_preview(summary_payload: Optional[dict]) -> Optional[str]:
        if not summary_payload:
            return None

        for key in ("Data Collection", "User Rights", "Data Sharing"):
            section = summary_payload.get(key)
            if isinstance(section, dict):
                preview = section.get("summary")
                if isinstance(preview, str) and preview.strip():
                    return preview[:240]

        return None

    items = [
        {
            "summary_id": str(summary.id),
            "source_name": summary.source_name,
            "source_type": summary.source_type,
            "source_url": summary.source_url,
            "created_at": summary.created_at.isoformat(),
            "updated_at": summary.updated_at.isoformat() if summary.updated_at else summary.created_at.isoformat(),
            "file_hash": summary.file_hash,
            "summary_preview": build_summary_preview(summary.summary_data),
        }
        for summary in summaries
    ]

    return SummaryHistoryResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get(
    "/health",
    summary="Health check",
    description="Check if the API is running and healthy."
)
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.api_version
    }
