import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'profile': { paramsTuple?: []; params?: {} }
    'tickets.list': { paramsTuple?: []; params?: {} }
    'tickets.create': { paramsTuple?: []; params?: {} }
    'tickets.store': { paramsTuple?: []; params?: {} }
    'tickets.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tickets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tickets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tickets.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tickets.transition': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ticket_comments.store': { paramsTuple: [ParamValue]; params: {'ticketId': ParamValue} }
    'ticket_attachments.store': { paramsTuple: [ParamValue]; params: {'ticketId': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.tickets.index': { paramsTuple?: []; params?: {} }
    'admin.users.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'profile': { paramsTuple?: []; params?: {} }
    'tickets.list': { paramsTuple?: []; params?: {} }
    'tickets.create': { paramsTuple?: []; params?: {} }
    'tickets.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tickets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.tickets.index': { paramsTuple?: []; params?: {} }
    'admin.users.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'profile': { paramsTuple?: []; params?: {} }
    'tickets.list': { paramsTuple?: []; params?: {} }
    'tickets.create': { paramsTuple?: []; params?: {} }
    'tickets.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tickets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.tickets.index': { paramsTuple?: []; params?: {} }
    'admin.users.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'tickets.store': { paramsTuple?: []; params?: {} }
    'tickets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tickets.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tickets.transition': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ticket_comments.store': { paramsTuple: [ParamValue]; params: {'ticketId': ParamValue} }
    'ticket_attachments.store': { paramsTuple: [ParamValue]; params: {'ticketId': ParamValue} }
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}