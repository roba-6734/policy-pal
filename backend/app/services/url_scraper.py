"""
URL scraping service using Playwright.
Handles web page content extraction with JavaScript support.
"""

import asyncio
import hashlib
from typing import Optional, Tuple
from playwright.async_api import async_playwright, Browser, Page
import httpx
from urllib.parse import urlparse


class URLScraper:
    """Service for scraping content from URLs."""
    
    def __init__(self):
        """Initialize the URL scraper."""
        self.browser: Optional[Browser] = None
        self._browser_initialized = False
    
    async def _ensure_browser(self):
        """Ensure browser is initialized."""
        if not self._browser_initialized:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            self._browser_initialized = True
    
    async def extract_text(self, url: str) -> Tuple[str, str]:
        """
        Extract text content from a URL.
        
        Args:
            url: URL to scrape
            
        Returns:
            Tuple of (extracted_text, url_hash)
            
        Raises:
            ValueError: If URL is invalid or unreachable
            RuntimeError: If content extraction fails
        """
        try:
            # Validate URL
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("Invalid URL format")
            
            # Calculate URL hash for deduplication
            url_hash = hashlib.sha256(url.encode()).hexdigest()
            
            # First try with httpx for simple pages
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(url, follow_redirects=True)
                    response.raise_for_status()
                    
                    # If it's a simple HTML page, extract text directly
                    if 'text/html' in response.headers.get('content-type', ''):
                        text = await self._extract_text_from_html(response.text)
                        if text and len(text.strip()) > 100:  # Ensure we got meaningful content
                            return text, url_hash
            except Exception:
                pass  # Fall back to Playwright
            
            # Use Playwright for JavaScript-heavy pages
            await self._ensure_browser()
            
            page = await self.browser.new_page()
            
            # Set user agent to avoid blocking
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
            
            # Navigate to the page
            await page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait a bit for dynamic content to load
            await page.wait_for_timeout(2000)
            
            # Extract text content
            text = await page.evaluate("""
                () => {
                    // Remove script and style elements
                    const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
                    scripts.forEach(el => el.remove());
                    
                    // Get text content
                    return document.body.innerText || document.body.textContent || '';
                }
            """)
            
            await page.close()
            
            # Clean up the text
            cleaned_text = self._clean_text(text)
            
            if not cleaned_text.strip():
                raise ValueError("No readable text found on the page")
            
            return cleaned_text, url_hash
            
        except Exception as e:
            if "timeout" in str(e).lower():
                raise ValueError(f"URL request timed out: {url}")
            elif "not found" in str(e).lower() or "404" in str(e).lower():
                raise ValueError(f"URL not found: {url}")
            elif "forbidden" in str(e).lower() or "403" in str(e).lower():
                raise ValueError(f"Access forbidden to URL: {url}")
            else:
                raise RuntimeError(f"Failed to extract content from URL: {str(e)}")
    
    async def _extract_text_from_html(self, html_content: str) -> str:
        """
        Extract text from HTML content using simple parsing.
        
        Args:
            html_content: Raw HTML content
            
        Returns:
            Extracted text
        """
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer", "aside"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            return self._clean_text(text)
        except ImportError:
            # Fallback to simple regex if BeautifulSoup not available
            import re
            # Remove HTML tags
            text = re.sub(r'<[^>]+>', '', html_content)
            return self._clean_text(text)
    
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
            if line and len(line) > 2:  # Only keep meaningful lines
                cleaned_lines.append(line)
        
        # Join lines with single newlines
        cleaned_text = '\n'.join(cleaned_lines)
        
        # Remove multiple consecutive newlines
        while '\n\n\n' in cleaned_text:
            cleaned_text = cleaned_text.replace('\n\n\n', '\n\n')
        
        return cleaned_text.strip()
    
    async def get_page_title(self, url: str) -> str:
        """
        Get the page title from a URL.
        
        Args:
            url: URL to get title from
            
        Returns:
            Page title or URL if title not found
        """
        try:
            await self._ensure_browser()
            
            page = await self.browser.new_page()
            await page.goto(url, wait_until='domcontentloaded', timeout=15000)
            
            title = await page.title()
            await page.close()
            
            return title if title else urlparse(url).netloc
            
        except Exception:
            return urlparse(url).netloc
    
    async def close(self):
        """Close the browser and cleanup resources."""
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
        self._browser_initialized = False


# Global instance
url_scraper = URLScraper()
