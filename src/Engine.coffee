# Engine is a base class for scripting environments.
# It includes interpreter and reference tracker. 
# Input, output and method definitions are set in subclasses

# simplistic pipe-like I/O, connects engines and modules together
class Pipe
  constructor: (@input, @output) ->

  pipe: (pipe) ->
    return @output = pipe

  read: ->
    if @input
      if @input.write
        return @input.write.apply(@input, arguments)
      else
        return @input.apply(this, arguments)

  write: ->
    if @output.read
      return @output.read.apply(@output, arguments)
    else
      return @output.apply(this, arguments)




class Engine extends Pipe
  Expressions:  require('./context/Expressions.js')
  References:   require('./context/References.js')

  constructor: (scope) ->
    # GSS(node) finds parent nearest engine or makes one on root
    if scope && scope.nodeType
      unless @References
        while scope
          if id = Document::References.get(scope)
            if engine = Engine[id]
              return engine
          break unless scope.parentNode
          scope = scope.parentNode
        return new Document(scope)

      # new GSS(node) assigns engine to node if it doesnt have one
      id = @References.get(scope, true)
      if engine = Engine[id]
        return engine

      Engine[id] = @
      @scope   = scope

    # Create a new engine
    if @References
      @expressions = new @Expressions(@)
      @references  = new @References(@)
      return
    else
      return new arguments.callee(scope)

  # Hook: Should interpreter iterate given object?
  isCollection: (object) ->
    if typeof object == 'object' && object.length != undefined
      unless typeof object[0] == 'string' && !@context[object[0]]
        return true

  # Delegate: Clean up nested things
  clean: ->
    return @context.clean.apply(@context, arguments)

  # Delegate: Pass input to interpreter
  read: ->
    return @expressions.read.apply(@expressions, arguments)

  # Delegate: Reference tracking, helps with bookkeeping
  set: ->
    return @references.set.apply(@references, arguments)
  add: ->
    return @references.add.apply(@references, arguments)
  remove: ->
    return @references.remove.apply(@references, arguments)

  # Catch-all event handler, fires @onevent methods
  handleEvent: (e) ->
    method = 'on' + e.type
    if method in @
      return @[method](e)

Engine.Pipe = Pipe

module.exports = Engine