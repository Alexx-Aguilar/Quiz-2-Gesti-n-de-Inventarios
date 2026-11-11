from __future__ import annotations

import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from pypdf import PdfReader
import fitz


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Informe.md"
OUTPUT = ROOT / "output" / "pdf" / "Informe_Gestion_Inventarios_Alex_Aguilar_Lopez.pdf"
PAGE_W, PAGE_H = letter
FOREST = colors.HexColor("#153E32")
GREEN = colors.HexColor("#2A7655")
MINT = colors.HexColor("#EAF4ED")
INK = colors.HexColor("#20342B")
MUTED = colors.HexColor("#68786F")
LINE = colors.HexColor("#DCE6DF")


def register_fonts() -> tuple[str, str]:
    font_dir = Path(r"C:\Windows\Fonts")
    regular = font_dir / "arial.ttf"
    bold = font_dir / "arialbd.ttf"
    if not regular.exists() or not bold.exists():
        raise FileNotFoundError("No se encontraron las fuentes Arial necesarias en C:\\Windows\\Fonts.")
    pdfmetrics.registerFont(TTFont("ReportSans", str(regular)))
    pdfmetrics.registerFont(TTFont("ReportSans-Bold", str(bold)))
    pdfmetrics.registerFontFamily("ReportSans", normal="ReportSans", bold="ReportSans-Bold")
    return "ReportSans", "ReportSans-Bold"


def inline_markup(text: str) -> str:
    text = text.replace("<br>", " [BR] ")
    safe = escape(text)
    safe = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", safe)
    safe = re.sub(r"`(.+?)`", r'<font name="Courier">\1</font>', safe)
    return safe.replace("[BR]", "<br/>")


def page_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(FOREST)
    canvas.rect(0, PAGE_H - 13, PAGE_W, 13, fill=1, stroke=0)
    canvas.setFont("ReportSans-Bold", 7.5)
    canvas.setFillColor(FOREST)
    canvas.drawString(44, PAGE_H - 31, "CONSTRUCTORA DEL VALLE  /  GESTIÓN DE INVENTARIOS")
    canvas.setStrokeColor(LINE)
    canvas.line(44, 34, PAGE_W - 44, 34)
    canvas.setFont("ReportSans", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(44, 21, "Quiz 2 · Opción 1 · Comparador de precios")
    canvas.drawRightString(PAGE_W - 44, 21, f"Página {doc.page}")
    canvas.restoreState()


def make_styles():
    regular, bold = register_fonts()
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("ReportTitle", parent=base["Title"], fontName=bold, fontSize=23, leading=27, textColor=FOREST, alignment=TA_LEFT, spaceAfter=7),
        "meta": ParagraphStyle("Meta", fontName=regular, fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=4),
        "h1": ParagraphStyle("Section1", fontName=bold, fontSize=15, leading=19, textColor=FOREST, spaceBefore=17, spaceAfter=8, keepWithNext=True),
        "h2": ParagraphStyle("Section2", fontName=bold, fontSize=10.5, leading=13.5, textColor=GREEN, spaceBefore=8, spaceAfter=4, keepWithNext=True),
        "h3": ParagraphStyle("Section3", fontName=bold, fontSize=9.5, leading=12, textColor=INK, spaceBefore=8, spaceAfter=4, keepWithNext=True),
        "body": ParagraphStyle("Body", fontName=regular, fontSize=8.5, leading=11.3, textColor=INK, spaceAfter=4, alignment=TA_LEFT),
        "bullet": ParagraphStyle("Bullet", fontName=regular, fontSize=8.4, leading=11.5, textColor=INK, leftIndent=13, firstLineIndent=-8, spaceAfter=3),
        "table": ParagraphStyle("TableCell", fontName=regular, fontSize=7.2, leading=9, textColor=INK),
        "table_head": ParagraphStyle("TableHead", fontName=bold, fontSize=7.2, leading=9, textColor=colors.white),
        "callout": ParagraphStyle("Callout", fontName=regular, fontSize=9, leading=13, textColor=FOREST),
    }


