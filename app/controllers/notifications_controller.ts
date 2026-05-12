import Notification from '#models/notification'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class NotificationsController {
    async index({ view, auth }: HttpContext) {
        const notifications = await Notification.query()
            .where('userId', auth.user!.id)
            .orderBy('createdAt', 'desc')
        
        return view.render('notifications/index', { notifications })
    }

    async markAsRead({ params, response, auth }: HttpContext) {
        const notifications = await Notification.query()
            .where('id', params.id)
            .where('userId', auth.user!.id)
            .firstOrFail()

        notifications.readAt = DateTime.now()
        await notifications.save()

        return response.redirect().back()
    }
}