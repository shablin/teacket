import { DepartmentSchema } from '#database/schema'
import { column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Category from './category.ts'
import Ticket from './ticket.ts'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Department extends DepartmentSchema {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare description: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime | null

    @hasMany(() => Category)
    declare categories: HasMany<typeof Category>

    @hasMany(() => Ticket)
    declare tickets: HasMany<typeof Ticket>
}