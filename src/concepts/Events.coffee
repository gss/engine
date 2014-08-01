# Simple event trigger that provides `handleEvent` interface
# and calls `on<event>` function on the object if defined

class Events
  constructor: ->
    @listeners = {}
    @eventHandler = @handleEvent.bind(@)
    @addListeners(@events) if @events

  destroy: ->
    @triggerEvent('destroy')
    if @scope
      @dispatchEvent(@scope, 'destroy')
    @removeListeners(@events) if @events

  addListeners: (listeners) ->
    for name, callback of listeners
      @addEventListener name, callback

  removeListeners: (listeners) ->
    for name, callback of listeners
      @removeEventListener name, callback

  once: (type, fn) ->
    fn.once = true
    @addEventListener(type, fn)

  addEventListener: (type, fn) ->
    (@listeners[type] ||= []).push(fn)

  removeEventListener: (type, fn) ->
    if group = @listeners[type]
      if (index = group.indexOf(fn)) > -1
        group.splice(index, 1)

  triggerEvent: (type, a, b, c) ->
    if group = @listeners?[type]
      for fn, index in group by -1
        group.splice(index, 1) if fn.once
        fn.call(@, a, b, c)
    if @[method = 'on' + type]
      return @[method](a, b, c)

  dispatchEvent: (element, type, detail, bubbles, cancelable) ->
    return unless @scope
    (detail ||= {}).engine = @
    element.dispatchEvent new CustomEvent(type, {detail,bubbles,cancelable})

  # Catch-all event listener 
  handleEvent: (e) ->
    @triggerEvent(e.type, e)

module.exports = Events