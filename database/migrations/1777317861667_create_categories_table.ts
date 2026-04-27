import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 120).notNullable()
      table.text('description').nullable()
      
      table
        .integer('department_id')
        .unsigned()
        .references('id')
        .inTable('departments')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['department_id'])
      table.unique(['name', 'department_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}