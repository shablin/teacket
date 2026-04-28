import Ticket from '#models/ticket'
import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
    async index({ view, auth }: HttpContext) {
        const myCreated = await Ticket.query()
            .where('requesterId', auth.user!.id)
            .orderBy('createdAt', 'desc')
            .limit(10)
        
        const myAssignee = await Ticket.query()
            .where('assigneeId', auth.user!.id)
            .orderBy('createdAt', 'desc')
            .limit(10)
        
        return view.render('pages/dashboard', {
            myCreated,
            myAssignee,
        })
    }
}