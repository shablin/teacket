import { CategorySchema } from '#database/schema'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import Department from './department.ts'
import Ticket from './ticket.ts'

export default class Category extends CategorySchema {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare description: string | null

    @column()
    declare departmentId: number | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => Department)
    declare department: BelongsTo<typeof Department>

    @hasMany(() => Ticket)
    declare tickets: HasMany<typeof Ticket>

}