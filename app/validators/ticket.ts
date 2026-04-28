import vine from '@vinejs/vine'
import { title } from 'node:process'

export const createTicketValidator = vine.create({
    title: vine.string().trim().minLength(5).maxLength(255),
    description: vine.string().trim().nullable(),
    priority: vine.enum(['low', 'medium', 'high', 'urgent'] as const),
    categoryId: vine.number().positive().nullable(),
    departmentId: vine.number().positive().nullable(),
    dueAt: vine.string().nullable(),
})

export const updateTicketValidator = vine.create({
    title: vine.string().trim().minLength(5).maxLength(255),
    description: vine.string().trim().nullable(),
    priority: vine.enum(['low', 'medium', 'high', 'urgent'] as const),
    categoryId: vine.number().positive().nullable(),
    departmentId: vine.number().positive().nullable(),
    dueAt: vine.string().nullable(),
})