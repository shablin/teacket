import Category from '#models/category'
import Department from '#models/department'
import Notification from '#models/notification'
import Ticket from '#models/ticket'
import TicketComment from '#models/ticket_comment'
import TicketHistory from '#models/ticket_history'
import User from '#models/user'
import TicketPolicy from '#policies/ticket_policy'
import { TicketQueryService } from '#services/ticket_query_service'
import { TICKET_STATUSES, TicketStatusService } from '#services/ticket_status_service'
import { createTicketValidator, updateTicketValidator } from '#validators/ticket'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class TicketsController {
    async list({ view, request, auth }: HttpContext) {
        const page = Number(request.input('page', 1)) || 1
        const filters = {
            number: request.input('number'),
            status: request.input('status'),
            priority: request.input('priority'),
            categoryId: request.input('categoryId') ? Number(request.input('categoryId')) : null,
            assigneeId: request.input('assigneeId') ? Number(request.input('assigneeId')) : null,
            requesterId: request.input('requesterId') ? Number(request.input('requesterId')) : null,
            departmentId: request.input('departmentId') ? Number(request.input('departmentId')) : null,
            createdFrom: request.input('createdFrom'),
            createdTo: request.input('createdTo'),
            dueFrom: request.input('dueFrom'),
            dueTo: request.input('dueTo'),
            search: request.input('search'),
            includeCommentSearch: request.input('includeCommentSearch') === '1',
        }

        const tickets = await TicketQueryService.build(filters).paginate(page, 10)
        const [categories, departments, users] = await Promise.all([
            Category.query().orderBy('name', 'asc'),
            Department.query().orderBy('name', 'asc'),
            User.query().orderBy('fullName', 'asc'),
        ])

        const queryString = request.qs()
        delete queryString.page

        return view.render('tickets/index', {
            tickets,
            filters,
            status: TICKET_STATUSES,
            priorities: ['low', 'medium', 'high', 'urgent'],
            categories,
            departments,
            users,
            user: auth.user,
            filtersQueryString: new URLSearchParams(queryString as Record<string, string>)
                                    .toString(),
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
            payload: {
                ticketId: ticket.id,
                ticketNumber: ticket.number,
                title: ticket.title,
            }
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
            payload: {
                ticketId: ticket.id,
                ticketNumber: ticket.number,
                title: ticket.title,
                assignedByUserId: auth.user!.id,
            }
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

        const recipientIds = new Set<number>([ticket.requesterId])
        if (ticket.assigneeId) recipientIds.add(ticket.assigneeId)
        recipientIds.delete(auth.user!.id)

        await Promise.all(
            Array.from(recipientIds).map((userId) =>
                Notification.create({
                    userId,
                    type: newStatus === 'closed' ? 'ticket_closed' : 'status_changed',
                    payload: {
                        ticketId: ticket.id,
                        ticketNumber: ticket.number,
                        oldStatus,
                        newStatus,
                        changeByUserId: auth.user!.id,
                    },
                })
            )
        )

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