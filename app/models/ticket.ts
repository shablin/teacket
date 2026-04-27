import { TicketSchema } from '#database/schema'
import { beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Category from './category.ts'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Department from './department.ts'
import User from './user.ts'
import TicketAttachment from './ticket_attachment.ts'
import TicketHistory from './ticket_history.ts'
import { TicketNumberGeneratorService } from '#services/ticket_number_generator_service'


const TicketStatuses = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    PENDING: 'pending',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    CANCELLED: 'canceled',
} as const

const TicketPriorities = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
} as const

type TicketStatus = (typeof TicketStatuses)[keyof typeof TicketStatuses]
type TicketPriority = (typeof TicketPriorities)[keyof typeof TicketPriorities]

export default class Ticket extends TicketSchema {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare number: string

    @column()
    declare title: string

    @column()
    declare description: string | null

    @column()
    declare status: TicketStatus

    @column()
    declare priority: TicketPriority

    @column()
    declare categoryId: number | null

    @column()
    declare requesterId: number

    @column()
    declare assigneeId: number | null

    @column()
    declare departmentId: number | null

    @column.dateTime()
    declare dueAt: DateTime

    @column.dateTime()
    declare closedAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => Category)
    declare category: BelongsTo<typeof Category>

    @belongsTo(() => Department)
    declare department: BelongsTo<typeof Department>

    @belongsTo(() => User, { foreignKey: 'requesterId' })
    declare requester: BelongsTo<typeof User>

    @belongsTo(() => User, { foreignKey: 'assigneeId' })
    declare assignee: BelongsTo<typeof User>

    @hasMany(() => TicketAttachment)
    declare attachments: HasMany<typeof TicketAttachment>

    @hasMany(() => TicketHistory)
    declare history: HasMany<typeof TicketHistory>

    @beforeCreate()
    static async assignTicketNumber(ticket: Ticket) {
        if (!ticket.number) {
            ticket.number = await TicketNumberGeneratorService.generate()
        }
    }
}