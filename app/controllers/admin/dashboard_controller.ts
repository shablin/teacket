import type { HttpContext } from '@adonisjs/core/http'

import User from '#models/user'
import Ticket from '#models/ticket'

export default class DashboardController {
    async index({ view }: HttpContext) {
        const [usersCount, openTickets, closedTickets, recentTickets] = await Promise.all([
            User.query().count('* as total'),
            Ticket.query().where('status', 'open').count('* as total'),
            Ticket.query().where('status', 'closed').count('* as total'),
            Ticket.query()
                .orderBy('createdAt', 'desc')
                .limit(10)
                .preload('requester')
                .preload('assignee')
        ])

        return view.render('admin/dashboard', {
            stats: {
                users: Number(usersCount[0].$extras.total),
                openTickets: Number(openTickets[0].$extras.total),
                closedTickets: Number(closedTickets[0].$extras.total),
            },
            recentTickets
        })
    }
}