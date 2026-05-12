import { NotificationSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Ticket from './ticket.ts'
import User from './user.ts'

export default class Notification extends NotificationSchema {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare userId: number

    @column()
    declare ticketId: number | null

    @column()
    declare type: string

    @column()
    declare payload: Record<string, unknown> | null

    @column()
    declare title: string

    @column()
    declare message: string | null

    @column.dateTime()
    declare readAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
    
    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    @belongsTo(() => Ticket)
    declare ticket: BelongsTo<typeof Ticket>
}