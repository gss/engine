### Constructor: GSS
  Dispatches arguments by type, returns engine
  When scope is given, creates Document
  Otherwise abstract Engine ###
GSS = -> #(data, url, scope)
  for argument, index in arguments
    continue unless argument
    switch typeof argument
      when 'object'
        if argument.nodeType
          scope = argument
        else
          data = argument
      when 'string', 'boolean'
        url = argument
          
  # **GSS()** attempts to find parent engine
  
  if !(@ instanceof GSS) && scope
    parent = scope
    while parent
      if id = GSS.identity.find(parent)
        if engine = GSS.Engine[id]
          return engine
      break unless parent.parentNode
      parent = parent.parentNode
    
  if scope && GSS.Document
    return new GSS.Document(data, url, scope)
  else
    return new GSS.Engine(data, url, scope)
    
GSS.Engine    = require('./Engine')
GSS.identity  = GSS.Engine::identity
GSS.identify  = GSS.Engine::identify
GSS.console   = GSS.Engine::console

module.exports = GSS
