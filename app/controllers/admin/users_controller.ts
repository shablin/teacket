import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
    async index({ view }: HttpContext) {
        const users = await User.query().orderBy('createdAt', 'desc')
        return view.render('admin/users/index', { users })
    }
}