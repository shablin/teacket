import Ticket from '#models/ticket'
import type { HttpContext } from '@adonisjs/core/http'

export default class TicketsController {
    async index({ view, request }: HttpContext) {
        const page = Number(request.input('page', 1)) || 1
        const tickets = await Ticket.query()
            .preload('requester')
            .preload('assignee')
            .orderBy('createdAt', 'desc')
            .paginate(page, 20)
            
        return view.render('admin/tickets/index', { tickets })
    }
}