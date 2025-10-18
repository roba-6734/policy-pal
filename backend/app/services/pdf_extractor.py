"""
PDF text extraction service using PyMuPDF (fitz).
Handles PDF file processing and text extraction with error handling.
"""

import io
import hashlib
from typing import Optional, Tuple
import fitz  # PyMuPDF


class PDFExtractor:
    """Service for extracting text from PDF files."""
    
    def __init__(self):
        """Initialize the PDF extractor."""
        pass
    
    async def extract_text(self, pdf_content: bytes) -> Tuple[str, str]:
        """
        Extract text from PDF content.
        
        Args:
            pdf_content: Raw PDF file content as bytes
            
        Returns:
            Tuple of (extracted_text, file_hash)
            
        Raises:
            ValueError: If PDF is invalid or cannot be processed
            RuntimeError: If text extraction fails
        """
        try:
            # Calculate file hash for deduplication
            file_hash = hashlib.sha256(pdf_content).hexdigest()
            
            # Open PDF from memory
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            
            if pdf_document.page_count == 0:
                raise ValueError("PDF file is empty or corrupted")
            
            # Extract text from all pages
            extracted_text = ""
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                page_text = page.get_text()
                extracted_text += page_text + "\n"
            
            pdf_document.close()
            
            # Clean up the text
            extracted_text = self._clean_text(extracted_text)
            
            if not extracted_text.strip():
                raise ValueError("No readable text found in PDF")
            
            return extracted_text, file_hash
            
        except Exception as e:
            if "invalid" in str(e).lower() or "corrupted" in str(e).lower():
                raise ValueError(f"Invalid or corrupted PDF file: {str(e)}")
            else:
                raise RuntimeError(f"Failed to extract text from PDF: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text.
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if line:  # Only keep non-empty lines
                cleaned_lines.append(line)
        
        # Join lines with single newlines
        cleaned_text = '\n'.join(cleaned_lines)
        
        # Remove multiple consecutive newlines
        while '\n\n\n' in cleaned_text:
            cleaned_text = cleaned_text.replace('\n\n\n', '\n\n')
        
        return cleaned_text.strip()
    
    def get_page_count(self, pdf_content: bytes) -> int:
        """
        Get the number of pages in the PDF.
        
        Args:
            pdf_content: Raw PDF file content as bytes
            
        Returns:
            Number of pages in the PDF
        """
        try:
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            page_count = pdf_document.page_count
            pdf_document.close()
            return page_count
        except Exception:
            return 0
    
    def is_valid_pdf(self, pdf_content: bytes) -> bool:
        """
        Check if the provided content is a valid PDF.
        
        Args:
            pdf_content: Raw PDF file content as bytes
            
        Returns:
            True if valid PDF, False otherwise
        """
        try:
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            is_valid = pdf_document.page_count > 0
            pdf_document.close()
            return is_valid
        except Exception:
            return False


# Global instance
pdf_extractor = PDFExtractor()
