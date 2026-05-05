import Ticket from '#models/ticket'
import User from '#models/user'
import { TicketStatusService } from '#services/ticket_status_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const createUser = (role: string) => {
  const password = 'secret123'

  return User.create({
    email: `${role}-${Math.random()}@example.com`,
    password,
    role,
    isActive: true,
  })
}


test.group('Ticket status transitions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('service allows executor to move assigned ticket: open -> in_progress',
    async ({ assert }) => {
      const executor = await createUser('executor')
      const requester = await createUser('employee')

      const ticket = await Ticket.create({
        title: 'T1',
        requesterId: requester.id,
        assigneeId: executor.id,
        status: 'open',
        priority: 'medium',
      })

      assert.isTrue(TicketStatusService.canTransition(executor, ticket, 'in_progress'))
  })

  test('service blocks executor transition when ticket is not assigned to them',
    async ({ assert }) => {
      const executor = await createUser('executor')
      const otherExecutor = await createUser('executor')
      const requester = await createUser('employee')

      const ticket = await Ticket.create({
        title: 'T2',
        requesterId: requester.id,
        assigneeId: otherExecutor.id,
        status: 'open',
        priority: 'medium',
      })

      assert.isFalse(TicketStatusService.canTransition(executor, ticket, 'in_progress'))
  })

  test('endpoint updates closed_at on close and clears it on reopen',
    async ({ client, assert }) => {
      const manager = await createUser('manager')
      const requester = await createUser('employee')

      const ticket = await Ticket.create({
        title: 'T3',
        requesterId: requester.id,
        status: 'resolved',
        priority: 'medium',
      })

      await client.post(`/tickets/${ticket.id}/transition`).loginAs(manager).form({ status: 'closed' })

      await ticket.refresh()
      assert.equal(ticket.status, 'closed')
      assert.isNotNull(ticket.closedAt)

      const closedAtBeforeReopen = ticket.closedAt

      await client.post(`/tickets/${ticket.id}/transition`).loginAs(manager).form({ status: 'open' })

      await ticket.refresh()
      assert.equal(ticket.status, 'open')
      assert.isNull(ticket.closedAt)
      assert.isNotNull(closedAtBeforeReopen)
  })

  test('endpoint rejects invalid transition and keeps state unchanged',
    async ({ client, assert }) => {
      const executor = await createUser('executor')
      const requester = await createUser('employee')

      const ticket = await Ticket.create({
        title: 'T4',
        requesterId: requester.id,
        assigneeId: executor.id,
        status: 'open',
        priority: 'medium',
        closedAt: DateTime.now(),
      })

      await client.post(`/tickets/${ticket.id}/transition`).loginAs(executor).form({ status: 'canceled' })

      await ticket.refresh()
      assert.equal(ticket.status, 'open')
      assert.isNotNull(ticket.closedAt)
  })
})
