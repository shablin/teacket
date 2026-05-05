/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/home').as('home')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
    
    router.get('dashboard', [controllers.Dashboard, 'index']).as('dashboard')
    
    router
      .get('profile',
        async ({ view, auth }) =>
          view.render(
            'pages/profile',
            { user: auth.user }
          )
      ).as('profile')

    router.get('tickets', [controllers.Tickets, 'list']).as('tickets.list')
    router.get('tickets/create', [controllers.Tickets, 'create']).as('tickets.create')
    router.post('tickets', [controllers.Tickets, 'store']).as('tickets.store')
    router.get('tickets/:id', [controllers.Tickets, 'show']).as('tickets.show')
    router.get('tickets/:id/edit', [controllers.Tickets, 'edit']).as('tickets.edit')
    router.post('tickets/:id', [controllers.Tickets, 'update']).as('tickets.update')

    router
      .post('tickets/:id/assign', [controllers.Tickets, 'assign'])
      .as('tickets.assign')

    router
      .post('tickets/:id/transition', [controllers.Tickets, 'transition'])
      .as('tickets.transition')

    router
      .post('tickets/:ticketId/comments', [controllers.TicketComments, 'store'])
      .as('ticket_comments.store')

    router
      .post('tickets/:ticketId/attachments', [controllers.TicketAttachments, 'store'])
      .as('ticket_attachments.store')

    router
      .get('notifications', [controllers.Notifications, 'index'])
      .as('notifications.index')

    router
      .post('notifications/:id/read', [controllers.Notifications, 'markAsRead'])
      .as('notifications.mark_as_read')
    
    router
      .group(() => {
        router.get('dashboard', [controllers.admin.Dashboard, 'index']).as('admin.dashboard')
        router.get('tickets', [controllers.admin.Tickets, 'index']).as('admin.tickets.index')
        router.get('users', [controllers.admin.Users, 'index']).as('admin.users.index')
      }).prefix('/admin').use(middleware.adminGuard())
  })
  .use(middleware.auth())
