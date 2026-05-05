import Notification from '#models/notification'
import Ticket from '#models/ticket'
import TicketComment from '#models/ticket_comment'
import TicketHistory from '#models/ticket_history'
import TicketPolicy from '#policies/ticket_policy'
import { createCommentValidator } from '#validators/comment'
import type { HttpContext } from '@adonisjs/core/http'

export default class TicketCommentsController {
    async store({ params, request, response, auth, session }: HttpContext) {
        const ticket = await Ticket.findOrFail(params.ticketId)

        if (!TicketPolicy.comment(auth.user!, ticket)) {
            session.flash('error', 'you cannot comment this ticket')
            return response.redirect(`/tickets/${ticket.id}`)
        }

        const payload = await request.validateUsing(createCommentValidator)

        await TicketComment.create({
            ticketId: ticket.id,
            userId: auth.user!.id,
            content: payload.content,
            isInternal: payload.isInternal || false,
        })

        await TicketHistory.create({
            ticketId: ticket.id,
            actorId: auth.user!.id,
            eventType: 'updated',
            beforeState: null,
            afterState: 'comment_created'
        })

        if (ticket.requesterId !== auth.user!.id) {
            await Notification.create({
                userId: ticket.requesterId,
                ticketId: ticket.id,
                type: 'new_comment',
                title: `New comment on ${ticket.number}`,
                message: payload.content.slice(0, 120),
            })
        }

        session.flash('success', 'Comment added')
        return response.redirect(`/tickets/${ticket.id}`)
    }

    async destroy({ params, response, auth, session }: HttpContext) {
        const comment = await TicketComment.findOrFail(params.id)
        const ticket = await Ticket.findOrFail(comment.ticketId)

        if (!TicketPolicy.comment(auth.user!, ticket)) {
            session.flash('error', 'you cannot delete comments in this ticket')
            return response.redirect(`/tickets/${ticket.id}`)
        }

        await comment.delete()
        await TicketHistory.create({
            ticketId: ticket.id,
            actorId: auth.user!.id,
            eventType: 'comment_deleted',
            afterState: null,
        })

        session.flash('success', 'comment deleted')
        return response.redirect(`/tickets/${ticket.id}`)
    }
}