# PolicyPal Backend

A production-ready FastAPI backend for AI-powered policy summarization and comparison. This service processes PDF documents and URLs to generate structured summaries with risk assessments using OpenAI or Groq LLMs.

## Features

- **PDF Processing**: Extract text from PDF documents using PyMuPDF
- **URL Scraping**: Scrape policy content from web pages using Playwright
- **AI Summarization**: Generate structured policy summaries with risk indicators
- **Policy Comparison**: Compare two policies and highlight key differences
- **Database Storage**: Store summaries with PostgreSQL for retrieval
- **Production Ready**: Docker containerization and Render deployment support

## API Endpoints

### Core Endpoints

- `POST /api/summarize_policy` - Summarize a single policy (PDF or URL)
- `POST /api/compare_policies` - Compare two policies (PDFs or URLs)
- `GET /api/summary/{id}` - Retrieve a stored summary
- `GET /api/health` - Health check endpoint

### Documentation

- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL database
- OpenAI API key or Groq API key

### Local Development

1. **Clone and setup**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

3. **Setup database**:
   ```bash
   # Create PostgreSQL database
   createdb policypal
   # Update DATABASE_URL in .env
   ```

4. **Run the application**:
   ```bash
   python -m app.main
   # or
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`

### Docker Deployment

1. **Build the image**:
   ```bash
   docker build -t policypal-backend .
   ```

2. **Run with environment variables**:
   ```bash
   docker run -p 8000:8000 \
     -e DATABASE_URL="postgresql://user:pass@host/db" \
     -e OPENAI_API_KEY="your_key" \
     policypal-backend
   ```

### Render Deployment

1. **Connect your repository** to Render
2. **Configure environment variables** in Render dashboard:
   - `OPENAI_API_KEY` or `GROQ_API_KEY`
   - `LLM_PROVIDER` (openai or groq)
   - `CORS_ORIGINS` (your frontend URLs)
3. **Deploy** - Render will automatically build and deploy using `render.yaml`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `GROQ_API_KEY` | Groq API key | Optional |
| `LLM_PROVIDER` | LLM provider (openai/groq) | openai |
| `LLM_MODEL` | Model to use | gpt-4o-mini |
| `CORS_ORIGINS` | Allowed CORS origins | localhost:3000,localhost:5173 |
| `MAX_FILE_SIZE` | Max file upload size (bytes) | 26214400 (25MB) |
| `SECRET_KEY` | Secret key for security | Generated |

### LLM Configuration

The service supports both OpenAI and Groq APIs:

**OpenAI**:
- Models: `gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`
- Cost-effective: `gpt-4o-mini` (recommended)

**Groq**:
- Models: `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`
- Fast inference: `llama-3.1-70b-versatile` (recommended)

## API Usage Examples

### Summarize PDF Policy

```bash
curl -X POST "http://localhost:8000/api/summarize_policy" \
  -F "file=@privacy_policy.pdf"
```

### Summarize URL Policy

```bash
curl -X POST "http://localhost:8000/api/summarize_policy" \
  -F "url=https://example.com/privacy-policy"
```

### Compare Two Policies

```bash
curl -X POST "http://localhost:8000/api/compare_policies" \
  -F "file1=@policy1.pdf" \
  -F "file2=@policy2.pdf"
```

### Retrieve Stored Summary

```bash
curl "http://localhost:8000/api/summary/123e4567-e89b-12d3-a456-426614174000"
```

## Response Format

### Policy Summary Response

```json
{
  "summary_id": "uuid",
  "source_name": "privacy_policy.pdf",
  "source_type": "pdf",
  "summary": {
    "Data Collection": {
      "summary": "Collects name, email, and usage data",
      "risk": "yellow",
      "details": "Specific data points collected..."
    },
    "User Rights": {
      "summary": "Users can access and delete their data",
      "risk": "green",
      "details": "Available rights and procedures..."
    }
  },
  "created_at": "2025-01-27T10:30:00Z"
}
```

### Risk Levels

- **Green**: User-friendly practices, good privacy protections
- **Yellow**: Concerning but not critical issues
- **Red**: Problematic practices, significant privacy risks

## Architecture

### Services

- **PDF Extractor**: PyMuPDF for reliable PDF text extraction
- **URL Scraper**: Playwright for JavaScript-heavy pages
- **LLM Service**: OpenAI/Groq integration with intelligent chunking
- **Summarizer**: Orchestrates extraction and LLM processing
- **Database**: PostgreSQL with SQLAlchemy ORM

### Error Handling

- Comprehensive validation for file types and sizes
- Graceful fallbacks for LLM API failures
- Structured error responses with helpful messages
- Request timeout and rate limiting

### Performance

- Async/await throughout for concurrency
- Intelligent text chunking for large documents
- Connection pooling for database
- Caching of extracted content

## Development

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── database.py          # Database models
│   ├── models.py            # Pydantic models
│   ├── routers/
│   │   └── policy.py        # API endpoints
│   ├── services/
│   │   ├── pdf_extractor.py # PDF processing
│   │   ├── url_scraper.py   # URL scraping
│   │   ├── llm_service.py   # LLM integration
│   │   └── summarizer.py    # Main orchestrator
│   └── utils/
│       └── helpers.py        # Utilities
├── requirements.txt
├── Dockerfile
├── render.yaml
└── README.md
```

### Adding New Features

1. **New endpoints**: Add to `app/routers/policy.py`
2. **New services**: Create in `app/services/`
3. **Database changes**: Update `app/database.py` and create migration
4. **Configuration**: Add to `app/config.py`

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## Troubleshooting

### Common Issues

1. **PDF extraction fails**: Ensure PDF is not password-protected or corrupted
2. **URL scraping fails**: Check if URL is accessible and contains text
3. **LLM API errors**: Verify API keys and check rate limits
4. **Database connection**: Ensure PostgreSQL is running and accessible

### Logs

Check application logs for detailed error information:

```bash
# Docker logs
docker logs policypal-backend

# Render logs
# Available in Render dashboard
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the API documentation at `/docs`
- Review the logs for error details
- Ensure all environment variables are configured correctly
