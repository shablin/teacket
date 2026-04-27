import { TicketCommentSchema } from '#database/schema'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Ticket from './ticket.ts'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.ts'
import TicketAttachment from './ticket_attachment.ts'

export default class TicketComment extends TicketCommentSchema {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare ticketId: number

    @column()
    declare userId: number

    @column()
    declare content: string

    @column()
    declare isInternal: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => Ticket)
    declare ticket: BelongsTo<typeof Ticket>

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    @hasMany(() => TicketAttachment, { foreignKey: 'commentId' })
    declare attachments: HasMany<typeof TicketAttachment>
}