import Category from '#models/category'
import Department from '#models/department'
import Notification from '#models/notification'
import Ticket from '#models/ticket'
import TicketComment from '#models/ticket_comment'
import TicketHistory from '#models/ticket_history'
import User from '#models/user'
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
            statuses: [
                'open', 'in_progress', 'pending',
                'resolved', 'closed', 'canceled'
            ],
            user: auth.user,
        })
    }

    async create({ view }: HttpContext) {
        const [categories, departments] = await Promise.all([
            Category.query().orderBy('name', 'asc'),
            Department.query().orderBy('name', 'asc'),
        ])

        return view.render('tickets/create', { categories, departments })
    }

    async store({ request, response, auth, session }: HttpContext) {
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

        session.flash('success', 'Ticket created')
        return response.redirect(`/tickets/${ticket.id}`)
    }

    async show({ params, view, auth }: HttpContext) {
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
        
        return view.render('tickets/show', {
            ticket,
            comments,
            history,
            statuses: ['open', 'in_progress', 'pending', 'resolved', 'closed', 'canceled'],
            canAssign: this.canAssign(auth.user ?? null),
            canTransition: this.canTransition(auth.user ?? null),
            canClose: this.canClose(auth.user ?? null),
        })
    }

    async edit({ params, view, auth, response, session }: HttpContext) {
        const ticket = await Ticket.findOrFail(params.id)
        
        if (!this.canEdit(auth.user ?? null, ticket)) {
            session.flash('error', 'You cannot edit this ticket')
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
        
        if (!this.canEdit(auth.user ?? null, ticket)) {
            session.flash('error', 'You cannot update this ticket')
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
                userId: auth.user!.id,
                field: 'status',
                oldValue: previousStatus,
                newValue: ticket.status,
            })
        }

        session.flash('success', 'Ticket updated')
        return response.redirect(`/tickets/${ticket.id}`)
    }

    async assign({ params, request, response, auth, session }: HttpContext) {
        const ticket = await Ticket.findOrFail(params.id)

        if (!this.canAssign(auth.user ?? null)) {
            session.flash('error', 'You cannot assign tickets')
            return response.redirect().back()
        }

        const assigneeId = Number(request.input('assigneeId'))
        const assignee = await User.findOrFail(assigneeId)

        const oldAssignee = ticket.assigneeId
        ticket.assigneeId = assignee.id
        await ticket.save()

        await TicketHistory.create({
            ticketId: ticket.id,
            userId: auth.user!.id,
            field: 'assignee_id',
            oldValue: oldAssignee ? String(oldAssignee) : null,
            newValue: String(assignee.id),
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
        const allowedStatuses = [
            'open', 'in_progress', 'pending',
            'resolved', 'closed', 'canceled'
        ]

        if (!this.canTransition(auth.user ?? null) || !allowedStatuses.includes(newStatus)) {
            session.flash('error', 'Invalid status transition request')
            return response.redirect().back()
        }

        const oldStatus = ticket.status
        ticket.status = newStatus
        ticket.closedAt = newStatus === 'closed' ? DateTime.now() : null
        await ticket.save()

        await TicketHistory.create({
            ticketId: ticket.id,
            userId: auth.user!.id,
            field: 'status',
            oldValue: oldStatus,
            newValue: newStatus,
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

    private canAssign(user: User | null) {
        return !!user && ['admin', 'agent', 'manager'].includes(user.role)
    }

    private canTransition(user: User | null) {
        return !!user && ['admin', 'agent', 'manger'].includes(user.role)
    }

    private canClose(user: User | null) {
        return !!user && ['admin', 'agent', 'manager'].includes(user.role)
    }

    private canEdit(user: User | null, ticket: Ticket) {
        return !!user && (user.id === ticket.requesterId || this.canAssign(user))
    }
}