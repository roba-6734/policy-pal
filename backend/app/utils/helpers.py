"""
Utility functions for the PolicyPal backend.
Common helper functions used across the application.
"""

import hashlib
import re
from typing import Optional, Dict, Any
from urllib.parse import urlparse


def generate_file_hash(content: bytes) -> str:
    """
    Generate SHA-256 hash for file content.
    
    Args:
        content: File content as bytes
        
    Returns:
        SHA-256 hash string
    """
    return hashlib.sha256(content).hexdigest()


def generate_url_hash(url: str) -> str:
    """
    Generate SHA-256 hash for URL.
    
    Args:
        url: URL string
        
    Returns:
        SHA-256 hash string
    """
    return hashlib.sha256(url.encode()).hexdigest()


def validate_url(url: str) -> bool:
    """
    Validate URL format.
    
    Args:
        url: URL to validate
        
    Returns:
        True if URL is valid, False otherwise
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def clean_filename(filename: str) -> str:
    """
    Clean filename for safe storage.
    
    Args:
        filename: Original filename
        
    Returns:
        Cleaned filename
    """
    # Remove or replace unsafe characters
    cleaned = re.sub(r'[^\w\-_\.]', '_', filename)
    # Remove multiple underscores
    cleaned = re.sub(r'_+', '_', cleaned)
    # Remove leading/trailing underscores
    cleaned = cleaned.strip('_')
    return cleaned or 'unknown_file'


def truncate_text(text: str, max_length: int = 1000) -> str:
    """
    Truncate text to specified length with ellipsis.
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length-3] + "..."


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        size_bytes: Size in bytes
        
    Returns:
        Formatted size string
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def extract_domain(url: str) -> str:
    """
    Extract domain from URL.
    
    Args:
        url: URL string
        
    Returns:
        Domain name
    """
    try:
        parsed = urlparse(url)
        return parsed.netloc
    except Exception:
        return "unknown"


def sanitize_text(text: str) -> str:
    """
    Sanitize text by removing potentially harmful content.
    
    Args:
        text: Text to sanitize
        
    Returns:
        Sanitized text
    """
    # Remove null bytes and control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()


def create_error_response(error: str, detail: Optional[str] = None) -> Dict[str, Any]:
    """
    Create standardized error response.
    
    Args:
        error: Error message
        detail: Additional error details
        
    Returns:
        Error response dictionary
    """
    response = {"error": error}
    if detail:
        response["detail"] = detail
    
    return response
