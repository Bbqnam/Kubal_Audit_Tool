const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime())
}

export function parseDateValue(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    const date = new Date(`${normalizedValue}T00:00:00`)
    return isValidDate(date) ? date : null
  }

  const date = new Date(normalizedValue)
  return isValidDate(date) ? date : null
}

function startOfLocalDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

export function compareDateOnly(left: string | null | undefined, right: string | null | undefined) {
  const leftDate = parseDateValue(left)
  const rightDate = parseDateValue(right)

  if (!leftDate && !rightDate) {
    return 0
  }

  if (!leftDate) {
    return 1
  }

  if (!rightDate) {
    return -1
  }

  return startOfLocalDay(leftDate).getTime() - startOfLocalDay(rightDate).getTime()
}

export function isPastDate(value: string | null | undefined, referenceDate = new Date()) {
  const parsedDate = parseDateValue(value)

  if (!parsedDate) {
    return false
  }

  return startOfLocalDay(parsedDate).getTime() < startOfLocalDay(referenceDate).getTime()
}

export function toFilenameDate(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10)
}

export function formatDate(value: string) {
  const parsedDate = parseDateValue(value)
  return parsedDate ? dateFormatter.format(parsedDate) : 'Not set'
}

export function formatDateTime(value: string) {
  const parsedDate = parseDateValue(value)
  return parsedDate ? dateTimeFormatter.format(parsedDate) : 'Not set'
}
