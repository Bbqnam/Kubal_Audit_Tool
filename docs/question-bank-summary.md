# Question Bank Summary

## VDA 6.3 extraction result

- Extracted workbook-backed static bank file: `src/features/vda63/data/questionBank.ts`
- Total extracted static audit-sheet items: `69`
- Unique numbered question entries: `58`
- Difference explained:
  - `P3` and `P4` include separate `Product` / `Process` scoring rows under the same fixed question number

## Extracted counts by chapter

| Chapter | Extracted items | Star items | Notes |
| --- | --- | --- | --- |
| `P2` | `7` | `2` | all question rows came from hidden rows |
| `P3` | `10` | `2` | five fixed numbers, each split into product/process variants |
| `P4` | `14` | `6` | eight fixed numbers, with product/process splits where present |
| `P5` | `7` | `2` | all question rows came from hidden rows |
| `P6` | `26` | `8` | extracted as fixed numbered questions under six subgroup headers |
| `P7` | `5` | `2` | all question rows came from hidden rows |

## Product / process grouping

- Found: yes
- Present in:
  - `P3`
  - `P4`
- Preserved in the bank as separate static items with `productProcessType`

## VDA 6.5 content

- Found in workbook as a real checklist bank: no
- Dedicated VDA 6.5 data file created from workbook: no
- Current app-side `src/data/vda65.ts` remains mock placeholder data until a real VDA 6.5 template is supplied

## Hidden-row usage

- Hidden rows used for extracted bank items: yes
- Hidden rows contributing directly to extracted items: `56`
- Hidden `P6` process-step rows inspected but excluded as non-bank scaffolding: `233`

## Validation checks

- Missing IDs: none
- Duplicate IDs: none
- Chapter grouping order: `P2 -> P3 -> P4 -> P5 -> P6 -> P7`
- Star-question detection mismatch against `Evaluation-Bewertung`: none
- Summary / report text incorrectly extracted as questions: none

## Extraction limitations

- The workbook provides real VDA 6.3 fixed content, but not a dedicated VDA 6.5 checklist bank
- `PS1`-`PS10` under `P6` were not turned into master bank items because they are process-step application rows, not fixed question IDs
- Supplementary guidance text in later columns was not promoted into the production bank; only the fixed master numbering, question text, grouping metadata, and star flags were extracted
