import Ticket from "#models/ticket"
import { DateTime } from "luxon"
import { TicketNotificationService } from "./ticket_notification_service.ts"
import { TicketAuditService } from "./ticket_audit_service.ts"

export class TicketCreationService {
  static async create(payload: {
    title: string
    description?: string | null
    priority: 'low' | 'medium' | 'high' | 'urgent'
    categoryId?: number | null
    departmentId?: number | null
    dueAt?: string | null
    requesterId: number
  }) {
    const ticket = await Ticket.create({
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      categoryId: payload.categoryId,
      departmentId: payload.departmentId,
      requesterId: payload.requesterId,
      status: 'open',
      dueAt: payload.dueAt ? DateTime.fromISO(payload.dueAt) : undefined,
    })

    const oldStatus = ticket.status

    await TicketNotificationService.notifyStatusChanged(
      ticket,
      oldStatus,
      ticket.status,
      payload.requesterId
    )

    await TicketAuditService.record(
      ticket,
      payload.requesterId,
      'created',
      null,
      JSON.stringify({
        status: ticket.status,
        title: ticket.title
      })
    )

    return ticket
  }
}