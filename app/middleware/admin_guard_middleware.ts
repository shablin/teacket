import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminGuardMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user || !user.isActive || user.role !== 'admin') {
      ctx.session.flash('error', 'admin access required')
      return ctx.response.redirect('/dashboard')
    }
    
    const output = await next()
    return output
  }
}