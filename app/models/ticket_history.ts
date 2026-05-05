import { TicketHistorySchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Ticket from './ticket.ts'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.ts'

export default class TicketHistory extends TicketHistorySchema {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare ticketId: number

    @column()
    declare actorId: number | null

    @column()
    declare eventType: string

    @column()
    declare beforeState: string | null

    @column()
    declare afterState: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Ticket)
    declare ticket: BelongsTo<typeof Ticket>

    @belongsTo(() => User, { foreignKey: 'actorId' })
    declare user: BelongsTo<typeof User>
}