#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET


WORKBOOK_PATH = Path("public/VDA 6.3 Process Audit_Moldshop Feb 25 .xlsm")
NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
CHAPTER_RE = re.compile(r"^P[2-7]$")
TOP_LEVEL_P6_RE = re.compile(r"^6\.\d$")
QUESTION_RE = re.compile(r"^\d+\.\d+(?:\.\d+)?$")
VARIANT_MAP = {
    "product": "Product",
    "produkt": "Product",
    "process": "Process",
    "prozess": "Process",
}


@dataclass(frozen=True)
class WorkbookSheet:
    name: str
    state: str
    target: str


@dataclass(frozen=True)
class SheetRow:
    index: int
    hidden: bool
    cells: dict[str, str]


def normalize_text(value: str) -> str:
    return " ".join(value.replace("\r", " ").replace("\n", " ").split())


class WorkbookReader:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.archive = zipfile.ZipFile(path)
        self.shared_strings = self._load_shared_strings()

    def _load_shared_strings(self) -> list[str]:
        shared_strings_path = "xl/sharedStrings.xml"
        if shared_strings_path not in self.archive.namelist():
            return []

        root = ET.fromstring(self.archive.read(shared_strings_path))
        values: list[str] = []

        for item in root.findall("a:si", NS):
            text = "".join(node.text or "" for node in item.iterfind(".//a:t", NS))
            values.append(text)

        return values

    def get_workbook_sheets(self) -> list[WorkbookSheet]:
        workbook = ET.fromstring(self.archive.read("xl/workbook.xml"))
        rels = ET.fromstring(self.archive.read("xl/_rels/workbook.xml.rels"))
        rel_map = {rel.get("Id"): rel.get("Target", "") for rel in rels}

        sheets: list[WorkbookSheet] = []
        for sheet in workbook.find("a:sheets", NS) or []:
            relationship_id = sheet.get(f"{{{NS['r']}}}id")
            sheets.append(
                WorkbookSheet(
                    name=sheet.get("name", ""),
                    state=sheet.get("state", "visible"),
                    target=rel_map.get(relationship_id, ""),
                )
            )

        return sheets

    def get_sheet_rows(self, target: str) -> list[SheetRow]:
        root = ET.fromstring(self.archive.read(f"xl/{target}"))
        sheet_data = root.find("a:sheetData", NS)

        if sheet_data is None:
            return []

        rows: list[SheetRow] = []
        for row in sheet_data.findall("a:row", NS):
            values: dict[str, str] = {}
            for cell in row.findall("a:c", NS):
                reference = cell.get("r", "")
                column = re.sub(r"\d+", "", reference)
                values[column] = self._resolve_cell_value(cell)

            rows.append(
                SheetRow(
                    index=int(row.get("r", "0")),
                    hidden=row.get("hidden") == "1",
                    cells={key: normalize_text(value) for key, value in values.items() if normalize_text(value)},
                )
            )

        return rows

    def _resolve_cell_value(self, cell: ET.Element) -> str:
        raw_value = cell.find("a:v", NS)
        if raw_value is None:
            return ""

        value = raw_value.text or ""
        if cell.get("t") == "s" and value.isdigit():
            return self.shared_strings[int(value)]

        return value


def detect_variant(label: str) -> str | None:
    return VARIANT_MAP.get(label.strip().lower())


def find_sheet_target(sheets: Iterable[WorkbookSheet], name: str) -> str:
    for sheet in sheets:
        if sheet.name == name:
            return sheet.target
    raise ValueError(f"Sheet {name!r} not found in workbook")


