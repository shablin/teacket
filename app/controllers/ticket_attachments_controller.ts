import app from '@adonisjs/core/services/app'
import Ticket from '#models/ticket'
import type { HttpContext } from '@adonisjs/core/http'
import TicketAttachment from '#models/ticket_attachment'
import TicketPolicy from '#policies/ticket_policy'
import TicketHistory from '#models/ticket_history'
import { attachmentUploadValidator } from '#validators/attachment'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { mkdir, rm } from 'node:fs/promises'

export default class TicketAttachmentsController {
    async store({ params, request, response, auth, session }: HttpContext) {
        const ticket = await Ticket.findOrFail(params.ticketId)

        if (!TicketPolicy.attach(auth.user!, ticket)) {
            session.flash('error', 'you cannot attach files to this ticket')
            return response.redirect(`/tickets/${ticket.id}`)
        }

        const { attachment } = await request.validateUsing(attachmentUploadValidator)

        if (!attachment) {
            session.flash('error', 'please select a file')
            return response.redirect().back()
        }

        const storageDir = app.makePath('storage', 'ticket_attachments', String(ticket.id))
        await mkdir(storageDir, { recursive: true })

        const uuid = randomUUID()
        const extname = path.extname(attachment.clientName)
                            .toLocaleLowerCase()

        const safeFileName = `${uuid+extname}`

        await attachment.move(storageDir, { name: safeFileName, overwrite: false })

        if (!attachment.isValid) {
            session.flash(
                'error',
                attachment.errors.map((error) => error.message)
                                 .join(', '))
                
            return response.redirect().back()
        }

        await TicketAttachment.create({
            ticketId: ticket.id,
            userId: auth.user!.id,
            commentId: null,
            fileName: attachment.clientName,
            filePath: path.join('ticket_attachments', String(ticket.id), safeFileName),
            mimeType: attachment.type || 'application/octet-stream',
            size: attachment.size,
        })

        await TicketHistory.create({
            ticketId: ticket.id,
            actorId: auth.user!.id,
            eventType: 'updated',
            beforeState: null,
            afterState: `attachment_uploaded:${attachment.clientName}`
        })

        session.flash('success', 'attachment uploaded')
        return response.redirect(`/tickets/${ticket.id}`)
    }

    async show({ params, response, auth, session }: HttpContext) {
        const attachment = await TicketAttachment.findOrFail(params.id)
        const ticket = await Ticket.findOrFail(attachment.ticketId)

        if (!TicketPolicy.view(auth.user!, ticket)) {
            session.flash('error', 'you cannot view files from this ticket')
            return response.redirect('/tickets')
        }

        response.header(
            'Content-Type',
            attachment.mimeType
        )

        response.header(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(attachment.fileName)}"`
        )

        return response.download(app.makePath('storage', attachment.filePath))
    }

    async preview({ params, response, auth, session }: HttpContext) {
        const attachment = await TicketAttachment.findOrFail(params.id)
        const ticket = await Ticket.findOrFail(attachment.ticketId)

        if (!TicketPolicy.view(auth.user!, ticket)) {
            session.flash('error', 'you cannot view files from this ticket')
            return response.redirect('/tickets')
        }

        response.header(
            'Content-Type',
            attachment.mimeType
        )

        response.header(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(attachment.fileName)}"`
        )

        return response.download(app.makePath('storage', attachment.filePath))
    }

    async destroy({ params, response, auth, session }: HttpContext) {
        const attachment = await TicketAttachment.findOrFail(params.id)
        const ticket = await Ticket.findOrFail(attachment.ticketId)

        if (!TicketPolicy.attach(auth.user!, ticket)) {
            session.flash('error', 'you cannot delete files from this ticket')
            return response.redirect(`/tickets/${ticket.id}`)
        }

        const absolutePath = app.makePath('storage', attachment.filePath)
        await rm(absolutePath, { force: true })
        await attachment.delete()
        
        await TicketHistory.create({
            ticketId: ticket.id,
            actorId: auth.user!.id,
            eventType: 'attachment_deleted',
            beforeState: attachment.fileName,
            afterState: null,
        })

        session.flash('success', 'Attachment deleted')
        return response.redirect(`/tickets/${ticket.id}`)
    }
}