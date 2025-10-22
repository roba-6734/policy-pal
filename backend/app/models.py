"""
Pydantic models for API requests and responses.
Defines the structure of data exchanged between frontend and backend.
"""

from typing import Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


# Risk levels for policy sections
RiskLevel = Literal["green", "yellow", "red"]


class PolicySection(BaseModel):
    """Individual policy section with summary and risk assessment."""
    summary: str = Field(..., description="Brief summary of the section")
    risk: RiskLevel = Field(..., description="Risk level: green (safe), yellow (caution), red (danger)")
    details: Optional[str] = Field(None, description="Detailed explanation of the section")


class PolicySummary(BaseModel):
    """Complete policy summary with all sections."""
    data_collection: PolicySection = Field(..., alias="Data Collection")
    user_rights: PolicySection = Field(..., alias="User Rights")
    data_sharing: PolicySection = Field(..., alias="Data Sharing")
    opt_out_options: PolicySection = Field(..., alias="Opt-Out Options")
    arbitration_clause: PolicySection = Field(..., alias="Arbitration Clause")
    
    class Config:
        populate_by_name = True


class PolicyComparison(BaseModel):
    """Comparison between two policies."""
    policy1_name: str
    policy2_name: str
    sections: Dict[str, Dict[str, Any]] = Field(
        ..., 
        description="Comparison data for each section"
    )


# Request models
class SummarizePolicyRequest(BaseModel):
    """Request model for policy summarization."""
    url: Optional[str] = Field(None, description="URL to the policy document")


class ComparePoliciesRequest(BaseModel):
    """Request model for policy comparison."""
    url1: Optional[str] = Field(None, description="First policy URL")
    url2: Optional[str] = Field(None, description="Second policy URL")


# Response models
class SummarizePolicyResponse(BaseModel):
    """Response model for policy summarization."""
    summary_id: str = Field(..., description="Unique identifier for the summary")
    source_name: str = Field(..., description="Name of the source document")
    source_type: str = Field(..., description="Type of source: 'pdf' or 'url'")
    summary: PolicySummary = Field(..., description="Structured policy summary")
    created_at: str = Field(..., description="Timestamp when summary was created")


class ComparePoliciesResponse(BaseModel):
    """Response model for policy comparison."""
    comparison_id: str = Field(..., description="Unique identifier for the comparison")
    policy1_name: str = Field(..., description="Name of first policy")
    policy2_name: str = Field(..., description="Name of second policy")
    comparison: PolicyComparison = Field(..., description="Structured comparison data")
    created_at: str = Field(..., description="Timestamp when comparison was created")


class GetSummaryResponse(BaseModel):
    """Response model for retrieving a stored summary."""
    summary_id: str
    source_name: str
    source_type: str
    source_url: Optional[str]
    summary: PolicySummary
    created_at: str


class SummaryHistoryItem(BaseModel):
    """Response model for a summary history entry."""

    summary_id: str = Field(..., description="Unique identifier for the summary")
    source_name: str = Field(..., description="Name of the source document")
    source_type: str = Field(..., description="Type of the source: pdf or url")
    source_url: Optional[str] = Field(None, description="URL of the source document if applicable")
    created_at: str = Field(..., description="When the summary was created")
    updated_at: str = Field(..., description="When the summary was last updated")
    file_hash: Optional[str] = Field(None, description="Hash of the source for deduplication")
    summary_preview: Optional[str] = Field(None, description="Short preview of the generated summary")


class SummaryHistoryResponse(BaseModel):
    """Paginated response model for summary history."""

    items: list[SummaryHistoryItem] = Field(..., description="List of history entries")
    total: int = Field(..., description="Total number of history items available")
    limit: int = Field(..., description="Maximum number of items returned")
    offset: int = Field(..., description="Number of skipped items from the start")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")
