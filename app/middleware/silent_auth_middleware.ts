import Notification from '#models/notification'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Silent auth middleware can be used as a global middleware to silent check
 * if the user is logged-in or not.
 *
 * The request continues as usual, even when the user is not logged-in.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()

    let unreadNotificationsCount = 0

    if (ctx.auth.user) {
      unreadNotificationsCount = await Notification.query()
        .where('userId', ctx.auth.user.id)
        .whereNull('readAt')
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total))
    }

    ctx.view.share({ unreadNotificationsCount })

    return next()
  }
}
