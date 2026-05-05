import Ticket from '#models/ticket'
import User from '#models/user'
import { TicketStatusService } from '#services/ticket_status_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const createUser = (role: string) =>
  User.create({
    email: `${role}-${Math.random()}@mail.ru`,
    password: 'password',
    role,
    isActive: true,
  })

test.group('Ticket status transition', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('service allows executor to change assigned ticket: open -> in_progress', async ({ assert }) => {
    const executor = await createUser('executor')
    const requester = await createUser('employee')

    const ticket = await Ticket.create({
      title: 'Test Ticket',
      requesterId: requester.id,
      assigneeId: executor.id,
      status: 'open',
      priority: 'high',
    })

    assert.isTrue(TicketStatusService.canTransition(executor, ticket, 'in_progress'))
  })
})