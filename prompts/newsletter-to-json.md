# Newsletter to JSON – Instructions for AI

**Option A:** Paste the raw newsletter text below, then send to the model.

**Option B (hybrid):** Run `python scripts/extract_newsletter.py raw/2026_09_*.pdf` (or `--latest`) first. It extracts images to `staging/images/` and creates `staging/dataset_raw.json`. Paste the contents of `staging/dataset_raw.json` below. The model will refine the structure and assign images to the correct items using the rich context provided.

The model must return ONLY valid JSON, no markdown fences or explanation.

---

Transform the newsletter text (or refine dataset_raw.json) into structured JSON.

## RULES

- **products**: MUST always be an array. Use for:
  - Normal products: { "code", "name", "price_store", "price_airport", "pack_size" } (omit price/pack fields if not in the newsletter).
  - Code changes (CAMBI CODICE): { "old_code", "new_code", "name" } — use these three fields only for items that replace an old code with a new one.
- **contacts**: MUST always be an array. Each contact: { "name", "role", "phone" (optional), "email" (optional) }. Include everyone listed under CONTATTI or similar.
- **attachments**: Array of strings = document names mentioned (e.g. "Espresso Guide", "Safety shoes PDF", "Updated keypad procedure"). Use [] if none.
- **bullet_points**: Array of short text bullets only. Summarise key points; use original language (Italian/English) as in the newsletter.
- **stock_updates**: MUST be an array or null. For "SCOPERTURE STOCK / ESAURIMENTO STOCK / REINTEGRI" and similar tables, put each row as { "code", "name", "status" }. Use null if the item has no stock table.
- **images**: Array of image filenames. If refining dataset_raw.json: use `_extraction_meta.images_with_context` to assign each image to the correct item (see Image Assignment below). If building from text only, use [] or add filenames if you have images.

## IMAGE ASSIGNMENT (when refining dataset_raw.json)

Use `_extraction_meta.images_with_context` for each image. Each entry has:

- `filename` – e.g. "2026_09_p1_i0.jpg"
- `page` – page number
- `auto_assigned_to` – script's best guess (item title)
- `section` – section the script assigned it to
- `preceding_text` – text blocks above the image on the page (the item title is usually here)
- `following_text` – text blocks below the image (often the next item)

**Rule:** Assign each image to the item whose title appears in `preceding_text` (the content directly above the image). The item immediately above an image almost always owns it. If ambiguous, use `_extraction_meta.item_positions` to match by page and y proximity. Trust `auto_assigned_to` when it matches the preceding text; override when it does not. Remove `_extraction_meta` from the final output.

## PRIORITY (set one per item: HIGH, MEDIUM, or LOW)

**HIGH**
- Deadlines and time-sensitive actions
- Things to order or to print
- New product codes and code changes
- Active promotions and delivery discounts
- Operational procedures that must be followed
- Stock alerts (limited / discontinued)

**MEDIUM**
- Important guidelines or updates
- New documentation to use
- Process reminders (e.g. temperature strip, delivery note)

**LOW**
- Informational content
- Mission statements
- General reminders (e.g. P+ item)

## JSON SCHEMA

Return ONLY valid JSON in this shape (no markdown, no comments):

```json
{
  "week": "YYYY-WW",
  "sections": [
    {
      "title": "SECTION TITLE IN UPPERCASE AS IN NEWSLETTER",
      "items": [
        {
          "title": "ITEM HEADLINE",
          "priority": "HIGH | MEDIUM | LOW",
          "content": "Full paragraph text. Keep in original language (Italian/English).",
          "attachments": ["Name of attachment 1", "Name of attachment 2"],
          "products": [],
          "contacts": [],
          "stock_updates": null,
          "images": [],
          "bullet_points": ["Bullet 1", "Bullet 2"]
        }
      ]
    }
  ]
}
```

## NOTES

- Use the exact section titles and order from the newsletter (e.g. "PROUD TO BE A PARTNER", "OPERATIONS & HR UPDATES", "AGGIORNAMENTO PRODOTTI", "QUALITY", "MARKETING", "LOGISTICA", "TRAINING").
- Split each distinct topic into its own item (e.g. separate items for "TASTO SOST DECA", "NUOVA PROCEDURA SCARPE", "VENDITA CON TASTIERINO").
- For delivery/promotion reminders (Glovo, Just Eat, Deliveroo), one item per platform or one combined item as in the source.
- Preserve product codes and numbers exactly (e.g. SDNLSBK 01.01, S011168648).
- If a contact has no phone, omit the "phone" field. Same for "role" or "email" if missing.
- If refining dataset_raw.json: use `_extraction_meta.tables_extracted` for stock_updates and products. Use `_extraction_meta.images_with_context` and `_extraction_meta.item_positions` to assign images. Remove `_extraction_meta` from the output.
- Return ONLY the JSON object. No text before or after.

---

Paste the newsletter text or `staging/dataset_raw.json` contents below this line:
────────────────────────────────────
