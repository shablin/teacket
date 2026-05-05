import app from '@adonisjs/core/services/app'
import Ticket from '#models/ticket'
import type { HttpContext } from '@adonisjs/core/http'
import TicketAttachment from '#models/ticket_attachment'
import TicketPolicy from '#policies/ticket_policy'

export default class TicketAttachmentsController {
    async store({ params, request, response, auth, session }: HttpContext) {
        const ticket = await Ticket.findByOrFail(params.ticketId)

        if (!TicketPolicy.attach(auth.user!, ticket)) {
            session.flash('error', 'you cannot attach files to this ticket')
            response.redirect(`/tickets/${ticket.id}`)
        }

        const file = request.file('attachment', {
            size: '10mb',
        })

        if (!file) {
            session.flash('error', 'Please select a file!')
            return response.redirect().back()
        }

        const fileName = `${Date.now()}_${file.clientName}`
        await file.move(app.makePath('tmp', 'uploads'), { name: fileName })

        if (!file.isValid) {
            session.flash('error', file.errors.map((error) => error.message).join(', '))
            return response.redirect().back()
        }

        await TicketAttachment.create({
            ticketId: ticket.id,
            userId: auth.user!.id,
            commentId: null,
            fileName: file.clientName,
            filePath: `tmp/uploads/${fileName}`,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
        })

        session.flash('success', 'Attachment uploaded')
        return response.redirect(`/tickets/${ticket.id}`)
    }
}