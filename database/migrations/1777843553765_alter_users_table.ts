import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('role', 30)
        .notNullable()
        .defaultTo('employee')
              
      table.integer('department_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('departments')
        .onDelete('SET NULL')
        
      table.boolean('is_active')
        .notNullable()
        .defaultTo(true)

      table.index(['role'])
      table.index(['department_id'])
      table.index(['is_active'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['role'])
      table.dropColumn('role')

      table.dropIndex(['department_id'])
      table.dropColumn('department_id')

      table.dropIndex(['is_active'])
      table.dropColumn('is_active')
    })
  }
}