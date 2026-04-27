import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_attachments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('ticket_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tickets')
        .onDelete('CASCADE')

      table
        .integer('comment_id')
        .unsigned()
        .references('id')
        .inTable('ticket_comments')
        .onDelete('CASCADE')
        .nullable()

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.string('file_name', 255).notNullable()
      table.string('file_path', 1024).notNullable()
      table.string('mime_type', 255).notNullable()
      table.bigInteger('size').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['ticket_id'])
      table.index(['comment_id'])
      table.index(['user_id'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}