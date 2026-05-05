import Category from '#models/category'
import Department from '#models/department'
import Notification from '#models/notification'
import Ticket from '#models/ticket'
import TicketComment from '#models/ticket_comment'
import TicketHistory from '#models/ticket_history'
import User from '#models/user'
import TicketPolicy from '#policies/ticket_policy'
import { TICKET_STATUSES, TicketStatusService } from '#services/ticket_status_service'
import { createTicketValidator, updateTicketValidator } from '#validators/ticket'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class TicketsController {
    async list({ view, request, auth }: HttpContext) {
        const page = Number(request.input('page', 1)) || 1
        const status = request.input('status')
        const query = Ticket.query()
            .preload('requester')
            .preload('assignee')
            .preload('category')
            .preload('department')
            .orderBy('createdAt', 'desc')

        if (status) query.where('status', status)
        
        const tickets = await query.paginate(page, 10)

        return view.render('tickets/index', {
            tickets,
            status,
            statuses: TICKET_STATUSES,
            user: auth.user,
        })
    }

    async create({ view, auth, response, session }: HttpContext) {
        if (!TicketPolicy.create(auth.user!)) {
            session.flash('error', 'you cannot create tickets')
            return response.redirect('/tickets')
        }

        const [categories, departments] = await Promise.all([
            Category.query().orderBy('name', 'asc'),
            Department.query().orderBy('name', 'asc'),
        ])

        return view.render('tickets/create', { categories, departments })
    }

    async store({ request, response, auth, session }: HttpContext) {
        if (!TicketPolicy.create(auth.user!)) {
            session.flash('error', 'you cannot create tickets')
            return response.redirect('/tickets')
        }

        const payload = await request.validateUsing(createTicketValidator)

        const ticket = await Ticket.create({
            title: payload.title,
            description: payload.description,
            priority: payload.priority,
            categoryId: payload.categoryId,
            departmentId: payload.departmentId,
            requesterId: auth.user!.id,
            status: 'open',
            dueAt: payload.dueAt ? DateTime.fromISO(payload.dueAt) : undefined
        })

        await Notification.create({
            userId: auth.user!.id,
            ticketId: ticket.id,
            type: 'ticket_created',
            title: `Ticket ${ticket.number} created`,
            message: ticket.title,
        })

        await TicketHistory.create({
            ticketId: ticket.id,
            actorId: auth.user!.id,
            eventType: 'created',
            beforeState: null,
            afterState: JSON.stringify({ status: ticket.status, title: ticket.title })
        })

        session.flash('success', 'Ticket created')
        return response.redirect(`/tickets/${ticket.id}`)
    }

    async show({ params, view, auth, response, session }: HttpContext) {
        const ticket = await Ticket.query()
            .where('id', params.id)
            .preload('requester')
            .preload('assignee')
            .preload('category')
            .preload('department')
            .preload('attachments', (q) => q.preload('user').orderBy('createdAt', 'desc'))
            .firstOrFail()

        const comments = await TicketComment.query()
            .where('ticketId', ticket.id)
            .preload('user')
            .orderBy('createdAt', 'desc')
        
        const history = await TicketHistory.query()
            .where('ticketId', ticket.id)
            .preload('user')
            .orderBy('createdAt', 'desc')
            .limit(20)
        
        if (!TicketPolicy.view(auth.user!, ticket)) {
            session.flash('error', 'you cannot view this ticket')
            return response.redirect('/tickets')
        }

        return view.render('tickets/show', {
            ticket,
            comments,
            history,
            statuses: TICKET_STATUSES,
            canAssign: TicketPolicy.assign(auth.user!),
            canTransition: TicketPolicy.changeStatus(auth.user!, ticket),
            canClose: TicketPolicy.changeStatus(auth.user!, ticket),
        })
    }

    async edit({ params, view, auth, response, session }: HttpContext) {
        const ticket = await Ticket.findOrFail(params.id)
        
        if (!TicketPolicy.update(auth.user!, ticket)) {
            session.flash('error', 'you cannot edit this ticket')
            return response.redirect(`/tickets/${ticket.id}`)
        }

        const [categories, departments] = await Promise.all([
            Category.query().orderBy('name', 'asc'),
            Department.query().orderBy('name', 'asc')
        ])

        return view.render('tickets/edit', { ticket, categories, departments })
    }

    async update({ params, request, response, auth, session }: HttpContext) {
        const ticket = await Ticket.findOrFail(params.id)

        if (!TicketPolicy.update(auth.user!, ticket)) {
            session.flash('error', 'you cannot update this ticket')
            return response.redirect(`/tickets/${ticket.id}`)
        }

        const payload = await request.validateUsing(updateTicketValidator)
        const previousStatus = ticket.status

        ticket.merge({
            title: payload.title,
            description: payload.description,
            priority: payload.priority,
            categoryId: payload.categoryId,
            departmentId: payload.departmentId,
            dueAt: payload.dueAt ? DateTime.fromISO(payload.dueAt) : undefined,
        })

        await ticket.save()

        if (previousStatus !== ticket.status) {
            await TicketHistory.create({
                ticketId: ticket.id,
                actorId: auth.user!.id,
                eventType: 'status_changed',
                beforeState: previousStatus,
                afterState: ticket.status,
            })
        }

        await TicketHistory.create({
            ticketId: ticket.id,
            actorId: auth.user!.id,
            eventType: 'updated',
            beforeState: null,
            afterState: JSON.stringify({ title: ticket.title, priority: ticket.priority })
        })

        session.flash('success', 'Ticket updated')
        return response.redirect(`/tickets/${ticket.id}`)
    }

    async assign({ params, request, response, auth, session }: HttpContext) {
        const ticket = await Ticket.findOrFail(params.id)

        if (!TicketPolicy.assign(auth.user!)) {
            session.flash('error', 'you cannot assign ticket')
            return response.redirect().back()
        }

        const assigneeId = Number(request.input('assigneeId'))
        const assignee = await User.findOrFail(assigneeId)

        const oldAssignee = ticket.assigneeId
        ticket.assigneeId = assignee.id
        await ticket.save()

        await TicketHistory.create({
            ticketId: ticket.id,
            actorId: auth.user!.id,
            eventType: 'assigned',
            beforeState: oldAssignee ? String(oldAssignee) : null,
            afterState: String(assignee.id),
        })

        await Notification.create({
            userId: assignee.id,
            ticketId: ticket.id,
            type: 'ticket_assigned',
            title: `You were assigned ticket ${ticket.number}`,
            message: ticket.title,
        })

        session.flash('success', 'Ticket assigned')
        return response.redirect(`/tickets/${ticket.id}`)
    }

    async transition({ params, request, response, auth, session }: HttpContext) {
        const ticket = await Ticket.findOrFail(params.id)
        const newStatus = request.input('status')

        if (!TicketStatusService.canTransition(auth.user!, ticket, newStatus)) {
            session.flash('error', 'invalid status transition req')
            return response.redirect().back()
        }

        const oldStatus = ticket.status
        ticket.status = newStatus

        if (newStatus === 'closed') {
            ticket.closedAt = DateTime.now()
        } else if (oldStatus === 'closed' && newStatus === 'open') {
            ticket.closedAt = null
        }

        await ticket.save()

        await TicketHistory.create({
            ticketId: ticket.id,
            actorId: auth.user!.id,
            eventType: 'status_changed',
            beforeState: oldStatus,
            afterState: newStatus,
        })

        await Notification.create({
            userId: ticket.requesterId,
            ticketId: ticket.id,
            type: 'status_changed',
            title: `Ticket ${ticket.number} status changed`,
            message: `New status: ${newStatus}`,
        })

        session.flash('success', 'Ticket status updated')
        return response.redirect(`/tickets/${ticket.id}`)
    }

    async usersForAssign({ response }: HttpContext) {
        const users = await User.query().orderBy('fullName', 'asc')
        return response.json(
            users.map((user) => ({
                id: user.id,
                fullName: user.fullName || user.email,
            }))
        )
    }
}