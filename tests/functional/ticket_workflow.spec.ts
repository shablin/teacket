import Category from '#models/category'
import Department from '#models/department'
import Ticket from '#models/ticket'
import TicketAttachment from '#models/ticket_attachment'
import TicketComment from '#models/ticket_comment'
import TicketHistory from '#models/ticket_history'
import User from '#models/user'
import { TicketQueryService } from '#services/ticket_query_service'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const createUser = (role: string, extra: Partial<User> = {}) =>
  User.create({
    email: `${role}-${Math.random()}@example.com`,
    password: 'secret123',
    role,
    isActive: true,
    ...extra,
  })

const createBaseData = async () => {
  const department = await Department.create({ name: `IT-${Math.random()}` })
  const category = await Category.create({ name: `Bug-${Math.random()}` })
  return { department, category }
}

test.group('Auth + protected routes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('signup/login/logout and protected route access', async ({ client, assert }) => {
    const anon = await client.get('/tickets')
    anon.assertRedirectsTo('/login')

    const signup = await client.post('/signup').form({
      fullName: 'Test User',
      email: `u-${Math.random()}@example.com`,
      password: 'secret123',
    })
    signup.assertRedirectsTo('/')

    const protectedAfterSignup = await client.get('/tickets')
    protectedAfterSignup.assertStatus(200)

    const logout = await client.post('/logout')
    logout.assertRedirectsTo('/login')

    const user = await createUser('employee')
    const login = await client.post('/login').form({ email: user.email, password: 'secret123' })
    login.assertRedirectsTo('/')

    const protectedAfterLogin = await client.get('/tickets')
    protectedAfterLogin.assertStatus(200)

    assert.isTrue(true)
  })
})

test.group('Tickets CRUD + role restrictions + status transitions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('employee can CRUD own ticket, other employee cannot edit it', async ({
    client,
    assert,
  }) => {
    const employee = await createUser('employee')
    const otherEmployee = await createUser('employee')
    const { department, category } = await createBaseData()

    const ticket = await Ticket.create({
      title: 'VPN issue',
      description: 'Cannot connect',
      priority: 'high',
      requesterId: employee.id,
      categoryId: category.id,
      departmentId: department.id,
      status: 'open',
    })

    const ownerUpdateResponse = await client.post(`/tickets/${ticket.id}`).loginAs(employee).form({
      title: 'VPN issue updated',
      description: 'Still cannot connect',
      priority: 'medium',
      categoryId: category.id,
      departmentId: department.id,
      dueAt: '2026-12-31',
    })
    ownerUpdateResponse.assertStatus(200)

    await ticket.refresh()
    assert.equal(ticket.title, 'VPN issue updated')

    const outsiderUpdateResponse = await client
      .post(`/tickets/${ticket.id}`)
      .loginAs(otherEmployee)
      .redirects(0)
      .form({
        title: 'Hacked title',
        description: 'nope',
        priority: 'low',
        categoryId: category.id,
        departmentId: department.id,
        dueAt: '2026-12-31',
      })
    outsiderUpdateResponse.assertStatus(302)

    await ticket.refresh()
    assert.equal(ticket.title, 'VPN issue updated')
  })

  test('status transitions and invalid transition does not change status', async ({
    client,
    assert,
  }) => {
    const manager = await createUser('manager')
    const requester = await createUser('employee')

    const ticket = await Ticket.create({
      title: 'Deploy issue',
      requesterId: requester.id,
      priority: 'medium',
      status: 'open',
    })

    await client
      .post(`/tickets/${ticket.id}/transition`)
      .loginAs(manager)
      .form({ status: 'in_progress' })
    await ticket.refresh()
    assert.equal(ticket.status, 'in_progress')

    await client
      .post(`/tickets/${ticket.id}/transition`)
      .loginAs(manager)
      .form({ status: 'resolved' })
    await ticket.refresh()
    assert.equal(ticket.status, 'resolved')

    await client
      .post(`/tickets/${ticket.id}/transition`)
      .loginAs(manager)
      .form({ status: 'closed' })
    await ticket.refresh()
    assert.equal(ticket.status, 'closed')
    assert.isNotNull(ticket.closedAt)

    const previousClosedAt = ticket.closedAt

    await client
      .post(`/tickets/${ticket.id}/transition`)
      .loginAs(manager)
      .form({ status: 'in_progress' })
    await ticket.refresh()
    assert.equal(ticket.status, 'closed')
    assert.equal(ticket.closedAt?.toISO(), previousClosedAt?.toISO())
  })
})

