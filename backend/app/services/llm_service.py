"""
LLM service for policy summarization and comparison.
Supports OpenAI and Groq APIs with intelligent chunking for long documents.
"""

import json
import asyncio
from typing import Dict, List, Optional, Any
from openai import AsyncOpenAI
from groq import AsyncGroq
import tiktoken

from app.config import settings
from app.models import PolicySummary, PolicySection


class LLMService:
    """Service for policy summarization using various LLM providers."""
    
    def __init__(self):
        """Initialize the LLM service."""
        self.openai_client = None
        self.groq_client = None
        self.encoding = None
        
        # Initialize clients based on configuration
        if settings.openai_api_key:
            self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        if settings.groq_api_key:
            self.groq_client = AsyncGroq(api_key=settings.groq_api_key)
        
        # Initialize tokenizer for chunking
        try:
            self.encoding = tiktoken.get_encoding("cl100k_base")
        except Exception:
            self.encoding = None
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text for chunking."""
        if self.encoding:
            return len(self.encoding.encode(text))
        else:
            # Rough estimation: 1 token ≈ 4 characters
            return len(text) // 4
    
    def _chunk_text(self, text: str, max_tokens: int = 6000) -> List[str]:
        """
        Split text into chunks that fit within token limits.
        
        Args:
            text: Text to chunk
            max_tokens: Maximum tokens per chunk
            
        Returns:
            List of text chunks
        """
        if self._count_tokens(text) <= max_tokens:
            return [text]
        
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            # If adding this paragraph would exceed limit, start new chunk
            test_chunk = current_chunk + "\n\n" + paragraph if current_chunk else paragraph
            
            if self._count_tokens(test_chunk) > max_tokens and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = paragraph
            else:
                current_chunk = test_chunk
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def _call_openai(self, prompt: str, model: str = None) -> str:
        """Call OpenAI API."""
        if not self.openai_client:
            raise RuntimeError("OpenAI client not initialized")
        
        model = model or settings.llm_model
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=4000
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {str(e)}")
    
    async def _call_groq(self, prompt: str, model: str = "llama-3.1-70b-versatile") -> str:
        """Call Groq API."""
        if not self.groq_client:
            raise RuntimeError("Groq client not initialized")
        
        try:
            response = await self.groq_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=4000
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"Groq API error: {str(e)}")
    
    async def _call_llm(self, prompt: str) -> str:
        """Call the configured LLM provider."""
        if settings.llm_provider == "openai" and self.openai_client:
            return await self._call_openai(prompt)
        elif settings.llm_provider == "groq" and self.groq_client:
            return await self._call_groq(prompt)
        else:
            # Try fallback providers
            if self.openai_client:
                return await self._call_openai(prompt)
            elif self.groq_client:
                return await self._call_groq(prompt)
            else:
                raise RuntimeError("No LLM provider configured or available")
    
    async def summarize_policy(self, text: str) -> Dict[str, Any]:
        """
        Summarize a policy document using LLM.
        
        Args:
            text: Policy text to summarize
            
        Returns:
            Structured policy summary
        """
        # Check if text needs chunking
        chunks = self._chunk_text(text)
        
        if len(chunks) == 1:
            # Single chunk - process normally
            return await self._summarize_single_chunk(chunks[0])
        else:
            # Multiple chunks - process each section separately
            return await self._summarize_multiple_chunks(chunks)
    
    async def _summarize_single_chunk(self, text: str) -> Dict[str, Any]:
        """Summarize a single chunk of text."""
        prompt = self._create_summarization_prompt(text)
        
        try:
            response = await self._call_llm(prompt)
            return self._parse_llm_response(response)
        except Exception as e:
            raise RuntimeError(f"Failed to summarize policy: {str(e)}")
    
    async def _summarize_multiple_chunks(self, chunks: List[str]) -> Dict[str, Any]:
        """Summarize multiple chunks and combine results."""
        # First, get an overview of the entire document
        overview_prompt = f"""
        Analyze this policy document and provide a high-level overview of its main sections.
        Focus on identifying the key areas: Data Collection, User Rights, Data Sharing, Opt-Out Options, and Arbitration Clause.
        
        Document content:
        {chunks[0][:2000]}...
        
        Provide a brief overview of what this policy covers.
        """
        
        try:
            overview = await self._call_llm(overview_prompt)
            
            # Then process each chunk for detailed analysis
            section_results = {}
            
            for i, chunk in enumerate(chunks):
                chunk_prompt = self._create_summarization_prompt(chunk, is_partial=True, chunk_num=i+1, total_chunks=len(chunks))
                
                try:
                    chunk_response = await self._call_llm(chunk_prompt)
                    chunk_data = self._parse_llm_response(chunk_response)
                    
                    # Merge results
                    for section, data in chunk_data.items():
                        if section not in section_results:
                            section_results[section] = data
                        else:
                            # Combine summaries for the same section
                            section_results[section]["summary"] += f" {data['summary']}"
                            # Use higher risk level
                            if data["risk"] == "red" or (data["risk"] == "yellow" and section_results[section]["risk"] == "green"):
                                section_results[section]["risk"] = data["risk"]
                
                except Exception as e:
                    # Continue with other chunks if one fails
                    continue
            
            return section_results
            
        except Exception as e:
            raise RuntimeError(f"Failed to summarize policy chunks: {str(e)}")
    
    def _create_summarization_prompt(self, text: str, is_partial: bool = False, chunk_num: int = 1, total_chunks: int = 1) -> str:
        """Create the prompt for policy summarization."""
        context = f" (Part {chunk_num} of {total_chunks})" if is_partial else ""
        
        return f"""
        Analyze this privacy policy or terms of service document{context} and extract information for the following sections:

        1. Data Collection - What personal information is collected
        2. User Rights - What rights users have regarding their data
        3. Data Sharing - How data is shared with third parties
        4. Opt-Out Options - What choices users have to limit data collection
        5. Arbitration Clause - Any mandatory arbitration or class action waivers

        For each section, provide:
        - summary: A clear, concise explanation
        - risk: "green" (user-friendly), "yellow" (concerning), or "red" (problematic)
        - details: Additional context and specific examples

        Return ONLY a valid JSON object with this exact structure:
        {{
            "Data Collection": {{"summary": "...", "risk": "green/yellow/red", "details": "..."}},
            "User Rights": {{"summary": "...", "risk": "green/yellow/red", "details": "..."}},
            "Data Sharing": {{"summary": "...", "risk": "green/yellow/red", "details": "..."}},
            "Opt-Out Options": {{"summary": "...", "risk": "green/yellow/red", "details": "..."}},
            "Arbitration Clause": {{"summary": "...", "risk": "green/yellow/red", "details": "..."}}
        }}

        Document content:
        {text[:8000]}  # Limit to prevent token overflow
        """
    
    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """Parse LLM response and extract JSON."""
        try:
            # Try to find JSON in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
                
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback: try to extract structured data manually
            return self._fallback_parse(response)
    
    def _fallback_parse(self, response: str) -> Dict[str, Any]:
        """Fallback parsing when JSON extraction fails."""
        # Create a basic structure with the raw response
        return {
            "Data Collection": {
                "summary": "Unable to parse specific details",
                "risk": "yellow",
                "details": response[:500]
            },
            "User Rights": {
                "summary": "Unable to parse specific details",
                "risk": "yellow", 
                "details": "Analysis incomplete"
            },
            "Data Sharing": {
                "summary": "Unable to parse specific details",
                "risk": "yellow",
                "details": "Analysis incomplete"
            },
            "Opt-Out Options": {
                "summary": "Unable to parse specific details",
                "risk": "yellow",
                "details": "Analysis incomplete"
            },
            "Arbitration Clause": {
                "summary": "Unable to parse specific details",
                "risk": "yellow",
                "details": "Analysis incomplete"
            }
        }
    
    async def compare_policies(self, policy1_text: str, policy2_text: str, 
                             policy1_name: str, policy2_name: str) -> Dict[str, Any]:
        """
        Compare two policies and highlight differences.
        
        Args:
            policy1_text: First policy text
            policy2_text: Second policy text
            policy1_name: Name of first policy
            policy2_name: Name of second policy
            
        Returns:
            Structured comparison data
        """
        prompt = f"""
        Compare these two privacy policies and highlight key differences:

        Policy 1 ({policy1_name}):
        {policy1_text[:3000]}

        Policy 2 ({policy2_name}):
        {policy2_text[:3000]}

        For each section (Data Collection, User Rights, Data Sharing, Opt-Out Options, Arbitration Clause), provide:
        - policy1_summary: Summary for policy 1
        - policy2_summary: Summary for policy 2  
        - key_differences: Main differences between the policies
        - recommendation: Which policy is better for users

        Return ONLY a valid JSON object with this structure:
        {{
            "Data Collection": {{
                "policy1_summary": "...",
                "policy2_summary": "...",
                "key_differences": "...",
                "recommendation": "..."
            }},
            "User Rights": {{...}},
            "Data Sharing": {{...}},
            "Opt-Out Options": {{...}},
            "Arbitration Clause": {{...}}
        }}
        """
        
        try:
            response = await self._call_llm(prompt)
            return self._parse_llm_response(response)
        except Exception as e:
            raise RuntimeError(f"Failed to compare policies: {str(e)}")


# Global instance
llm_service = LLMService()
