import Ticket from "#models/ticket"
import User from "#models/user"
import { DateTime } from "luxon"
import { TicketAuditService } from "./ticket_audit_service.ts"
import { TicketNotificationService } from "./ticket_notification_service.ts"

export const TICKET_STATUSES = [
  'open',
  'in_progress',
  'pending',
  'resolved',
  'closed',
  'canceled',
] as const

export type TicketStatus = (typeof TICKET_STATUSES)[number]
type UserRole = 'admin' | 'manager' | 'executor' | 'employee'

const ROLE_TRANSITIONS: Record<UserRole, Partial<Record<TicketStatus, TicketStatus[]>>> = {
  admin: {
    open: ['in_progress', 'pending', 'resolved', 'closed', 'canceled'],
    in_progress: ['open', 'pending', 'resolved', 'closed', 'canceled'],
    pending: ['open', 'in_progress', 'resolved', 'closed', 'canceled'],
    resolved: ['open', 'in_progress', 'pending', 'closed', 'canceled'],
    closed: ['open'],
    canceled: ['open'],
  },

  manager: {
    open: ['in_progress', 'pending', 'resolved', 'closed', 'canceled'],
    in_progress: ['open', 'pending', 'resolved', 'closed', 'canceled'],
    pending: ['open', 'in_progress', 'resolved', 'closed', 'canceled'],
    resolved: ['open', 'in_progress', 'pending', 'closed', 'canceled'],
    closed: ['open'],
    canceled: ['open'],
  },

  executor: {
    open: ['in_progress', 'pending', 'resolved', 'closed'],
    in_progress: ['pending', 'resolved', 'closed'],
    pending: ['in_progress', 'resolved', 'closed'],
    resolved: ['closed', 'open'],
    closed: ['open'],
    canceled: [],
  },

  employee: {
    open: [],
    in_progress: [],
    pending: [],
    resolved: [],
    closed: [],
    canceled: [],
  },
}

export class TicketStatusService {
  static isValidStatus(status: string): status is TicketStatus {
    return TICKET_STATUSES.includes(status as TicketStatus)
  }

  static canTransition(user: User, ticket: Ticket, toStatus: string): boolean {
    if (!user.isActive || !this.isValidStatus(toStatus)) {
      return false
    }

    const role = (user.role in ROLE_TRANSITIONS ? user.role : 'employee') as UserRole
    const fromStatus = ticket.status as TicketStatus

    if (!this.isValidStatus(fromStatus) || fromStatus === toStatus) {
      return false
    }

    if (role === 'executor' && ticket.assigneeId !== user.id) {
      return false
    }

    const allowedTargets = ROLE_TRANSITIONS[role][fromStatus] ?? []
    return allowedTargets.includes(toStatus)
  }

  static async transition(ticket: Ticket, newStatus: string, actorId: number) {
    const oldStatus = ticket.status
    ticket.status = newStatus as TicketStatus

    if (newStatus === 'closed') {
      ticket.closedAt = DateTime.now()
    } else if (oldStatus === 'closed' && newStatus === 'open') {
      ticket.closedAt = null
    }

    await ticket.save()

    await TicketAuditService.record(
      ticket,
      actorId,
      'status_changed',
      oldStatus,
      newStatus
    )

    await TicketNotificationService.notifyStatusChanged(
      ticket,
      oldStatus,
      newStatus,
      actorId
    )

    return ticket
  }
}