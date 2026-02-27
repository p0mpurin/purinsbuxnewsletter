# Partner Newsletter — Next.js

Premium internal newsletter viewer built with Next.js, React, and Tailwind CSS.

## Features

- **Search & filters** — By priority, section, product
- **Collapsible sections** — Expand/collapse all
- **Dark mode** — Toggle with persistence
- **Bilingual** — Italian (default) / English
- **Print / PDF** — Browser print for PDF export
- **Responsive** — Mobile-friendly layout

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data

- `public/dataset.json` — Newsletter content (AI-refined from extraction output)
- `public/images/` — Extracted images from PDFs

## Weekly Newsletter Update Workflow

1. **Drop the new PDF** in `raw/` (e.g. `raw/2026_10_STARBUCKS NEWSLETTER 05.03.pdf`).

2. **Run the extractor:**
   ```bash
   pip install -r requirements.txt
   python scripts/extract_newsletter.py raw/2026_10_*.pdf
   # Or use --latest to process the most recent PDF in raw/
   python scripts/extract_newsletter.py --latest
   ```

3. **Refine with AI:** Open `staging/dataset_raw.json`, copy its contents, and paste into your AI (e.g. Cursor, Claude) with the instructions from `prompts/newsletter-to-json.md`. The prompt uses `images_with_context` so the AI knows where each image belongs.

4. **Copy the output:**
   - Save the AI's JSON output to `public/dataset.json`
   - Copy `staging/images/` to `public/images/`:
     ```powershell
     Copy-Item -Recurse staging\images\* public\images\ -Force
     ```

**Optional:** Create `staging/image_assignments.json` to manually override image placement. Format: `{"2026_09_p1_i0.jpg": "SECTION TITLE / ITEM TITLE"}`. See `scripts/image_assignments.example.json`.

## Build

```bash
npm run build
npm run start
```
