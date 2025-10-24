# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/234ba47c-f588-4a99-9535-f7b2defd5d08

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/234ba47c-f588-4a99-9535-f7b2defd5d08) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/234ba47c-f588-4a99-9535-f7b2defd5d08) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
# PolicyPal

AI-assisted privacy policy analysis that turns dense legal documents into actionable insights. PolicyPal lets you upload or link to policies, summarize the key sections with risk indicators, compare two different policies, and keep results organized in a workspace.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Running the Full Stack](#running-the-full-stack)
8. [Configuration Reference](#configuration-reference)
9. [Key Workflows](#key-workflows)
10. [API Overview](#api-overview)
11. [Development Utilities](#development-utilities)
12. [Troubleshooting](#troubleshooting)
13. [UI Gallery](#ui-gallery)

---

## Features

- **Policy summarization** – Upload a PDF or provide a URL and receive structured summaries for Data Collection, User Rights, Data Sharing, Opt-Out Options, and Arbitration Clauses.
- **Risk scoring** – Each section is assigned a traffic-light style risk level (safe, caution, danger).
- **Workspace management** – Automatically stores results so you can reopen summaries without re-processing documents.
- **Policy comparison** – Compare two PDFs or URLs side-by-side to highlight differences and user-friendly recommendations.
- **Async FastAPI backend** – Handles file validation, scraping, LLM orchestration, and persistence with PostgreSQL.
- **Modern React frontend** – Built with Vite, TypeScript, shadcn/ui, Tailwind CSS, and React Query for a snappy UX.
- **Extensible architecture** – Clean service boundaries (PDF extraction, URL scraping, summarization, LLM calls) for easy customization.

---

## Architecture

```
Frontend (Vite + React + TypeScript)
    ├─ Upload/URL forms, comparison UI, workspace state
    ├─ API client (fetch) + React Query caching
    └─ Tailwind + shadcn/ui components

Backend (FastAPI)
    ├─ Routes: summarize_policy, compare_policies, summary retrieval, health
    ├─ Services: PDF extractor (PyMuPDF), URL scraper (Playwright), LLM orchestrator (OpenAI or Groq)
    ├─ Database: PostgreSQL via SQLAlchemy
    └─ Configuration via Pydantic settings
```

The backend can run independently and exposes a REST API. The frontend communicates with `http://localhost:8000` (configurable) and expects JSON responses that mirror the backend Pydantic models.

---

## Project Structure

```
policy-pal/
├─ backend/                 # FastAPI service
│  ├─ app/                  # Application packages
│  │  ├─ routers/           # API routes (policy)
│  │  ├─ services/          # PDF extractor, summarizer, LLM, URL scraper
│  │  ├─ models.py          # Pydantic response & request models
│  │  ├─ database.py        # SQLAlchemy models and helpers
│  │  └─ config.py          # Settings loaded from .env
│  ├─ requirements.txt      # Python dependencies
│  ├─ Dockerfile            # Containerized backend build
│  └─ README.md             # Backend-specific docs
├─ src/                     # React frontend
│  ├─ pages/                # Index, Results, Compare, NotFound
│  ├─ components/           # Shared UI components (PolicyCard, shadcn/ui)
│  ├─ hooks/                # Workspace state management
│  ├─ services/             # REST API client helpers
│  └─ App.tsx               # Router & providers
├─ package.json             # Frontend scripts & dependencies
├─ README.md                # You are here
└─ …                        # Configuration files (Vite, Tailwind, ESLint)
```

---

## Prerequisites

| Tool                 | Version (tested)                | Notes                                                                 |
| -------------------- | ------------------------------ | --------------------------------------------------------------------- |
| Node.js              | 18.x or 20.x LTS               | Required for the Vite React frontend                                  |
| npm                  | 9+ (ships with Node)           | Yarn/PNPM also work if you prefer                                     |
| Python               | 3.11+                          | Backend uses async features and type annotations                      |
| PostgreSQL           | 13+                            | Local development can use Docker or any hosted instance               |
| Playwright Browser   | Chromium                       | Needed for URL scraping; install via `playwright install chromium`    |
| OpenAI or Groq key   | Optional but recommended       | Required for production-quality summaries and comparisons             |

---

## Backend Setup

1. **Create environment**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate        # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env    # file contains sensible defaults
   ```
   Update `.env` with at least:
   - `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/policypal`
   - `LLM_PROVIDER=openai` (or `groq`)
   - `OPENAI_API_KEY` or `GROQ_API_KEY`

4. **Initialize the database**
   The service automatically creates tables on startup. Ensure the configured database exists (use `createdb policypal` if needed).

5. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   API docs are available at `http://localhost:8000/docs`.

---

## Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```
   The Vite dev server defaults to `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

3. **Build for production**
   ```bash
   npm run build
   npm run preview   # optional local preview of the production bundle
   ```

---

## Running the Full Stack

1. Start the backend (`uvicorn app.main:app --reload`).
2. Start the frontend (`npm run dev`).
3. Open `http://localhost:5173` in your browser.

The frontend makes requests to `http://localhost:8000/api/...`. If you deploy the backend elsewhere, update `src/services/api.ts` or configure Vite proxy and environment variables accordingly.

---

## Configuration Reference

### Backend Environment Variables

| Variable            | Description                                           | Default                               |
| ------------------- | ----------------------------------------------------- | ------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string                          | `postgresql://user:password@localhost/policypal` |
| `OPENAI_API_KEY`    | OpenAI API key                                        | `None`                                |
| `GROQ_API_KEY`      | Groq API key                                          | `None`                                |
| `LLM_PROVIDER`      | `openai` or `groq`                                    | `openai`                              |
| `LLM_MODEL`         | Model name (e.g., `gpt-4o-mini`, `llama-3.1-70b-versatile`) | `gpt-4o-mini`                     |
| `CORS_ORIGINS`      | Comma-separated list or JSON list of allowed origins  | `http://localhost:3000`, `http://localhost:5173`, `http://localhost:8080` |
| `MAX_FILE_SIZE`     | Maximum upload size in bytes                          | `26214400` (25 MB)                    |
| `SECRET_KEY`        | Application secret                                    | `your-secret-key-change-in-production` |
| `LOG_LEVEL`         | Logging level (`INFO`, `DEBUG`, etc.)                | `INFO`                                |

### Frontend Configuration

All API calls currently use the hardcoded base URL `http://localhost:8000`. Adjust `src/services/api.ts` if you expose the backend via a different host or use environment-specific URLs.

---

## Key Workflows

### Summarize a Policy

1. Load the landing page.
2. Upload a PDF or enter a policy URL.
3. Click **Analyze** to queue the document.
4. Once processed, click **Open in workspace** or navigate to **Results** to see the summary, risk indicators, and stats.

### Compare Two Policies

1. Navigate to `/compare` (header button).
2. Choose **Upload PDFs** or **Enter URLs**.
3. Submit two documents/links.
4. Review section-by-section differences, summaries for each policy, and the LLM recommendation.

### Workspace

- Summaries are stored by their UUID and cached in local storage.
- Reopening a summary fetches it from the backend if it is not already cached.
- The workspace allows switching between multiple summaries without reprocessing documents.

---

## API Overview

| Method | Endpoint                  | Description                                      |
| ------ | ------------------------- | ------------------------------------------------ |
| POST   | `/api/summarize_policy`   | Summarize a single PDF or URL                    |
| POST   | `/api/compare_policies`   | Compare two PDFs or URLs                         |
| GET    | `/api/summary/{summaryId}`| Retrieve a previously stored summary             |
| GET    | `/api/health`             | Health/status check                              |

### Example: Summarize a PDF

```bash
curl -X POST "http://localhost:8000/api/summarize_policy" \
  -F "file=@privacy_policy.pdf"
```

### Example: Compare Two Policies

```bash
curl -X POST "http://localhost:8000/api/compare_policies" \
  -F "url1=https://example.com/privacy" \
  -F "url2=https://example.com/terms"
```

Each response includes structured JSON keyed by the five policy sections with summaries, risks, differences, and recommendations.

---

## Development Utilities

| Command                  | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `npm run dev`           | Start Vite dev server                                   |
| `npm run build`         | Production build for the frontend                       |
| `npm run lint`          | Run ESLint (note: some warnings originate from vendored Playwright files) |
| `npx tsc --noEmit`      | Type-check the frontend                                 |
| `uvicorn app.main:app --reload` | Run backend with hot reload                   |

---

## Troubleshooting

| Issue                                        | Resolution |
| -------------------------------------------- | ---------- |
| **Playwright errors when scraping URLs**     | Ensure Chromium is installed via `playwright install chromium`. Some environments require additional system dependencies (see Playwright docs). |
| **CORS failures in the browser**             | Update `CORS_ORIGINS` in the backend `.env` to include your frontend origin(s). |
| **LLM provider errors**                      | Confirm API keys and provider configuration. The backend falls back across providers if available. |
| **Large PDFs failing**                       | Files over `MAX_FILE_SIZE` (default 25 MB) are rejected. Increase the limit in `.env` or reduce file size. |
| **ESLint complaining about third-party files** | The project vendor directory installed by Playwright contains lint directives. Limit the lint scope or suppress these warnings if desired. |

---

## UI Gallery

| Landing Page | Comparison Setup | Comparison Results |
| ------------ | ---------------- | ------------------ |
| ![Landing page showing upload form and URL input](public/screenshots/hero.png) | ![Comparison setup with tabs for PDFs and URLs](public/screenshots/compare.png) | ![Comparison results highlighting differences and recommendations](public/screenshots/comparison-results.png) |

---

## License

This project is provided for internal evaluation and can be adapted to fit your deployment needs. Add your preferred license here if you plan to distribute it publicly.

---

Happy analyzing! If you extend PolicyPal or integrate additional LLM providers, document your changes here to keep the team aligned.
