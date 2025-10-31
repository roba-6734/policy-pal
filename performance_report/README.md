# PolicyPal Performance Report

## Overview
- PolicyPal is deployed at `https://policy-pal-roan.vercel.app` with a FastAPI backend on Render (`https://policy-pal-o7fq.onrender.com`).
- Monitoring snapshots were captured on 31 Oct 2025 via Vercel Speed Insights and Web Analytics (see included screenshots).
- Latest build reflects production defaults with static assets delivered by Vercel’s CDN and backend responses proxied to Render.

## Test Snapshot
- **Test window:** Last 7 days ending 31 Oct 2025.
- **Device profile:** Desktop (Vercel Speed Insights desktop preset).
- **Connection profile:** Vercel’s default simulated broadband (roughly 40 Mbps down / 10 Mbps up).
- **Frontend bundle:** Vite + React + TypeScript (cached first visit); hero background served as JPEG (~400 KB).
- **Backend latency:** Average TTFB 0.18 s from Render region `us-east`.

## Core Web Vitals

| Metric                     | Observed | Target | Status | Notes |
| -------------------------- | -------- | ------ | ------ | ----- |
| Real Experience Score      | 98 / 100 | > 90   | ✅     | Consistent “Great” rating for the entire week. |
| First Contentful Paint     | 1.9 s    | < 1.8 s| ⚠️     | Slightly above Google’s ideal threshold; dominated by hero image load. |
| Largest Contentful Paint   | 2.07 s   | < 2.5 s| ✅     | Well within good range; stable across visits. |
| Interaction to Next Paint  | 144 ms   | < 200 ms| ✅    | Interface remains responsive after initial paint. |
| Cumulative Layout Shift    | 0        | < 0.1  | ✅     | No layout jumps detected. |
| First Input Delay          | 1 ms     | < 100 ms| ✅    | Navigation and CTA buttons register instantly. |
| Time to First Byte         | 0.18 s   | < 0.3 s| ✅     | Render API responding quickly; cached static assets help. |

## Traffic & Engagement
- **Visitors:** 11 unique visitors in the 7-day window.
- **Page views:** 59 total page views; `/summarize` (7) and `/compare` (5) see the most engagement after the landing page.
- **Bounce rate:** 36%, acceptable for a new tool but suggests room to deepen onboarding.
- **Referrers:** vercel.com (5 visits) and bing.com (1 visit); remaining traffic is direct or unknown.
- **Engagement trend:** Traffic spike observed Oct 30–31 with steady increase in return visits (see `performance_report/Screenshot from 2025-10-31 21-42-07.png`).

## Feature Validation
- **Working**
  - `POST /api/summarize_policy` accepts PDF uploads or URLs and persists summaries in PostgreSQL (see backend/app/routers/policy.py:34).
  - `POST /api/compare_policies` powers the comparison UI on `/compare` by returning structured sections (backend/app/routers/policy.py:161).
  - Stored summaries can be reopened from the workspace without reprocessing (frontend/src/pages/Results.tsx:1).
- **Limitations / Known Issues**
  - Summarization and comparison require valid `OPENAI_API_KEY` or `GROQ_API_KEY`; missing credentials raise 500-level errors (backend/app/services/llm_service.py).
  - Mobile-specific Speed Insights data was not captured during this snapshot; follow-up profiling is recommended.
  - Hero background image (~400 KB JPEG) slightly delays FCP; consider lazy-loading or using a lighter WebP asset.

## Loading Issues
- Vercel Speed Insights did not flag render-blocking scripts during the reporting window; all metrics except FCP are in the green band.
- LLM processing remains the dominant contributor to response time; large PDFs may require several seconds to complete (backend/app/services/summarizer.py:41).
- React Query caching minimizes layout shifts when navigating between workspace results and detail pages (frontend/src/App.tsx:18).

## Recommendations
1. Convert hero background to WebP and enable `loading="lazy"` for below-the-fold imagery to bring FCP under 1.8 s.
2. Add synthetic mobile run (e.g., Lighthouse CI) and track results in this report for parity.
3. Implement request-level caching or job queueing for repeated summarization of identical documents to cap LLM costs and response times.
4. Expand analytics goals (e.g., conversion events on “Summarize” submission) to better interpret bounce rate changes.

## Screenshots
- Speed Insights (Desktop)  
  ![Speed Insights dashboard](./Screenshot%20from%202025-10-31%2021-41-38.png)
- Web Analytics (Last 7 Days)  
  ![Web Analytics overview](./Screenshot%20from%202025-10-31%2021-42-07.png)
