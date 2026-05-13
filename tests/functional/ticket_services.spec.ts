import Notification from '#models/notification'
import Ticket from '#models/ticket'
import TicketHistory from '#models/ticket_history'
import User from '#models/user'
import { TicketAssignmentService } from '#services/ticket_assignment_service'
import { TicketCreationService } from '#services/ticket_creation_service'
import { TicketStatusService } from '#services/ticket_status_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const createUser = (role: string) =>
  User.create({
    email: `${role}-${Math.random()}@example.com`,
    password: 'secret123',
    role,
    isActive: true,
  })

test.group('Ticket services', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('ticket_creation_service creates ticket with audit and notification', async ({ assert }) => {
    const requester = await createUser('employee')

    const ticket = await TicketCreationService.create({
      title: 'Created via service',
      priority: 'high',
      requesterId: requester.id,
    })

    const notification = await Notification.query().where('ticketId', ticket.id).where('type', 'ticket_created').first()
    const history = await TicketHistory.query().where('ticketId', ticket.id).where('eventType', 'created').first()

    assert.equal(ticket.status, 'open')
    assert.exists(notification)
    assert.exists(history)
  })

  test('ticket_assignment_service assigns and emits side effects', async ({ assert }) => {
    const manager = await createUser('manager')
    const requester = await createUser('employee')
    const assignee = await createUser('executor')

    const ticket = await Ticket.create({ title: 'Assign me', requesterId: requester.id, priority: 'medium', status: 'open' })

    await TicketAssignmentService.assign(ticket, assignee.id, manager.id)
    await ticket.refresh()

    const notification = await Notification.query().where('ticketId', ticket.id).where('type', 'ticket_assigned').first()
    const history = await TicketHistory.query().where('ticketId', ticket.id).where('eventType', 'assigned').first()

    assert.equal(ticket.assigneeId, assignee.id)
    assert.exists(notification)
    assert.exists(history)
  })

  test('ticket_status_service transition closes and notifies participants except actor', async ({ assert }) => {
    const manager = await createUser('manager')
    const requester = await createUser('employee')
    const assignee = await createUser('executor')

    const ticket = await Ticket.create({
      title: 'Close me',
      requesterId: requester.id,
      assigneeId: assignee.id,
      priority: 'medium',
      status: 'resolved',
    })

    await TicketStatusService.transition(ticket, 'closed', manager.id)
    await ticket.refresh()

    const history = await TicketHistory.query().where('ticketId', ticket.id).where('eventType', 'status_changed').first()
    const notifications = await Notification.query().whereIn('userId', [requester.id, assignee.id]).where('type', 'ticket_closed')

    assert.equal(ticket.status, 'closed')
    assert.isNotNull(ticket.closedAt)
    assert.exists(history)
    assert.lengthOf(notifications, 2)
  })
})
