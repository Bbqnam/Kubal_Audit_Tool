import { useMemo, useState } from 'react'
import { ButtonLabel } from './icons'
import { formatDateTime } from '../utils/dateUtils'
import { useModalKeyboard } from '../utils/useModalKeyboard'

const HISTORY_PAGE_SIZE = 8

export type HistoryModalItem = {
  id: string
  timestamp: string
  badge: string
  title: string
  description: string
  meta: string
}

export default function HistoryModal({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
  onClose,
}: {
  title: string
  description: string
  items: HistoryModalItem[]
  emptyTitle: string
  emptyDescription: string
  onClose: () => void
}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / HISTORY_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleItems = useMemo(
    () => items.slice((currentPage - 1) * HISTORY_PAGE_SIZE, currentPage * HISTORY_PAGE_SIZE),
    [currentPage, items],
  )
  useModalKeyboard({ onClose, onConfirm: onClose })

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-shell history-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" className="button button-secondary button-small" onClick={onClose}>
            <ButtonLabel icon="close" label="Close" />
          </button>
        </div>

        <div className="modal-body history-modal-body">
          {items.length ? (
            <>
              <div className="history-modal-list">
                {visibleItems.map((item) => (
                  <article key={item.id} className="history-modal-item">
                    <div className="history-modal-item-top">
                      <span className="history-modal-badge">{item.badge}</span>
                      <time dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time>
                    </div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <span>{item.meta}</span>
                  </article>
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="history-modal-pagination" aria-label="History pagination">
                  <button
                    type="button"
                    className="button button-secondary button-small"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                  >
                    <ButtonLabel icon="back" label="Previous" />
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    className="button button-secondary button-small"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ButtonLabel icon="next" label="Next" />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="history-modal-empty">
              <strong>{emptyTitle}</strong>
              <p>{emptyDescription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
