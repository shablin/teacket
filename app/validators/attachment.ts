import vine from '@vinejs/vine'

export const attachmentUploadValidator = vine.create(
    vine.object({
        attachment: vine.file({
            size: '10mb',
            extnames: [
                'pdf',
                'png',
                'jpg',
                'jpeg',
                'gif',
                'webp',
                'txt',
                'doc',
                'docx',
                'xls',
                'xlsx',
                'zip',
            ]
        })
    })
)