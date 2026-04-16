import { useEffect } from 'react'

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName

  return (
    tagName === 'INPUT'
    || tagName === 'TEXTAREA'
    || tagName === 'SELECT'
    || tagName === 'BUTTON'
    || tagName === 'A'
    || target.isContentEditable
  )
}

export function useModalKeyboard({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm?: (() => void) | null
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (
        event.key === 'Enter'
        && onConfirm
        && !event.defaultPrevented
        && !event.repeat
        && !event.altKey
        && !event.ctrlKey
        && !event.metaKey
        && !event.shiftKey
        && !isInteractiveTarget(event.target)
      ) {
        event.preventDefault()
        onConfirm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onConfirm])
}
