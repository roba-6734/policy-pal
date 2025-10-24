import asyncio
import hashlib

import fitz
import pytest

from app.services.pdf_extractor import PDFExtractor


@pytest.fixture
def pdf_extractor() -> PDFExtractor:
    return PDFExtractor()


@pytest.fixture
def pdf_with_text_bytes() -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "PolicyPal\nTest Document")
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


@pytest.fixture
def blank_pdf_bytes() -> bytes:
    document = fitz.open()
    document.new_page()  # Ensure the document has a page but no text
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


@pytest.mark.asyncio
async def test_extract_text_returns_clean_text_and_hash(pdf_extractor: PDFExtractor, pdf_with_text_bytes: bytes) -> None:
    extracted_text, file_hash = await pdf_extractor.extract_text(pdf_with_text_bytes)

    assert extracted_text == "PolicyPal\nTest Document"
    assert file_hash == hashlib.sha256(pdf_with_text_bytes).hexdigest()


@pytest.mark.asyncio
async def test_extract_text_with_blank_pdf_raises_value_error(pdf_extractor: PDFExtractor, blank_pdf_bytes: bytes) -> None:
    with pytest.raises(ValueError, match="No readable text found in PDF"):
        await pdf_extractor.extract_text(blank_pdf_bytes)


@pytest.mark.asyncio
async def test_extract_text_with_invalid_pdf_raises_runtime_error(pdf_extractor: PDFExtractor) -> None:
    with pytest.raises(RuntimeError, match="Failed to extract text from PDF"):
        await pdf_extractor.extract_text(b"not a real pdf")


def test_get_page_count_returns_number_of_pages(pdf_extractor: PDFExtractor, pdf_with_text_bytes: bytes) -> None:
    assert pdf_extractor.get_page_count(pdf_with_text_bytes) == 1


def test_get_page_count_invalid_pdf_returns_zero(pdf_extractor: PDFExtractor) -> None:
    assert pdf_extractor.get_page_count(b"broken data") == 0


def test_is_valid_pdf_returns_true_for_valid_file(pdf_extractor: PDFExtractor, pdf_with_text_bytes: bytes) -> None:
    assert pdf_extractor.is_valid_pdf(pdf_with_text_bytes) is True


def test_is_valid_pdf_returns_false_for_invalid_file(pdf_extractor: PDFExtractor) -> None:
    assert pdf_extractor.is_valid_pdf(b"still not a pdf") is False