def extract_vda63_questions(rows: list[SheetRow]) -> dict[str, object]:
    chapter_titles: dict[str, str] = {}
    p6_subgroups: dict[str, str] = {}
    questions: list[dict[str, object]] = []
    hidden_extracted_rows: set[int] = set()
    hidden_ignored_ps_rows: set[int] = set()
    hidden_ignored_format_rows: set[int] = set()
    consumed_row_indexes: set[int] = set()
    current_chapter = ""
    current_p6_subgroup = ""
    order = 1

    for index, row in enumerate(rows):
        if row.index in consumed_row_indexes:
            continue

        column_a = row.cells.get("A", "")
        column_b = row.cells.get("B", "")
        column_c = row.cells.get("C", "")

        if not column_a and not column_c:
            if row.hidden:
                hidden_ignored_format_rows.add(row.index)
            continue

        if CHAPTER_RE.match(column_a):
            current_chapter = column_a
            chapter_titles[current_chapter] = column_c
            current_p6_subgroup = ""
            continue

        if current_chapter == "P6" and TOP_LEVEL_P6_RE.match(column_a):
            current_p6_subgroup = column_c
            p6_subgroups[column_a] = column_c
            continue

        if current_chapter != "P6" and column_a.startswith("PS"):
            if row.hidden:
                hidden_ignored_ps_rows.add(row.index)
            continue

        if current_chapter == "P6" and column_a.startswith("PS"):
            if row.hidden:
                hidden_ignored_ps_rows.add(row.index)
            continue

        if not current_chapter or not QUESTION_RE.match(column_a):
            if row.hidden:
                hidden_ignored_format_rows.add(row.index)
            continue

        is_star = column_b.lower() == "x" or column_c.endswith("*")
        normalized_text = column_c.rstrip("*").strip()
        variants: list[tuple[str, SheetRow]] = []
        next_index = index + 1

        while next_index < len(rows):
            next_row = rows[next_index]
            next_a = next_row.cells.get("A", "")
            next_c = next_row.cells.get("C", "")

            if next_a:
                break

            variant = detect_variant(next_c)
            if variant:
                variants.append((variant, next_row))
                next_index += 1
                continue

            if next_c:
                break

            next_index += 1

        if variants:
            for variant, variant_row in variants:
                consumed_row_indexes.add(variant_row.index)
                questions.append(
                    {
                        "id": f"{column_a}-{variant.lower()}",
                        "number": column_a,
                        "chapter": current_chapter,
                        "text": normalized_text,
                        "isStarQuestion": is_star,
                        "group": variant,
                        "subgroup": current_p6_subgroup or None,
                        "productProcessType": variant,
                        "order": order,
                        "sourceSheet": "Questions - Fragen",
                        "sourceRow": variant_row.index,
                        "parentQuestionRow": row.index,
                        "sourceHidden": variant_row.hidden or row.hidden,
                    }
                )
                order += 1
                if row.hidden:
                    hidden_extracted_rows.add(row.index)
                if variant_row.hidden:
                    hidden_extracted_rows.add(variant_row.index)
        else:
            questions.append(
                {
                    "id": column_a,
                    "number": column_a,
                    "chapter": current_chapter,
                    "text": normalized_text,
                    "isStarQuestion": is_star,
                    "group": current_p6_subgroup or None,
                    "subgroup": current_p6_subgroup or None,
                    "productProcessType": None,
                    "order": order,
                    "sourceSheet": "Questions - Fragen",
                    "sourceRow": row.index,
                    "parentQuestionRow": None,
                    "sourceHidden": row.hidden,
                }
            )
            order += 1
            if row.hidden:
                hidden_extracted_rows.add(row.index)

    chapter_counts = Counter(question["chapter"] for question in questions)
    star_counts = Counter(question["chapter"] for question in questions if question["isStarQuestion"])
    variant_counts = Counter(question["chapter"] for question in questions if question["productProcessType"])

    return {
        "chapterTitles": chapter_titles,
        "p6Subgroups": p6_subgroups,
        "questions": questions,
        "chapterCounts": dict(chapter_counts),
        "starCounts": dict(star_counts),
        "variantCounts": dict(variant_counts),
        "hiddenExtractedRows": sorted(hidden_extracted_rows),
        "hiddenIgnoredProcessStepRows": sorted(hidden_ignored_ps_rows),
        "hiddenIgnoredFormattingRows": sorted(hidden_ignored_format_rows),
    }


def extract_star_numbers_from_evaluation(rows: list[SheetRow]) -> list[str]:
    star_numbers: set[str] = set()

    for row in rows:
        for value in row.cells.values():
            normalized = normalize_text(value)
            match = re.match(r"^(\d+\.\d+(?:\.\d+)?)\*$", normalized)
            if match:
                star_numbers.add(match.group(1))

    return sorted(star_numbers, key=lambda item: [int(part) for part in item.split(".")])


