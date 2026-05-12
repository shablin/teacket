import Ticket from "#models/ticket"
import { ModelQueryBuilderContract } from "@adonisjs/lucid/types/model"
import { DateTime } from "luxon"

type NullableString = string | null | undefined

export type TicketFilters = {
  number?: NullableString
  status?: NullableString
  priority?: NullableString
  categoryId?: number | null
  assigneeId?: number | null
  requesterId: number | null
  departmentId: number | null
  createdFrom?: NullableString
  createdTo?: NullableString
  dueFrom?: NullableString
  dueTo?: NullableString
  search?: NullableString
  includeCommentsSearch?: boolean
}

export class TicketQueryService {
  static build(filters: TicketFilters) {
    const query = Ticket.query()
      .preload('requester')
      .preload('assignee')
      .preload('category')
      .preload('department')
      .orderBy('createdAt', 'desc')

    this.applyFilters(query, filters)
    return query
  }

  private static applyFilters(query: ModelQueryBuilderContract<typeof Ticket>, filters: TicketFilters) {
    if (filters.number) {
      query.whereILike('number', `%${filters.number.trim()}%`)
    }

    if (filters.status) query.where('status', filters.status)
    if (filters.priority) query.where('priority', filters.priority)
    if (filters.categoryId) query.where('categoryId', filters.categoryId)
    if (filters.assigneeId) query.where('assigneeId', filters.assigneeId)
    if (filters.requesterId) query.where('requesterId', filters.requesterId)
    if (filters.departmentId) query.where('departmentId', filters.departmentId)

    this.applyDateRange(query, 'createdAt', filters.createdFrom, filters.createdTo)
    this.applyDateRange(query, 'dueAt', filters.dueFrom, filters.dueTo)

    if (filters.search) {
      const term = filters.search.trim()
      query.where((_query) => {
        _query
          .whereILike('number', `%${term}%`)
          .orWhereILike('title', `%${term}%`)
          .orWhereILike('description', `%${term}%`)

        if (filters.includeCommentsSearch) {
          _query.orWhereExists((commentsQuery) => {
            commentsQuery
              .from('ticket_comments')
              .whereColumn('ticket_comments.ticket_id', 'tickets.id')
              .whereILike('ticket_comments.content', `%${term}%`)
          })
        }
      })
    }
  }

  private static applyDateRange(
    query: ModelQueryBuilderContract<typeof Ticket>,
    column: 'createdAt' | 'dueAt',
    from?: NullableString,
    to?: NullableString
  ) {
    const fromDate = from ? DateTime.fromISO(from) : null
    const toDate = to ? DateTime.fromISO(to) : null

    if (fromDate?.isValid) {
      query.where(column, '>=', fromDate.startOf('day').toSQL()!)
    }

    if (toDate?.isValid) {
      query.where(column, '<=', toDate.endOf('day').toSQL()!)
    }
  }
}