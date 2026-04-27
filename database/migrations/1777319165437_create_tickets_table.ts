import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('number', 32).notNullable().unique()
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.string('status', 30).notNullable().defaultTo('open')
      table.string('priority', 30).notNullable().defaultTo('medium')

      table
        .integer('category_id')
        .unsigned()
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL')
        .nullable()

      table
        .integer('requester_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
      
      table
        .integer('assignee_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table
        .integer('department_id')
        .unsigned()
        .references('id')
        .inTable('departments')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('due_at').nullable()
      table.timestamp('closed_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['status'])
      table.index(['priority'])
      table.index(['category_id'])
      table.index(['assignee_id'])
      table.index(['requester_id'])
      table.index(['department_id'])
      table.index(['created_at'])
      table.index(['updated_at'])
      table.index(['due_at'])
      table.index(['closed_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}