test.group('Comments, attachments, filtering/search and audit history', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('comments, attachment validations, filtering + TicketHistory audit', async ({
    client,
    assert,
  }) => {
    const manager = await createUser('manager')
    const employee = await createUser('employee')
    const outsider = await createUser('employee')
    const { department, category } = await createBaseData()

    const ticket = await Ticket.create({
      title: 'Email outage',
      description: 'Searchable outage body',
      priority: 'urgent',
      status: 'open',
      requesterId: employee.id,
      departmentId: department.id,
      categoryId: category.id,
      createdAt: DateTime.now().minus({ day: 1 }),
    })

    const authorCommentResponse = await client
      .post(`/tickets/${ticket.id}/comments`)
      .loginAs(employee)
      .redirects(0)
      .form({ content: 'comment with unique phrase', isInternal: false })
    authorCommentResponse.assertStatus(302)

    const comment = await TicketComment.query().where('ticketId', ticket.id).first()
    assert.exists(comment)

    const outsiderCommentResponse = await client
      .post(`/tickets/${ticket.id}/comments`)
      .loginAs(outsider)
      .redirects(0)
      .form({ content: 'should fail' })

    outsiderCommentResponse.assertStatus(302)
    assert.lengthOf(await TicketComment.query().where('ticketId', ticket.id), 1)

    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'attach-tests-'))
    const allowedFile = path.join(tempDir, 'note.txt')
    const forbiddenFile = path.join(tempDir, 'script.exe')
    const largeFile = path.join(tempDir, 'big.txt')

    await writeFile(allowedFile, 'hello attachment')
    await writeFile(forbiddenFile, 'MZ')
    await writeFile(largeFile, Buffer.alloc(11 * 1024 * 1024, 1))

    const allowedAttachmentResponse = await client
      .post(`/tickets/${ticket.id}/attachments`)
      .loginAs(employee)
      .redirects(0)
      .file('attachment', allowedFile)
    allowedAttachmentResponse.assertStatus(302)
    assert.lengthOf(await TicketAttachment.query().where('ticketId', ticket.id), 1)

    const forbiddenAttachmentResponse = await client
      .post(`/tickets/${ticket.id}/attachments`)
      .loginAs(employee)
      .redirects(0)
      .file('attachment', forbiddenFile)
    forbiddenAttachmentResponse.assertStatus(302)
    assert.lengthOf(await TicketAttachment.query().where('ticketId', ticket.id), 1)

    const largeAttachmentResponse = await client
      .post(`/tickets/${ticket.id}/attachments`)
      .loginAs(employee)
      .redirects(0)
      .file('attachment', largeFile)
    largeAttachmentResponse.assertStatus(302)
    assert.lengthOf(await TicketAttachment.query().where('ticketId', ticket.id), 1)

    const filteredTickets = await TicketQueryService.build({
      search: 'unique phrase',
      includeCommentsSearch: true,
      status: 'open',
      priority: 'urgent',
      categoryId: category.id,
      requesterId: null,
      departmentId: null,
    })

    assert.isTrue(filteredTickets.some((row) => row.id === ticket.id))

    const historyRows = await TicketHistory.query()
      .where('ticketId', ticket.id)
      .orderBy('createdAt', 'asc')
    assert.isAtLeast(historyRows.length, 2)
    assert.isTrue(
      historyRows.some((row) => row.eventType === 'updated' && row.afterState === 'comment_created')
    )
    assert.isTrue(
      historyRows.some(
        (row) =>
          row.eventType === 'updated' && (row.afterState || '').includes('attachment_uploaded')
      )
    )
  })
})
