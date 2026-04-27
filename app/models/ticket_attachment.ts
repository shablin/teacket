import { TicketAttachmentSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Ticket from './ticket.ts'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import TicketComment from './ticket_comment.ts'
import User from './user.ts'

export default class TicketAttachment extends TicketAttachmentSchema {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare ticketId: number

    @column()
    declare commentId: number | null

    @column()
    declare userId: number | null

    @column()
    declare fileName: string

    @column()
    declare filePath: string

    @column()
    declare mimeType: string

    @column()
    declare size: number | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => Ticket)
    declare ticket: BelongsTo<typeof Ticket>

    @belongsTo(() => TicketComment)
    declare comment: BelongsTo<typeof TicketComment>

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>
}