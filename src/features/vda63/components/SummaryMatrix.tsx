import { vda63ChapterTitles } from '../../../data/navigation'
import { getVda63ChapterResultLabel, getVda63ChapterStatusLabel } from '../../../utils/auditUtils'
import { StatusBadge } from '../../../components/ui'
import type { Vda63ChapterSummary, Vda63ElementSummary } from '../../../types/audit'

function formatScore(chapter: Vda63ChapterSummary) {
  if (chapter.percent === null) {
    return chapter.scope === 'outOfScope' ? 'n.e.' : 'Not evaluated'
  }

  const maxScore = chapter.status === 'completed' || chapter.status === 'downgraded' ? chapter.maxScore : chapter.scoredQuestionCount * 10
  return `${chapter.totalScore} / ${maxScore}`
}

function formatElementScore(element: Vda63ElementSummary) {
  if (element.percent === null) {
    return 'n.e.'
  }

  return `${element.totalScore} / ${element.scoredQuestionCount * 10}`
}

export default function SummaryMatrix({
  chapters,
  p6Elements,
}: {
  chapters: Vda63ChapterSummary[]
  p6Elements: Vda63ElementSummary[]
}) {
  return (
    <div className="summary-matrix-card">
      <div className="summary-matrix-heading">
        <div>
          <span>Evaluation matrix</span>
          <strong>Chapter result overview</strong>
        </div>
        <p>Only in-scope, completed chapters contribute to the final result. Neutral rows stay neutral.</p>
      </div>

      <div className="summary-matrix-list">
        {chapters.map((chapter) => (
          <article key={chapter.chapter} className={`summary-matrix-row summary-matrix-row-${chapter.status}`}>
            <div className="summary-matrix-main">
              <div className="summary-matrix-label">
                <strong>{chapter.chapter}</strong>
                <span>{vda63ChapterTitles[chapter.chapter]}</span>
              </div>
              <StatusBadge value={getVda63ChapterStatusLabel(chapter.status)} />
            </div>

            <div className="summary-matrix-details">
              <div>
                <span>Scope</span>
                <strong>{chapter.scope === 'inScope' ? 'In scope' : 'Out of scope'}</strong>
              </div>
              <div>
                <span>Score</span>
                <strong>{formatScore(chapter)}</strong>
              </div>
              <div>
                <span>Result</span>
                <strong>{chapter.percent === null ? getVda63ChapterStatusLabel(chapter.status) : `${chapter.percent}%`}</strong>
              </div>
              <div>
                <span>Evaluation</span>
                <strong>{getVda63ChapterResultLabel(chapter.result)}</strong>
              </div>
              <div>
                <span>Progress</span>
                <strong>{chapter.scoredQuestionCount}/{chapter.questionCount} scored</strong>
              </div>
              <div>
                <span>Downgrade</span>
                <strong>{chapter.downgradeTriggered ? 'Triggered' : chapter.percent === null ? 'n.e.' : 'No'}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>

      {p6Elements.length ? (
        <div className="table-card summary-matrix-table">
          <table>
            <thead>
              <tr>
                <th>P6 subsection</th>
                <th>Scored</th>
                <th>Score</th>
                <th>Current result</th>
              </tr>
            </thead>
            <tbody>
              {p6Elements.map((element) => (
                <tr key={element.label} className="summary-matrix-subrow">
                  <td>{element.label}</td>
                  <td>{element.scoredQuestionCount}/{element.questionCount}</td>
                  <td>{formatElementScore(element)}</td>
                  <td>{element.percent === null ? 'n.e.' : `${element.percent}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
