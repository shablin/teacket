import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('payload').nullable()
      table.dropColumn('title')
      table.dropColumn('message')
      table.dropColumn('ticket_id')
      table.dropColumn('updated_at')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('ticket_id')
        .unsigned()
        .nullable()
      
      table.string('title', 255)
        .notNullable()
        .defaultTo('')
      
      table.text('message').nullable()
      table.timestamp('updated_at')
      table.dropColumn('payload')
    })
  }
}