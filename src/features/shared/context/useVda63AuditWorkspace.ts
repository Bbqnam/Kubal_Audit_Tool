import { vda63QuestionBank } from '../../vda63/data/questionBank'
import { buildVda63AuditQuestions, chapterOrder } from '../../../utils/auditUtils'
import type { ActionPlanItem, AuditInfo, ScoreOption, Vda63ChapterKey, Vda63QuestionResponse } from '../../../types/audit'
import { useAuditWorkspace } from './useAuditWorkspace'

function updateListItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

export function useVda63AuditWorkspace() {
  const workspace = useAuditWorkspace()

  if (workspace.audit.auditType !== 'vda63') {
    throw new Error('VDA 6.3 workspace hook used outside a VDA 6.3 audit route')
  }

  const audit = workspace.audit
  const vda63Questions = buildVda63AuditQuestions(vda63QuestionBank, audit.data.responses)

  return {
    ...workspace,
    vda63AuditInfo: audit.data.auditInfo,
    vda63Questions,
    vda63Participants: audit.data.participants,
    chapterScope: audit.data.chapterScope,
    actionPlanItems: audit.actions,
    updateAuditTitle: (title: string) => {
      workspace.updateAuditRecord(audit.id, (current) => ({ ...current, title }))
    },
    updateAuditInfo: (field: keyof AuditInfo, value: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType !== 'vda63') {
          return current
        }

        return {
          ...current,
          data: {
            ...current.data,
            auditInfo: {
              ...current.data.auditInfo,
              [field]: value,
            },
          },
        }
      })
    },
    updateVda63Question: (id: string, patch: Partial<Pick<Vda63QuestionResponse, 'score' | 'comment' | 'finding'>>) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType !== 'vda63') {
          return current
        }

        const nextPatch: Partial<Vda63QuestionResponse> = {}

        if (patch.score !== undefined) {
          nextPatch.score = patch.score as ScoreOption | null
        }

        if (patch.comment !== undefined) {
          nextPatch.comment = patch.comment
        }

        if (patch.finding !== undefined) {
          nextPatch.finding = patch.finding
        }

        return {
          ...current,
          data: {
            ...current.data,
            responses: updateListItem(current.data.responses, id, nextPatch),
          },
        }
      })
    },
    updateParticipants: (participants: string[]) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType !== 'vda63') {
          return current
        }

        return {
          ...current,
          data: {
            ...current.data,
            participants,
          },
        }
      })
    },
    updateChapterScope: (chapter: Vda63ChapterKey, isInScope: boolean) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType !== 'vda63') {
          return current
        }

        const currentScope = current.data.chapterScope
        const nextScope = (isInScope
          ? Array.from(new Set([...currentScope, chapter]))
          : currentScope.filter((item) => item !== chapter))
          .sort((left, right) => chapterOrder.indexOf(left) - chapterOrder.indexOf(right))

        return {
          ...current,
          data: {
            ...current.data,
            chapterScope: nextScope,
          },
        }
      })
    },
    updateActionPlanItem: (
      id: string,
      patch: Partial<Pick<ActionPlanItem, 'section' | 'finding' | 'action' | 'owner' | 'dueDate' | 'status' | 'comment'>>,
    ) => {
      workspace.updateAuditRecord(audit.id, (current) => ({
        ...current,
        actions: updateListItem<ActionPlanItem>(current.actions, id, patch as Partial<ActionPlanItem>),
      }))
    },
  }
}
