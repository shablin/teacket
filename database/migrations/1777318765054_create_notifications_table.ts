import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('title', 128)
      table.text('message')
      table.string('type')

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
      
      table
        .integer('ticket_id')
        .unsigned()
        .references('id')
        .inTable('tickets')

      table.timestamp('read_at')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}