def make_table(rows: list[list[str]], styles, available_width: float):
    if not rows:
        return Spacer(1, 1)
    count = len(rows[0])
    proportions = {
        4: [0.20, 0.18, 0.36, 0.26],
        5: [0.09, 0.21, 0.15, 0.16, 0.39],
    }.get(count, [1 / count] * count)
    data = []
    for row_index, row in enumerate(rows):
        style = styles["table_head"] if row_index == 0 else styles["table"]
        data.append([Paragraph(inline_markup(cell.strip()), style) for cell in row])
    table = Table(data, colWidths=[available_width * p for p in proportions], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FOREST),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAF8")]),
    ]))
    return table


def parse_report(text: str, styles, available_width: float):
    lines = text.splitlines()
    story = []
    paragraph_lines: list[str] = []
    bullet_lines: list[str] = []

    def flush_paragraph():
        nonlocal paragraph_lines
        if paragraph_lines:
            content = " ".join(line.strip() for line in paragraph_lines)
            story.append(Paragraph(inline_markup(content), styles["body"]))
            paragraph_lines = []

    def flush_bullets():
        nonlocal bullet_lines
        if bullet_lines:
            for bullet in bullet_lines:
                story.append(Paragraph("• " + inline_markup(bullet), styles["bullet"]))
            bullet_lines = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line == "---":
            flush_paragraph()
            flush_bullets()
            i += 1
            continue
        if line.startswith("|"):
            flush_paragraph()
            flush_bullets()
            table_rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{2,}:?", cell.replace(" ", "")) for cell in cells):
                    table_rows.append(cells)
                i += 1
            story.append(make_table(table_rows, styles, available_width))
            story.append(Spacer(1, 6))
            continue
        if line.startswith("### "):
            flush_paragraph(); flush_bullets()
            story.append(Paragraph(inline_markup(line[4:]), styles["h3"]))
        elif line.startswith("## "):
            flush_paragraph(); flush_bullets()
            story.append(Paragraph(inline_markup(line[3:]), styles["h2"]))
        elif line.startswith("# "):
            flush_paragraph(); flush_bullets()
            story.append(Paragraph(inline_markup(line[2:]), styles["title"]))
        elif line.startswith("- "):
            flush_paragraph()
            bullet_lines.append(line[2:])
        elif re.match(r"^\d+\.\s", line):
            flush_paragraph(); flush_bullets()
            story.append(Paragraph(inline_markup(line), styles["bullet"]))
        else:
            flush_bullets()
            paragraph_lines.append(line)
        i += 1
    flush_paragraph(); flush_bullets()
    return story


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = make_styles()
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=letter, leftMargin=44, rightMargin=44,
        topMargin=48, bottomMargin=44, title="Gestión de inventarios y comparador de precios",
        author="Alex Aguilar López", subject="Quiz 2 · Trabajo práctico",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="report", frames=[frame], onPage=page_chrome)])
    content = parse_report(SOURCE.read_text(encoding="utf-8"), styles, doc.width)
    doc.build(content)
    reader = PdfReader(str(OUTPUT))
    if not 1 <= len(reader.pages) <= 15:
        raise ValueError(f"El PDF debe tener entre 1 y 15 páginas; tiene {len(reader.pages)}.")
    extracted = "\n".join(page.extract_text() or "" for page in reader.pages)
    if "Alex Aguilar López" not in extracted:
        raise ValueError("No se encontró el nombre del integrante en el PDF final.")
    preview_directory = ROOT / "tmp" / "pdfs" / "qa"
    preview_directory.mkdir(parents=True, exist_ok=True)
    rendered = fitz.open(str(OUTPUT))
    for index, page in enumerate(rendered, start=1):
        page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).save(preview_directory / f"page_{index}.png")
    print(f"PDF listo y renderizado: {OUTPUT} ({len(reader.pages)} páginas)")


if __name__ == "__main__":
    main()
