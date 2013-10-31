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
    if @_listenersByType[type] then return @_listenersByType[type]
    @_listenersByType[type] = []
    return @_listenersByType[type]
  
  on: (type, listener) ->
    listeners = @_getListeners type    
    if listeners.indexOf(listener) is -1 then listeners.push(listener)
    @
  
  off: (type, listener) ->
    listeners = @_getListeners type
    i = listeners.indexOf(listener)
    if i isnt -1 then listeners.slice(i, 1)
    @
  
  offAll: (type) ->
    if type
      @_listenersByType[type] = []
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