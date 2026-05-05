import User from '#models/user'
import Ticket from '#models/ticket'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'


const EXEC_ROLES = [
    'executor',
    'manager',
    'admin',
]


export default class TicketPolicy extends BasePolicy {
    static view(user: User, ticket: Ticket) {
        if (!user.isActive) return false // add isActive field
        if (user.role === 'admin' || user.role === 'manager') return true
        if (user.role === 'executor')
            return ticket.assigneeId === user.id ||
                   ticket.departmentId === user.departmentId // add user's department id
        
        return ticket.requesterId === user.id
    }

    static create(user: User) {
        return user.isActive
    }

    static update(user: User, ticket: Ticket) {
        if (!user.isActive) return false
        if (user.role === 'admin' || user.role === 'manager') return true
        
        return ticket.requesterId === user.id
    }

    static assign(user: User) {
        return user.isActive && EXEC_ROLES.includes(user.role) 
    }

    static changeStatus(user: User, ticket: Ticket) {
        if (!user.isActive) return false
        if (user.role === 'admin' || user.role === 'manager') return true

        return user.role === 'executor' && ticket.assigneeId === user.id
    }

    static reopen(user: User, ticket: Ticket) {
        if (!user.isActive) return false
        if (user.role === 'admin' || user.role === 'manager') return true

        return user.role === 'executor' && ticket.assigneeId === user.id
    }

    static comment(user: User, ticket: Ticket) {
        return this.view(user, ticket)
    }

    static attach(user: User, ticket: Ticket) {
        return this.view(user, ticket)
    }
}