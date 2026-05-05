import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Ticket from './ticket.ts'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import TicketComment from './ticket_comment.ts'
import TicketAttachment from './ticket_attachment.ts'
import TicketHistory from './ticket_history.ts'
import Notification from './notification.ts'
import Department from './department.ts'

/**
 * User model represents a user in the application.
 * It extends UserSchema and includes authentication capabilities
 * through the withAuthFinder mixin.
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @column()
  declare role: string
  
  @column()
  declare departmentId: number | null

  @column()
  declare isActive: boolean

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  @hasMany(() => Ticket, { foreignKey: 'requesterId' })
  declare requestedTickets: HasMany<typeof Ticket>

  @hasMany(() => Ticket, { foreignKey: 'assigneeId' })
  declare assignedTickets: HasMany<typeof Ticket>

  @hasMany(() => TicketComment)
  declare comments: HasMany<typeof TicketComment>

  @hasMany(() => TicketAttachment)
  declare attachments: HasMany<typeof TicketAttachment>

  @hasMany(() => TicketHistory)
  declare historyEntries: HasMany<typeof TicketHistory>

  @hasMany(() => Notification)
  declare notifications: HasMany<typeof Notification>
  /**
   * Get the user's initials from their full name or email.
   * Returns the first letter of first and last name if available,
   * otherwise returns the first two characters of the email username.
   */
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
