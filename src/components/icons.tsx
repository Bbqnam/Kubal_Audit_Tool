export type AppIconName =
  | 'add'
  | 'back'
  | 'calendar'
  | 'cancel'
  | 'checklist'
  | 'close'
  | 'complete'
  | 'collapse'
  | 'delete'
  | 'details'
  | 'duplicate'
  | 'edit'
  | 'expand'
  | 'export'
  | 'history'
  | 'home'
  | 'library'
  | 'menu'
  | 'next'
  | 'open'
  | 'reports'
  | 'reopen'
  | 'results'
  | 'save'
  | 'summary'

function IconStroke({ children }: { children: React.ReactNode }) {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.85"
    >
      {children}
    </g>
  )
}

export function AppIcon({ name, className }: { name: AppIconName; className?: string }) {
  const resolvedClassName = `button-icon ${className ?? ''}`.trim()

  switch (name) {
    case 'add':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M10 4.25v11.5" />
            <path d="M4.25 10h11.5" />
          </IconStroke>
        </svg>
      )
    case 'back':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M15.75 10H4.75" />
            <path d="M8.5 6.25 4.75 10l3.75 3.75" />
          </IconStroke>
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <rect x="3.25" y="4.25" width="13.5" height="12.5" rx="2.5" />
            <path d="M6.5 2.75v3" />
            <path d="M13.5 2.75v3" />
            <path d="M3.25 8h13.5" />
          </IconStroke>
        </svg>
      )
    case 'cancel':
    case 'close':
    case 'delete':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="m5.5 5.5 9 9" />
            <path d="m14.5 5.5-9 9" />
          </IconStroke>
        </svg>
      )
    case 'checklist':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="m4.25 6.75 1.5 1.5 2.5-2.75" />
            <path d="M9.5 7h6.25" />
            <path d="m4.25 12 1.5 1.5 2.5-2.75" />
            <path d="M9.5 12.25h6.25" />
          </IconStroke>
        </svg>
      )
    case 'complete':
    case 'save':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="m4.75 10.5 3.25 3.25 7.25-7.5" />
          </IconStroke>
        </svg>
      )
    case 'collapse':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="m5.5 12.25 4.5-4.5 4.5 4.5" />
          </IconStroke>
        </svg>
      )
    case 'details':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="m5.5 7.75 4.5 4.5 4.5-4.5" />
          </IconStroke>
        </svg>
      )
    case 'duplicate':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <rect x="6.5" y="6.5" width="9.25" height="9.25" rx="2" />
            <path d="M13.5 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2h1" />
          </IconStroke>
        </svg>
      )
    case 'edit':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="m13.75 4.25 2 2a1.75 1.75 0 0 1 0 2.5L8 16.5l-3.75.75L5 13.5l7.75-7.75a1.75 1.75 0 0 1 2.5 0Z" />
          </IconStroke>
        </svg>
      )
    case 'expand':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="m5.5 7.75 4.5 4.5 4.5-4.5" />
          </IconStroke>
        </svg>
      )
    case 'export':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M10 12.5V3.75" />
            <path d="m6.75 7 3.25-3.25L13.25 7" />
            <path d="M4 11.75v2.5A1.75 1.75 0 0 0 5.75 16h8.5A1.75 1.75 0 0 0 16 14.25v-2.5" />
          </IconStroke>
        </svg>
      )
    case 'history':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M3.75 10a6.25 6.25 0 1 0 1.75-4.25" />
            <path d="M3.75 4.75v3.5h3.5" />
            <path d="M10 6.5v3.75l2.5 1.5" />
          </IconStroke>
        </svg>
      )
    case 'home':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="m3.75 8.25 6.25-5 6.25 5" />
            <path d="M5.5 7.75V16h9V7.75" />
          </IconStroke>
        </svg>
      )
    case 'library':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M4.5 4.25h4.25V16H4.5z" />
            <path d="M11 4.25h4.5V16H11z" />
            <path d="M8.75 16h2.25" />
          </IconStroke>
        </svg>
      )
    case 'menu':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <rect x="3.25" y="4" width="13.5" height="12" rx="3" />
            <path d="M7 8h6" />
            <path d="M7 10.75h6" />
            <path d="M7 13.5h4.25" />
          </IconStroke>
        </svg>
      )
    case 'next':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M4.25 10h11" />
            <path d="M11.5 6.25 15.25 10l-3.75 3.75" />
          </IconStroke>
        </svg>
      )
    case 'open':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M11.5 4.25h4.25V8.5" />
            <path d="M8.5 11.5 15.75 4.25" />
            <path d="M8 4.25H5.75A1.75 1.75 0 0 0 4 6v8.25A1.75 1.75 0 0 0 5.75 16h8.25A1.75 1.75 0 0 0 15.75 14v-2.25" />
          </IconStroke>
        </svg>
      )
    case 'reports':
    case 'results':
    case 'summary':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M4.25 15.75V9.5" />
            <path d="M10 15.75V4.25" />
            <path d="M15.75 15.75V7" />
          </IconStroke>
        </svg>
      )
    case 'reopen':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={resolvedClassName}>
          <IconStroke>
            <path d="M16.25 10A6.25 6.25 0 1 1 14.5 5.75" />
            <path d="M16.25 4.75v3.5h-3.5" />
          </IconStroke>
        </svg>
      )
  }
}

export function ButtonLabel({
  icon,
  label,
  hideLabel = false,
}: {
  icon: AppIconName
  label: string
  hideLabel?: boolean
}) {
  return (
    <span className="button-content">
      <AppIcon name={icon} />
      <span className={hideLabel ? 'sr-only' : 'button-label'}>{label}</span>
    </span>
  )
}
