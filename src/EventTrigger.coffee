# Dead simple event system
# 
# via CoffeeScript:
#     class SomethingAwesome extends EventTrigger
#
# via vanilla JS:
#     // make new one
#     trigger = EventTrigger.make();
#     // compose trigger-ness
#     EventTrigger.make(SomethingAwesome);  

class EventTrigger

  constructor: ->
    @_listenersByType = {}
    @
    
  _getListeners: (type) ->
    if @_listenersByType[type]
      byType = @_listenersByType[type]
    else
      byType =  []
      @_listenersByType[type] = byType 
    return byType
  
  on: (type, listener) ->
    listeners = @_getListeners type    
    if listeners.indexOf(listener) is -1 then listeners.push(listener)
    @
  
  once: (type, listener) ->
    wrap = null
    that = this
    wrap = (o) ->
      listener.call that, o
      that.off type, wrap
    @on type, wrap
    @
  
  off: (type, listener) ->
    listeners = @_getListeners type
    i = listeners.indexOf(listener)
    if i isnt -1 then listeners.splice(i, 1)
    @
  
  offAll: (target) ->    
    # all event names
    if typeof target is "string"
      if target
        @_listenersByType[target] = []
    # all listeners
    else if typeof target is "function"
      for type, listeners of @_listenersByType
        i = listeners.indexOf(target)
        if i isnt -1 then listeners.splice(i, 1)
    # everything
    else
      @_listenersByType = {}
    @
  
  trigger: (type, o) ->
    for listener in @_getListeners type      
      listener.call @, o
    @
  
  

EventTrigger.make = (obj = {}) ->
  EventTrigger::constructor.call obj
  for key, val of EventTrigger::    
    if key is "constructor"
      val.call obj
    else
      obj[key] = val
  return obj

module.exports = EventTrigger