def scan_for_vda65(path: Path) -> dict[str, object]:
    keywords = [r"VDA\s*6\.5", r"Product Audit", r"Produktaudit"]
    matches: list[dict[str, str]] = []

    with zipfile.ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.endswith(".xml"):
                continue

            content = archive.read(name).decode("utf-8", "ignore")
            found = next((keyword for keyword in keywords if re.search(keyword, content, re.IGNORECASE)), None)
            if found:
                matches.append({"file": name, "keyword": found})

    dedicated_match = any("6.5" in match["keyword"] for match in matches)
    return {"matches": matches, "hasDedicatedVda65Content": dedicated_match}


def build_summary() -> dict[str, object]:
    if not WORKBOOK_PATH.exists():
        raise FileNotFoundError(f"Workbook file not found: {WORKBOOK_PATH}")

    reader = WorkbookReader(WORKBOOK_PATH)
    sheets = reader.get_workbook_sheets()
    questions_target = find_sheet_target(sheets, "Questions - Fragen")
    evaluation_target = find_sheet_target(sheets, "Evaluation-Bewertung")
    questions_rows = reader.get_sheet_rows(questions_target)
    evaluation_rows = reader.get_sheet_rows(evaluation_target)
    extracted = extract_vda63_questions(questions_rows)
    star_numbers = extract_star_numbers_from_evaluation(evaluation_rows)
    extracted_star_numbers = sorted(
        {question["number"] for question in extracted["questions"] if question["isStarQuestion"]},
        key=lambda item: [int(part) for part in item.split(".")],
    )

    validation = {
        "missingIds": [question["number"] for question in extracted["questions"] if not question["id"]],
        "duplicateIds": [
            question_id
            for question_id, count in Counter(question["id"] for question in extracted["questions"]).items()
            if count > 1
        ],
        "chapterOrder": list(dict.fromkeys(question["chapter"] for question in extracted["questions"])),
        "starNumberMismatch": sorted(set(star_numbers) ^ set(extracted_star_numbers)),
        "summaryTextLeaks": [
            question["id"]
            for question in extracted["questions"]
            if any(
                phrase in question["text"].lower()
                for phrase in ("result of the questionnaire", "summary of the audit", "audit report", "actionplan")
            )
        ],
    }

    return {
        "workbook": str(WORKBOOK_PATH),
        "sheets": [sheet.__dict__ for sheet in sheets],
        "selectedSheets": {
            "questions": "Questions - Fragen",
            "evaluationCrossCheck": "Evaluation-Bewertung",
        },
        "vda63": extracted,
        "evaluationStarNumbers": star_numbers,
        "vda65Scan": scan_for_vda65(WORKBOOK_PATH),
        "validation": validation,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect and extract VDA question-bank data from the workbook template.")
    parser.add_argument("--json", action="store_true", help="Print the parsed workbook summary as JSON.")
    parser.add_argument("--validation", action="store_true", help="Print only the validation block as JSON.")
    parser.add_argument("--questions", action="store_true", help="Print only the extracted VDA 6.3 questions as JSON.")
    args = parser.parse_args()

    summary = build_summary()

    if args.validation:
        json.dump(summary["validation"], sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0

    if args.questions:
        json.dump(summary["vda63"]["questions"], sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0

    if args.json:
        json.dump(summary, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0

    print(f"Workbook: {summary['workbook']}")
    print("Selected sheets:")
    print("  - Questions - Fragen")
    print("  - Evaluation-Bewertung (star cross-check)")
    print("VDA 6.3 chapter counts:")
    for chapter, count in summary["vda63"]["chapterCounts"].items():
        stars = summary["vda63"]["starCounts"].get(chapter, 0)
        variants = summary["vda63"]["variantCounts"].get(chapter, 0)
        print(f"  - {chapter}: {count} extracted items, {stars} star items, {variants} product/process variants")
    print(f"Hidden extracted rows: {len(summary['vda63']['hiddenExtractedRows'])}")
    print(f"Hidden ignored PS rows: {len(summary['vda63']['hiddenIgnoredProcessStepRows'])}")
    print("Validation:")
    print(json.dumps(summary["validation"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
