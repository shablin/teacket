import Ticket from "#models/ticket";
import { TicketAuditService } from "./ticket_audit_service.ts";
import { TicketNotificationService } from "./ticket_notification_service.ts";

export class TicketAssignmentService {
  static async assign(
    ticket: Ticket,
    assigneeId: number,
    actorId: number
  ) {
    const oldAssignee = ticket.assigneeId
    ticket.assigneeId = assigneeId
    await ticket.save()

    await TicketAuditService.record(
      ticket,
      actorId,
      'assigned',
      oldAssignee ? String(oldAssignee) : null,
      String(assigneeId)
    )

    await TicketNotificationService.notifyTicketAssigned(ticket, assigneeId, actorId)
    return ticket
  }
}