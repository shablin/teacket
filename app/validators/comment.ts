import vine from '@vinejs/vine'

export const createCommentValidator = vine.create({
    content: vine.string().trim().minLength(1).maxLength(2000),
    isInternal: vine.boolean().optional(),
})