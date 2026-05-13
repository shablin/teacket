import Notification from "#models/notification";
import Ticket from "#models/ticket";

export class TicketNotificationService {
  static async notifyTicketCreated(ticket: Ticket, actorId: number) {
    return Notification.create({
      userId: actorId,
      type: 'ticket_created',
      payload: {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        title: ticket.title,
      },
    })
  }

  static async notifyTicketAssigned(
    ticket: Ticket,
    assigneeId: number,
    actorId: number
  ) {
    return Notification.create({
      userId: assigneeId,
      type: 'ticket_assigned',
      payload: {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        title: ticket.title,
        assignedByUserId: actorId,
      },
    })
  }

  static async notifyStatusChanged(
    ticket: Ticket,
    oldStatus: string,
    newStatus: string,
    actorId: number
  ) {
    const recipientIds = new Set<number>([ticket.requesterId])
    if (ticket.assigneeId) recipientIds.add(ticket.assigneeId)
    recipientIds.delete(actorId)

    return Promise.all(
      Array.from(recipientIds).map((userId) =>
        Notification.create({
          userId,
          type: newStatus === 'closed' ? 'ticket_closed' : 'status_changed',
          payload: {
            ticketId: ticket.id,
            ticketNumber: ticket.number,
            oldStatus,
            newStatus,
            changeByUserId: actorId,
          },
        })
      )
    )
  }
}