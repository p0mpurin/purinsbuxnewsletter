#!/usr/bin/env python3
"""
Extract text, images, and tables from a Starbucks Partner Newsletter PDF.
Outputs: staging/images/ + staging/dataset_raw.json (for AI refinement).

Usage:
  python scripts/extract_newsletter.py raw/2026_09_STARBUCKS NEWSLETTER 26.02.pdf
  python scripts/extract_newsletter.py --latest
  python scripts/extract_newsletter.py raw/*.pdf --copy-to-public

Images are saved with rich context (preceding_text, following_text) so the AI
can reliably assign each image to the correct item.
"""

import json
import re
import sys
import shutil
from pathlib import Path

# Project root: newsletter-app/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "raw"
STAGING_DIR = PROJECT_ROOT / "staging"
PUBLIC_DIR = PROJECT_ROOT / "public"


def extract_week_from_filename(filename: str) -> str:
    """Extract week (e.g. 2026-09) from filename like '2026_09_STARBUCKS NEWSLETTER 26.02.pdf'."""
    name = Path(filename).stem
    m = re.search(r"(\d{4})_?(\d{2})", name)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    m = re.search(r"(\d{2})_?(\d{2})", name)
    if m:
        return f"20{m.group(1)}-{m.group(2)}"
    return "unknown"


def is_section_header(line: str) -> bool:
    """Detect section headers like '1. PROUD TO BE A PARTNER' or '5. LOGISTICA'."""
    s = line.strip()
    return bool(re.match(r"^\d+\.\s*[A-Za-z][A-Za-z0-9\s&]+$", s) and len(s) > 5)


def is_item_title(line: str, prev_line: str = "") -> bool:
    """Detect item titles: all-caps, not a section header, not CONTATTI/header."""
    s = line.strip()
    if not s or len(s) > 100:
        return False
    if is_section_header(s):
        return False
    if s in ("CONTATTI", "Codice Negozio Orario", "Item Number Item Description Comments"):
        return False
    if re.match(r"^(OUT|IN)\s+", s):
        return False
    if s.upper() != s:
        return False
    if re.match(r"^[A-Z][A-Z0-9\s\-–/:&]+$", s) and len(s) > 3:
        return True
    return False


def extract_with_pymupdf(pdf_path: Path, images_dir: Path, week: str) -> dict:
    """Extract using PyMuPDF: text blocks with positions, images."""
    try:
        import fitz
    except ImportError:
        print("Install PyMuPDF: pip install pymupdf (or: pip install -r requirements.txt)")
        sys.exit(1)

    images_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)

    page_elements = []
    page_images = []

    for page_num in range(len(doc)):
        page = doc[page_num]

        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if "lines" not in block:
                continue
            parts = []
            for line in block["lines"]:
                for span in line["spans"]:
                    parts.append(span.get("text", ""))
            text = " ".join(parts).strip()
            if text:
                bbox = block.get("bbox", (0, 0, 0, 0))
                page_elements.append({
                    "page": page_num,
                    "y0": bbox[1],
                    "y1": bbox[3],
                    "text": text,
                    "type": "text",
                })

        image_list = page.get_images()
        for img_idx, img_info in enumerate(image_list):
            xref = img_info[0]
            try:
                base_image = doc.extract_image(xref)
                img_bytes = base_image["image"]
                ext = base_image["ext"]
                if ext == "jpeg":
                    ext = "jpg"

                img_rects = page.get_image_rects(xref)
                y0 = img_rects[0].y0 if img_rects else 0

                filename = f"{week}_p{page_num + 1}_i{img_idx}.{ext}"
                out_path = images_dir / filename
                with open(out_path, "wb") as f:
                    f.write(img_bytes)

                page_images.append({
                    "page": page_num,
                    "y0": y0,
                    "filename": filename,
                    "type": "image",
                })
            except Exception as e:
                print(f"Warning: could not extract image {img_idx} on page {page_num + 1}: {e}")

    doc.close()

    return {
        "page_elements": page_elements,
        "page_images": page_images,
    }


