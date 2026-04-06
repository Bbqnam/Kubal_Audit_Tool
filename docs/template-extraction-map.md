# Template Extraction Map

## Workbook used

- Canonical workbook: `public/VDA 6.3 Process Audit_Moldshop Feb 25 .xlsm`
- Duplicate workbook also found: `public/VDA 6.3 Process Audit_Moldshop Feb 25 [28].xlsm`
- Both files are byte-identical by SHA-1: `d1f5ee64e735472ed5731e338a188bb896cf7f74`
- Extraction was performed against the first filename above and treated it as the source of truth

## Sheet names found

| Sheet | State | Notes |
| --- | --- | --- |
| `Disclaimer` | hidden | informational only |
| `First Sheet - Deckblatt` | hidden | cover / front sheet |
| `Input Form - EingabeMaske` | visible | data entry surface, not the canonical question bank |
| `Questions - Fragen` | visible | canonical question text and scoring rows |
| `Evaluation-Bewertung` | visible | evaluation matrix and star-marker cross-check |
| `PrGr1` | visible | process-group evaluation view |
| `PrGr2` | hidden | process-group evaluation view |
| `PrGr3` | hidden | process-group evaluation view |
| `PrGr4` | hidden | process-group evaluation view |
| `Report-Bericht` | visible | report output only |
| `Actionplan-Maßnahmenplan` | visible | action-plan output only |
| `History` | hidden | workbook history / support data |
| `Language-Sprachen` | hidden | language / lookup data |
| `CSV` | hidden | export / helper sheet |

## Sheets selected for extraction

- Primary extraction sheet: `Questions - Fragen`
  - This sheet contains the fixed VDA 6.3 chapter headers, question numbers, question text, star markers, and the product/process split rows used for scoring.
- Cross-check sheet: `Evaluation-Bewertung`
  - This sheet was used only to validate star-question detection because star numbers are rendered there with a trailing `*`.

## How question rows were identified

### Chapter headers

- Column `A` values matching `P2`, `P3`, `P4`, `P5`, `P6`, `P7`
- Column `C` contains the chapter title

### VDA 6.3 question rows

- Column `A` values matching the fixed numbering pattern:
  - `2.1` to `2.7`
  - `3.1` to `3.5`
  - `4.1` to `4.8`
  - `5.1` to `5.7`
  - `6.1.1` to `6.6.4`
  - `7.1` to `7.5`
- Column `C` contains the question text
- For `P3` and `P4`, blank-`A` rows immediately following a numbered row with column `C` equal to `Product` / `Process` or `Produkt` / `Prozess` were treated as distinct scorable variants of the parent question

### P6 subgroup rows

- Rows `6.1` through `6.6` in column `A` were treated as subgroup headers, not questions
- Their column `C` values were kept as subgroup metadata:
  - `What goes into the process ? Process input`
  - `Are all production processes controlled? Process management`
  - `What functions support the process? Personnel resources`
  - `What means are used to implement the process? Material resources`
  - `How effective is the process being carried out? Effectiveness, efficiency, waste avoidance`
  - `What should the process produce? (process result / output)`

## How star questions were detected

- Primary detection: column `B` contains `x` on the question row in `Questions - Fragen`
- Secondary validation: the same question number appears with a trailing `*` in `Evaluation-Bewertung`
- Validation result: no star-number mismatches were found

## Hidden rows

- Hidden rows were explicitly included in the scan
- `56` hidden rows contributed directly to extracted VDA 6.3 bank items
- These hidden source rows contain real chapter questions and real `Product` / `Process` scoring rows, especially in `P2`, `P3`, `P4`, `P5`, and `P7`
- `233` hidden rows were inspected but excluded because they were `PS2`-`PS10` process-step scaffolding rows under `P6`, not master question-bank rows
- Additional hidden rows were ignored only when they were clearly formatting/support rows rather than question content

## Product / process grouping

- Product/process grouping is clearly present in `P3` and `P4`
- The workbook models these as separate scoring rows under the same fixed question number
- The extracted bank preserves them as separate static items with:
  - the same `number`
  - the same `text`
  - distinct `id` values such as `3.1-product` and `3.1-process`
  - `productProcessType` set to `Product` or `Process`

## Rows and cells ignored

- Entire sheets ignored for extraction because they are presentation, report, or support sheets:
  - `Disclaimer`
  - `First Sheet - Deckblatt`
  - `Input Form - EingabeMaske`
  - `PrGr1`
  - `PrGr2`
  - `PrGr3`
  - `PrGr4`
  - `Report-Bericht`
  - `Actionplan-Maßnahmenplan`
  - `History`
  - `Language-Sprachen`
  - `CSV`
- In `Questions - Fragen`, these were intentionally not extracted as bank questions:
  - chapter header rows `P2`-`P7`
  - P6 subgroup header rows `6.1`-`6.6`
  - `PS1`-`PS10` process-step rows
  - formatting / helper cells outside the fixed master question text in columns `A`-`C`
  - report / evaluation / export content from other sheets
- Supplementary guidance content in later columns such as `N` and `O` was not promoted into the production bank because those cells act as explanatory checklist prompts rather than the fixed master question text itself

## VDA 6.5 findings

- No dedicated VDA 6.5 worksheet, section, or checklist bank was found in this workbook
- Keyword scanning found only a generic `Product audit` phrase inside shared strings, not a real VDA 6.5 checklist structure
- Result:
  - VDA 6.3 question bank extracted
  - no `src/features/vda65/data/checklistBank.ts` created from this workbook

## Assumptions and uncertainties

- `Questions - Fragen` was treated as the canonical source of question text because it contains the fixed wording, numbering, and star flags
- `Evaluation-Bewertung` was treated as a validation sheet, not the primary text source
- P6 `PS1`-`PS10` rows were interpreted as process-step scoring instances, not independent master question-bank entries
- Product/process rows in `P3` and `P4` were preserved as separate static items because the template clearly scores them separately
- One workbook typo was preserved exactly as written: `serial prodiction` in question `4.3`
