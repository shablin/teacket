import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      
      table
        .integer('ticket_id')
        .unsigned()
        .references('id')
        .inTable('tickets')
        .onDelete('CASCADE')
        .nullable()

      table.string('type', 100).notNullable()
      table.string('title', 255).notNullable()
      table.text('message').nullable()

      table.timestamp('read_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['user_id'])
      table.index(['ticket_id'])
      table.index(['read_at'])
      table.index(['created_at'])
      table.index(['updated_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}