def extract_tables_with_pdfplumber(pdf_path: Path) -> list:
    """Extract tables using pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        return []

    tables = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            page_tables = page.extract_tables()
            if page_tables:
                for t_idx, t in enumerate(page_tables):
                    if t and any(any(cell for cell in row) for row in t):
                        tables.append({
                            "page": page_num + 1,
                            "table_index": t_idx,
                            "data": t,
                        })
    return tables


def build_images_with_context(
    page_elements: list,
    page_images: list,
    sections: list,
    item_to_assignment: dict,
) -> list:
    """
    Build images_with_context: for each image, preceding_text, following_text, auto_assigned_to.
    """
    elements_by_page = {}
    for el in page_elements:
        if el["type"] != "text":
            continue
        p = el["page"]
        if p not in elements_by_page:
            elements_by_page[p] = []
        elements_by_page[p].append(el)

    for p in elements_by_page:
        elements_by_page[p].sort(key=lambda e: e["y0"])

    result = []
    for img in page_images:
        img_page = img["page"]
        img_y = img["y0"]
        filename = img["filename"]

        preceding = []
        following = []

        page_elts = elements_by_page.get(img_page, [])
        for el in page_elts:
            if el["y1"] <= img_y:
                preceding.append(el["text"])
            elif el["y0"] > img_y:
                following.append(el["text"])

        preceding = preceding[-3:] if len(preceding) > 3 else preceding
        following = following[:2] if len(following) > 2 else following

        auto_item = item_to_assignment.get(filename, "")
        auto_section = ""
        for sec in sections:
            for item in sec["items"]:
                if filename in item.get("images", []):
                    auto_item = item.get("title", "")
                    auto_section = sec.get("title", "")
                    break

        result.append({
            "filename": filename,
            "page": img_page + 1,
            "y0": round(img_y, 1),
            "auto_assigned_to": auto_item,
            "section": auto_section,
            "preceding_text": preceding,
            "following_text": following,
        })

    return result


def build_structure_from_elements(raw: dict, week: str):
    """
    Build sections/items from text blocks and assign images to items by position.
    Returns (result, item_positions, images_with_context).
    """
    elements = raw["page_elements"]
    images = raw["page_images"]

    elements.sort(key=lambda e: (e["page"], e["y0"]))

    sections = []
    current_section = None
    current_item = None

    for el in elements:
        if el["type"] != "text":
            continue
        text = el["text"]
        page = el["page"]
        y0, y1 = el["y0"], el["y1"]

        if "NL " in text and "WEEK" in text:
            continue
        if text == "pag." or re.match(r"^pag\.\s*\d+$", text):
            continue
        if re.match(r"^--\s*\d+ of \d+\s*--$", text):
            continue

        if is_section_header(text):
            title = re.sub(r"^\d+\.\s*", "", text).strip()
            current_section = {
                "title": title,
                "items": [],
            }
            sections.append(current_section)
            current_item = None
            continue

        if current_section is None:
            continue

        if is_item_title(text):
            current_item = {
                "title": text.strip(),
                "priority": "MEDIUM",
                "content": "",
                "attachments": [],
                "products": [],
                "contacts": [],
                "stock_updates": None,
                "images": [],
                "bullet_points": [],
                "_page": page,
                "_y0": y0,
                "_y1": y1,
            }
            current_section["items"].append(current_item)
            continue

        if current_item is not None:
            if not current_item["content"]:
                current_item["content"] = text
            else:
                current_item["content"] += "\n" + text
            current_item["_y1"] = current_item.get("_y1", y1)

    # Assign images to items by position
    item_to_assignment = {}
    for img in images:
        img_page = img["page"]
        img_y = img["y0"]
        filename = img["filename"]

        best_item = None
        best_dist = float("inf")

        for sec in sections:
            for item in sec["items"]:
                item_page = item.get("_page", -1)
                item_y0 = item.get("_y0", 0)
                item_y1 = item.get("_y1", 0)

                if item_page == img_page:
                    if item_y0 <= img_y <= item_y1 + 50:
                        dist = abs(img_y - (item_y0 + item_y1) / 2)
                        if dist < best_dist:
                            best_dist = dist
                            best_item = item
                    elif item_y1 < img_y and best_item is None:
                        best_item = item

        if best_item is not None:
            if filename not in best_item["images"]:
                best_item["images"].append(filename)
            item_to_assignment[filename] = best_item.get("title", "")
        else:
            if sections and sections[-1]["items"]:
                last_item = sections[-1]["items"][-1]
                if last_item.get("_page") == img_page and filename not in last_item["images"]:
                    last_item["images"].append(filename)
                    item_to_assignment[filename] = last_item.get("title", "")

    # Build item_positions before stripping
    item_positions = []
    for sec in sections:
        for item in sec["items"]:
            item_positions.append({
                "section": sec["title"],
                "item": item["title"],
                "page": item["_page"] + 1,
                "y0": round(item["_y0"], 1),
                "y1": round(item["_y1"], 1),
            })

    # Build images_with_context
    images_with_context = build_images_with_context(
        raw["page_elements"],
        raw["page_images"],
        sections,
        item_to_assignment,
    )

    # Clean internal fields
    for sec in sections:
        for item in sec["items"]:
            del item["_page"]
            del item["_y0"]
            del item["_y1"]

    return {
        "week": week,
        "sections": sections,
    }, item_positions, images_with_context


def find_pdf_path(args):
    """Resolve PDF path from args. Supports --latest and raw/ glob."""
    if "--latest" in args:
        pdfs = sorted(RAW_DIR.glob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not pdfs:
            print(f"Error: no PDF files in {RAW_DIR}")
            return None
        return pdfs[0]

    if len(args) < 1:
        return None

    arg = args[0]
    path = Path(arg)
    if not path.is_absolute():
        path = (PROJECT_ROOT / arg).resolve()

    if path.exists():
        if path.is_file():
            return path
        if path.is_dir():
            pdfs = sorted(path.glob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)
            if pdfs:
                return pdfs[0]

    # Try glob
    if "*" in arg:
        matches = list(PROJECT_ROOT.glob(arg))
        if matches:
            return sorted(matches, key=lambda p: p.stat().st_mtime, reverse=True)[0]

    return path if path.exists() else None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--") or a in ("--output-dir", "--copy-to-public", "--latest")]
    output_dir = STAGING_DIR
    copy_to_public = "--copy-to-public" in sys.argv

    if "--output-dir" in sys.argv:
        idx = sys.argv.index("--output-dir")
        if idx + 1 < len(sys.argv):
            output_dir = Path(sys.argv[idx + 1])

    pdf_path = find_pdf_path(sys.argv[1:])
    if not pdf_path or not pdf_path.exists():
        print(__doc__)
        print("\nUsage: python scripts/extract_newsletter.py <pdf_path|raw/*.pdf|--latest> [--output-dir DIR] [--copy-to-public]")
        print(f"  Drop PDFs in {RAW_DIR}")
        sys.exit(1)

    week = extract_week_from_filename(pdf_path.name)
    week_safe = week.replace("-", "_")
    images_dir = output_dir / "images"

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Extracting from {pdf_path.name} (week: {week})")
    print(f"Output: {output_dir}")

    raw = extract_with_pymupdf(pdf_path, images_dir, week_safe)
    tables = extract_tables_with_pdfplumber(pdf_path)

    result, item_positions, images_with_context = build_structure_from_elements(raw, week)

    assignments_path = output_dir / "image_assignments.json"
    if assignments_path.exists():
        try:
            with open(assignments_path, encoding="utf-8") as f:
                assignments = json.load(f)
            for img_filename, target in assignments.items():
                parts = target.split("/", 1) if "/" in target else [target.strip(), ""]
                section_title = parts[0].strip()
                item_title = parts[1].strip() if len(parts) > 1 else ""
                for sec in result["sections"]:
                    for item in sec["items"]:
                        if img_filename in item["images"]:
                            item["images"].remove(img_filename)
                placed = False
                for sec in result["sections"]:
                    if section_title.upper() in sec["title"].upper():
                        for item in sec["items"]:
                            if not item_title or item_title.upper() in item["title"].upper():
                                item["images"].append(img_filename)
                                placed = True
                                break
                    if placed:
                        break
        except Exception as e:
            print(f"Warning: could not load image_assignments.json: {e}")

    images_per_page = {}
    for img in raw["page_images"]:
        p = img["page"] + 1
        if p not in images_per_page:
            images_per_page[str(p)] = []
        images_per_page[str(p)].append(img["filename"])

    out_json = output_dir / "dataset_raw.json"
    output = {
        "week": result["week"],
        "sections": result["sections"],
        "_extraction_meta": {
            "source_pdf": pdf_path.name,
            "tables_extracted": tables,
            "images_per_page": images_per_page,
            "item_positions": item_positions,
            "images_with_context": images_with_context,
        },
    }

    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved {out_json}")
    print(f"Extracted {len(raw['page_images'])} images, {len(tables)} tables")

    if copy_to_public:
        public_images = PUBLIC_DIR / "images"
        public_images.mkdir(parents=True, exist_ok=True)
        for f in images_dir.glob("*"):
            if f.is_file():
                shutil.copy2(f, public_images / f.name)
        shutil.copy2(out_json, PUBLIC_DIR / "dataset.json")
        print(f"Copied to {PUBLIC_DIR} (dataset.json + images/)")

    print("\nOptional: create staging/image_assignments.json to override image placement:")
    print('  {"2026_09_p1_i0.jpg": "SECTION TITLE / ITEM TITLE", ...}')
    print("  See scripts/image_assignments.example.json")
    print("\nNext: paste contents of staging/dataset_raw.json into AI with prompts/newsletter-to-json.md")
    print("  Then copy AI output to public/dataset.json and staging/images/ to public/images/")

    sys.exit(0)


if __name__ == "__main__":
    main()
