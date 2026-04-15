import type { AuditInfo, AuditParticipant, Vda63QuestionResponse } from '../types/audit'
import { vda63QuestionBank } from '../features/vda63/data/questionBank'

export const vda63AuditInfo: AuditInfo = {
  site: 'North Alliance Plant',
  auditor: 'Clara Schmidt',
  date: '2026-04-06',
  reference: 'VDA63-2026-01',
  auditStatus: 'Not started',
  department: 'Operations Excellence',
  customer: 'Autowerke Europe',
  scope: 'End-to-end process audit across launch readiness, supplier integration, production control, and customer escalation handling.',
  notes: 'Workbook-backed VDA 6.3 audit template extracted from the public Excel source file.',
}

export const vda63Participants: AuditParticipant[] = [
  { id: 'participant-mehdi-h', userName: 'Mehdi H.', role: 'Auditor' },
  { id: 'participant-marta-kovac', userName: 'Marta Kovac', role: 'Observer' },
]

export const vda63SeedResponses: Vda63QuestionResponse[] = vda63QuestionBank.map((question) => ({
  id: question.id,
  score: null,
  comment: '',
  finding: '',
}))
