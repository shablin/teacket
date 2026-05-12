import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['status', 'priority'], 'tickets_status_priority_idx')
      table.index(['department_id', 'status'], 'tickets_department_status_idx')
      table.index(['assignee_id', 'status'], 'tickets_assignee_status_idx')
      table.index(['requester_id', 'status'], 'tickets_requester_status_idx')
      table.index(['category_id', 'status'], 'tickets_category_status_idx')
      table.index(['created_at', 'status'], 'tickets_created_status_idx')
      table.index(['due_at', 'status'], 'tickets_due_status_idx')
      table.index(['number'], 'tickets_number_idx')
      table.index(['title'], 'tickets_title_idx')
    })

    this.schema.alterTable('ticket_comments', (table) => {
      table.index(['ticket_id', 'created_at'], 'ticket_comments_ticket_created_idx')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['status', 'priority'], 'tickets_status_priority_idx')
      table.dropIndex(['department_id', 'status'], 'tickets_department_status_idx')
      table.dropIndex(['assignee_id', 'status'], 'tickets_assignee_status_idx')
      table.dropIndex(['requester_id', 'status'], 'tickets_requester_status_idx')
      table.dropIndex(['category_id', 'status'], 'tickets_category_status_idx')
      table.dropIndex(['created_at', 'status'], 'tickets_created_status_idx')
      table.dropIndex(['due_at', 'status'], 'tickets_due_status_idx')
      table.dropIndex(['number'], 'tickets_number_idx')
      table.dropIndex(['title'], 'tickets_title_idx')
    })

    this.schema.alterTable('ticket_comments', (table) => {
      table.dropIndex(['ticket_id', 'created_at'], 'ticket_comments_ticket_created_idx')
    })
  }
}
