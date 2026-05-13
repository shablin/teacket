import Ticket from "#models/ticket";
import TicketHistory from "#models/ticket_history";

export class TicketAuditService {
  static async record(
    ticket: Ticket,
    actorId: number | null,
    eventType: string,
    beforeState: string | null,
    afterState: string | null
  ) {
    return TicketHistory.create({
      ticketId: ticket.id,
      actorId,
      eventType,
      beforeState,
      afterState,
    })
  }
}