"""
Main summarizer service that orchestrates text extraction and LLM processing.
Handles both PDF and URL sources, with intelligent error handling and fallbacks.
"""

import asyncio
from typing import Tuple, Optional, Dict, Any
from app.services.pdf_extractor import pdf_extractor
from app.services.url_scraper import url_scraper
from app.services.llm_service import llm_service
from app.models import PolicySummary


class PolicySummarizer:
    """Main service for policy summarization workflow."""
    
    def __init__(self):
        """Initialize the summarizer service."""
        self.pdf_extractor = pdf_extractor
        self.url_scraper = url_scraper
        self.llm_service = llm_service
    
    async def summarize_from_pdf(self, pdf_content: bytes, filename: str) -> Tuple[Dict[str, Any], str]:
        """
        Summarize a policy from PDF content.
        
        Args:
            pdf_content: Raw PDF file content
            filename: Name of the PDF file
            
        Returns:
            Tuple of (summary_data, file_hash)
        """
        try:
            # Extract text from PDF
            text, file_hash = await self.pdf_extractor.extract_text(pdf_content)
            
            if not text or len(text.strip()) < 100:
                raise ValueError("PDF contains insufficient text for analysis")
            
            # Generate summary using LLM
            summary_data = await self.llm_service.summarize_policy(text)
            
            return summary_data, file_hash
            
        except Exception as e:
            raise RuntimeError(f"Failed to summarize PDF '{filename}': {str(e)}")
    
    async def summarize_from_url(self, url: str) -> Tuple[Dict[str, Any], str, str]:
        """
        Summarize a policy from URL.
        
        Args:
            url: URL to the policy document
            
        Returns:
            Tuple of (summary_data, url_hash, page_title)
        """
        try:
            # Extract text from URL
            text, url_hash = await self.url_scraper.extract_text(url)
            
            if not text or len(text.strip()) < 100:
                raise ValueError("URL contains insufficient text for analysis")
            
            # Get page title for better identification
            page_title = await self.url_scraper.get_page_title(url)
            
            # Generate summary using LLM
            summary_data = await self.llm_service.summarize_policy(text)
            
            return summary_data, url_hash, page_title
            
        except Exception as e:
            raise RuntimeError(f"Failed to summarize URL '{url}': {str(e)}")
    
    async def compare_policies_from_pdfs(self, pdf1_content: bytes, pdf2_content: bytes,
                                       filename1: str, filename2: str) -> Tuple[Dict[str, Any], str, str]:
        """
        Compare two policies from PDF files.
        
        Args:
            pdf1_content: First PDF content
            pdf2_content: Second PDF content
            filename1: First PDF filename
            filename2: Second PDF filename
            
        Returns:
            Tuple of (comparison_data, file1_hash, file2_hash)
        """
        try:
            # Extract text from both PDFs
            text1, hash1 = await self.pdf_extractor.extract_text(pdf1_content)
            text2, hash2 = await self.pdf_extractor.extract_text(pdf2_content)
            
            if not text1 or not text2:
                raise ValueError("One or both PDFs contain insufficient text for comparison")
            
            # Generate comparison using LLM
            comparison_data = await self.llm_service.compare_policies(
                text1, text2, filename1, filename2
            )
            
            return comparison_data, hash1, hash2
            
        except Exception as e:
            raise RuntimeError(f"Failed to compare PDFs '{filename1}' and '{filename2}': {str(e)}")
    
    async def compare_policies_from_urls(self, url1: str, url2: str) -> Tuple[Dict[str, Any], str, str, str, str]:
        """
        Compare two policies from URLs.
        
        Args:
            url1: First policy URL
            url2: Second policy URL
            
        Returns:
            Tuple of (comparison_data, url1_hash, url2_hash, title1, title2)
        """
        try:
            # Extract text from both URLs
            text1, hash1 = await self.url_scraper.extract_text(url1)
            text2, hash2 = await self.url_scraper.extract_text(url2)
            
            if not text1 or not text2:
                raise ValueError("One or both URLs contain insufficient text for comparison")
            
            # Get page titles
            title1 = await self.url_scraper.get_page_title(url1)
            title2 = await self.url_scraper.get_page_title(url2)
            
            # Generate comparison using LLM
            comparison_data = await self.llm_service.compare_policies(
                text1, text2, title1, title2
            )
            
            return comparison_data, hash1, hash2, title1, title2
            
        except Exception as e:
            raise RuntimeError(f"Failed to compare URLs '{url1}' and '{url2}': {str(e)}")
    
    async def validate_pdf(self, pdf_content: bytes) -> bool:
        """
        Validate that a PDF file is processable.
        
        Args:
            pdf_content: Raw PDF file content
            
        Returns:
            True if PDF is valid and processable
        """
        try:
            return self.pdf_extractor.is_valid_pdf(pdf_content)
        except Exception:
            return False
    
    async def validate_url(self, url: str) -> bool:
        """
        Validate that a URL is accessible and contains readable content.
        
        Args:
            url: URL to validate
            
        Returns:
            True if URL is accessible and contains text
        """
        try:
            text, _ = await self.url_scraper.extract_text(url)
            return bool(text and len(text.strip()) > 50)
        except Exception:
            return False
    
    async def get_document_info(self, pdf_content: bytes = None, url: str = None) -> Dict[str, Any]:
        """
        Get basic information about a document.
        
        Args:
            pdf_content: PDF content (if PDF source)
            url: URL (if URL source)
            
        Returns:
            Document information dictionary
        """
        info = {}
        
        if pdf_content:
            try:
                page_count = self.pdf_extractor.get_page_count(pdf_content)
                info.update({
                    "type": "pdf",
                    "page_count": page_count,
                    "is_valid": await self.validate_pdf(pdf_content)
                })
            except Exception:
                info.update({
                    "type": "pdf",
                    "page_count": 0,
                    "is_valid": False
                })
        
        elif url:
            try:
                title = await self.url_scraper.get_page_title(url)
                is_valid = await self.validate_url(url)
                info.update({
                    "type": "url",
                    "title": title,
                    "is_valid": is_valid
                })
            except Exception:
                info.update({
                    "type": "url",
                    "title": "Unknown",
                    "is_valid": False
                })
        
        return info
    
    async def cleanup(self):
        """Cleanup resources."""
        try:
            await self.url_scraper.close()
        except Exception:
            pass


# Global instance
policy_summarizer = PolicySummarizer()
