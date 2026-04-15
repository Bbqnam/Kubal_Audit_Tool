import { getDomainStatusLabel } from '../config/domain/statuses'

export function getStatusDisplayLabel(value: string) {
  return getDomainStatusLabel(value)
}
